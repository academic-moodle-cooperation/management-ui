import { describe, expect, it } from "vitest";

import {
  bucketizeFootprints,
  completionOf,
  lastActiveLabel,
  normalizeSeries,
  parseDurationMs,
  summarize,
} from "./stats";

import type { EpisodeUsage } from "./types";

describe("parseDurationMs", () => {
  it("accepts milliseconds as number or numeric string", () => {
    expect(parseDurationMs(90_000)).toBe(90_000);
    expect(parseDurationMs("90000")).toBe(90_000);
  });

  it("parses HH:MM:SS", () => {
    expect(parseDurationMs("01:30:00")).toBe(5_400_000);
  });

  it("returns null for anything unusable", () => {
    expect(parseDurationMs(undefined)).toBeNull();
    expect(parseDurationMs(0)).toBeNull();
    expect(parseDurationMs("soon")).toBeNull();
    expect(parseDurationMs(Number.NaN)).toBeNull();
  });
});

describe("bucketizeFootprints", () => {
  it("returns an all-zero profile without footprints", () => {
    expect(bucketizeFootprints([], 60_000, 4)).toEqual([0, 0, 0, 0]);
  });

  it("folds per-second footprints into segments and normalises to the peak", () => {
    const footprints = [
      { position: 0, views: 10 },
      { position: 15, views: 8 },
      { position: 30, views: 4 },
      { position: 59, views: 2 },
    ];
    expect(bucketizeFootprints(footprints, 60_000, 4)).toEqual([1, 0.8, 0.4, 0.2]);
  });

  it("uses the last footprint as the end when the duration is unknown", () => {
    const footprints = [
      { position: 0, views: 4 },
      { position: 100, views: 2 },
    ];
    expect(bucketizeFootprints(footprints, null, 2)).toEqual([1, 0.5]);
  });

  it("never indexes past the last segment", () => {
    const profile = bucketizeFootprints([{ position: 999, views: 1 }], 10_000, 5);
    expect(profile).toHaveLength(5);
    expect(profile[4]).toBe(1);
  });
});

describe("completionOf", () => {
  it("averages the final tenth of the profile", () => {
    const profile = [1, 1, 1, 1, 1, 1, 1, 1, 0.5, 0.3];
    expect(completionOf(profile)).toBeCloseTo(0.3);
  });

  it("is 0 for an empty profile", () => {
    expect(completionOf([])).toBe(0);
  });
});

describe("time series helpers", () => {
  const series = { labels: ["d1", "d2", "d3", "d4"], values: [2, 8, 4, 0] };

  it("normalises against the peak", () => {
    expect(normalizeSeries(series)).toEqual([0.25, 1, 0.5, 0]);
    expect(normalizeSeries({ labels: ["x"], values: [0] })).toEqual([0]);
  });

  it("finds the newest active label", () => {
    expect(lastActiveLabel(series)).toBe("d3");
    expect(lastActiveLabel({ labels: ["a"], values: [0] })).toBeNull();
  });
});

describe("summarize", () => {
  const usage = (views: number, completion: number | null): EpisodeUsage => ({
    episodeId: `e${views}-${completion}`,
    views,
    lastViewedAt: null,
    viewsOverTime: null,
    watchProfile: null,
    completion,
    source: "demo",
  });

  it("counts views and averages completion over viewed episodes that report one", () => {
    const summary = summarize([usage(10, 0.5), usage(0, 1), usage(30, 0.9), usage(5, null)]);
    expect(summary).toEqual({
      totalViews: 45,
      episodes: 4,
      episodesWithViews: 3,
      avgCompletion: 0.7,
    });
  });

  it("reports null completion when no source provides one", () => {
    expect(summarize([usage(3, null)]).avgCompletion).toBeNull();
  });
});
