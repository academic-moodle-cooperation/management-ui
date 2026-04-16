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
 * plugin that owns the key. Consumers must cast through their plugin's own
 * `readXxxConfig()` accessor before reading fields.
 */
export type PluginsConfig = Record<string, unknown>;

/** Plugin control entries for granular activation/deactivation. */
export interface PluginNamespaceConfig {
  /** Array of type names to enable; omit to enable all. */
  types?: string[];
}

/** Plugin namespace item: string (enable all) or object (granular control). */
export type PluginNamespaceItem = string | Record<string, PluginNamespaceConfig>;

export interface AppConfig {
  productionConfigUrl: string;
  productionAppPluginUrl: string;
  downloadBaseUrl?: string | undefined;
  app: {
    title: string;
    appName: string;
    version: string;
    locale: string;
    HtmlDocumentTitle: string;
    appTitle: string;
    logoUrl?: string;
    orgLogoUrl?: string;
    faviconUrl?: string;
    organizationUrls?: {
      main: string;
      support?: string;
    };
    theme: string;
    pluginNamespace: PluginNamespaceItem[];
  };
  auth: {
    loginUrl: string;
    logoutUrl: string;
    loginUrlDev?: string;
    logoutUrlDev?: string;
    tokenRefreshUrl?: string;
  };
  plugins: PluginsConfig;
  api: {
    baseUrl: string;
    timeout?: number;
    graphqlEndpoint: string;
  };
  [key: string]: unknown;
}
