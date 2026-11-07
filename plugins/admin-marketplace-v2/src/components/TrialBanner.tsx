import { FlaskConical, Palette, PauseCircle, XCircle } from "lucide-react";

import { useI18n } from "@oc-mui/i18n";
import { Button } from "@oc-mui/ui/components";

import { endThemePreview, type ThemePreview } from "../services/themePreview";
import { endAllTrials, endTrial, type Trial } from "../services/trials";

import type { FC } from "react";

interface TrialBannerProps {
  trials: Trial[];
  errors: Record<string, string>;
  /** The theme previewed in this tab, if any (live, no reload). */
  themePreview?: ThemePreview | null;
}

/**
 * Visible state for active trials: the ephemerality lives in the UI, not in
 * fine print. Load failures surface here too, with the reason, so a broken
 * trial can be understood and ended instead of silently doing nothing.
 */
const TrialBanner: FC<TrialBannerProps> = ({ trials, errors, themePreview }) => {
  const { t } = useI18n();
  if (trials.length === 0 && !themePreview) return null;
  const parts = [
    trials.length > 0 ? t("marketplace:banner.plugins", { count: trials.length }) : null,
    themePreview ? t("marketplace:banner.theme") : null,
  ].filter(Boolean);

  return (
    <div className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3">
      <div className="flex items-center gap-2.5">
        <FlaskConical className="size-4 shrink-0 text-warning" />
        <span className="text-sm font-semibold">
          {t("marketplace:banner.loaded", { what: parts.join(t("marketplace:banner.join")) })}
        </span>
        <span className="text-xs text-muted-foreground">{t("marketplace:banner.gone")}</span>
        {trials.length > 1 && (
          <Button variant="ghost" size="sm" className="ml-auto" onClick={endAllTrials}>
            {t("marketplace:actions.endAllTrials")}
          </Button>
        )}
      </div>
      <ul className="mt-2 space-y-1.5">
        {themePreview && (
          <li className="flex items-center gap-2 text-sm">
            <Palette className="size-3.5 shrink-0 text-warning" />
            <span className="font-medium">{themePreview.name}</span>
            <span className="text-xs text-muted-foreground">{t("marketplace:banner.themeApplied")}</span>
            <Button variant="outline" size="sm" className="ml-auto h-7 px-2.5 text-xs" onClick={endThemePreview}>
              {t("marketplace:actions.endPreview")}
            </Button>
          </li>
        )}
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
                {trial.kind === "local"
                  ? t("marketplace:banner.deployedPreviewing")
                  : t("marketplace:banner.fromRegistry")}
              </span>
              {trial.paused && trial.paused.length > 0 && (
                <span
                  className="flex items-center gap-1 rounded-md bg-warning/15 px-1.5 py-0.5 text-[10.5px] font-semibold text-warning"
                  title={t("marketplace:banner.pausingHint")}
                >
                  <PauseCircle className="size-3" />{" "}
                  {t("marketplace:banner.pausing", { names: trial.paused.join(", ") })}
                </span>
              )}
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
                {t("marketplace:actions.endTrial")}
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export { TrialBanner };
