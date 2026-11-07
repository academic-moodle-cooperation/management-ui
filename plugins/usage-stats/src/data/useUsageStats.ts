import { useMemo } from "react";

import { useQueries, useQuery } from "@oc-mui/query";

import { usageStatsConfig, usageStatsConfigDefaults } from "../config";

import { createDemoProvider } from "./demoProvider";
import { createStatisticsProvider } from "./statisticsProvider";
import { createUsertrackingProvider } from "./usertrackingProvider";

import type { EpisodeRef, EpisodeUsage, UsageProvider, UsageSource } from "./types";

export type SourceSetting = "auto" | UsageSource;

/** Probe order for `auto`: richest real source first, demo last. */
const AUTO_ORDER: UsageSource[] = ["statistics", "usertracking"];

/** Decide once which provider serves this session. Exported for tests. */
export const resolveSource = async (
  preferred: SourceSetting,
  providers: Record<UsageSource, UsageProvider>,
): Promise<UsageSource> => {
  if (preferred !== "auto") return preferred;
  for (const source of AUTO_ORDER) {
    if (await providers[source].isAvailable()) return source;
  }
  return "demo";
};

export interface UseUsageStatsResult {
  /** `undefined` while the `auto` probe is still running. */
  source: UsageSource | undefined;
  usages: Map<string, EpisodeUsage>;
  isLoading: boolean;
  isError: boolean;
}

/**
 * Usage numbers for a list of episodes, one query per episode so the table
 * fills in progressively and a single failing episode does not blank the page.
 */
export const useUsageStats = (episodes: EpisodeRef[]): UseUsageStatsResult => {
  const cfg = usageStatsConfig.use();
  const preferred = cfg.source ?? usageStatsConfigDefaults.source;
  const segments = cfg.segments ?? usageStatsConfigDefaults.segments;
  const historyDays = cfg.historyDays ?? usageStatsConfigDefaults.historyDays;
  const statisticsBaseUrl = cfg.statisticsBaseUrl ?? usageStatsConfigDefaults.statisticsBaseUrl;
  const usertrackingBaseUrl =
    cfg.usertrackingBaseUrl ?? usageStatsConfigDefaults.usertrackingBaseUrl;

  const providers = useMemo<Record<UsageSource, UsageProvider>>(
    () => ({
      statistics: createStatisticsProvider(statisticsBaseUrl, undefined, { historyDays }),
      usertracking: createUsertrackingProvider(usertrackingBaseUrl),
      demo: createDemoProvider(),
    }),
    [statisticsBaseUrl, usertrackingBaseUrl, historyDays],
  );

  const probe = useQuery({
    queryKey: ["usage-stats", "source", preferred, statisticsBaseUrl, usertrackingBaseUrl],
    queryFn: () => resolveSource(preferred, providers),
    staleTime: Infinity,
  });
  const source = probe.data;

  const results = useQueries({
    queries: episodes.map((episode) => ({
      queryKey: ["usage-stats", "episode", source, episode.id, segments, historyDays],
      queryFn: () => providers[source ?? "demo"].fetchUsage(episode, segments),
      enabled: source !== undefined,
      staleTime: 5 * 60 * 1000,
    })),
  });

  const usages = useMemo(() => {
    const map = new Map<string, EpisodeUsage>();
    for (const result of results) {
      if (result.data) map.set(result.data.episodeId, result.data);
    }
    return map;
  }, [results]);

  return {
    source,
    usages,
    isLoading: probe.isPending || results.some((result) => result.isPending),
    isError: probe.isError || results.some((result) => result.isError),
  };
};

/** Map a GraphQL event node onto the provider-facing shape. */
export const toEpisodeRef = (
  node: { id: string; title?: string | null; seriesName?: string | null; duration?: unknown },
  parseDuration: (duration: unknown) => number | null,
): EpisodeRef => ({
  id: node.id,
  title: node.title?.trim() ? node.title : node.id,
  seriesName: node.seriesName ?? null,
  durationMs: parseDuration(node.duration),
});
