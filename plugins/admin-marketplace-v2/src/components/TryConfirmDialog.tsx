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

import type { RegistryPlugin } from "../services/registry";
import type { FC } from "react";

interface TryConfirmDialogProps {
  plugin: RegistryPlugin | null;
  onConfirm: (plugin: RegistryPlugin) => void;
  onCancel: () => void;
}

/**
 * The consent step before any remote code runs. States plainly what a trial
 * is: third-party code with the admin's privileges, tab-scoped, page reloads.
 */
const TryConfirmDialog: FC<TryConfirmDialogProps> = ({ plugin, onConfirm, onCancel }) => {
  if (!plugin) return null;

  let host = plugin.url;
  try {
    host = new URL(plugin.url).hostname;
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
              <p className="flex gap-2.5">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                <span>
                  This runs third-party code from <b className="font-medium text-foreground">{host}</b>{" "}
                  with your administrator privileges in this browser.
                </span>
              </p>
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
              <p className="flex gap-2.5">
                <Timer className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span>
                  Nothing is installed. The trial is active <b className="font-medium text-foreground">only in
                  this tab</b> and ends when you close it.
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
