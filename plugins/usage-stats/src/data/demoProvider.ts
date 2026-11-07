import { clamp01, completionOf, lastActiveLabel } from "./stats";

import type { EpisodeRef, EpisodeUsage, TimeSeries, UsageProvider } from "./types";

/**
 * Deterministic stand-in for the real sources.
 *
 * Everything derives from a hash of the episode id, so a given episode shows
 * the same numbers on every render, in every browser, and in tests — which is
 * what makes the demo honest: the UI labels the source, and nothing changes
 * underneath the user while they look at it.
 */

const DAY_MS = 86_400_000;
export const DEMO_HISTORY_DAYS = 30;

/** FNV-1a — small, fast, and good enough to seed a PRNG from an id. */
export const hashString = (input: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

/** mulberry32 — a tiny seeded PRNG returning values in [0, 1). */
export const seededRandom = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const dayLabel = (now: Date, daysBack: number): string =>
  new Date(now.getTime() - daysBack * DAY_MS).toISOString().slice(0, 10);

export const generateDemoUsage = (
  episode: EpisodeRef,
  segments: number,
  now: Date,
): EpisodeUsage => {
  const random = seededRandom(hashString(episode.id));

  // Skewed towards small numbers: most videos are watched a little, a few a lot.
  const popularity = random();
  const dailyPeak = 1 + popularity * popularity * 40;

  // Plays per day over the last month, with a weekly rhythm and a spike
  // (an exam week, say) — ending on today so the sparkline reads as "recent".
  const spikeDay = Math.floor(random() * DEMO_HISTORY_DAYS);
  const labels: string[] = [];
  const values: number[] = [];
  for (let day = DEMO_HISTORY_DAYS - 1; day >= 0; day--) {
    const weekday = (now.getUTCDay() - (day % 7) + 7) % 7;
    const weekend = weekday === 0 || weekday === 6 ? 0.35 : 1;
    const spike = day === spikeDay ? 2.5 : 1;
    values.push(Math.round(random() * dailyPeak * weekend * spike));
    labels.push(dayLabel(now, day));
  }
  const viewsOverTime: TimeSeries = { labels, values };
  const views = values.reduce((sum, value) => sum + value, 0);

  // A typical watch curve: everyone sees the start, attention decays, and one
  // section gets re-watched (the "rewatch bump" — a worked example, usually).
  const bumpAt = Math.floor(random() * segments);
  const decayPerSegment = 0.02 + (1 - popularity) * 0.05;
  const profile: number[] = [];
  let level = 1;
  for (let i = 0; i < segments; i++) {
    if (i > 0) level -= random() * decayPerSegment * 2;
    const value = i === bumpAt ? level + 0.1 + random() * 0.15 : level;
    profile.push(clamp01(value));
  }

  return {
    episodeId: episode.id,
    views,
    lastViewedAt: lastActiveLabel(viewsOverTime),
    viewsOverTime,
    watchProfile: profile,
    completion: completionOf(profile),
    source: "demo",
  };
};

export const createDemoProvider = (options: { now?: () => Date } = {}): UsageProvider => {
  const now = options.now ?? (() => new Date());
  return {
    source: "demo",
    isAvailable: () => Promise.resolve(true),
    fetchUsage: (episode, segments) => Promise.resolve(generateDemoUsage(episode, segments, now())),
  };
};
