// Import types first
import type { AppConfig, MetadataField, MetadataItem } from "./types";

// Export types from types file
export * from "./types";

// Explicitly re-export types for Vite/Rollup compatibility
// when using 'import type' syntax
export type { MetadataField, MetadataItem };

// Default or base configuration, adapted from old defaultConfig and new AppConfig
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
  plugins: {
    "management-ui-series": {
      protection: {
        public: false, // Protected by default - requires authentication
      },
      seriesInfo: {
        metadata: [
          { title: { show: true, readonly: false } },
          { subject: { show: true, readonly: false } },
          { rightsHolder: { show: true, readonly: false } },
          { publisher: { show: true, readonly: false } },
          { license: { show: true, readonly: false } },
          { language: { show: true, readonly: false } },
          { identifier: { show: true, readonly: true } },
          { description: { show: true, readonly: false } },
          { creator: { show: true, readonly: true } },
          { contributor: { show: true, readonly: false } },
        ],
      },
      seriesTable: {
        createSeries: {
          enabled: true,
        },
        columns: [
          { title: { show: true } },
          { created: { show: true } },
          { description: { show: true } },
          { creator: { show: true } },
          { contributors: { show: true } },
          { events: { show: true } },
          { actions: { show: true } },
        ],
      },
    },
    "management-ui-episodes": {
      protection: {
        public: false, // Protected by default
      },
      episodeInfo: {
        metadata: [
          { title: { show: true, readonly: false } },
          { subject: { show: true, readonly: false } },
          { startDate: { show: true, readonly: false } },
          { source: { show: true, readonly: false } },
          { rightsHolder: { show: true, readonly: false } },
          { publisher: { show: true, readonly: true } },
          { location: { show: true, readonly: false } },
          { license: { show: true, readonly: false } },
          { language: { show: true, readonly: false } },
          { isPartOf: { show: true, readonly: false } },
          { identifier: { show: true, readonly: true } },
          { duration: { show: true, readonly: false } },
          { description: { show: true, readonly: false } },
          { creator: { show: true, readonly: true } },
          { created: { show: true, readonly: true } },
          { contributor: { show: true, readonly: false } },
        ],
      },
      episodesTable: {
        views: {
          list: {
            enabled: true,
          },
          gallery: {
            enabled: true,
          },
        },
        columns: [
          { title: { show: true } },
          { seriesName: { show: true } },
          { description: { show: true } },
          { contributors: { show: true } },
          { creator: { show: true } },
          { created: { show: true } },
          { eventStatus: { show: true } },
          { duration: { show: true } },
          { location: { show: true } },
          { presenters: { show: true } },
          { startDate: { show: true } },
          { actions: { show: true } },
        ],
      },
    },
    "management-ui-upload": {
      location: "Upload",
      workflowId: "ingest-upload",
      whitelist: [
        "h264",
        "mov",
        "mp4",
        "mp3",
        "wav",
        "avi",
        "m4a",
        "wmv",
        "mkv",
        "ac3",
        "webm",
        "ts",
        "ogg",
        "opus",
        "aiff",
        "hevc",
        "m2t",
        "mjp",
        "mts",
        "mxf",
        "ogv",
        "rm",
        "vob",
        "wtv",
        "swf",
        "3gp",
        "asf",
        "f4v",
        "m2v",
        "flv",
      ],
      protection: {
        public: false, // Protected by default
      },
    },
  },
  api: {
    baseUrl: "/management-ui",
    timeout: 30000,
    graphqlEndpoint: "/graphql",
  },
};

// Updated Function to load and merge instance-specific configurations
export const getAppConfig = (instanceConfig?: Partial<AppConfig>) => {
  const mergedConfig = {
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
      organizationUrls: {
        main:
          instanceConfig?.app?.organizationUrls?.main ??
          defaultConfig.app.organizationUrls?.main ??
          "",
        ...(instanceConfig?.app?.organizationUrls?.support && {
          support: instanceConfig.app.organizationUrls.support,
        }),
      },
      // Merge pluginNamespace without duplicates
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

  return mergedConfig;
};
