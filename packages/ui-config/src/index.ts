import type { AppConfig } from "./types";

export * from "./types";

/**
 * Default app config shipped with the shell.
 *
 * Only contains shell-level defaults (branding, auth, api, plugin loader).
 * Plugin-specific defaults live in each plugin's own `config.ts` and are
 * merged in at runtime through the `app:config:defaults` extension point, so this
 * file no longer has to know about `episodes`, `series`, `upload` or any
 * other plugin's schema.
 */
export const defaultConfig: AppConfig = {
  productionConfigUrl: "/ui/config/management-ui/config.json",
  productionAppPluginUrl: "/management-tool/ui/config/plugins.json",
  matomo: {
    enabled: false,
    trackPageViews: true,
    enableLinkTracking: true,
    includeSearch: true,
  },
  app: {
    appName: "Video Management Platform",
    locale: "en",
    HtmlDocumentTitle: "Management UI",
    logoUrl: "assets/default/logo.svg",
    orgLogoUrl: "",
    faviconUrl: "assets/favicon/favicon.svg",
    theme: "default",
    // Core OSS plugins that ship with the shell plus the two integration
    // hooks:
    //  - `admin`  → admin-marketplace plugin (bundled)
    //  - `config` → `.local-plugins/config/` loader runs first in phase 1
    //               so org-specific plugins can extend `enabledPlugins`
    //               before phase 2 picks up the rest of .local-plugins.
    enabledPlugins: ["core", "episodes", "series", "upload", "admin", "config"],
  },
  auth: {
    loginUrl: "/Shibboleth.sso/Login?target=/management-ui/",
    logoutUrl: "/Shibboleth.sso/Logout?return=/management-ui/",
    loginUrlDev: "/j_spring_security_login",
    logoutUrlDev: "/j_spring_security_logout",
  },
  plugins: {},
  api: {
    baseUrl: "/management-ui",
    graphqlEndpoint: "/graphql",
  },
};

/**
 * Merges an instance config on top of {@link defaultConfig}.
 *
 * The shell-owned keys (app/auth/api) are shallow-merged and the plugin
 * map passes through as-is. Per-plugin defaults are contributed at runtime
 * via the `app:config:defaults` extension point, so this function intentionally does
 * not carry plugin-specific knowledge any more.
 */
export const getAppConfig = (instanceConfig?: Partial<AppConfig>): AppConfig => {
  return {
    productionConfigUrl: instanceConfig?.productionConfigUrl ?? defaultConfig.productionConfigUrl,
    productionAppPluginUrl:
      instanceConfig?.productionAppPluginUrl ?? defaultConfig.productionAppPluginUrl,
    downloadBaseUrl: instanceConfig?.downloadBaseUrl ?? defaultConfig.downloadBaseUrl,
    matomo: {
      ...defaultConfig.matomo,
      ...(instanceConfig?.matomo || {}),
    },
    app: {
      ...defaultConfig.app,
      ...(instanceConfig?.app || {}),
      enabledPlugins: instanceConfig?.app?.enabledPlugins || defaultConfig.app.enabledPlugins,
    },
    auth: {
      ...defaultConfig.auth,
      ...(instanceConfig?.auth || {}),
    },
    plugins: {
      ...defaultConfig.plugins,
      ...(instanceConfig?.plugins || {}),
    },
    api: {
      ...defaultConfig.api,
      ...(instanceConfig?.api || {}),
    },
  };
};
