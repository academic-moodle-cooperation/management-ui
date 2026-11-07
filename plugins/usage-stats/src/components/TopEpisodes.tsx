import { usePluginTranslation } from "@oc-mui/i18n";

import type { EpisodeRef, EpisodeUsage } from "../data/types";

export interface TopEpisodesProps {
  rows: Array<{ episode: EpisodeRef; usage: EpisodeUsage }>;
}

/** Horizontal bars, longest first — the "most watched" leaderboard. */
export const TopEpisodes = ({ rows }: TopEpisodesProps) => {
  const { t } = usePluginTranslation(["usage-stats"]);
  const max = Math.max(1, ...rows.map((row) => row.usage.views));

  return (
    <ol className="space-y-3">
      {rows.map(({ episode, usage }) => (
        <li key={episode.id} className="space-y-1">
          <div className="flex items-baseline justify-between gap-4 text-sm">
            <span className="truncate text-foreground" title={episode.title}>
              {episode.title}
            </span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {t("usage-stats:top.views", { count: usage.views })}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${Math.round((usage.views / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
};
