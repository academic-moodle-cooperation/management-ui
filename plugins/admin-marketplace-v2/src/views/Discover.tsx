import { RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";

import { useI18n } from "@oc-mui/i18n";
import { Button, Skeleton } from "@oc-mui/ui/components";

import { DetailDialog } from "../components/DetailDialog";
import { FeaturedCard } from "../components/FeaturedCard";
import { PluginRow, taglineOf } from "../components/PluginRow";
import { SectionHeader } from "../components/SectionHeader";
import { ThemeCard } from "../components/ThemeCard";
import { TryConfirmDialog } from "../components/TryConfirmDialog";
import { marketplaceV2Config } from "../config";
import { useThemePreview } from "../hooks/useThemePreview";
import { useThemes } from "../hooks/useThemes";
import { rich } from "../lib/rich";
import { findConflicts } from "../services/conflicts";
import { namespaceOf } from "../services/registry";
import { isAllowedAssetUrl } from "../services/security";
import { startThemePreview } from "../services/themePreview";
import { canPreviewTheme, type ThemeCandidate } from "../services/themes";
import { endTrial, isTrialActive, startLocalTrial, startTrial } from "../services/trials";
import { resolveTryTarget } from "../services/tryTarget";

import type { CatalogState } from "../hooks/useCatalog";
import type { InventoryState } from "../hooks/useInventory";
import type { InventoryItem } from "../services/inventory";
import type { RegistryCategory, RegistryPlugin } from "../services/registry";
import type { FC, ReactElement } from "react";

/**
 * Discover — the catalog view of the v2 marketplace, in V4's shape: hero,
 * category pills, then Featured cards (curated by the deployment), the
 * plugin rows, and the theme cards. A search or a category filter collapses
 * that into one results section.
 *
 * Job (per INTENT.md): show what exists, invitingly — plus exactly one
 * gesture, **Try**: an ephemeral, tab-scoped trial behind a consent dialog.
 * There is deliberately no install; permanence goes through the ops path.
 *
 * Layout note: this view intentionally does not use PageShell. Like the
 * landing page (see PageShell's doc comment), the marketplace is a showcase
 * surface with its own hero — not a standard content page.
 */

/** Pill order; labels resolve from `marketplace:categories.<key>`. */
const CATEGORY_FILTERS: Array<RegistryCategory | "all"> = [
  "all",
  "feature",
  "integration",
  "utility",
  "theme",
  "experimental",
];

function matches(plugin: RegistryPlugin, query: string, category: RegistryCategory | "all"): boolean {
  // Themes are listed by the themes section (all sources), never as plugin rows.
  if (plugin.category === "theme") return false;
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
  /** The header search — owned by the page so it works from either tab. */
  query: string;
  /** This deployment's inventory — tells the detail view whether a dependency is present. */
  inventory: InventoryState;
  /** Switches to the Installed tab and focuses the row for this namespace (the "Installed" pill). */
  onOpenInstalled?: (namespace: string) => void;
}

const CARD_GRID = "grid grid-cols-2 gap-[18px] lg:grid-cols-4";
const ROW_GRID = "grid gap-x-10 gap-y-1 md:grid-cols-2";

const Discover: FC<DiscoverProps> = ({ catalog, query, inventory, onOpenInstalled }) => {
  const { t } = useI18n();
  const cfg = marketplaceV2Config.use();
  const { plugins, loading, error, reload } = catalog;
  const [category, setCategory] = useState<RegistryCategory | "all">("all");
  const [selected, setSelected] = useState<RegistryPlugin | null>(null);
  const [tryCandidate, setTryCandidate] = useState<RegistryPlugin | null>(null);
  /** A catalog entry whose plugin is deployed here but off: previewed locally, not fetched. */
  const [localCandidate, setLocalCandidate] = useState<{ plugin: RegistryPlugin; item: InventoryItem } | null>(null);
  const [themeCandidate, setThemeCandidate] = useState<ThemeCandidate | null>(null);
  const themes = useThemes(plugins);
  const themePreview = useThemePreview();

  const filtering = query.trim() !== "" || category !== "all";
  const showThemes = category === "all" || category === "theme";
  const showPlugins = category !== "theme";

  const visibleThemes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return themes.themes.filter(
      (theme) => !q || `${theme.name} ${theme.tagline ?? ""} ${theme.author ?? ""}`.toLowerCase().includes(q),
    );
  }, [themes.themes, query]);

  const visible = useMemo(
    () => plugins.filter((p) => matches(p, query, category)),
    [plugins, query, category],
  );

  const featured = useMemo(() => {
    const byId = new Map(plugins.map((p) => [p.id, p]));
    return cfg.featured
      .map((id) => byId.get(id))
      .filter((p): p is RegistryPlugin => p !== undefined && p.category !== "theme");
  }, [plugins, cfg.featured]);

  const canTry = cfg.try.enabled;
  const presence = useMemo(
    () => new Map(inventory.items.map((i) => [i.namespace, i.status])),
    [inventory.items],
  );
  /** The first screenshot this deployment may load, else generated artwork. */
  const screenshotFor = (plugin: RegistryPlugin): string | null =>
    plugin.screenshots?.find((s) => isAllowedAssetUrl(s.url, cfg.try))?.url ?? null;

  const activeHere = (plugin: RegistryPlugin): boolean => {
    const target = resolveTryTarget(plugin, inventory.items);
    return target.kind === "present" && target.status === "active";
  };

  const openInstalled = (plugin: RegistryPlugin): void => {
    setSelected(null);
    onOpenInstalled?.(namespaceOf(plugin));
  };

  const requestTry = (plugin: RegistryPlugin): void => {
    setSelected(null);
    const target = resolveTryTarget(plugin, inventory.items);
    if (target.kind === "local") setLocalCandidate({ plugin, item: target.item });
    else if (target.kind === "remote") setTryCandidate(plugin);
  };

  const rows = (list: RegistryPlugin[]): ReactElement => (
    <div className={ROW_GRID}>
      {list.map((plugin) => (
        <PluginRow
          key={plugin.id}
          plugin={plugin}
          onOpen={setSelected}
          canTry={canTry}
          trialActive={isTrialActive(plugin.id)}
          activeHere={activeHere(plugin)}
          onTry={requestTry}
          onOpenInstalled={openInstalled}
        />
      ))}
    </div>
  );

  const themeSection =
    showThemes && !themes.loading && visibleThemes.length > 0 ? (
      <section className="pt-8">
        <SectionHeader
          title={t("marketplace:catalog.themes")}
          count={visibleThemes.length}
          hint={t("marketplace:catalog.themesHint")}
        />
        <div className={CARD_GRID}>
          {visibleThemes.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              isActive={theme.configValue !== undefined && theme.configValue === themes.activeConfigValue}
              isPreviewing={themePreview?.id === theme.id}
              can={canPreviewTheme(theme, cfg.try)}
              onTry={setThemeCandidate}
            />
          ))}
        </div>
      </section>
    ) : null;

  const nothingToShow =
    (!showPlugins || visible.length === 0) && !(showThemes && visibleThemes.length > 0) && !themes.loading;

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
        <div className="relative mx-auto max-w-[1180px] px-8 pt-14 pb-[54px] text-center">
          <h1 className="mx-auto max-w-2xl font-heading text-[clamp(1.5rem,3.3vw,2.0625rem)] leading-[1.25] font-bold tracking-tight text-balance">
            {rich(t("marketplace:hero.title"), {
              plugins: <span className="text-primary" />,
              themes: <span className="text-info" />,
              integrations: <span className="text-ok" />,
            })}
          </h1>
          <p className="mt-2.5 text-[14.5px] text-muted-foreground">{t("marketplace:hero.subtitle")}</p>
        </div>
      </div>

      <div className="mx-auto max-w-[1180px] px-8 pb-16">
        {/* ---- Category pills ---- */}
        <div className="flex flex-wrap items-center gap-2 pt-[22px] pb-1">
          {CATEGORY_FILTERS.map((key) => {
            const active = category === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setCategory(key)}
                className={
                  active
                    ? "rounded-md border border-foreground bg-foreground px-3.5 py-[7px] text-[13px] font-semibold text-background"
                    : "rounded-md border border-input px-3.5 py-[7px] text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                }
              >
                {t(`marketplace:categories.${key}`)}
              </button>
            );
          })}
        </div>

        {/* ---- Catalog ---- */}
        {loading ? (
          <div className="pt-8">
            <div className={CARD_GRID}>
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i}>
                  <Skeleton className="aspect-[16/10.5] rounded-xl" />
                  <Skeleton className="mt-3 h-4 w-3/5" />
                  <Skeleton className="mt-1.5 h-3 w-2/5" />
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="py-20 text-center">
            <p className="font-medium">{t("marketplace:catalog.loadFailed")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={reload}>
              <RefreshCw className="size-3.5" /> {t("marketplace:catalog.retry")}
            </Button>
          </div>
        ) : nothingToShow ? (
          <div className="py-20 text-center">
            <p className="font-heading text-lg font-semibold">
              {plugins.length === 0 ? t("marketplace:catalog.noRegistries") : t("marketplace:catalog.nothingFound")}
            </p>
            <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
              {plugins.length === 0
                ? t("marketplace:catalog.noRegistriesHint")
                : t("marketplace:catalog.nothingFoundHint")}
            </p>
          </div>
        ) : !filtering ? (
          <>
            {featured.length > 0 && (
              <section className="pt-8">
                <SectionHeader title={t("marketplace:catalog.featured")} hint={t("marketplace:catalog.featuredHint")} />
                <div className={CARD_GRID}>
                  {featured.map((plugin) => (
                    <FeaturedCard
                      key={plugin.id}
                      plugin={plugin}
                      image={screenshotFor(plugin)}
                      onOpen={setSelected}
                      canTry={canTry}
                      trialActive={isTrialActive(plugin.id)}
                      activeHere={activeHere(plugin)}
                      onTry={requestTry}
                      onOpenInstalled={openInstalled}
                    />
                  ))}
                </div>
              </section>
            )}
            {visible.length > 0 && (
              <section className="pt-8">
                <SectionHeader title={t("marketplace:catalog.plugins")} count={visible.length} />
                {rows(visible)}
              </section>
            )}
            {themeSection}
          </>
        ) : (
          <>
            {showPlugins && visible.length > 0 && (
              <section className="pt-8">
                <SectionHeader
                  title={
                    query.trim()
                      ? t("marketplace:catalog.resultsFor", { query: query.trim() })
                      : category === "all"
                        ? t("marketplace:catalog.results")
                        : t(`marketplace:categories.${category}`)
                  }
                  hint={t("marketplace:catalog.resultCount", { count: visible.length })}
                />
                {rows(visible)}
              </section>
            )}
            {themeSection}
          </>
        )}
      </div>

      <DetailDialog
        plugin={selected}
        image={selected ? screenshotFor(selected) : null}
        presence={presence}
        onClose={() => setSelected(null)}
        canTry={selected ? canTry : false}
        trialActive={selected ? isTrialActive(selected.id) : false}
        activeHere={selected ? activeHere(selected) : false}
        onTry={requestTry}
        onEndTrial={endTrial}
        onOpenInstalled={openInstalled}
      />
      <TryConfirmDialog
        plugin={tryCandidate}
        conflicts={
          tryCandidate
            ? findConflicts(
                { namespace: namespaceOf(tryCandidate), extensionPoints: tryCandidate.extensionPoints },
                inventory.items,
              )
            : []
        }
        onConfirm={(plugin, options) => startTrial(plugin, options)}
        onCancel={() => setTryCandidate(null)}
      />
      <TryConfirmDialog
        plugin={localCandidate ? { ...localCandidate.plugin, name: localCandidate.plugin.name } : null}
        mode="local"
        conflicts={localCandidate ? findConflicts(localCandidate.item, inventory.items) : []}
        onConfirm={(_plugin, options) => {
          if (!localCandidate) return;
          startLocalTrial(
            {
              namespace: localCandidate.item.namespace,
              name: localCandidate.plugin.name,
              ...(localCandidate.item.version !== undefined && { version: localCandidate.item.version }),
            },
            options,
          );
        }}
        onCancel={() => setLocalCandidate(null)}
      />
      <TryConfirmDialog
        plugin={themeCandidate}
        mode="theme"
        onConfirm={(theme) => {
          startThemePreview({ id: theme.id, name: theme.name, url: theme.url, source: theme.source });
          setThemeCandidate(null);
        }}
        onCancel={() => setThemeCandidate(null)}
      />
    </div>
  );
};

// Re-export for tests: the tagline fallback is part of this view's contract.
export { Discover, taglineOf };
