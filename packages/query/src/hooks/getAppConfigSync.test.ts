import { describe, it, expect, vi } from "vitest";

import type { PluginManager } from "@oc-mui/plugin-system";
import type { AppConfig } from "@oc-mui/ui-config";

import { getAppConfigSync } from "./useAppConfig";

vi.mock("@oc-mui/ui-config", () => ({
  defaultConfig: {
    productionConfigUrl: "/ui/config/config.json",
    app: {
      theme: "default",
      enabledPlugins: ["core"] as string[],
      organizationUrls: { main: "https://example.org" },
    },
  },
  getAppConfig: (data: unknown) => data,
}));

const makeManager = (
  overlays: Array<Partial<AppConfig>>,
  defaults: Array<Partial<AppConfig>> = [],
): PluginManager => {
  return {
    getObjects: <T,>(ext: string): T[] => {
      if (ext === "app:config") return overlays as unknown as T[];
      if (ext === "app:config:defaults") return defaults as unknown as T[];
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
      app: { theme: "custom", enabledPlugins: [] },
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
    expect(result.app?.enabledPlugins).toEqual(["core"]);
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

  it("merges plugin defaults below the base so the base wins on conflicts", () => {
    const manager = makeManager(
      [],
      [
        {
          app: { theme: "plugin-default" } as AppConfig["app"],
          plugins: { episodes: { episodeInfo: { metadata: [] } } } as AppConfig["plugins"],
        },
      ],
    );

    const result = getAppConfigSync(manager);
    // Base `theme: "default"` must beat the plugin-contributed default.
    expect(result.app?.theme).toBe("default");
    // Plugin defaults fill gaps the base doesn't cover.
    expect(
      (result.plugins as { episodes?: { episodeInfo?: { metadata?: unknown[] } } }).episodes
        ?.episodeInfo?.metadata,
    ).toEqual([]);
  });

  it("applies overlays on top of both defaults and the base", () => {
    const manager = makeManager(
      [{ app: { theme: "overlay" } as AppConfig["app"] }],
      [{ app: { theme: "plugin-default" } as AppConfig["app"] }],
    );

    const result = getAppConfigSync(manager);
    expect(result.app?.theme).toBe("overlay");
  });
});
