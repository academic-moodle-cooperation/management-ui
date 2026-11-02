import { z } from "zod";

import { definePluginConfig } from "@oc-mui/query";

/**
 * admin-marketplace-v2 plugin config.
 *
 * Two independent concerns:
 *
 * - `registryUrls` configures *where the catalog comes from*. Browsing is
 *   read-only and never loads remote code.
 * - `try` gates the Try gesture — the only path in v2 that fetches and
 *   executes remote plugin code. It is fail-closed: `enabled` defaults to
 *   `false` and a deployment must opt in via config.json. There is no
 *   permanent install in v2; a trial lives in `sessionStorage` and dies with
 *   the browser tab.
 *
 * Consume through `marketplaceV2Config.use()` (React) or
 * `marketplaceV2Config.read(config)` — never index
 * `config.plugins["admin-marketplace-v2"]` directly (lint-enforced).
 */
export const MARKETPLACE_V2_PLUGIN_ID = "admin-marketplace-v2";

/**
 * Default bundle hosts for the Try gesture. Mirrors v1's defaults — note the
 * deliberate absence of bare `github.io` (suffix matching would admit every
 * GitHub user's Pages site; deployments allow their own subdomain instead).
 * The list authenticates the *host*, not the code's author — which is why the
 * whole surface stays admin-only and integrity pinning exists on top.
 */
export const DEFAULT_TRY_ALLOWED_DOMAINS = [
  "cdn.jsdelivr.net",
  "raw.githubusercontent.com",
];

const trySchema = z
  .object({
    /** Master switch for the Try gesture (fetching + executing remote code). */
    enabled: z.boolean().default(false),
    /** Hostnames a plugin bundle may be fetched from (suffix-matched). */
    allowedDomains: z.array(z.string()).default([...DEFAULT_TRY_ALLOWED_DOMAINS]),
    /**
     * Permit plain-HTTP bundle URLs in production builds. Meant for TLS-less
     * deployments (test boxes, intranet installs) where the page itself is
     * plain HTTP anyway; leave off wherever TLS exists.
     */
    allowInsecureHttp: z.boolean().default(false),
    /**
     * Refuse to try registry entries that carry no `integrity` hash. Off by
     * default while pinning adoption grows; strict deployments turn it on.
     */
    requireIntegrity: z.boolean().default(false),
  })
  .default({
    enabled: false,
    allowedDomains: [...DEFAULT_TRY_ALLOWED_DOMAINS],
    allowInsecureHttp: false,
    requireIntegrity: false,
  });

export const marketplaceV2ConfigSchema = z.object({
  /**
   * Plugin-registry URLs (each serving a `registry.json`) whose entries the
   * catalog lists. Listing is read-only browsing. Empty (the default) means no
   * registry is contacted; in dev the local `public/registry.json` is used as
   * a fallback so the flow works without any external repo.
   */
  registryUrls: z.array(z.string()).default([]),
  try: trySchema,
});

export type MarketplaceV2Config = z.infer<typeof marketplaceV2ConfigSchema>;
export type TryConfig = MarketplaceV2Config["try"];

export const marketplaceV2Config = definePluginConfig({
  id: MARKETPLACE_V2_PLUGIN_ID,
  schema: marketplaceV2ConfigSchema,
  defaults: {
    registryUrls: [],
    try: {
      enabled: false,
      allowedDomains: [...DEFAULT_TRY_ALLOWED_DOMAINS],
      allowInsecureHttp: false,
      requireIntegrity: false,
    },
  },
});
