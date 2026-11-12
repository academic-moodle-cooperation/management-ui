import { Info, Palette } from "lucide-react";
import { useEffect, useState } from "react";

import { useI18n } from "@oc-mui/i18n";
import { useAppConfig } from "@oc-mui/query";
import { Button, Skeleton } from "@oc-mui/ui/components";

import { LibraryRow } from "../components/LibraryRow";
import { TryConfirmDialog } from "../components/TryConfirmDialog";
import { useThemePreview } from "../hooks/useThemePreview";
import { rich } from "../lib/rich";
import { findConflicts } from "../services/conflicts";
import { endThemePreview } from "../services/themePreview";
import { startLocalTrial } from "../services/trials";

import type { InventoryState } from "../hooks/useInventory";
import type { InventoryItem, InventoryStatus } from "../services/inventory";
import type { FC } from "react";

interface LibraryProps {
  /** Loaded by the page (the header's Installed count reads it too). */
  inventory: InventoryState;
  /** A namespace to scroll to and flash once (from an Explore "Installed" pill or `#library=<ns>`). */
  focusNamespace?: string | null;
}

/** How long the focused row keeps its ring. */
const FOCUS_FLASH_MS = 2400;

/** DOM id of a row (LibraryRow renders the same literal), so a focus can find it after the tab mounts. */
function rowId(namespace: string): string {
  return `installed-${namespace}`;
}

/** Group order; title and hint resolve from `marketplace:library.groups.<status>[Hint]`. */
const GROUPS: InventoryStatus[] = ["active", "trial", "paused", "disabled"];

/**
 * Installed (the "Library" view) — "what is on this deployment, and is it running?"
 *
 * Read-only inventory grouped by status (per the feature discussion):
 * no toggles here — tab-scoped preview arrives with the Try gesture for
 * present-but-disabled plugins, and org-wide enabling stays a deployment
 * decision, which is why every row shows the exact config value to copy.
 */
const Library: FC<LibraryProps> = ({ inventory, focusNamespace = null }) => {
  const { t } = useI18n();
  const { items, loading } = inventory;
  const [tryCandidate, setTryCandidate] = useState<InventoryItem | null>(null);
  const [flashing, setFlashing] = useState<string | null>(null);

  // Once the rows exist, bring the focused one into view and ring it briefly.
  useEffect(() => {
    if (loading || !focusNamespace) return;
    const el = document.getElementById(rowId(focusNamespace));
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    setFlashing(focusNamespace);
    const timer = window.setTimeout(() => setFlashing(null), FOCUS_FLASH_MS);
    return () => window.clearTimeout(timer);
  }, [loading, focusNamespace]);
  const { config } = useAppConfig();
  const activeTheme =
    ((config as unknown as { app?: { theme?: string } } | undefined)?.app?.theme ?? "default") || "default";
  const themePreview = useThemePreview();

  if (loading) {
    return (
      <div className="space-y-2 py-6">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex gap-3.5 rounded-xl border border-border p-3.5">
            <Skeleton className="size-11 rounded-xl" />
            <div className="flex-1 space-y-2 py-0.5">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const byStatus = new Map<InventoryStatus, InventoryItem[]>();
  for (const item of items) {
    byStatus.set(item.status, [...(byStatus.get(item.status) ?? []), item]);
  }
  const presence = new Map(items.map((i) => [i.namespace, i.status]));

  return (
    <div className="py-6">
      <p className="mb-3 text-sm font-medium text-foreground">{t("marketplace:library.lead")}</p>
      <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-border bg-card/60 px-4 py-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" />
        <p>
          {rich(t("marketplace:library.intro"), {
            code: <code className="font-mono" />,
            switch: <code className="font-mono">config.plugins.&lt;namespace&gt;.enabled: false</code>,
          })}
        </p>
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-border bg-card px-4 py-3 text-sm">
        <Palette className="size-4 shrink-0 text-muted-foreground" />
        <span className="font-semibold">{t("marketplace:library.theme")}</span>
        <span className="text-muted-foreground">
          {t("marketplace:library.themeActive")}{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11.5px] text-foreground">{activeTheme}</code>
          <span className="ml-1.5 text-xs">
            {rich(t("marketplace:library.themeVia"), { code: <code className="font-mono" /> })}
          </span>
        </span>
        {themePreview && (
          <>
            <span className="flex items-center gap-1 rounded-md bg-warning/15 px-1.5 py-0.5 text-[10.5px] font-semibold text-warning">
              {t("marketplace:library.themePreviewing", { name: themePreview.name })}
            </span>
            <Button variant="outline" size="sm" className="ml-auto h-7 px-2.5 text-xs" onClick={endThemePreview}>
              {t("marketplace:actions.endPreview")}
            </Button>
          </>
        )}
      </div>

      {GROUPS.map((status) => {
        const group = byStatus.get(status) ?? [];
        if (group.length === 0 && (status === "trial" || status === "paused")) return null;
        return (
          <section key={status} className="mb-8">
            <div className="mb-3 flex items-baseline gap-2.5">
              <h2 className="font-heading text-base font-semibold">{t(`marketplace:library.groups.${status}`)}</h2>
              <span className="font-mono text-xs text-muted-foreground">{group.length}</span>
              <span className="text-xs text-muted-foreground">— {t(`marketplace:library.groups.${status}Hint`)}</span>
            </div>
            {group.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
                {status === "active"
                  ? t("marketplace:library.emptyActive")
                  : t("marketplace:library.emptyDisabled")}
              </p>
            ) : (
              <div className="space-y-2">
                {group.map((item) => (
                  <LibraryRow
                    key={item.key}
                    item={item}
                    onTry={setTryCandidate}
                    presence={presence}
                    focused={flashing === item.namespace}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}

      <TryConfirmDialog
        plugin={tryCandidate ? { ...tryCandidate, name: tryCandidate.displayName } : null}
        mode="local"
        conflicts={tryCandidate ? findConflicts(tryCandidate, items) : []}
        onConfirm={(item, options) =>
          startLocalTrial(
            {
              namespace: item.namespace,
              name: item.displayName,
              ...(item.version !== undefined && { version: item.version }),
            },
            options,
          )
        }
        onCancel={() => setTryCandidate(null)}
      />
    </div>
  );
};

export { Library };
