import { describe, expect, it } from "vitest";

import {
  createDemoProvider,
  DEMO_HISTORY_DAYS,
  generateDemoUsage,
  hashString,
  seededRandom,
} from "./demoProvider";

import type { EpisodeRef } from "./types";

const episode = (id: string): EpisodeRef => ({
  id,
  title: id,
  seriesName: null,
  durationMs: 600_000,
});

const NOW = new Date("2026-10-12T12:00:00Z");

describe("demo provider", () => {
  it("is deterministic per episode id", () => {
    const a = generateDemoUsage(episode("abc"), 20, NOW);
    const b = generateDemoUsage(episode("abc"), 20, NOW);
    expect(a).toEqual(b);
  });

  it("differs between episodes", () => {
    const a = generateDemoUsage(episode("abc"), 20, NOW);
    const b = generateDemoUsage(episode("xyz"), 20, NOW);
    expect(a.views === b.views && a.watchProfile?.join() === b.watchProfile?.join()).toBe(false);
  });

  it("produces a profile of the requested resolution within [0, 1]", () => {
    const usage = generateDemoUsage(episode("abc"), 12, NOW);
    expect(usage.watchProfile).toHaveLength(12);
    expect(usage.watchProfile?.[0]).toBe(1);
    for (const value of usage.watchProfile ?? []) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
    expect(usage.completion).toBeGreaterThanOrEqual(0);
    expect(usage.completion).toBeLessThanOrEqual(1);
  });

  it("derives total views and the last view from a daily timeline ending today", () => {
    const usage = generateDemoUsage(episode("abc"), 20, NOW);
    expect(usage.viewsOverTime?.labels).toHaveLength(DEMO_HISTORY_DAYS);
    expect(usage.viewsOverTime?.labels.at(-1)).toBe("2026-10-12");
    expect(usage.views).toBe(usage.viewsOverTime?.values.reduce((sum, v) => sum + v, 0));
    expect(usage.lastViewedAt === null || /^\d{4}-\d{2}-\d{2}$/.test(usage.lastViewedAt)).toBe(true);
  });

  it("is always available and labels its source", async () => {
    const provider = createDemoProvider({ now: () => NOW });
    await expect(provider.isAvailable()).resolves.toBe(true);
    await expect(provider.fetchUsage(episode("abc"), 20)).resolves.toMatchObject({
      episodeId: "abc",
      source: "demo",
    });
  });
});

describe("hashString / seededRandom", () => {
  it("hashes stably and seeds a reproducible sequence in [0, 1)", () => {
    expect(hashString("abc")).toBe(hashString("abc"));
    expect(hashString("abc")).not.toBe(hashString("abd"));
    const first = seededRandom(42);
    const second = seededRandom(42);
    for (let i = 0; i < 5; i++) {
      const value = first();
      expect(value).toBe(second());
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});
