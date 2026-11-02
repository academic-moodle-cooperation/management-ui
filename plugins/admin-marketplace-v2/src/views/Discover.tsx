import { RefreshCw, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Button, Input, Skeleton } from "@oc-mui/ui/components";

import { DetailDialog } from "../components/DetailDialog";
import { PluginRow, taglineOf } from "../components/PluginRow";
import { TrialBanner } from "../components/TrialBanner";
import { TryConfirmDialog } from "../components/TryConfirmDialog";
import { marketplaceV2Config } from "../config";
import {
  endTrial,
  getTrialErrors,
  getTrials,
  isTrialActive,
  startTrial,
} from "../services/trials";

import type { CatalogState } from "../hooks/useCatalog";
import type { RegistryCategory, RegistryPlugin } from "../services/registry";
import type { FC } from "react";

/**
 * Discover — the catalog view of the v2 marketplace.
 *
 * Job (per INTENT.md): show what exists, invitingly — plus exactly one
 * gesture, **Try**: an ephemeral, tab-scoped trial behind a consent dialog.
 * There is deliberately no install; permanence goes through the ops path.
 *
 * Layout note: this view intentionally does not use PageShell. Like the
 * landing page (see PageShell's doc comment), the marketplace is a showcase
 * surface with its own hero — not a standard content page.
 */

const CATEGORY_FILTERS: Array<{ key: RegistryCategory | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "feature", label: "Features" },
  { key: "integration", label: "Integrations" },
  { key: "utility", label: "Utilities" },
  { key: "theme", label: "Themes" },
  { key: "experimental", label: "Experimental" },
];

function matches(plugin: RegistryPlugin, query: string, category: RegistryCategory | "all"): boolean {
  if (category !== "all" && plugin.category !== category) return false;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    plugin.name,
    plugin.description,
    plugin.tagline ?? "",
    plugin.author.name,
    ...(plugin.tags ?? []),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

interface DiscoverProps {
  /** Shared with the Library tab so the catalog is fetched once per page. */
  catalog: CatalogState;
}

const Discover: FC<DiscoverProps> = ({ catalog }) => {
  const cfg = marketplaceV2Config.use();
  const { plugins, loading, error, reload } = catalog;
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<RegistryCategory | "all">("all");
  const [selected, setSelected] = useState<RegistryPlugin | null>(null);
  const [tryCandidate, setTryCandidate] = useState<RegistryPlugin | null>(null);

  // Trials only change via full page reloads, so a render-time read is stable.
  const [trials] = useState(getTrials);
  const [trialErrors] = useState(getTrialErrors);

  const visible = useMemo(
    () => plugins.filter((p) => matches(p, query, category)),
    [plugins, query, category],
  );

  // Themes restyle the app rather than extending it — their try-on story is a
  // separate feature; the plugin Try gesture doesn't apply to them.
  const canTry = (plugin: RegistryPlugin): boolean =>
    cfg.try.enabled && plugin.category !== "theme";

  const requestTry = (plugin: RegistryPlugin): void => {
    setSelected(null);
    setTryCandidate(plugin);
  };

  return (
    <div className="min-h-full bg-background text-foreground">
      {/* ---- Hero: the shop window ---- */}
      <div className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: [
              "radial-gradient(560px 260px at 16% 125%, color-mix(in srgb, var(--primary) 16%, transparent), transparent 65%)",
              "radial-gradient(560px 260px at 84% 125%, color-mix(in srgb, var(--info) 13%, transparent), transparent 65%)",
              "radial-gradient(420px 220px at 52% -35%, color-mix(in srgb, var(--ok) 10%, transparent), transparent 65%)",
            ].join(", "),
          }}
        />
        <div className="relative mx-auto max-w-5xl px-8 py-12 text-center">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-balance">
            Discover community-made <span className="text-primary">plugins</span>,{" "}
            <span className="text-info">themes</span>, and{" "}
            <span className="text-ok">integrations</span>
          </h1>
          <p className="mt-2.5 text-sm text-muted-foreground">
            Built by organisations like yours. Try anything in this tab — nothing is installed, and
            permanent changes stay in your hands.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-8">
        {/* ---- Active trials ---- */}
        {trials.length > 0 && (
          <div className="pt-5">
            <TrialBanner trials={trials} errors={trialErrors} />
          </div>
        )}

        {/* ---- Toolbar: filters + search ---- */}
        <div className="flex flex-wrap items-center gap-2 py-5">
          {CATEGORY_FILTERS.map((filter) => {
            const active = category === filter.key;
            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => setCategory(filter.key)}
                className={
                  active
                    ? "rounded-lg bg-foreground px-3.5 py-1.5 text-[13px] font-semibold text-background"
                    : "rounded-lg border border-border px-3.5 py-1.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                }
              >
                {filter.label}
              </button>
            );
          })}
          <div className="relative ml-auto w-full sm:w-64">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search plugins & themes"
              className="pl-8"
            />
          </div>
        </div>

        {/* ---- Catalog ---- */}
        {loading ? (
          <div className="grid gap-x-10 gap-y-2 pb-16 md:grid-cols-2">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex gap-3.5 p-3">
                <Skeleton className="size-11 rounded-xl" />
                <div className="flex-1 space-y-2 py-0.5">
                  <Skeleton className="h-4 w-2/5" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-20 text-center">
            <p className="font-medium">The catalog could not be loaded.</p>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={reload}>
              <RefreshCw className="size-3.5" /> Try again
            </Button>
          </div>
        ) : visible.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-heading text-lg font-semibold">
              {plugins.length === 0 ? "No registries configured." : "Nothing found."}
            </p>
            <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
              {plugins.length === 0
                ? "This deployment has no plugin registries set up. Add registry URLs to the marketplace configuration to browse community plugins."
                : "Try a different search or category — or build it yourself with the plugin SDK."}
            </p>
          </div>
        ) : (
          <div className="grid gap-x-10 gap-y-1 pb-16 md:grid-cols-2">
            {visible.map((plugin) => (
              <PluginRow
                key={plugin.id}
                plugin={plugin}
                onOpen={setSelected}
                canTry={canTry(plugin)}
                trialActive={isTrialActive(plugin.id)}
                onTry={requestTry}
              />
            ))}
          </div>
        )}
      </div>

      <DetailDialog
        plugin={selected}
        onClose={() => setSelected(null)}
        canTry={selected ? canTry(selected) : false}
        trialActive={selected ? isTrialActive(selected.id) : false}
        onTry={requestTry}
        onEndTrial={endTrial}
      />
      <TryConfirmDialog
        plugin={tryCandidate}
        onConfirm={startTrial}
        onCancel={() => setTryCandidate(null)}
      />
    </div>
  );
};

// Re-export for tests: the tagline fallback is part of this view's contract.
export { Discover, taglineOf };
