import {
  AlertTriangle,
  Building2,
  ChevronDown,
  Code2,
  Filter,
  Globe,
  Info,
  Loader2,
  Package,
  Palette,
  RefreshCw,
  Search,
  Terminal,
  X,
} from "lucide-react";
import React, { useMemo, useState } from "react";

import type { PluginManager } from "@oc-mui/plugin-system";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Checkbox,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Label,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@oc-mui/ui/components";

import { PluginDetailView } from "../components/PluginDetailView";
import { CommunityPluginGridCard, PluginGridCard } from "../components/PluginListItem";
import { ThemeListItem } from "../components/ThemeListItem";
import { ThemeModal } from "../components/ThemeModal";
import { adminMarketplaceConfig } from "../config";
import { useMarketplace } from "../hooks/useMarketplace";
import { getPluginMetadataOrDefault } from "../services/plugin-metadata";

import type { ThemeDefinition } from "../services/themes";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface MarketplaceDashboardProps {
  manager: PluginManager;
  view?: "themes" | "plugins";
}

// ---------------------------------------------------------------------------
// Section definitions — grouped by SOURCE
// ---------------------------------------------------------------------------

interface Section {
  key: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const PLUGIN_SECTIONS: Section[] = [
  {
    key: "bundled",
    label: "Bundled",
    icon: <Package className="h-4 w-4" />,
    description:
      "Shipped with this installation. Core system plugins, content apps (Episodes, Series, Upload), and admin tools.",
  },
  {
    key: "local-dev",
    label: "Local Development",
    icon: <Code2 className="h-4 w-4" />,
    description:
      "Loaded from .local-plugins/ for hot-reload development. These plugins override JAR plugins with the same scope.",
  },
  {
    key: "jar",
    label: "Organization (JAR)",
    icon: <Building2 className="h-4 w-4" />,
    description:
      "Deployed by your organization via backend JAR bundles. Managed server-side, not editable from the UI.",
  },
  {
    key: "community",
    label: "Community Registry",
    icon: <Globe className="h-4 w-4" />,
    description:
      "Third-party plugins from the community registry. Try or install them to extend your instance.",
  },
  {
    key: "developer",
    label: "Developer Tools",
    icon: <Terminal className="h-4 w-4" />,
    description: "Load plugins from custom URLs for development and testing.",
  },
];

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export const MarketplaceDashboard: React.FC<MarketplaceDashboardProps> = ({
  manager,
  view: initialView = "plugins",
}) => {
  const m = useMarketplace(manager);
  const remoteLoadingEnabled = adminMarketplaceConfig.use().remotePlugins.enabled;

  const [activeView, setActiveView] = useState<"plugins" | "themes">(initialView);
  const [searchQuery, setSearchQuery] = useState("");
  const [namespaceFilters, setNamespaceFilters] = useState<Set<string>>(new Set());
  const [selectedPlugin, setSelectedPlugin] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<ThemeDefinition | null>(null);

  // Group plugins by source
  const pluginsBySource = useMemo(() => {
    const groups: Record<string, DiscoveredPlugin[]> = {
      bundled: [],
      "local-dev": [],
      jar: [],
    };

    for (const plugins of m.bundledPlugins.values()) {
      for (const d of plugins) {
        const key = d.source ?? "bundled";
        if (!groups[key]) groups[key] = [];
        groups[key].push(d);
      }
    }

    return groups;
  }, [m.bundledPlugins]);

  // Collect all unique namespaces for the filter dropdown
  const allNamespaces = useMemo(() => {
    const ns = new Map<string, number>();
    for (const plugins of Object.values(pluginsBySource)) {
      for (const d of plugins) {
        ns.set(d.namespace, (ns.get(d.namespace) || 0) + 1);
      }
    }
    return Array.from(ns.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, count]) => ({ name, count }));
  }, [pluginsBySource]);

  const toggleNamespaceFilter = (ns: string) => {
    setNamespaceFilters((prev) => {
      const next = new Set(prev);
      if (next.has(ns)) next.delete(ns);
      else next.add(ns);
      return next;
    });
  };

  // Filter by search + namespace
  const filteredSources = useMemo(() => {
    const hasNsFilter = namespaceFilters.size > 0;
    const hasSearch = !!searchQuery.trim();
    const q = searchQuery.toLowerCase();

    const result: typeof pluginsBySource = {};
    for (const [source, plugins] of Object.entries(pluginsBySource)) {
      result[source] = plugins.filter((d) => {
        if (hasNsFilter && !namespaceFilters.has(d.namespace)) return false;
        if (hasSearch) {
          const meta = getPluginMetadataOrDefault(d.plugin.name);
          return (
            d.plugin.name.toLowerCase().includes(q) ||
            meta.name.toLowerCase().includes(q) ||
            meta.description.toLowerCase().includes(q) ||
            d.namespace.toLowerCase().includes(q)
          );
        }
        return true;
      });
    }
    return result;
  }, [pluginsBySource, searchQuery, namespaceFilters]);

  const filteredCommunity = useMemo(() => {
    if (!searchQuery.trim()) return m.communityPlugins;
    const q = searchQuery.toLowerCase();
    return m.communityPlugins.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(q)),
    );
  }, [m.communityPlugins, searchQuery]);

  const filteredThemes = useMemo(() => {
    if (!searchQuery.trim()) return m.themes;
    const q = searchQuery.toLowerCase();
    return m.themes.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.author.toLowerCase().includes(q),
    );
  }, [m.themes, searchQuery]);

  // Resolve selected plugin detail
  const selectedPluginData = useMemo(() => {
    if (!selectedPlugin) return null;
    for (const plugins of Object.values(pluginsBySource)) {
      const found = plugins.find((d) => d.plugin.name === selectedPlugin);
      if (found) return found;
    }
    return null;
  }, [selectedPlugin, pluginsBySource]);

  // Plugin detail view
  if (selectedPlugin && selectedPluginData) {
    const meta = getPluginMetadataOrDefault(selectedPluginData.plugin.name);
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <PluginDetailView
          pluginName={selectedPluginData.plugin.name}
          displayName={meta.name}
          description={meta.description}
          version={selectedPluginData.plugin.version}
          category={meta.category}
          author={meta.author}
          source={selectedPluginData.source}
          extensionPoints={meta.extensionPoints}
          isLoaded={selectedPluginData.isLoaded}
          isOverridden={selectedPluginData.isOverridden}
          isCore={meta.isCore}
          tags={meta.tags}
          pendingChanges={m.pendingChanges}
          onReload={m.reload}
          onDiscardChanges={m.clearAllOverrides}
          onBack={() => setSelectedPlugin(null)}
          onEnable={() => m.enableBundledPlugin(selectedPluginData.plugin.name)}
          onDisable={() => void m.disableBundledPlugin(selectedPluginData.plugin.name)}
          onRemoveOverride={() => m.removeOverride(selectedPluginData.plugin.name)}
        />
      </div>
    );
  }

  const allBundled = Array.from(m.bundledPlugins.values()).flat();
  const loadedCount = allBundled.filter((p) => p.isLoaded).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      {/* Header with top toggle */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Marketplace</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loadedCount} active plugins · {m.themes.length} themes available
          </p>
        </div>
        <div className="flex rounded-lg border bg-muted/30 p-0.5">
          <button
            type="button"
            onClick={() => setActiveView("plugins")}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              activeView === "plugins"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Plugins
          </button>
          <button
            type="button"
            onClick={() => setActiveView("themes")}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              activeView === "themes"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Themes
          </button>
        </div>
      </div>

      {/* Status banners */}
      <StatusBanners
        pendingChanges={m.pendingChanges}
        conflicts={m.conflicts}
        error={m.error}
        onReload={m.reload}
        onDiscardChanges={m.clearAllOverrides}
        onClearError={m.clearError}
      />

      {/* Search bar + namespace filter */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={activeView === "plugins" ? "Search plugins..." : "Search themes..."}
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="h-9 pl-9"
          />
        </div>
        {activeView === "plugins" && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs">
                <Filter className="h-3.5 w-3.5" />
                Namespace
                {namespaceFilters.size > 0 && (
                  <Badge variant="secondary" className="ml-0.5 h-4 px-1 text-[10px]">
                    {namespaceFilters.size}
                  </Badge>
                )}
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs">Filter by namespace</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {allNamespaces.map((ns) => (
                <DropdownMenuCheckboxItem
                  key={ns.name}
                  checked={namespaceFilters.has(ns.name)}
                  onCheckedChange={() => toggleNamespaceFilter(ns.name)}
                  onSelect={(e) => e.preventDefault()}
                  className="text-xs"
                >
                  <span className="flex-1">{ns.name}</span>
                  <span className="ml-auto text-[10px] tabular-nums text-muted-foreground">
                    {ns.count}
                  </span>
                </DropdownMenuCheckboxItem>
              ))}
              {namespaceFilters.size > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={false}
                    onCheckedChange={() => setNamespaceFilters(new Set())}
                    className="text-xs text-muted-foreground"
                  >
                    Clear all
                  </DropdownMenuCheckboxItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Main content */}
      {activeView === "themes" ? (
        <>
          <ThemesView
            themes={filteredThemes}
            isThemeInstalled={m.isThemeInstalled}
            loading={m.loading}
            onSelectTheme={setSelectedTheme}
          />
          <ThemeModal
            theme={selectedTheme}
            isInstalled={selectedTheme ? m.isThemeInstalled(selectedTheme.previewUrl) : false}
            isLoading={selectedTheme ? m.loading === selectedTheme.previewUrl : false}
            onClose={() => setSelectedTheme(null)}
            onPreview={() => selectedTheme && void m.tryTheme(selectedTheme.previewUrl)}
            onApply={() => selectedTheme && void m.installTheme(selectedTheme.previewUrl)}
            onRemove={() => {
              m.uninstallTheme();
              setSelectedTheme(null);
            }}
          />
        </>
      )       : (
        <PluginsView
          sources={filteredSources}
          remoteLoadingEnabled={remoteLoadingEnabled}
          jarPlugins={m.jarPlugins}
          communityPlugins={filteredCommunity}
          communityPluginsLoading={m.communityPluginsLoading}
          bundledPluginsLoading={m.bundledPluginsLoading}
          loading={m.loading}
          installedRemotePlugins={m.installedRemotePlugins}
          onSelectPlugin={setSelectedPlugin}
          onInstallCommunity={(plugin) => void m.installCommunityPlugin(plugin)}
          isCommunityInstalled={m.isCommunityPluginInstalled}
          onRefreshBundled={() => void m.refreshBundledPlugins()}
          onRefreshCommunity={() => void m.refreshCommunityPlugins()}
          onTryCustomUrl={(url, force) => void m.tryCustomUrl(url, force)}
          onInstallCustomUrl={(url, force) => void m.installCustomUrl(url, force)}
          onUninstallPlugin={m.uninstallPlugin}
        />
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Status Banners
// ---------------------------------------------------------------------------

const StatusBanners: React.FC<{
  pendingChanges: boolean;
  conflicts: { message: string }[];
  error: string | null;
  onReload: () => void;
  onDiscardChanges: () => void;
  onClearError: () => void;
}> = ({ pendingChanges, conflicts, error, onReload, onDiscardChanges, onClearError }) => (
  <>
    {pendingChanges && (
      <div className="flex items-center gap-3 rounded-lg border border-warning/50 bg-warning/10 px-4 py-3">
        <RefreshCw className="h-4 w-4 shrink-0 text-warning" />
        <p className="flex-1 text-sm text-warning-foreground">
          Plugin changes require a reload to take effect.
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onDiscardChanges}>
            Discard
          </Button>
          <Button
            size="sm"
            className="h-7 bg-warning text-xs text-white hover:bg-warning/80"
            onClick={onReload}
          >
            Reload
          </Button>
        </div>
      </div>
    )}

    {conflicts.length > 0 && (
      <div className="rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-medium text-destructive">Potential conflicts</p>
            {conflicts.map((c, i) => (
              <p key={i} className="mt-1 text-xs text-destructive/80">
                {c.message}
              </p>
            ))}
          </div>
        </div>
      </div>
    )}

    {error && (
      <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3">
        <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
        <p className="flex-1 text-sm text-destructive">{error}</p>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          aria-label="Dismiss error"
          onClick={onClearError}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    )}
  </>
);

// ---------------------------------------------------------------------------
// Section Header with info tooltip
// ---------------------------------------------------------------------------

const SectionHeader: React.FC<{
  section: Section;
  count: number;
  action?: React.ReactNode;
}> = ({ section, count, action }) => (
  <div className="mb-3 flex items-center gap-2">
    <span className="text-muted-foreground">{section.icon}</span>
    <h2 className="text-sm font-semibold">{section.label}</h2>
    <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
      {count}
    </Badge>
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground/60" />
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs text-xs">
          {section.description}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
    {action && <div className="ml-auto">{action}</div>}
  </div>
);

// ---------------------------------------------------------------------------
// Themes View
// ---------------------------------------------------------------------------

const ThemesView: React.FC<{
  themes: ThemeDefinition[];
  isThemeInstalled: (url: string) => boolean;
  loading: string | null;
  onSelectTheme: (theme: ThemeDefinition) => void;
}> = ({ themes, isThemeInstalled, loading, onSelectTheme }) => {
  if (themes.length === 0) {
    return <EmptyState icon={Palette} message="No themes match your search." />;
  }

  return (
    <div className="rounded-lg border">
      {themes.map((theme) => (
        <ThemeListItem
          key={theme.id}
          theme={theme}
          isInstalled={isThemeInstalled(theme.previewUrl)}
          isLoading={loading === theme.previewUrl}
          onClick={() => onSelectTheme(theme)}
        />
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Plugins View — grouped by source
// ---------------------------------------------------------------------------

type MarketplaceHook = ReturnType<typeof useMarketplace>;
type DiscoveredPlugin = ReturnType<typeof useMarketplace>["bundledPlugins"] extends Map<
  string,
  infer V
>
  ? V extends (infer U)[]
    ? U
    : never
  : never;

const PluginsView: React.FC<{
  sources: Record<string, DiscoveredPlugin[]>;
  remoteLoadingEnabled: boolean;
  jarPlugins: MarketplaceHook["jarPlugins"];
  communityPlugins: MarketplaceHook["communityPlugins"];
  communityPluginsLoading: boolean;
  bundledPluginsLoading: boolean;
  loading: string | null;
  installedRemotePlugins: string[];
  onSelectPlugin: (name: string) => void;
  onInstallCommunity: (plugin: MarketplaceHook["communityPlugins"][number]) => void;
  isCommunityInstalled: (id: string) => boolean;
  onRefreshBundled: () => void;
  onRefreshCommunity: () => void;
  onTryCustomUrl: (url: string, force: boolean) => void;
  onInstallCustomUrl: (url: string, force: boolean) => void;
  onUninstallPlugin: (urlOrId: string) => void;
}> = ({
  sources,
  remoteLoadingEnabled,
  jarPlugins,
  communityPlugins,
  communityPluginsLoading,
  bundledPluginsLoading,
  loading,
  installedRemotePlugins,
  onSelectPlugin,
  onInstallCommunity,
  isCommunityInstalled,
  onRefreshBundled,
  onRefreshCommunity,
  onTryCustomUrl,
  onInstallCustomUrl,
  onUninstallPlugin,
}) => {
  if (bundledPluginsLoading) {
    return <LoadingState message="Discovering plugins..." />;
  }

  return (
    <div className="space-y-8">
      {!remoteLoadingEnabled && <RemoteLoadingDisabledBanner />}
      {PLUGIN_SECTIONS.map((section) => {
        if (section.key === "community") {
          return (
            <CommunitySection
              key={section.key}
              section={section}
              plugins={communityPlugins}
              isLoading={communityPluginsLoading}
              installLoading={loading}
              isCommunityInstalled={isCommunityInstalled}
              onInstall={onInstallCommunity}
              onRefresh={onRefreshCommunity}
              installedRemotePlugins={installedRemotePlugins}
              onUninstallPlugin={onUninstallPlugin}
            />
          );
        }

        if (section.key === "developer") {
          return (
            <DeveloperSection
              key={section.key}
              section={section}
              loading={loading}
              disabled={!remoteLoadingEnabled}
              onTryCustomUrl={onTryCustomUrl}
              onInstallCustomUrl={onInstallCustomUrl}
            />
          );
        }

        // JAR section: show JAR plugins from the dedicated list
        if (section.key === "jar") {
          const jarSourcePlugins = sources["jar"] || [];
          if (jarSourcePlugins.length === 0 && jarPlugins.length === 0) return null;
          return (
            <PluginSourceSection
              key={section.key}
              section={section}
              plugins={jarSourcePlugins}
              jarPlugins={jarPlugins}
              onSelectPlugin={onSelectPlugin}
              onRefresh={onRefreshBundled}
            />
          );
        }

        const plugins = sources[section.key] || [];
        if (plugins.length === 0) return null;

        return (
          <PluginSourceSection
            key={section.key}
            section={section}
            plugins={plugins}
            onSelectPlugin={onSelectPlugin}
            onRefresh={onRefreshBundled}
          />
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Plugin Source Section (heading + description + list)
// ---------------------------------------------------------------------------

const PluginSourceSection: React.FC<{
  section: Section;
  plugins: DiscoveredPlugin[];
  jarPlugins?: MarketplaceHook["jarPlugins"];
  onSelectPlugin: (name: string) => void;
  onRefresh: () => void;
}> = ({ section, plugins, jarPlugins, onSelectPlugin }) => {
  const totalCount = plugins.length + (jarPlugins?.length || 0);

  return (
    <section>
      <SectionHeader section={section} count={totalCount} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {plugins.map((d) => {
          const meta = getPluginMetadataOrDefault(d.plugin.name);
          return (
            <PluginGridCard
              key={d.plugin.name}
              name={d.plugin.name}
              displayName={meta.name}
              description={meta.description}
              version={d.plugin.version}
              namespace={d.namespace}
              author={meta.author}
              isLoaded={d.isLoaded}
              isOverridden={d.isOverridden}
              isCore={meta.isCore}
              onClick={() => onSelectPlugin(d.plugin.name)}
            />
          );
        })}
        {jarPlugins?.map((p, idx) => (
          <PluginGridCard
            key={`jar:${p.id ?? `${p.scope}:${idx}`}`}
            name={p.name}
            displayName={p.name}
            description={`Scope: ${p.scope}`}
            version="jar"
            namespace={p.scope}
            author="Organization"
            isLoaded={true}
            isOverridden={false}
            onClick={() => {}}
          />
        ))}
      </div>
    </section>
  );
};

// ---------------------------------------------------------------------------
// Community Section
// ---------------------------------------------------------------------------

const CommunitySection: React.FC<{
  section: Section;
  plugins: MarketplaceHook["communityPlugins"];
  isLoading: boolean;
  installLoading: string | null;
  isCommunityInstalled: (id: string) => boolean;
  onInstall: (plugin: MarketplaceHook["communityPlugins"][number]) => void;
  onRefresh: () => void;
  installedRemotePlugins: string[];
  onUninstallPlugin: (urlOrId: string) => void;
}> = ({
  section,
  plugins,
  isLoading,
  installLoading,
  isCommunityInstalled,
  onInstall,
  onRefresh,
  installedRemotePlugins,
  onUninstallPlugin,
}) => (
  <section>
    <SectionHeader
      section={section}
      count={plugins.length}
      action={
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground"
          aria-label="Refresh community plugins"
          onClick={onRefresh}
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      }
    />
    {isLoading ? (
      <LoadingState message="Loading community registry..." />
    ) : plugins.length === 0 ? (
      <EmptyState icon={Globe} message="No community plugins available." />
    ) : (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {plugins.map((plugin) => (
          <CommunityPluginGridCard
            key={plugin.id}
            name={plugin.name}
            description={plugin.description}
            version={plugin.version}
            category={plugin.category}
            author={plugin.author.name}
            tags={plugin.tags}
            isInstalled={isCommunityInstalled(plugin.id)}
            isLoading={installLoading === plugin.url}
            onClick={() => {}}
            onInstall={() => onInstall(plugin)}
          />
        ))}
      </div>
    )}

    {installedRemotePlugins.length > 0 && (
      <div className="mt-4 rounded-lg border p-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Installed remote plugins</p>
        {installedRemotePlugins.map((url) => (
          <div
            key={url}
            className="group flex items-center justify-between rounded px-2 py-1.5 hover:bg-muted/50"
          >
            <code className="mr-2 flex-1 truncate text-xs text-muted-foreground">{url}</code>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs opacity-0 transition-opacity group-hover:opacity-100"
              onClick={() => onUninstallPlugin(url)}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>
    )}
  </section>
);

// ---------------------------------------------------------------------------
// Developer Section
// ---------------------------------------------------------------------------

const DeveloperSection: React.FC<{
  section: Section;
  loading: string | null;
  disabled: boolean;
  onTryCustomUrl: (url: string, force: boolean) => void;
  onInstallCustomUrl: (url: string, force: boolean) => void;
}> = ({ section, loading, disabled, onTryCustomUrl, onInstallCustomUrl }) => {
  const [customUrl, setCustomUrl] = useState("");
  const [forceReload, setForceReload] = useState(false);
  // Loading code from an arbitrary URL runs untrusted third-party JavaScript in
  // the admin session. Require an explicit, per-visit acknowledgement before the
  // Try/Install actions are usable — this is not persisted, so it must be
  // re-confirmed each time the section is opened.
  const [riskAcknowledged, setRiskAcknowledged] = useState(false);

  // Buttons are usable only when remote loading is enabled, a URL is entered,
  // nothing is in flight, and the risk has been acknowledged for this visit.
  const actionsDisabled = disabled || loading !== null || !customUrl.trim() || !riskAcknowledged;

  return (
    <section>
      <SectionHeader section={section} count={0} />
      <Card>
        <CardContent className="space-y-4 pt-5">
          <div className="flex gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="space-y-1">
              <p className="font-medium">High risk — developer use only</p>
              <p className="text-xs leading-relaxed text-destructive/90">
                A plugin loaded from a URL runs untrusted third-party code with your full
                administrator session: it can read and modify any data you can, act on your behalf,
                and persist itself. Only load URLs you have personally reviewed and trust.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dev-url" className="text-xs font-medium">
              Plugin URL
            </Label>
            <Input
              id="dev-url"
              type="url"
              placeholder="http://127.0.0.1:5173/dist/my-plugin.mjs"
              value={customUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomUrl(e.target.value)}
              disabled={disabled}
              className="h-9 font-mono text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="dev-force"
              checked={forceReload}
              disabled={disabled}
              onCheckedChange={(checked) => setForceReload(checked === true)}
            />
            <Label htmlFor="dev-force" className="cursor-pointer text-xs">
              Force reload (bypass cache)
            </Label>
          </div>
          <div className="flex items-start gap-2">
            <Checkbox
              id="dev-risk-ack"
              checked={riskAcknowledged}
              disabled={disabled}
              onCheckedChange={(checked) => setRiskAcknowledged(checked === true)}
              className="mt-0.5"
            />
            <Label htmlFor="dev-risk-ack" className="cursor-pointer text-xs leading-relaxed">
              I understand this executes untrusted code with my administrator privileges and I trust
              this URL.
            </Label>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => onTryCustomUrl(customUrl.trim(), forceReload)}
              disabled={actionsDisabled}
            >
              {loading === customUrl ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : null}
              Try
            </Button>
            <Button
              size="sm"
              className="h-8"
              onClick={() => onInstallCustomUrl(customUrl.trim(), forceReload)}
              disabled={actionsDisabled}
            >
              {loading === customUrl ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : null}
              Install
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

/**
 * Shown at the top of the plugins view when a deployment has not enabled remote
 * plugin loading. Explains the state and exactly how an administrator turns it
 * on, so the capability is discoverable rather than silently missing.
 */
const RemoteLoadingDisabledBanner: React.FC = () => (
  <div className="flex gap-3 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm">
    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
    <div className="space-y-1">
      <p className="font-medium">Remote plugin loading is disabled</p>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Installing community plugins and loading plugins from a URL run untrusted third-party code,
        so they are off by default. An administrator can enable them by setting{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
          plugins.admin-marketplace.remotePlugins.enabled
        </code>{" "}
        to <code className="rounded bg-muted px-1 py-0.5 text-[11px]">true</code> in{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-[11px]">config.json</code>. Bundled,
        organization (JAR), and local plugins are unaffected.
      </p>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Shared Primitives
// ---------------------------------------------------------------------------

const LoadingState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
    <Loader2 className="mb-3 h-6 w-6 animate-spin" />
    <p className="text-sm">{message}</p>
  </div>
);

const EmptyState: React.FC<{
  icon: React.FC<{ className?: string }>;
  message: string;
  detail?: string;
}> = ({ icon: Icon, message, detail }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="mb-4 rounded-full bg-muted p-4">
      <Icon className="h-6 w-6 text-muted-foreground" />
    </div>
    <p className="text-sm font-medium">{message}</p>
    {detail && <p className="mt-1 max-w-sm text-xs text-muted-foreground">{detail}</p>}
  </div>
);
