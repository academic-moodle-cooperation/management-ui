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
  app: {
    title: "management-ui",
    appName: "Video Management Platform",
    version: "0.0.1",
    locale: "en",
    HtmlDocumentTitle: "Management UI",
    appTitle: "",
    logoUrl: "assets/default/logo.svg",
    orgLogoUrl: "",
    faviconUrl: "assets/favicon/favicon.svg",
    organizationUrls: {
      main: "https://example.com",
    },
    theme: "default",
    // Include "config" so a .local-plugins/config/ plugin loads first and can register
    // app:config with pluginNamespace (e.g. univie, tuwien); remaining .local-plugins load in a second pass
    pluginNamespace: ["core", "episodes", "series", "upload", "config"],
  },
  auth: {
    loginUrl: "/Shibboleth.sso/Login?target=/management-ui",
    logoutUrl: "/Shibboleth.sso/Logout?return=/management-ui",
    loginUrlDev: "/j_spring_security_login",
    logoutUrlDev: "/j_spring_security_logout",
  },
  plugins: {},
  api: {
    baseUrl: "/management-ui",
    timeout: 30000,
    graphqlEndpoint: "/graphql",
  },
};

/**
 * Merges an instance config on top of {@link defaultConfig}.
 *
 * Keeps the legacy semantics for the shell-owned keys (app/auth/api are
 * shallow-merged, `organizationUrls` gets a nested merge) and passes the
 * plugin map through as-is. Per-plugin defaults are contributed at runtime
 * via the `app:config:defaults` extension point, so this function intentionally does
 * not carry plugin-specific knowledge any more.
 */
export const getAppConfig = (instanceConfig?: Partial<AppConfig>): AppConfig => {
  return {
    productionConfigUrl: instanceConfig?.productionConfigUrl ?? defaultConfig.productionConfigUrl,
    productionAppPluginUrl:
      instanceConfig?.productionAppPluginUrl ?? defaultConfig.productionAppPluginUrl,
    downloadBaseUrl: instanceConfig?.downloadBaseUrl ?? defaultConfig.downloadBaseUrl,
    app: {
      ...defaultConfig.app,
      ...(instanceConfig?.app || {}),
      organizationUrls: {
        main:
          instanceConfig?.app?.organizationUrls?.main ??
          defaultConfig.app.organizationUrls?.main ??
          "",
        ...(instanceConfig?.app?.organizationUrls?.support && {
          support: instanceConfig.app.organizationUrls.support,
        }),
      },
      pluginNamespace: instanceConfig?.app?.pluginNamespace || defaultConfig.app.pluginNamespace,
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
