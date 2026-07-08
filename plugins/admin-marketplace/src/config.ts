import { z } from "zod";

import { definePluginConfig } from "@oc-mui/query";

import { DEFAULT_ALLOWED_DOMAINS } from "./services/security";

/**
 * Admin-marketplace plugin config.
 *
 * The marketplace can fetch and **execute** third-party plugin code at runtime,
 * so that capability is opt-in: `remotePlugins.enabled` defaults to `false` and
 * a deployment must turn it on explicitly in `config.json`:
 *
 * ```json
 * { "plugins": { "admin-marketplace": { "remotePlugins": { "enabled": true } } } }
 * ```
 *
 * Consume the validated slice through `adminMarketplaceConfig.use()` (React) or
 * `adminMarketplaceConfig.read(config)` (outside React) — never index
 * `config.plugins["admin-marketplace"]` directly (lint flags it, and it skips
 * validation + the security defaults below).
 */
export const ADMIN_MARKETPLACE_PLUGIN_ID = "admin-marketplace";

const remotePluginsSchema = z
  .object({
    /** Master switch for loading/executing remote plugin code. */
    enabled: z.boolean().default(false),
    /**
     * Hostnames a remote plugin URL may be fetched from. Note these authenticate
     * the *host*, not the code's author (a shared CDN serves anyone's content),
     * so this is necessary-but-not-sufficient — keep the feature admin-only.
     */
    allowedDomains: z.array(z.string()).default([...DEFAULT_ALLOWED_DOMAINS]),
  })
  // Whole-object default for when `remotePlugins` is absent; the per-field
  // defaults above cover a partial slice (e.g. `{ "enabled": true }` still fills
  // `allowedDomains`).
  .default({ enabled: false, allowedDomains: [...DEFAULT_ALLOWED_DOMAINS] });

export const adminMarketplaceConfigSchema = z.object({
  remotePlugins: remotePluginsSchema,
});

export type AdminMarketplaceConfig = z.infer<typeof adminMarketplaceConfigSchema>;

export const adminMarketplaceConfig = definePluginConfig({
  id: ADMIN_MARKETPLACE_PLUGIN_ID,
  schema: adminMarketplaceConfigSchema,
  // Used when the slice is entirely absent from config.json; mirrors the zod
  // defaults above so both the absent and partial cases resolve identically.
  defaults: {
    remotePlugins: {
      enabled: false,
      allowedDomains: [...DEFAULT_ALLOWED_DOMAINS],
    },
  },
});
