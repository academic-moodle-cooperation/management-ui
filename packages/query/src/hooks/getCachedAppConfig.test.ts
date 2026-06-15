import { describe, it, expect, vi, beforeEach } from "vitest";

import { defaultConfig } from "@opencast-mui/ui-config";

import { getCachedAppConfig, clearAppConfigCache } from "./getCachedAppConfig";

// Mock @opencast-mui/ui-config. `getAppConfig` is the normalizer used by the
// real hook + cache — the identity passthrough keeps assertions focused on
// caching behaviour without coupling tests to the default-merge details.
vi.mock("@opencast-mui/ui-config", () => ({
  defaultConfig: {
    productionConfigUrl: "/ui/config/config.json",
  },
  getAppConfig: (data: unknown) => data,
}));

// Mock global fetch
global.fetch = vi.fn();

describe("getCachedAppConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAppConfigCache();
  });

  it("should fetch and cache config", async () => {
    const mockConfig = { app: { theme: "test" } };
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(mockConfig),
    };

    vi.mocked(global.fetch).mockResolvedValue(mockResponse as unknown as Response);

    const result = await getCachedAppConfig();

    expect(global.fetch).toHaveBeenCalledWith("/ui/config/config.json");
    expect(result).toEqual(mockConfig);
  });

  it("should return cached promise on subsequent calls", async () => {
    const mockConfig = { app: { theme: "test" } };
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(mockConfig),
    };

    vi.mocked(global.fetch).mockResolvedValue(mockResponse as unknown as Response);

    const promise1 = getCachedAppConfig();
    const promise2 = getCachedAppConfig();

    // Both should return the same promise (cached)
    expect(promise1).toBe(promise2);

    const result1 = await promise1;
    const result2 = await promise2;

    // Should only fetch once
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result1).toEqual(mockConfig);
    expect(result2).toEqual(mockConfig);
  });

  it("should clear cache on error and allow retry", async () => {
    const mockErrorResponse = {
      ok: false,
      status: 404,
    };

    vi.mocked(global.fetch).mockResolvedValue(mockErrorResponse as unknown as Response);

    // First call should fail
    await expect(getCachedAppConfig()).rejects.toThrow("HTTP error");

    // Cache should be cleared, so second call should retry
    const mockSuccessResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ app: { theme: "test" } }),
    };

    vi.mocked(global.fetch).mockResolvedValue(mockSuccessResponse as unknown as Response);

    const result = await getCachedAppConfig();

    // Should have been called twice (once for error, once for retry)
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ app: { theme: "test" } });
  });

  it("should handle configUrl without leading slash", async () => {
    // Mock defaultConfig with URL without leading slash
    vi.mocked(defaultConfig).productionConfigUrl = "ui/config/config.json";

    const mockConfig = { app: { theme: "test" } };
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(mockConfig),
    };

    vi.mocked(global.fetch).mockResolvedValue(mockResponse as unknown as Response);

    await getCachedAppConfig();

    expect(global.fetch).toHaveBeenCalledWith("/ui/config/config.json");
  });
});

describe("clearAppConfigCache", () => {
  it("should clear the cache", async () => {
    const mockConfig = { app: { theme: "test" } };
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(mockConfig),
    };

    vi.mocked(global.fetch).mockResolvedValue(mockResponse as unknown as Response);

    // Fetch and cache
    await getCachedAppConfig();

    // Clear cache
    clearAppConfigCache();

    // Next call should fetch again
    await getCachedAppConfig();

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
