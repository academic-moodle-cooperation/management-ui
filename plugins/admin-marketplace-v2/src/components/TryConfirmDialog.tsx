import { AlertTriangle, PauseCircle, RefreshCw, ShieldCheck, Timer } from "lucide-react";
import { useState } from "react";

import { useI18n } from "@oc-mui/i18n";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@oc-mui/ui/components";

import { rich } from "../lib/rich";

import type { Conflict } from "../services/conflicts";
import type { ReactElement } from "react";

/** What the dialog needs to describe a trial — a registry entry or a deployed plugin. */
export interface TrySubject {
  name: string;
  url?: string;
  integrity?: string;
}

interface TryConfirmDialogProps<T extends TrySubject> {
  plugin: T | null;
  /**
   * `remote`: a registry bundle will be downloaded and executed.
   * `local`: a plugin already deployed here (but switched off) is previewed.
   * `theme`: a CSS theme is applied in this tab — immediately, no reload.
   */
  mode?: "remote" | "local" | "theme";
  /**
   * Active plugins that fill the same single slots (footer, landing page, …).
   * The dialog names them and offers to pause them in this tab for the trial.
   */
  conflicts?: Conflict[];
  onConfirm: (plugin: T, options: { pause: string[] }) => void;
  onCancel: () => void;
}

/** The emphasised run of a sentence: the `<b>` tag of a translated string. */
const strong = <b className="font-medium text-foreground" />;

/**
 * The consent step before a trial starts. States plainly what it is: for a
 * registry bundle, third-party code with the admin's privileges; for a
 * deployed plugin, a tab-only activation. Always tab-scoped, always reloads.
 */
function TryConfirmDialog<T extends TrySubject>({
  plugin,
  mode = "remote",
  conflicts = [],
  onConfirm,
  onCancel,
}: TryConfirmDialogProps<T>): ReactElement | null {
  const { t } = useI18n();
  // Pausing is the sensible default: without it the two plugins fight per slot.
  const [pause, setPause] = useState(true);
  if (!plugin) return null;

  let host = plugin.url ?? "";
  try {
    if (plugin.url) host = new URL(plugin.url).hostname;
  } catch {
    /* show the raw URL if unparseable — validation rejects it later anyway */
  }
  // Registry data goes in as an element, never spliced into the string (see lib/rich).
  const hostEl = <b className="font-medium text-foreground">{host}</b>;

  return (
    <AlertDialog open onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("marketplace:try.title", { name: plugin.name })}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 pt-1 text-sm">
              {mode === "theme" ? (
                <p className="flex gap-2.5">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span>
                    {rich(t("marketplace:try.theme"), { b: strong })}
                    {host && <> {rich(t("marketplace:try.themeSource"), { host: hostEl })}</>}
                  </span>
                </p>
              ) : mode === "local" ? (
                <p className="flex gap-2.5">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span>{rich(t("marketplace:try.local"), { b: strong })}</span>
                </p>
              ) : (
                <p className="flex gap-2.5">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                  <span>{rich(t("marketplace:try.remote"), { host: hostEl })}</span>
                </p>
              )}
              {mode === "remote" && (
                <p className="flex gap-2.5">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span>
                    {rich(t(plugin.integrity ? "marketplace:try.pinned" : "marketplace:try.notPinned"), {
                      b: strong,
                    })}
                  </span>
                </p>
              )}
              <p className="flex gap-2.5">
                <Timer className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span>{rich(t("marketplace:try.tabOnly"), { b: strong })}</span>
              </p>
              {conflicts.length > 0 && (
                <div className="rounded-lg border border-warning/40 bg-warning/10 p-3">
                  <p className="flex gap-2.5">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                    <span>
                      <b className="font-medium text-foreground">{t("marketplace:try.overlapsTitle")}</b>{" "}
                      {conflicts.map((c, i) => (
                        <span key={c.namespace}>
                          {i > 0 && "; "}
                          {rich(t("marketplace:try.overlapsItem"), {
                            name: <b className="font-medium text-foreground">{c.displayName}</b>,
                            slots: <span>{c.slots.join(", ")}</span>,
                          })}
                        </span>
                      ))}
                      {t("marketplace:try.overlapsTail")}
                    </span>
                  </p>
                  <label className="mt-2.5 flex cursor-pointer items-start gap-2.5 text-foreground">
                    <input
                      type="checkbox"
                      className="mt-0.5 size-4 accent-primary"
                      checked={pause}
                      onChange={(e) => setPause(e.target.checked)}
                    />
                    <span>
                      <PauseCircle className="mr-1 inline size-3.5 text-muted-foreground" />
                      {rich(t("marketplace:try.pause", { count: conflicts.length }), {
                        b: <b className="font-medium" />,
                        names: <span>{conflicts.map((c) => c.displayName).join(t("marketplace:try.pauseJoin"))}</span>,
                      })}
                    </span>
                  </label>
                </div>
              )}
              {mode !== "theme" && (
                <p className="flex gap-2.5">
                  <RefreshCw className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span>{t("marketplace:try.reloads")}</span>
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("marketplace:actions.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onConfirm(plugin, { pause: pause ? conflicts.map((c) => c.namespace) : [] })}
          >
            {mode === "theme" ? t("marketplace:actions.tryIt") : t("marketplace:actions.tryItReload")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export { TryConfirmDialog };
