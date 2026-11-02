import { Info, Palette } from "lucide-react";
import { useState } from "react";

import { useAppConfig } from "@oc-mui/query";
import { Button, Skeleton } from "@oc-mui/ui/components";

import { LibraryRow } from "../components/LibraryRow";
import { TryConfirmDialog } from "../components/TryConfirmDialog";
import { useInventory } from "../hooks/useInventory";
import { useThemePreview } from "../hooks/useThemePreview";
import { endThemePreview } from "../services/themePreview";
import { startLocalTrial } from "../services/trials";

import type { InventoryItem, InventoryStatus } from "../services/inventory";
import type { RegistryPlugin } from "../services/registry";
import type { FC } from "react";

interface LibraryProps {
  catalog: RegistryPlugin[];
}

const GROUPS: Array<{ status: InventoryStatus; title: string; hint: string }> = [
  { status: "active", title: "Active", hint: "Running on this deployment right now" },
  { status: "trial", title: "Trials", hint: "Loaded in this tab only — gone when it closes" },
  {
    status: "disabled",
    title: "Available but disabled",
    hint: "Present on this deployment, switched off by configuration",
  },
];

/**
 * Library — "what is on this deployment, and is it running?"
 *
 * Read-only inventory grouped by status (per the feature discussion):
 * no toggles here — tab-scoped preview arrives with the Try gesture for
 * present-but-disabled plugins, and org-wide enabling stays a deployment
 * decision, which is why every row shows the exact config value to copy.
 */
const Library: FC<LibraryProps> = ({ catalog }) => {
  const { items, loading } = useInventory(catalog);
  const [tryCandidate, setTryCandidate] = useState<InventoryItem | null>(null);
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

  return (
    <div className="py-6">
      <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-border bg-card/60 px-4 py-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" />
        <p>
          This is everything the shell knows about. Enabling a plugin for the whole organisation is a
          deployment step: add its <code className="font-mono">namespace</code> to{" "}
          <code className="font-mono">app.enabledPlugins</code> in <code className="font-mono">config.json</code>{" "}
          (every row has a copy button for that value). A plugin can additionally be switched off at
          runtime via <code className="font-mono">config.plugins.&lt;namespace&gt;.enabled: false</code>.
        </p>
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-border bg-card px-4 py-3 text-sm">
        <Palette className="size-4 shrink-0 text-muted-foreground" />
        <span className="font-semibold">Theme</span>
        <span className="text-muted-foreground">
          active for everyone: <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11.5px] text-foreground">{activeTheme}</code>
          <span className="ml-1.5 text-xs">(via <code className="font-mono">app.theme</code>)</span>
        </span>
        {themePreview && (
          <>
            <span className="flex items-center gap-1 rounded-md bg-warning/15 px-1.5 py-0.5 text-[10.5px] font-semibold text-warning">
              previewing {themePreview.name} · this tab
            </span>
            <Button variant="outline" size="sm" className="ml-auto h-7 px-2.5 text-xs" onClick={endThemePreview}>
              End preview
            </Button>
          </>
        )}
      </div>

      {GROUPS.map(({ status, title, hint }) => {
        const group = byStatus.get(status) ?? [];
        if (group.length === 0 && status === "trial") return null;
        return (
          <section key={status} className="mb-8">
            <div className="mb-3 flex items-baseline gap-2.5">
              <h2 className="font-heading text-base font-semibold">{title}</h2>
              <span className="font-mono text-xs text-muted-foreground">{group.length}</span>
              <span className="text-xs text-muted-foreground">— {hint}</span>
            </div>
            {group.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
                {status === "active"
                  ? "Nothing is registered — that would be a broken boot; check the console."
                  : "Everything present is enabled."}
              </p>
            ) : (
              <div className="space-y-2">
                {group.map((item) => (
                  <LibraryRow key={item.key} item={item} onTry={setTryCandidate} />
                ))}
              </div>
            )}
          </section>
        );
      })}

      <TryConfirmDialog
        plugin={tryCandidate ? { ...tryCandidate, name: tryCandidate.displayName } : null}
        mode="local"
        onConfirm={(item) =>
          startLocalTrial({
            namespace: item.namespace,
            name: item.displayName,
            ...(item.version !== undefined && { version: item.version }),
          })
        }
        onCancel={() => setTryCandidate(null)}
      />
    </div>
  );
};

export { Library };
