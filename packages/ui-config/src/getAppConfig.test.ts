import { describe, it, expect } from "vitest";

import { getAppConfig, defaultConfig } from "./index";

import type { AppConfig } from "./types";

describe("getAppConfig", () => {
  it("should return default config when no instance config provided", () => {
    const config = getAppConfig();

    expect(config.productionConfigUrl).toBe(defaultConfig.productionConfigUrl);
    expect(config.app.appName).toBe(defaultConfig.app.appName);
    expect(config.app.theme).toBe(defaultConfig.app.theme);
  });

  it("should merge instance config with default config", () => {
    const instanceConfig: Partial<AppConfig> = {
      app: {
        appName: "Custom App Name",
        theme: "custom-theme",
        title: defaultConfig.app.title,
        version: defaultConfig.app.version,
        locale: defaultConfig.app.locale,
        HtmlDocumentTitle: defaultConfig.app.HtmlDocumentTitle,
        appTitle: defaultConfig.app.appTitle,
        pluginNamespace: defaultConfig.app.pluginNamespace,
      },
    };

    const config = getAppConfig(instanceConfig);

    expect(config.app.appName).toBe("Custom App Name");
    expect(config.app.theme).toBe("custom-theme");
    // Other defaults should still be present
    expect(config.app.version).toBe(defaultConfig.app.version);
    expect(config.app.locale).toBe(defaultConfig.app.locale);
  });

  it("should merge organizationUrls correctly", () => {
    const instanceConfig: Partial<AppConfig> = {
      app: {
        ...defaultConfig.app,
        organizationUrls: {
          main: "https://custom.example.com",
          support: "https://support.example.com",
        },
      },
    };

    const config = getAppConfig(instanceConfig);

    expect(config.app.organizationUrls.main).toBe("https://custom.example.com");
    expect(config.app.organizationUrls.support).toBe("https://support.example.com");
  });

  it("should use default main URL when instance config doesn't provide it", () => {
    const instanceConfig: Partial<AppConfig> = {
      app: {
        ...defaultConfig.app,
        organizationUrls: {
          main: defaultConfig.app.organizationUrls?.main || "",
          support: "https://support.example.com",
        },
      },
    };

    const config = getAppConfig(instanceConfig);

    expect(config.app.organizationUrls?.main).toBe(defaultConfig.app.organizationUrls?.main);
    expect(config.app.organizationUrls?.support).toBe("https://support.example.com");
  });

  it("should merge auth config", () => {
    const instanceConfig: Partial<AppConfig> = {
      auth: {
        loginUrl: "/custom/login",
        logoutUrl: "/custom/logout",
      },
    };

    const config = getAppConfig(instanceConfig);

    expect(config.auth.loginUrl).toBe("/custom/login");
    expect(config.auth.logoutUrl).toBe("/custom/logout");
    // Dev URLs should still be from default
    expect(config.auth.loginUrlDev).toBe(defaultConfig.auth.loginUrlDev);
  });

  it("should merge plugins config", () => {
    const instanceConfig: Partial<AppConfig> = {
      plugins: {
        "management-ui-series": {
          protection: {
            public: true,
          },
        },
      },
    };

    const config = getAppConfig(instanceConfig);

    expect(config.plugins["management-ui-series"]?.protection?.public).toBe(true);
    // Other plugins should still be present
    expect(config.plugins["management-ui-episodes"]).toBeDefined();
  });

  it("should merge api config", () => {
    const instanceConfig: Partial<AppConfig> = {
      api: {
        baseUrl: "/custom-api",
        timeout: 60000,
        graphqlEndpoint: defaultConfig.api.graphqlEndpoint,
      },
    };

    const config = getAppConfig(instanceConfig);

    expect(config.api.baseUrl).toBe("/custom-api");
    expect(config.api.timeout).toBe(60000);
    // graphqlEndpoint should still be from default
    expect(config.api.graphqlEndpoint).toBe(defaultConfig.api.graphqlEndpoint);
  });

  it("should handle pluginNamespace override", () => {
    const instanceConfig: Partial<AppConfig> = {
      app: {
        ...defaultConfig.app,
        pluginNamespace: ["custom", "namespace"],
      },
    };

    const config = getAppConfig(instanceConfig);

    expect(config.app.pluginNamespace).toEqual(["custom", "namespace"]);
  });

  it("should use default pluginNamespace when not provided", () => {
    const config = getAppConfig();

    expect(config.app.pluginNamespace).toEqual(defaultConfig.app.pluginNamespace);
  });

  it("should merge productionConfigUrl", () => {
    const instanceConfig: Partial<AppConfig> = {
      productionConfigUrl: "/custom/config.json",
    };

    const config = getAppConfig(instanceConfig);

    expect(config.productionConfigUrl).toBe("/custom/config.json");
  });

  it("should merge productionAppPluginUrl", () => {
    const instanceConfig: Partial<AppConfig> = {
      productionAppPluginUrl: "/custom/plugins.json",
    };

    const config = getAppConfig(instanceConfig);

    expect(config.productionAppPluginUrl).toBe("/custom/plugins.json");
  });

  it("should handle partial nested configs", () => {
    const instanceConfig: Partial<AppConfig> = {
      app: {
        ...defaultConfig.app,
        logoUrl: "/custom-logo.png",
      },
    };

    const config = getAppConfig(instanceConfig);

    expect(config.app.logoUrl).toBe("/custom-logo.png");
    // Other app properties should still be from default
    expect(config.app.appName).toBe(defaultConfig.app.appName);
    expect(config.app.faviconUrl).toBe(defaultConfig.app.faviconUrl);
  });

  it("should include default actions configuration for episodes table", () => {
    const config = getAppConfig();

    const episodesTable = config.plugins["management-ui-episodes"]?.episodesTable as {
      actions?: {
        maxVisibleInList?: number;
        maxVisibleInGallery?: number;
        order?: string[];
      };
    } | undefined;

    expect(episodesTable?.actions).toBeDefined();
    expect(episodesTable?.actions?.maxVisibleInList).toBe(3);
    expect(episodesTable?.actions?.maxVisibleInGallery).toBe(2);
    expect(episodesTable?.actions?.order).toEqual([
      "edit-data",
      "edit-video",
      "play",
      "download",
      "delete",
    ]);
  });

  it("should include default actions configuration for series table", () => {
    const config = getAppConfig();

    const seriesTable = config.plugins["management-ui-series"]?.seriesTable as {
      actions?: {
        maxVisible?: number;
        order?: string[];
      };
    } | undefined;

    expect(seriesTable?.actions).toBeDefined();
    expect(seriesTable?.actions?.maxVisible).toBe(2);
    expect(seriesTable?.actions?.order).toEqual(["edit", "upload"]);
  });

  it("should allow overriding actions configuration", () => {
    const instanceConfig: Partial<AppConfig> = {
      plugins: {
        "management-ui-episodes": {
          episodesTable: {
            columns: [],
            actions: {
              maxVisibleInList: 5,
              maxVisibleInGallery: 3,
              order: ["delete", "edit-data", "download"],
            },
          },
        },
      },
    };

    const config = getAppConfig(instanceConfig);

    const episodesTable = config.plugins["management-ui-episodes"]?.episodesTable as {
      actions?: {
        maxVisibleInList?: number;
        maxVisibleInGallery?: number;
        order?: string[];
      };
    } | undefined;

    expect(episodesTable?.actions?.maxVisibleInList).toBe(5);
    expect(episodesTable?.actions?.maxVisibleInGallery).toBe(3);
    expect(episodesTable?.actions?.order).toEqual(["delete", "edit-data", "download"]);
  });
});
