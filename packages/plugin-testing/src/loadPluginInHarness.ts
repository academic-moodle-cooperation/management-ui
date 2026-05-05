import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  createAppRegistryPlugin,
  createObjectRegistryPlugin,
  createPluginManager,
  createRendererPlugin,
  type Plugin,
  type PluginManager,
} from "@workspace/plugin-system";

import { HarnessPluginProvider } from "./harnessContext";

import type {
  ConsoleCapture,
  ConsoleEvent,
  ExpectCleanRenderOptions,
  HarnessOptions,
  PluginManifest,
  TestHarness,
} from "./types";

const stringify = (args: unknown[]): string =>
  args
    .map((arg) => {
      if (typeof arg === "string") return arg;
      if (arg instanceof Error) return arg.message;
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    })
    .join(" ");

/**
 * Install interceptors on `console.error` / `console.warn` that record every
 * call into the given capture. The real console methods remain active so
 * failing tests still show helpful diagnostics.
 */
const installConsoleCapture = (capture: ConsoleCapture): (() => void) => {
  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = (...args: unknown[]) => {
    const event: ConsoleEvent = { args, message: stringify(args) };
    capture.errors.push(event);
    originalError(...args);
  };
  console.warn = (...args: unknown[]) => {
    const event: ConsoleEvent = { args, message: stringify(args) };
    capture.warnings.push(event);
    originalWarn(...args);
  };

  return () => {
    console.error = originalError;
    console.warn = originalWarn;
  };
};

/**
 * Boot a minimal plugin manager with the three built-ins registered
 * (`objectRegistry`, `renderer`, `appRegistry`). Matches the behaviour
 * of the production {@link PluginProvider} without any additional wiring.
 */
const bootstrapManager = async (): Promise<PluginManager> => {
  const manager = createPluginManager();
  await manager.register(createObjectRegistryPlugin());
  await manager.register(createRendererPlugin());
  await manager.register(createAppRegistryPlugin());
  return manager;
};

const listLocaleFiles = async (
  namespaceDir: string,
): Promise<{ locale: string; file: string }[]> => {
  const entries = await readdir(namespaceDir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith(".json"))
    .map((e) => ({ locale: e.name.replace(/\.json$/i, ""), file: resolve(namespaceDir, e.name) }))
    .sort((a, b) => a.locale.localeCompare(b.locale));
};

const collectKeys = (value: unknown, prefix: string, out: Set<string>): void => {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    out.add(prefix);
    return;
  }
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    const next = prefix === "" ? k : `${prefix}.${k}`;
    collectKeys(v, next, out);
  }
};

const readLocaleKeys = async (file: string): Promise<Set<string>> => {
  const raw = await readFile(file, "utf8");
  const json = JSON.parse(raw);
  const keys = new Set<string>();
  collectKeys(json, "", keys);
  return keys;
};

const diffKeySets = (a: Set<string>, b: Set<string>): string[] => {
  const only: string[] = [];
  for (const k of a) if (!b.has(k)) only.push(k);
  return only.sort();
};

/**
 * Load a single plugin into a throw-away runtime and return assertion
 * helpers tailored for contract tests.
 *
 * Each call bootstraps a fresh {@link PluginManager} with the three built-in
 * plugins registered, installs console capture, registers the plugin under
 * test (awaiting its `initialize(manager)` if async), and returns a handle
 * whose `expect*` methods throw an `Error` on failure so `vitest` reports
 * them as normal test failures.
 *
 * Callers are expected to invoke {@link TestHarness.dispose} in `afterAll`
 * or similar. The harness currently does no global state leakage, but
 * disposing is still polite — the contract may tighten in future minors.
 */
export async function loadPluginInHarness(
  plugin: Plugin,
  options: HarnessOptions = {},
): Promise<TestHarness> {
  const capture: ConsoleCapture = { errors: [], warnings: [] };
  const uninstallConsole = installConsoleCapture(capture);

  let manager: PluginManager;
  try {
    manager = await bootstrapManager();
    await manager.register(plugin);
    manager.markPluginsAsReady();
  } catch (cause) {
    uninstallConsole();
    throw cause;
  }

  const manifest = options.manifest;

  const expectActivated = (): void => {
    if (!manager.plugins.has(plugin.name)) {
      throw new Error(
        `Plugin "${plugin.name}" was not registered. Did initialize() throw before activate()?`,
      );
    }
  };

  const expectRegistered = (extensionPoints: string[]): void => {
    if (!Array.isArray(extensionPoints) || extensionPoints.length === 0) {
      throw new Error("expectRegistered() requires a non-empty array of extension point names.");
    }
    const empties: string[] = [];
    for (const ep of extensionPoints) {
      const items = manager.getObjects(ep) ?? [];
      if (items.length === 0) empties.push(ep);
    }
    if (empties.length > 0) {
      throw new Error(
        `Plugin "${plugin.name}" did not register anything at: ${empties.join(", ")}. ` +
          `Double-check initialize() populates these extension points.`,
      );
    }
  };

  const expectAllManifestRegistrationsSucceed = (): void => {
    if (!manifest) {
      throw new Error(
        `expectAllManifestRegistrationsSucceed() requires options.manifest. ` +
          `Pass the result of readPluginManifest(pluginDir) when calling loadPluginInHarness.`,
      );
    }
    if (!Array.isArray(manifest.extensionPoints) || manifest.extensionPoints.length === 0) {
      throw new Error(
        `Manifest for "${plugin.name}" does not declare extensionPoints. ` +
          `Add the Manifest 1.1 "extensionPoints" field or use expectRegistered([...]) instead.`,
      );
    }
    expectRegistered(manifest.extensionPoints);
  };

  const expectI18nKeyParity = async (localesArg?: string[]): Promise<void> => {
    if (!manifest) {
      throw new Error(
        `expectI18nKeyParity() requires options.manifest so it can resolve i18nNamespaces.`,
      );
    }
    if (!options.pluginDir) {
      throw new Error(
        `expectI18nKeyParity() requires options.pluginDir to resolve the locales directory on disk.`,
      );
    }
    const namespaces = manifest.i18nNamespaces ?? [];
    if (namespaces.length === 0) return;
    const localesRoot = manifest.locales
      ? resolve(options.pluginDir, manifest.locales)
      : resolve(options.pluginDir, "locales");

    for (const ns of namespaces) {
      const nsDir = resolve(localesRoot, ns);
      const files = await listLocaleFiles(nsDir);
      const relevant = localesArg
        ? files.filter((f) => localesArg.includes(f.locale))
        : files;
      if (relevant.length < 2) continue;

      const keySets = new Map<string, Set<string>>();
      for (const f of relevant) {
        keySets.set(f.locale, await readLocaleKeys(f.file));
      }
      const [referenceLocale, referenceKeys] = [...keySets.entries()][0]!;
      const mismatches: string[] = [];
      for (const [locale, keys] of keySets.entries()) {
        if (locale === referenceLocale) continue;
        const missing = diffKeySets(referenceKeys, keys);
        const extra = diffKeySets(keys, referenceKeys);
        if (missing.length > 0 || extra.length > 0) {
          mismatches.push(
            `  namespace "${ns}", locale "${locale}" vs "${referenceLocale}": ` +
              (missing.length > 0 ? `missing=[${missing.join(", ")}] ` : "") +
              (extra.length > 0 ? `extra=[${extra.join(", ")}]` : ""),
          );
        }
      }
      if (mismatches.length > 0) {
        throw new Error(
          `i18n key parity check failed for "${plugin.name}":\n${mismatches.join("\n")}`,
        );
      }
    }
  };

  const expectCleanRender = async (opts?: ExpectCleanRenderOptions): Promise<void> => {
    if (opts?.render != null) {
      // Only import @testing-library/react when a render tree is supplied so
      // environments without a DOM don't pay the cost of jsdom just to run
      // the manifest/registration checks.
      const { render } = await import("@testing-library/react");
      const { createElement } = await import("react");
      const tree = createElement(
        HarnessPluginProvider,
        { manager, children: opts.render },
      );
      const result = render(tree);
      result.unmount();
    }

    // Assert the whole capture, not just "new" events, so that errors thrown
    // during `initialize()` / `activate()` fail the test even when no render
    // tree is supplied. Callers that want to ignore prior noise should build
    // a fresh harness rather than mutating `captured.errors` / `.warnings`.
    const allErrors = capture.errors;
    const allWarnings = capture.warnings;
    if (allErrors.length > 0 || allWarnings.length > 0) {
      const parts: string[] = [];
      if (allErrors.length > 0) {
        parts.push(`${allErrors.length} console.error call(s):`);
        for (const e of allErrors) parts.push(`  - ${e.message}`);
      }
      if (allWarnings.length > 0) {
        parts.push(`${allWarnings.length} console.warn call(s):`);
        for (const w of allWarnings) parts.push(`  - ${w.message}`);
      }
      throw new Error(
        `Plugin "${plugin.name}" emitted console errors/warnings:\n${parts.join("\n")}`,
      );
    }
  };

  const dispose = (): void => {
    manager.deregister(plugin.name);
    uninstallConsole();
  };

  return {
    manager,
    plugin,
    manifest,
    captured: capture,
    expectActivated,
    expectRegistered,
    expectAllManifestRegistrationsSucceed,
    expectI18nKeyParity,
    expectCleanRender,
    dispose,
  };
}

/**
 * Convenience helper mirroring the runtime manifest type, re-exported so
 * test files do not have to reach into `./types` directly.
 */
export type { PluginManifest };
