import { defaultFetch, fetchJson } from "./http";
import { lastActiveLabel } from "./stats";

import type { FetchLike } from "./http";
import type { EpisodeRef, EpisodeUsage, TimeSeries, UsageProvider } from "./types";

/**
 * Reads Opencast's Statistics External API — the sanctioned route to the
 * numbers a deployment collects in Matomo (or InfluxDB):
 *
 *   GET  /api/statistics/providers?filter=resourceType:episode
 *   POST /api/statistics/data/query   (form field `data` = JSON array of queries)
 *
 * Opencast aggregates per provider (one `etc/statistics/matomo.*.json` each);
 * this plugin asks the first episode-level `timeseries` provider for the
 * last `historyDays` days at daily resolution. Needs `ROLE_API_STATISTICS_VIEW`
 * on the session — admins have it. No providers configured → unavailable.
 */

const DAY_MS = 86_400_000;

interface ProviderInfo {
  identifier: string;
  type?: string;
  resourceType?: string;
}

interface QueryResult {
  data?: { labels?: unknown; values?: unknown; total?: unknown };
}

const isTimeSeries = (provider: ProviderInfo): boolean =>
  (provider.type ?? "").toLowerCase() === "timeseries";

const readProviders = (payload: unknown): ProviderInfo[] =>
  (Array.isArray(payload) ? payload : []).filter(
    (entry): entry is ProviderInfo =>
      typeof entry === "object" && entry !== null && typeof entry.identifier === "string",
  );

const readSeries = (payload: unknown): TimeSeries | null => {
  const first = (Array.isArray(payload) ? payload[0] : undefined) as QueryResult | undefined;
  const labels = first?.data?.labels;
  const values = first?.data?.values;
  if (!Array.isArray(labels) || !Array.isArray(values)) return null;
  return {
    labels: labels.map(String),
    values: values.map((value) => (Number.isFinite(Number(value)) ? Number(value) : 0)),
  };
};

export interface StatisticsProviderOptions {
  historyDays?: number;
  now?: () => Date;
}

export const createStatisticsProvider = (
  baseUrl: string,
  fetchImpl: FetchLike = defaultFetch,
  options: StatisticsProviderOptions = {},
): UsageProvider => {
  const base = baseUrl.replace(/\/$/, "");
  const historyDays = options.historyDays ?? 90;
  const now = options.now ?? (() => new Date());
  let providerPromise: Promise<ProviderInfo | null> | undefined;

  const resolveProvider = (): Promise<ProviderInfo | null> => {
    providerPromise ??= fetchJson(fetchImpl, `${base}/providers?filter=resourceType:episode`)
      .then((payload) => readProviders(payload).find(isTimeSeries) ?? null)
      .catch((error: unknown) => {
        providerPromise = undefined; // let the next call retry a transient failure
        throw error;
      });
    return providerPromise;
  };

  return {
    source: "statistics",

    async isAvailable() {
      try {
        return (await resolveProvider()) !== null;
      } catch {
        return false;
      }
    },

    async fetchUsage(episode: EpisodeRef): Promise<EpisodeUsage> {
      const provider = await resolveProvider();
      if (!provider) throw new Error("No episode-level timeseries statistics provider configured");

      const to = now();
      const from = new Date(to.getTime() - historyDays * DAY_MS);
      const body = new URLSearchParams({
        data: JSON.stringify([
          {
            provider: { identifier: provider.identifier },
            parameters: {
              resourceId: episode.id,
              from: from.toISOString(),
              to: to.toISOString(),
              dataResolution: "daily",
            },
          },
        ]),
      });
      const payload = await fetchJson(fetchImpl, `${base}/data/query`, { method: "POST", body });
      const series = readSeries(payload);
      const views = series ? series.values.reduce((sum, value) => sum + value, 0) : 0;

      return {
        episodeId: episode.id,
        views,
        lastViewedAt: series ? lastActiveLabel(series) : null,
        viewsOverTime: series,
        // Aggregated statistics carry no in-video positions.
        watchProfile: null,
        completion: null,
        source: "statistics",
      };
    },
  };
};
