import { describe, it, expect, vi } from "vitest";

import type { PluginManager } from "@workspace/plugin-system";
import type { AppConfig } from "@workspace/ui-config";

import { getAppConfigSync } from "./useAppConfig";

vi.mock("@workspace/ui-config", () => ({
  defaultConfig: {
    productionConfigUrl: "/ui/config/config.json",
    app: {
      theme: "default",
      pluginNamespace: ["core"] as unknown[],
      organizationUrls: { main: "https://example.org" },
    },
  },
  getAppConfig: (data: unknown) => data,
}));

const makeManager = (overlays: Array<Partial<AppConfig>>): PluginManager => {
  return {
    getObjects: <T,>(ext: string): T[] => {
      if (ext === "app:config") return overlays as unknown as T[];
      return [];
    },
  } as unknown as PluginManager;
};

describe("getAppConfigSync", () => {
  it("returns a copy of the default config when no manager is supplied", () => {
    const result = getAppConfigSync();
    expect(result.app?.theme).toBe("default");
    expect(result.app?.organizationUrls?.main).toBe("https://example.org");
  });

  it("prefers the explicit baseConfig over the default", () => {
    const base = {
      productionConfigUrl: "/custom.json",
      app: { theme: "custom", pluginNamespace: [] },
    } as unknown as AppConfig;

    const result = getAppConfigSync(undefined, base);
    expect(result.app?.theme).toBe("custom");
    expect(result.productionConfigUrl).toBe("/custom.json");
  });

  it("deep-merges plugin overlays into the base config", () => {
    const manager = makeManager([
      { app: { theme: "dark" } as AppConfig["app"] },
      {
        app: {
          organizationUrls: { main: "https://overridden.example" },
        } as AppConfig["app"],
      },
    ]);

    const result = getAppConfigSync(manager);
    expect(result.app?.theme).toBe("dark");
    // Deep merge must preserve sibling keys from the base layer.
    expect(result.app?.organizationUrls?.main).toBe("https://overridden.example");
    expect(result.app?.pluginNamespace).toEqual(["core"]);
  });

  it("tolerates a manager that throws when reading overlays", () => {
    const manager = {
      getObjects: () => {
        throw new Error("boom");
      },
    } as unknown as PluginManager;

    const result = getAppConfigSync(manager);
    expect(result.app?.theme).toBe("default");
  });
});
