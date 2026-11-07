import { useMemo } from "react";

import { usePluginTranslation } from "@oc-mui/i18n";
import { OrderDirection, useMuiGetMyEventsQuery } from "@oc-mui/query";
import { Card, CardContent, CardHeader, CardTitle, Loading, PageShell } from "@oc-mui/ui/components";

import { SourceBadge } from "./components/SourceBadge";
import { StatCard } from "./components/StatCard";
import { TopEpisodes } from "./components/TopEpisodes";
import { formatPercent, UsageTable } from "./components/UsageTable";
import { usageStatsConfig, usageStatsConfigDefaults } from "./config";
import { parseDurationMs, summarize } from "./data/stats";
import { toEpisodeRef, useUsageStats } from "./data/useUsageStats";

import type { EpisodeRef } from "./data/types";

const TOP_COUNT = 8;

/** The overview at `/usage-stats`: summary tiles, a leaderboard, and the full table. */
export const UsageStatsPage = () => {
  const { t } = usePluginTranslation(["usage-stats"]);
  const cfg = usageStatsConfig.use();
  const limit = cfg.limit ?? usageStatsConfigDefaults.limit;

  const events = useMuiGetMyEventsQuery({
    limit,
    orderBy: { created: OrderDirection.Desc },
  });

  const episodes = useMemo<EpisodeRef[]>(
    () =>
      (events.data?.currentUser.myEvents.nodes ?? [])
        .filter((node): node is NonNullable<typeof node> => node !== null)
        .map((node) => toEpisodeRef(node, parseDurationMs)),
    [events.data],
  );

  const { source, usages, isLoading } = useUsageStats(episodes);

  const summary = useMemo(() => summarize([...usages.values()]), [usages]);
  const top = useMemo(
    () =>
      episodes
        .flatMap((episode) => {
          const usage = usages.get(episode.id);
          return usage && usage.views > 0 ? [{ episode, usage }] : [];
        })
        .sort((a, b) => b.usage.views - a.usage.views)
        .slice(0, TOP_COUNT),
    [episodes, usages],
  );

  return (
    <PageShell
      title={t("usage-stats:page.title")}
      description={t("usage-stats:page.description")}
      actions={<SourceBadge source={source} />}
    >
      {events.isPending ? (
        <Loading className="h-8 w-8">{t("usage-stats:state.loading")}</Loading>
      ) : events.isError ? (
        <p className="text-destructive">{t("usage-stats:state.error")}</p>
      ) : episodes.length === 0 ? (
        <p className="text-muted-foreground">{t("usage-stats:state.empty")}</p>
      ) : (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label={t("usage-stats:summary.totalViews")} value={summary.totalViews} />
            <StatCard
              label={t("usage-stats:summary.episodes")}
              value={summary.episodes}
              hint={t("usage-stats:summary.withViews", { count: summary.episodesWithViews })}
            />
            <StatCard
              label={t("usage-stats:summary.avgCompletion")}
              value={formatPercent(summary.avgCompletion)}
              hint={t("usage-stats:summary.avgCompletionHint")}
            />
          </div>

          {top.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>{t("usage-stats:top.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <TopEpisodes rows={top} />
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>{t("usage-stats:table.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <UsageTable episodes={episodes} usages={usages} />
              {isLoading ? (
                <p className="mt-4 text-sm text-muted-foreground">{t("usage-stats:state.loading")}</p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      )}
    </PageShell>
  );
};

export default UsageStatsPage;
