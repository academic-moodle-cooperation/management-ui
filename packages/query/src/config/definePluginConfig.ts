import { useMemo } from "react";
import { z } from "zod";

import type { PluginManager } from "@workspace/plugin-system";
import type { AppConfig } from "@workspace/ui-config";
import { logger } from "@workspace/utils";

import { useAppConfig } from "../hooks/useAppConfig";

/**
 * Owner-side binding for a plugin's config slice.
 *
 * Each core plugin declares its slice *once* via {@link definePluginConfig}
 * and gets back a reader object that encapsulates:
 *
 *   - the plugin id (used as the key under `AppConfig.plugins`)
 *   - a Zod schema that describes the slice shape
 *   - hand-written defaults used both at registration time (to seed
 *     `app:config:defaults`) and as the fallback when validation fails
 *   - a `register(manager)` helper to wire the defaults into the
 *     runtime registry during `initialize()`
 *   - a `use()` React hook and a `read(config)` imperative reader that
 *     both validate through the schema and return a typed slice
 *
 * The point of going through this reader instead of indexing
 * `config.plugins[id]` directly is that validation failures surface as
 * a single, contextual warning and the UI keeps rendering against the
 * defaults — a corrupt `config.json` key never crashes the shell.
 */
export interface PluginConfigReader<T extends z.ZodTypeAny> {
  readonly id: string;
  readonly schema: T;
  readonly defaults: z.infer<T>;
  register(manager: PluginManager): void;
  use(): z.infer<T>;
  read(config: AppConfig | undefined): z.infer<T>;
}

export interface DefinePluginConfigInput<T extends z.ZodTypeAny> {
  id: string;
  schema: T;
  defaults: z.infer<T>;
}

/**
 * Validate a slice against its schema, returning the parsed value on
 * success and the plugin's defaults on failure. Keeps all warning
 * formatting in one place so dev tooling can grep for `plugin:<id>`.
 */
function validateOrFallback<T extends z.ZodTypeAny>(
  id: string,
  schema: T,
  defaults: z.infer<T>,
  slice: unknown,
): z.infer<T> {
  if (slice === undefined || slice === null) return defaults;
  const parsed = schema.safeParse(slice);
  if (parsed.success) return parsed.data;
  logger.warn(`plugin:${id} config validation failed; falling back to defaults`, {
    issues: parsed.error.issues,
  });
  return defaults;
}

/**
 * React hook: resolve the validated slice for a given
 * {@link PluginConfigReader}. Equivalent to `reader.use()` but available
 * as a standalone hook for call sites that prefer the top-level form.
 */
export function useConfig<T extends z.ZodTypeAny>(reader: PluginConfigReader<T>): z.infer<T> {
  const { config } = useAppConfig();
  return useMemo(
    () => validateOrFallback(reader.id, reader.schema, reader.defaults, config?.plugins?.[reader.id]),
    [config, reader],
  );
}

/**
 * Create a {@link PluginConfigReader} for a plugin's config slice.
 *
 * The returned object is intentionally the *only* surface plugin code
 * should use to access its own config. Direct reads via
 * `useAppConfig().config.plugins[id]` bypass validation and are
 * explicitly flagged by lint (see the Phase 2b master plan).
 *
 * @example
 * ```ts
 * export const episodesConfig = definePluginConfig({
 *   id: "episodes",
 *   schema: episodesConfigSchema,
 *   defaults: episodesConfigDefaults,
 * });
 *
 * // in initialize():
 * episodesConfig.register(manager);
 *
 * // in a component:
 * const cfg = episodesConfig.use();
 * ```
 */
export function definePluginConfig<T extends z.ZodTypeAny>(
  input: DefinePluginConfigInput<T>,
): PluginConfigReader<T> {
  const { id, schema, defaults } = input;

  const reader: PluginConfigReader<T> = {
    id,
    schema,
    defaults,
    register(manager) {
      manager.registerObject("app:config:defaults", `${id}-defaults`, {
        plugins: { [id]: defaults },
      });
    },
    use() {
      return useConfig(reader);
    },
    read(config) {
      return validateOrFallback(id, schema, defaults, config?.plugins?.[id]);
    },
  };

  return reader;
}
