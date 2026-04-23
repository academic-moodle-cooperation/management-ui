// Shared types for ui-config package

export interface MetadataField {
  show: boolean;
  readonly: boolean;
}

export interface ColumnsField {
  show: boolean;
  label?: string;
  labelKey?: string;
}

// Keep these as flexible types since the actual structure varies
export type MetadataItem = Record<string, MetadataField>;
export type TableColumnItem = Record<string, ColumnsField>;

export interface TableViewConfig {
  enabled?: boolean;
  columns?: TableColumnItem[];
}

export interface SeriesInfo {
  metadata: unknown[]; // Make this flexible to accept actual structure
}

export interface SeriesTable {
  columns: TableColumnItem[];
  createSeries?: {
    enabled?: boolean;
  };
}

export interface EpisodeInfo {
  metadata: unknown[]; // Make this flexible to accept actual structure
}

export interface EpisodesTable {
  columns?: TableColumnItem[];
  views?: {
    list?: TableViewConfig;
    gallery?: TableViewConfig;
  };
}

export interface UploadConfig {
  location: string;
  workflowId: string;
  whitelist: string[];
}

// Simplified protection: just public or protected
export interface AppProtectionConfig {
  public?: boolean; // If true, app is publicly accessible. If false/undefined, requires authentication
}

// Make PluginsConfig more flexible to accept any plugin structure
export interface PluginsConfig {
  "management-ui-series"?: {
    seriesInfo?: SeriesInfo;
    seriesTable?: SeriesTable;
    protection?: AppProtectionConfig;
  };
  "management-ui-episodes"?: {
    episodeInfo?: EpisodeInfo;
    episodesTable?: EpisodesTable;
    protection?: AppProtectionConfig;
  };
  "management-ui-upload"?: UploadConfig & {
    protection?: AppProtectionConfig;
  };
  [key: string]: unknown; // Allow any plugin structure
}

// Plugin control types for granular activation/deactivation
export interface PluginNamespaceConfig {
  types?: string[]; // Array of type names to enable, if omitted = enable all
}

// Plugin namespace item can be either a string (enable all) or object (granular control)
export type PluginNamespaceItem = string | Record<string, PluginNamespaceConfig>;

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
    title: string;
    appName: string;
    version: string;
    locale: string;
    HtmlDocumentTitle: string;
    appTitle: string;
    logoUrl?: string;
    orgLogoUrl?: string;
    faviconUrl?: string; // URL to favicon (SVG preferred)
    organizationUrls?: {
      main: string;
      support?: string;
    };
    theme: string;
    pluginNamespace: PluginNamespaceItem[]; // New clean array-based approach
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
  [key: string]: unknown; // Allow plugin-provided config keys
}
