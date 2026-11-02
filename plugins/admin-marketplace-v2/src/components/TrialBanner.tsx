import { FlaskConical, XCircle } from "lucide-react";

import { Button } from "@oc-mui/ui/components";

import { endAllTrials, endTrial, type Trial } from "../services/trials";

import type { FC } from "react";

interface TrialBannerProps {
  trials: Trial[];
  errors: Record<string, string>;
}

/**
 * Visible state for active trials: the ephemerality lives in the UI, not in
 * fine print. Load failures surface here too, with the reason, so a broken
 * trial can be understood and ended instead of silently doing nothing.
 */
const TrialBanner: FC<TrialBannerProps> = ({ trials, errors }) => {
  if (trials.length === 0) return null;

  return (
    <div className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3">
      <div className="flex items-center gap-2.5">
        <FlaskConical className="size-4 shrink-0 text-warning" />
        <span className="text-sm font-semibold">
          {trials.length === 1 ? "1 plugin loaded" : `${trials.length} plugins loaded`} for this tab
          only
        </span>
        <span className="text-xs text-muted-foreground">— gone when the tab closes</span>
        {trials.length > 1 && (
          <Button variant="ghost" size="sm" className="ml-auto" onClick={endAllTrials}>
            End all trials
          </Button>
        )}
      </div>
      <ul className="mt-2 space-y-1.5">
        {trials.map((trial) => {
          const error = errors[trial.id];
          return (
            <li key={trial.id} className="flex items-center gap-2 text-sm">
              {error ? (
                <XCircle className="size-3.5 shrink-0 text-error" />
              ) : (
                <span className="size-1.5 shrink-0 rounded-full bg-ok" />
              )}
              <span className="font-medium">{trial.name}</span>
              {trial.version && (
                <span className="font-mono text-xs text-muted-foreground">v{trial.version}</span>
              )}
              <span className="text-xs text-muted-foreground">
                {trial.kind === "local" ? "deployed here · previewing" : "from registry"}
              </span>
              {error && (
                <span className="min-w-0 truncate text-xs text-error" title={error}>
                  {error}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                className="ml-auto h-7 px-2.5 text-xs"
                onClick={() => endTrial(trial.id)}
              >
                End trial
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export { TrialBanner };
