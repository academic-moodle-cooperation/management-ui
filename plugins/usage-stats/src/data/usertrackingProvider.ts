import { asArray, defaultFetch, fetchJson } from "./http";
import { bucketizeFootprints, completionOf } from "./stats";

import type { FetchLike } from "./http";
import type { Footprint } from "./stats";
import type { EpisodeRef, EpisodeUsage, UsageProvider } from "./types";

/**
 * Reads Opencast's usertracking REST service — the one source that knows
 * *which parts* of a video were watched:
 *
 *   GET /usertracking/stats.json?id=<mediapackage>      → { stats: { views } }
 *   GET /usertracking/footprint.json?id=<mediapackage>  → { footprints: { footprint: [{ position, views }] } }
 *
 * The dev server proxies `/usertracking` to `VITE_PROXY_TARGET`. When the
 * module is not deployed the server answers 404, which `isAvailable()`
 * turns into `false`.
 */

const PROBE_ID = "usage-stats-probe";

const readViews = (payload: unknown): number => {
  const raw = (payload as { stats?: { views?: unknown } } | null)?.stats?.views;
  const views = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(views) && views > 0 ? views : 0;
};

const readFootprints = (payload: unknown): Footprint[] => {
  const raw = (payload as { footprints?: { footprint?: unknown } } | null)?.footprints
    ?.footprint as Footprint | Footprint[] | null | undefined;
  return asArray(raw)
    .map((f) => ({ position: Number(f?.position), views: Number(f?.views) }))
    .filter((f) => Number.isFinite(f.position) && Number.isFinite(f.views));
};

export const createUsertrackingProvider = (
  baseUrl: string,
  fetchImpl: FetchLike = defaultFetch,
): UsageProvider => {
  const base = baseUrl.replace(/\/$/, "");
  const get = (path: string) => fetchJson(fetchImpl, `${base}${path}`);

  return {
    source: "usertracking",

    async isAvailable() {
      try {
        await get(`/stats.json?id=${PROBE_ID}`);
        return true;
      } catch {
        return false;
      }
    },

    async fetchUsage(episode: EpisodeRef, segments: number): Promise<EpisodeUsage> {
      const id = encodeURIComponent(episode.id);
      const [stats, footprint] = await Promise.all([
        get(`/stats.json?id=${id}`),
        get(`/footprint.json?id=${id}`),
      ]);
      const watchProfile = bucketizeFootprints(readFootprints(footprint), episode.durationMs, segments);
      return {
        episodeId: episode.id,
        views: readViews(stats),
        // These endpoints expose neither a timeline nor a "last played" stamp.
        lastViewedAt: null,
        viewsOverTime: null,
        watchProfile,
        completion: completionOf(watchProfile),
        source: "usertracking",
      };
    },
  };
};
