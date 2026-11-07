import { formatDate, usePluginTranslation } from "@oc-mui/i18n";
import {
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@oc-mui/ui/components";

import { normalizeSeries } from "../data/stats";

import { WatchProfile } from "./WatchProfile";

/** Sources report days, not instants — never show a time of day. */
const DAY = { dateStyle: "medium" } as const;

import type { EpisodeRef, EpisodeUsage } from "../data/types";

export interface UsageTableProps {
  episodes: EpisodeRef[];
  usages: Map<string, EpisodeUsage>;
}

const DASH = "–";

export const formatPercent = (ratio: number | null): string =>
  ratio === null ? DASH : `${Math.round(ratio * 100)} %`;

export const UsageTable = ({ episodes, usages }: UsageTableProps) => {
  const { t } = usePluginTranslation(["usage-stats"]);

  return (
    // Fixed layout: the title and series cells truncate instead of pushing
    // the measure columns out of the card.
    <Table className="table-fixed">
      <TableHeader>
        <TableRow className="[&>th]:whitespace-normal [&>th]:leading-tight">
          <TableHead className="w-[26%]">{t("usage-stats:table.episode")}</TableHead>
          <TableHead className="hidden w-[16%] md:table-cell">{t("usage-stats:table.series")}</TableHead>
          <TableHead className="w-[9%] text-right">{t("usage-stats:table.views")}</TableHead>
          <TableHead className="w-[15%]">{t("usage-stats:table.timeline")}</TableHead>
          <TableHead className="w-[10%] text-right">{t("usage-stats:table.completion")}</TableHead>
          <TableHead className="w-[15%]">{t("usage-stats:table.profile")}</TableHead>
          <TableHead className="hidden w-[11%] lg:table-cell">{t("usage-stats:table.lastViewed")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {episodes.map((episode) => {
          const usage = usages.get(episode.id);
          return (
            <TableRow key={episode.id}>
              <TableCell className="truncate font-medium" title={episode.title}>
                {episode.title}
              </TableCell>
              <TableCell
                className="hidden truncate text-muted-foreground md:table-cell"
                title={episode.seriesName ?? undefined}
              >
                {episode.seriesName ?? DASH}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {usage ? usage.views : <Skeleton className="ml-auto h-4 w-10" />}
              </TableCell>
              <TableCell>
                {!usage ? (
                  <Skeleton className="h-6 w-full" />
                ) : usage.viewsOverTime ? (
                  <WatchProfile
                    profile={normalizeSeries(usage.viewsOverTime)}
                    height={24}
                    ariaLabel={t("usage-stats:timeline.legend")}
                  />
                ) : (
                  <span className="text-muted-foreground">{DASH}</span>
                )}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {usage ? formatPercent(usage.completion) : <Skeleton className="ml-auto h-4 w-10" />}
              </TableCell>
              <TableCell>
                {!usage ? (
                  <Skeleton className="h-6 w-full" />
                ) : usage.watchProfile ? (
                  <WatchProfile
                    profile={usage.watchProfile}
                    height={24}
                    ariaLabel={t("usage-stats:profile.legend")}
                  />
                ) : (
                  <span className="text-muted-foreground">{DASH}</span>
                )}
              </TableCell>
              <TableCell className="hidden truncate text-muted-foreground lg:table-cell">
                {usage ? (usage.lastViewedAt ? formatDate(usage.lastViewedAt, DAY) : DASH) : null}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
