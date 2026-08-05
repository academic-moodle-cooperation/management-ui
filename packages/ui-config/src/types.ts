/**
 * Core application config types.
 *
 * This package intentionally does NOT know about individual plugins any more.
 * After Phase 2b / Commit 3 the core app config only describes the shell
 * itself (branding, auth, api, plugin loader). Each plugin owns the shape
 * of its own slice under `AppConfig.plugins[<plugin-id>]` and contributes
 * its defaults at runtime via the `app:config:defaults` extension point
 * (which is merged *below* the fetched `config.json` so deployments win) —
 * see `plugins/core-episodes/src/config.ts` for a reference implementation.
 */

/**
 * Opaque map of plugin-owned config slices.
 *
 * The core config only guarantees that `plugins` is an object keyed by plugin
 * id; individual values are `unknown` because their shape belongs to the
 * plugin that owns the key. Consumers access them through their plugin's
 * `definePluginConfig()` reader (`xxxConfig.use()` / `.read(config)`), which
 * validates the slice against the plugin's Zod schema before returning it.
 *
 * By convention every plugin slice may carry an `enabled?: boolean` flag that
 * the shell's plugin loader reads at runtime to deactivate a plugin without
 * removing it from {@link AppConfig.app.enabledPlugins} or from the bundle.
 */
export type PluginsConfig = Record<string, unknown>;

export interface MatomoConfig {
  enabled: boolean;
  /**
   * Base URL of the Matomo instance, for example
   * `https://matomo.example.org/`.
   */
  url?: string;
  siteId?: string | number;
  /**
   * Override the generated `url + "matomo.js"` script URL when the tracker
   * script is hosted somewhere else.
   */
  scriptUrl?: string;
  /**
   * Override the generated `url + "matomo.php"` tracker endpoint.
   */
  trackerUrl?: string;
  trackPageViews?: boolean;
  enableLinkTracking?: boolean;
  enableHeartBeatTimer?: boolean | number;
  disableCookies?: boolean;
  requireConsent?: boolean;
  requireCookieConsent?: boolean;
  includeSearch?: boolean;
}

export interface AppConfig {
  productionConfigUrl: string;
  productionAppPluginUrl: string;
  downloadBaseUrl?: string | undefined;
  matomo: MatomoConfig;
  app: {
    /**
     * Product name for the deployment.
     *
     * **Currently unrendered.** No component reads this — the header shows the
     * logo (`logoUrl` / `orgLogoUrl`, or an `app:header-logo` registration) and
     * the browser tab uses {@link AppConfig.app.HtmlDocumentTitle}. Setting it
     * changes nothing visible today; it is kept because it is the natural place
     * for a deployment's product name and is a candidate for a text fallback
     * where no logo is configured.
     */
    appName: string;
    locale: string;
    /** `<title>` of the HTML document. */
    HtmlDocumentTitle: string;
    logoUrl?: string;
    orgLogoUrl?: string;
    faviconUrl?: string;
    theme: string;
    /**
     * Flat list of plugin namespaces the shell is allowed to load at all
     * (ship/load filter). Default covers the OSS core: `core`, `episodes`,
     * `series`, `upload`, `admin` (marketplace), and the `config`
     * namespace used by `.local-plugins/config/` to inject org-specific
     * config at boot.
     *
     * Finer-grained runtime deactivation lives on each plugin's own slice:
     * `config.plugins[<id>].enabled === false` causes the loader to skip
     * that plugin even when its namespace is in `enabledPlugins`.
     */
    enabledPlugins: string[];
  };
  auth: {
    loginUrl: string;
    logoutUrl: string;
    loginUrlDev?: string;
    logoutUrlDev?: string;
  };
  plugins: PluginsConfig;
  api: {
    baseUrl: string;
    graphqlEndpoint: string;
  };
  // Deployments may carry extra top-level keys we don't model here (legacy
  // fields, org-specific knobs read by a config plugin). They pass through
  // untyped rather than failing validation.
  [key: string]: unknown;
}
