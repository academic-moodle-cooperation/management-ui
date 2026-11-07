import { useMemo } from "react";

import { formatDate, usePluginTranslation } from "@oc-mui/i18n";
import { Loading } from "@oc-mui/ui/components";

import { normalizeSeries, parseDurationMs } from "../data/stats";
import { toEpisodeRef, useUsageStats } from "../data/useUsageStats";

import { SourceBadge } from "./SourceBadge";
import { formatPercent } from "./UsageTable";
import { WatchProfile } from "./WatchProfile";

/** Sources report days, not instants — never show a time of day. */
const DAY = { dateStyle: "medium" } as const;

/**
 * The "Usage" tab inside the episodes table's detail panel.
 *
 * The host hands over the selected row as `selectedElement` (an untyped
 * GraphQL event node); we narrow it to the few fields the providers need.
 */
export interface EpisodeUsageTabProps {
  selectedElement?: unknown;
  refetch?: () => void;
  onClose?: () => void;
}

const DASH = "–";

const isEventLike = (value: unknown): value is { id: string } =>
  typeof value === "object" && value !== null && typeof (value as { id?: unknown }).id === "string";

export const EpisodeUsageTab = ({ selectedElement }: EpisodeUsageTabProps) => {
  const { t } = usePluginTranslation(["usage-stats"]);

  const episodes = useMemo(
    () => (isEventLike(selectedElement) ? [toEpisodeRef(selectedElement, parseDurationMs)] : []),
    [selectedElement],
  );
  const { source, usages, isLoading, isError } = useUsageStats(episodes);
  const episode = episodes[0];
  const usage = episode ? usages.get(episode.id) : undefined;

  if (!episode) return null;

  if (isError) {
    return <p className="p-2 text-sm text-destructive">{t("usage-stats:state.error")}</p>;
  }

  if (isLoading || !usage) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loading className="h-6 w-6" centered={false}>
          {t("usage-stats:state.loading")}
        </Loading>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{t("usage-stats:source.label")}</span>
        <SourceBadge source={source} />
      </div>

      <dl className="grid grid-cols-3 gap-4">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
            {t("usage-stats:table.views")}
          </dt>
          <dd className="text-2xl font-semibold tabular-nums">{usage.views}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
            {t("usage-stats:table.completion")}
          </dt>
          <dd className="text-2xl font-semibold tabular-nums">{formatPercent(usage.completion)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
            {t("usage-stats:table.lastViewed")}
          </dt>
          <dd className="text-sm">{usage.lastViewedAt ? formatDate(usage.lastViewedAt, DAY) : DASH}</dd>
        </div>
      </dl>

      {usage.viewsOverTime ? (
        <section className="space-y-2">
          <h3 className="text-sm font-medium">{t("usage-stats:timeline.title")}</h3>
          <WatchProfile
            profile={normalizeSeries(usage.viewsOverTime)}
            height={72}
            ariaLabel={t("usage-stats:timeline.legend")}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{usage.viewsOverTime.labels[0] ? formatDate(usage.viewsOverTime.labels[0], DAY) : ""}</span>
            <span>{t("usage-stats:timeline.legend")}</span>
            <span>
              {usage.viewsOverTime.labels.at(-1)
                ? formatDate(usage.viewsOverTime.labels.at(-1) as string, DAY)
                : ""}
            </span>
          </div>
        </section>
      ) : null}

      {usage.watchProfile ? (
        <section className="space-y-2">
          <h3 className="text-sm font-medium">{t("usage-stats:profile.title")}</h3>
          <WatchProfile
            profile={usage.watchProfile}
            height={96}
            ariaLabel={t("usage-stats:profile.legend")}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t("usage-stats:profile.start")}</span>
            <span>{t("usage-stats:profile.legend")}</span>
            <span>{t("usage-stats:profile.end")}</span>
          </div>
        </section>
      ) : (
        <p className="text-sm text-muted-foreground">{t("usage-stats:profile.unavailable")}</p>
      )}
    </div>
  );
};
