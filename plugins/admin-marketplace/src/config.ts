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
 * `config.plugins["admin-marketplace"]` directly — it skips validation + the
 * security defaults below. The `local/no-cross-plugin-config` lint rule flags such reads (#323).
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
    /**
     * Plugin-registry URLs (each serving a `registry.json`) whose entries the
     * marketplace lists for browsing. Listing is only the catalog — actually
     * loading an entry stays behind `enabled` + `allowedDomains`. Empty (the
     * default) means no registry is contacted; outside dev the marketplace
     * then only shows locally present plugins.
     */
    registryUrls: z.array(z.string()).default([]),
    /**
     * Permit plain-HTTP plugin URLs in production builds. Default false:
     * HTTPS is required outside dev. Meant for deployments that themselves
     * run without TLS (test boxes, intranet installs) — on such a host the
     * page is plain HTTP anyway, so this adds no new interception surface,
     * but leave it off wherever TLS exists. `allowedDomains` still applies.
     */
    allowInsecureHttp: z.boolean().default(false),
  })
  // Whole-object default for when `remotePlugins` is absent; the per-field
  // defaults above cover a partial slice (e.g. `{ "enabled": true }` still fills
  // `allowedDomains`).
  .default({
    enabled: false,
    allowedDomains: [...DEFAULT_ALLOWED_DOMAINS],
    registryUrls: [],
    allowInsecureHttp: false,
  });

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
      registryUrls: [],
      allowInsecureHttp: false,
    },
  },
});
