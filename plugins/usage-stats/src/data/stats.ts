import type { EpisodeUsage, TimeSeries } from "./types";

/** One usertracking footprint: how many plays touched `position` (seconds). */
export interface Footprint {
  position: number;
  views: number;
}

export const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/**
 * Opencast reports `duration` inconsistently across versions and catalogs:
 * a number of milliseconds, a numeric string, or `HH:MM:SS`. Normalise to
 * milliseconds; anything unusable becomes `null` rather than `NaN`.
 */
export const parseDurationMs = (duration: unknown): number | null => {
  if (typeof duration === "number") {
    return Number.isFinite(duration) && duration > 0 ? duration : null;
  }
  if (typeof duration !== "string") return null;

  const trimmed = duration.trim();
  if (/^\d+$/.test(trimmed)) {
    const ms = Number(trimmed);
    return ms > 0 ? ms : null;
  }

  const parts = trimmed.split(":").map(Number);
  if (parts.length === 3 && parts.every((part) => Number.isFinite(part))) {
    const [hours, minutes, seconds] = parts as [number, number, number];
    const ms = ((hours * 60 + minutes) * 60 + seconds) * 1000;
    return ms > 0 ? ms : null;
  }
  return null;
};

/**
 * Fold per-second footprints into `segments` equal parts of the video and
 * normalise against the busiest segment, so the result reads as "share of
 * plays that reached this part". Without a known duration the last footprint
 * position is taken as the end of the video.
 */
export const bucketizeFootprints = (
  footprints: Footprint[],
  durationMs: number | null,
  segments: number,
): number[] => {
  const profile = new Array<number>(segments).fill(0);
  const usable = footprints.filter(
    (f) => Number.isFinite(f.position) && Number.isFinite(f.views) && f.position >= 0,
  );
  if (usable.length === 0 || segments <= 0) return profile;

  const endSeconds =
    durationMs && durationMs > 0
      ? durationMs / 1000
      : Math.max(...usable.map((f) => f.position), 1);

  for (const { position, views } of usable) {
    const index = Math.min(segments - 1, Math.floor((position / endSeconds) * segments));
    profile[index] = Math.max(profile[index] ?? 0, views);
  }

  const peak = Math.max(...profile);
  return peak > 0 ? profile.map((value) => clamp01(value / peak)) : profile;
};

/** Completion = mean of the final tenth of the profile (at least one segment). */
export const completionOf = (profile: number[]): number => {
  if (profile.length === 0) return 0;
  const tailLength = Math.max(1, Math.round(profile.length * 0.1));
  const tail = profile.slice(-tailLength);
  return clamp01(tail.reduce((sum, value) => sum + value, 0) / tail.length);
};

/** Scale a series to 0..1 against its peak so it can share the area-chart component. */
export const normalizeSeries = (series: TimeSeries): number[] => {
  const peak = Math.max(0, ...series.values);
  return peak > 0 ? series.values.map((value) => clamp01(value / peak)) : series.values.map(() => 0);
};

/** The newest label with at least one play, or `null`. */
export const lastActiveLabel = (series: TimeSeries): string | null => {
  for (let i = series.values.length - 1; i >= 0; i--) {
    if ((series.values[i] ?? 0) > 0) return series.labels[i] ?? null;
  }
  return null;
};

export interface UsageSummary {
  totalViews: number;
  episodes: number;
  episodesWithViews: number;
  /** Mean completion over the viewed episodes that report one; `null` when none does. */
  avgCompletion: number | null;
}

export const summarize = (usages: EpisodeUsage[]): UsageSummary => {
  const withViews = usages.filter((usage) => usage.views > 0);
  const withCompletion = withViews.filter(
    (usage): usage is EpisodeUsage & { completion: number } => usage.completion !== null,
  );
  const avgCompletion =
    withCompletion.length === 0
      ? null
      : clamp01(
          withCompletion.reduce((sum, usage) => sum + usage.completion, 0) / withCompletion.length,
        );
  return {
    totalViews: usages.reduce((sum, usage) => sum + usage.views, 0),
    episodes: usages.length,
    episodesWithViews: withViews.length,
    avgCompletion,
  };
};
