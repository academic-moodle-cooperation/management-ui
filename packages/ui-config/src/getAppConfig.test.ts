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

    expect(config.app.organizationUrls?.main).toBe("https://custom.example.com");
    expect(config.app.organizationUrls?.support).toBe("https://support.example.com");
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

  it("passes through the plugins map from the instance config", () => {
    // The core type is plugin-agnostic (`Record<string, unknown>`), so the
    // test mirrors real plugin callers which cast to their own slice shape.
    const instanceConfig: Partial<AppConfig> = {
      plugins: {
        series: {
          protection: {
            public: true,
          },
        },
      },
    };

    const config = getAppConfig(instanceConfig);

    const seriesSlice = config.plugins["series"] as
      | { protection?: { public?: boolean } }
      | undefined;
    expect(seriesSlice?.protection?.public).toBe(true);
    // Core defaults no longer carry per-plugin fixtures — those are
    // contributed at runtime via the `app:config:defaults` extension point,
    // so an un-registered slice should simply be absent from the merged config.
    expect(config.plugins["episodes"]).toBeUndefined();
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

  it("should merge downloadBaseUrl", () => {
    const instanceConfig: Partial<AppConfig> = {
      downloadBaseUrl: "https://admin.oc.univie.ac.at/static",
    };

    const config = getAppConfig(instanceConfig);

    expect(config.downloadBaseUrl).toBe("https://admin.oc.univie.ac.at/static");
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
});
