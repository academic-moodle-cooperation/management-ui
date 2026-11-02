import { AlertTriangle, RefreshCw, ShieldCheck, Timer } from "lucide-react";

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
   */
  mode?: "remote" | "local";
  onConfirm: (plugin: T) => void;
  onCancel: () => void;
}

/**
 * The consent step before a trial starts. States plainly what it is: for a
 * registry bundle, third-party code with the admin's privileges; for a
 * deployed plugin, a tab-only activation. Always tab-scoped, always reloads.
 */
function TryConfirmDialog<T extends TrySubject>({
  plugin,
  mode = "remote",
  onConfirm,
  onCancel,
}: TryConfirmDialogProps<T>): ReactElement | null {
  if (!plugin) return null;

  let host = plugin.url ?? "";
  try {
    if (plugin.url) host = new URL(plugin.url).hostname;
  } catch {
    /* show the raw URL if unparseable — validation rejects it later anyway */
  }

  return (
    <AlertDialog open onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Try “{plugin.name}” in this tab?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 pt-1 text-sm">
              {mode === "local" ? (
                <p className="flex gap-2.5">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span>
                    This plugin is <b className="font-medium text-foreground">already deployed</b> on this
                    server but switched off by configuration. Nothing is downloaded — it is activated
                    for your tab only, exactly as if it were enabled.
                  </span>
                </p>
              ) : (
                <p className="flex gap-2.5">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                  <span>
                    This runs third-party code from <b className="font-medium text-foreground">{host}</b>{" "}
                    with your administrator privileges in this browser.
                  </span>
                </p>
              )}
              {mode === "remote" && (
              <p className="flex gap-2.5">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span>
                  {plugin.integrity ? (
                    <>
                      The bundle is <b className="font-medium text-foreground">integrity-pinned</b>:
                      only the exact reviewed build will execute.
                    </>
                  ) : (
                    <>
                      This entry is <b className="font-medium text-foreground">not integrity-pinned</b> —
                      the bundle is trusted as served by its host.
                    </>
                  )}
                </span>
              </p>
              )}
              <p className="flex gap-2.5">
                <Timer className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span>
                  Nothing is installed or enabled for anyone else. The trial is active{" "}
                  <b className="font-medium text-foreground">only in this tab</b> and ends when you close it.
                </span>
              </p>
              <p className="flex gap-2.5">
                <RefreshCw className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span>The page reloads to activate it.</span>
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => onConfirm(plugin)}>
            Try it — reload page
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export { TryConfirmDialog };
