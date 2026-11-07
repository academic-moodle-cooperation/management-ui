export type UsageSource = "statistics" | "usertracking" | "demo";

/** The slice of an episode the providers need — decoupled from the GraphQL shape. */
export interface EpisodeRef {
  id: string;
  title: string;
  seriesName: string | null;
  /** Media duration in milliseconds, or `null` when Opencast does not report one. */
  durationMs: number | null;
}

/** Plays per day (or whatever resolution the source delivers), oldest first. */
export interface TimeSeries {
  labels: string[];
  values: number[];
}

export interface EpisodeUsage {
  episodeId: string;
  /** Total plays recorded for the episode. */
  views: number;
  /** ISO timestamp of the most recent play, or `null` when the source cannot tell. */
  lastViewedAt: string | null;
  /** Plays over time, or `null` when the source only knows totals. */
  viewsOverTime: TimeSeries | null;
  /**
   * "Which parts were watched": one entry per segment of the video, first to
   * last, each the share (0..1) of plays that reached that segment relative
   * to the busiest segment. `null` when the source has no position data.
   */
  watchProfile: number[] | null;
  /** Share (0..1) of plays that reached the final tenth of the video, or `null`. */
  completion: number | null;
  source: UsageSource;
}

export interface UsageProvider {
  readonly source: UsageSource;
  /** Cheap reachability probe, used once by the `auto` source setting. */
  isAvailable(): Promise<boolean>;
  fetchUsage(episode: EpisodeRef, segments: number): Promise<EpisodeUsage>;
}
