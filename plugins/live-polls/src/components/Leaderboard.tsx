import { useTranslation } from "@oc-mui/i18n";

import { quizLeaderboard } from "../transport/aggregate";

import type { SessionState } from "../types";

/** Quiz score ranking, derived from the session state. */
export function Leaderboard({ state }: { state: SessionState }) {
  const { t } = useTranslation("live-polls");
  const board = quizLeaderboard(state);

  if (board.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("results.noResponses")}</p>;
  }

  return (
    <ol className="flex flex-col gap-1.5">
      {board.map((entry, index) => (
        <li
          key={entry.participantId}
          className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
        >
          <span className="flex items-center gap-3">
            <span className="w-5 tabular-nums text-muted-foreground">{index + 1}</span>
            <span className="font-medium">{entry.name || t("results.you")}</span>
          </span>
          <span className="font-semibold tabular-nums">{entry.score}</span>
        </li>
      ))}
    </ol>
  );
}
