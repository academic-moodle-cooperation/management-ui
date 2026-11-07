import { describe, expect, it } from "vitest";

import { parseDurationMs } from "./stats";
import { resolveSource, toEpisodeRef } from "./useUsageStats";

import type { UsageProvider, UsageSource } from "./types";

const provider = (source: UsageSource, available: boolean): UsageProvider => ({
  source,
  isAvailable: () => Promise.resolve(available),
  fetchUsage: () => Promise.reject(new Error("not called")),
});

const providers = (statistics: boolean, usertracking: boolean) => ({
  statistics: provider("statistics", statistics),
  usertracking: provider("usertracking", usertracking),
  demo: provider("demo", true),
});

describe("resolveSource", () => {
  it("honours an explicit setting without probing", async () => {
    await expect(resolveSource("demo", providers(true, true))).resolves.toBe("demo");
    await expect(resolveSource("usertracking", providers(false, false))).resolves.toBe(
      "usertracking",
    );
  });

  it("probes statistics, then usertracking, then falls back to demo", async () => {
    await expect(resolveSource("auto", providers(true, true))).resolves.toBe("statistics");
    await expect(resolveSource("auto", providers(false, true))).resolves.toBe("usertracking");
    await expect(resolveSource("auto", providers(false, false))).resolves.toBe("demo");
  });
});

describe("toEpisodeRef", () => {
  it("maps a GraphQL node and falls back to the id for an empty title", () => {
    expect(
      toEpisodeRef({ id: "e1", title: "  ", seriesName: null, duration: "00:10:00" }, parseDurationMs),
    ).toEqual({ id: "e1", title: "e1", seriesName: null, durationMs: 600_000 });
  });
});
