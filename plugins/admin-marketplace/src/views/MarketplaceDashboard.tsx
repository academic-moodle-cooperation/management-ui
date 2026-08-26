import {
  AlertTriangle,
  Building2,
  ChevronDown,
  Code2,
  Globe,
  Loader2,
  Package,
  Palette,
  RefreshCw,
  Search,
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Input,
  Label,
  PageShell,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@oc-mui/ui/components";

import { CommunityPluginCard } from "../components/CommunityPluginCard";
import { ThemeListItem } from "../components/ThemeListItem";
import { ThemeModal } from "../components/ThemeModal";
import { adminMarketplaceConfig } from "../config";
import { useMarketplace } from "../hooks/useMarketplace";

import type { ThemeDefinition } from "../services/themes";

/**
 * Marketplace v2 — organized around the two questions an admin actually has:
 *
 *   "What is running in this installation?"  → Installed tab (pure transparency)
 *   "What can I try out?"                    → Discover tab (registry + URL)
 *
 * plus Themes. The previous dashboard mixed both questions into one scrolling
 * page and carried per-browser enable/disable toggles for bundled plugins, a
 * conflicts workflow, a namespace filter and a detail view fed by a
 * hand-maintained metadata map — all removed: they answered questions nobody
 * asked, and the map was a documented maintenance burden. What remains of the
 * override machinery is an escape hatch: when overrides from an earlier
 * session exist, a banner offers to reset them.
 */

export interface MarketplaceDashboardProps {
  manager: PluginManager;
  view?: "themes" | "plugins";
}

type MarketplaceHook = ReturnType<typeof useMarketplace>;
type Discovered =
  MarketplaceHook["bundledPlugins"] extends Map<string, (infer U)[]> ? U : never;

const SOURCE_META: Record<string, { label: string; icon: React.ReactNode; description: string }> = {
  bundled: {
    label: "Bundled",
    icon: <Package className="h-4 w-4" />,
    description: "Shipped with this installation.",
  },
  jar: {
    label: "Organization",
    icon: <Building2 className="h-4 w-4" />,
    description: "Deployed by your organization on the backend (JAR bundles). Managed server-side.",
  },
  "local-dev": {
    label: "Local development",
    icon: <Code2 className="h-4 w-4" />,
    description: "Loaded from .local-plugins/ by the dev server.",
  },
};

export const MarketplaceDashboard: React.FC<MarketplaceDashboardProps> = ({
  manager,
  view: initialView = "plugins",
}) => {
  const m = useMarketplace(manager);
  const remoteLoadingEnabled = adminMarketplaceConfig.use().remotePlugins.enabled;

  const [tab, setTab] = useState<string>(initialView === "themes" ? "themes" : "installed");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTheme, setSelectedTheme] = useState<ThemeDefinition | null>(null);

  const q = searchQuery.trim().toLowerCase();

  // Everything running (or deliberately not running) in this installation.
  const installedBySource = useMemo(() => {
    const groups: Record<string, Discovered[]> = {};
    for (const plugins of m.bundledPlugins.values()) {
      for (const d of plugins) {
        const matches =
          !q || d.plugin.name.toLowerCase().includes(q) || d.namespace.toLowerCase().includes(q);
        if (!matches) continue;
        const key = d.source ?? "bundled";
        (groups[key] ??= []).push(d);
      }
    }
    return groups;
  }, [m.bundledPlugins, q]);

  const filteredCommunity = useMemo(() => {
    if (!q) return m.communityPlugins;
    return m.communityPlugins.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(q)),
    );
  }, [m.communityPlugins, q]);

  const filteredThemes = useMemo(() => {
    if (!q) return m.themes;
    return m.themes.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.author.toLowerCase().includes(q),
    );
  }, [m.themes, q]);

  const installedCount =
    Array.from(m.bundledPlugins.values()).flat().length + m.jarPlugins.length;

  return (
    <PageShell
      className="mx-auto max-w-6xl"
      title="Marketplace"
      description="See what is part of this installation, and try additional plugins without deploying anything."
    >
      <div className="space-y-6">
        {m.pendingChanges && (
          <div className="border-warning/50 bg-warning/10 flex items-center gap-3 rounded-lg border px-4 py-3">
            <RefreshCw className="text-warning h-4 w-4 shrink-0" />
            <p className="text-warning-foreground flex-1 text-sm">
              Plugin changes from this browser session take effect after a reload.
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={m.clearAllOverrides}>
                Reset overrides
              </Button>
              <Button size="sm" className="h-7 text-xs" onClick={m.reload}>
                Reload
              </Button>
            </div>
          </div>
        )}

        {m.error && (
          <div className="border-destructive/50 bg-destructive/5 flex items-center gap-3 rounded-lg border px-4 py-3">
            <AlertTriangle className="text-destructive h-4 w-4 shrink-0" />
            <p className="text-destructive flex-1 text-sm">{m.error}</p>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              aria-label="Dismiss error"
              onClick={m.clearError}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <div className="flex flex-wrap items-center gap-3">
            <TabsList>
              <TabsTrigger value="installed">
                Installed
                <Badge variant="secondary" className="ml-1.5 h-4 px-1.5 text-[10px]">
                  {installedCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="discover">Discover</TabsTrigger>
              <TabsTrigger value="themes">Themes</TabsTrigger>
            </TabsList>
            <div className="relative min-w-56 flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Search…"
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="h-9 pl-9"
              />
            </div>
          </div>

          <TabsContent value="installed" className="mt-6">
            <InstalledTab
              loading={m.bundledPluginsLoading}
              groups={installedBySource}
              jarPlugins={m.jarPlugins}
              searchActive={Boolean(q)}
            />
          </TabsContent>

          <TabsContent value="discover" className="mt-6">
            <DiscoverTab
              remoteLoadingEnabled={remoteLoadingEnabled}
              plugins={filteredCommunity}
              isLoading={m.communityPluginsLoading}
              actionLoading={m.loading}
              isInstalled={m.isCommunityPluginInstalled}
              installedRemotePlugins={m.installedRemotePlugins}
              onTry={(p) => void m.tryCommunityPlugin(p)}
              onInstall={(p) => void m.installCommunityPlugin(p)}
              onUninstall={m.uninstallPlugin}
              onRefresh={() => void m.refreshCommunityPlugins()}
              onTryCustomUrl={(url, force) => void m.tryCustomUrl(url, force)}
              onInstallCustomUrl={(url, force) => void m.installCustomUrl(url, force)}
            />
          </TabsContent>

          <TabsContent value="themes" className="mt-6">
            {filteredThemes.length === 0 ? (
              <EmptyState icon={Palette} message="No themes match your search." />
            ) : (
              <div className="rounded-lg border">
                {filteredThemes.map((theme) => (
                  <ThemeListItem
                    key={theme.id}
                    theme={theme}
                    isInstalled={m.isThemeInstalled(theme.previewUrl)}
                    isLoading={m.loading === theme.previewUrl}
                    onClick={() => setSelectedTheme(theme)}
                  />
                ))}
              </div>
            )}
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
          </TabsContent>
        </Tabs>
      </div>
    </PageShell>
  );
};

// ---------------------------------------------------------------------------
// Installed — read-only transparency
// ---------------------------------------------------------------------------

const InstalledTab: React.FC<{
  loading: boolean;
  groups: Record<string, Discovered[]>;
  jarPlugins: MarketplaceHook["jarPlugins"];
  searchActive: boolean;
}> = ({ loading, groups, jarPlugins, searchActive }) => {
  if (loading) {
    return <LoadingState message="Discovering plugins…" />;
  }

  const sources = ["bundled", "jar", "local-dev"].filter(
    (key) => (groups[key]?.length ?? 0) > 0 || (key === "jar" && jarPlugins.length > 0),
  );

  if (sources.length === 0) {
    return (
      <EmptyState
        icon={Package}
        message={searchActive ? "No plugins match your search." : "No plugins discovered."}
      />
    );
  }

  return (
    <div className="space-y-8">
      <p className="text-muted-foreground text-sm">
        Everything this installation is running, grouped by where it comes from. This list is
        informational — bundled and organization plugins are managed through deployment and
        configuration, not from here.
      </p>
      {sources.map((key) => {
        const meta = SOURCE_META[key] ?? SOURCE_META["bundled"]!;
        const plugins = groups[key] ?? [];
        const count = plugins.length + (key === "jar" ? jarPlugins.length : 0);
        return (
          <section key={key}>
            <div className="mb-1 flex items-center gap-2">
              <span className="text-muted-foreground">{meta.icon}</span>
              <h2 className="text-sm font-semibold">{meta.label}</h2>
              <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                {count}
              </Badge>
            </div>
            <p className="text-muted-foreground mb-3 text-xs">{meta.description}</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {plugins.map((d) => (
                <InstalledRow
                  key={d.plugin.name}
                  name={d.plugin.name}
                  namespace={d.namespace}
                  version={d.plugin.version}
                  isLoaded={d.isLoaded}
                  isOverridden={d.isOverridden}
                />
              ))}
              {key === "jar" &&
                jarPlugins.map((p, idx) => (
                  <InstalledRow
                    key={`jar:${p.id ?? `${p.scope}:${idx}`}`}
                    name={p.name}
                    namespace={p.scope}
                    version="jar"
                    isLoaded
                    isOverridden={false}
                  />
                ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};

const InstalledRow: React.FC<{
  name: string;
  namespace: string;
  version: string;
  isLoaded: boolean;
  isOverridden: boolean;
}> = ({ name, namespace, version, isLoaded, isOverridden }) => (
  <div className="bg-card flex items-center gap-3 rounded-lg border px-3 py-2">
    <span
      className={`h-2 w-2 shrink-0 rounded-full ${isLoaded ? "bg-ok" : "bg-muted-foreground/40"}`}
      title={isLoaded ? "Active" : "Not loaded"}
    />
    <span className="min-w-0 flex-1 truncate text-sm font-medium">{name}</span>
    {isOverridden && (
      <Badge variant="outline" className="text-warning h-5 shrink-0 px-1.5 text-[10px]">
        override
      </Badge>
    )}
    <Badge variant="secondary" className="h-5 shrink-0 px-1.5 text-[10px] font-normal">
      {namespace}
    </Badge>
    <span className="text-muted-foreground shrink-0 text-[10px] tabular-nums">{version}</span>
  </div>
);

// ---------------------------------------------------------------------------
// Discover — registry entries + custom URL
// ---------------------------------------------------------------------------

const DiscoverTab: React.FC<{
  remoteLoadingEnabled: boolean;
  plugins: MarketplaceHook["communityPlugins"];
  isLoading: boolean;
  actionLoading: string | null;
  isInstalled: (id: string) => boolean;
  installedRemotePlugins: string[];
  onTry: (plugin: MarketplaceHook["communityPlugins"][number]) => void;
  onInstall: (plugin: MarketplaceHook["communityPlugins"][number]) => void;
  onUninstall: (urlOrId: string) => void;
  onRefresh: () => void;
  onTryCustomUrl: (url: string, force: boolean) => void;
  onInstallCustomUrl: (url: string, force: boolean) => void;
}> = ({
  remoteLoadingEnabled,
  plugins,
  isLoading,
  actionLoading,
  isInstalled,
  installedRemotePlugins,
  onTry,
  onInstall,
  onUninstall,
  onRefresh,
  onTryCustomUrl,
  onInstallCustomUrl,
}) => (
  <div className="space-y-6">
    <div className="text-muted-foreground space-y-1 text-sm">
      <p>
        Plugins from your configured registries, loadable at runtime — nothing is deployed to the
        server. <strong className="text-foreground font-medium">Try</strong> loads a plugin once
        (gone after the next reload); <strong className="text-foreground font-medium">Install</strong>{" "}
        keeps it loaded across reloads. Both affect only your browser, not other users.
      </p>
    </div>

    {!remoteLoadingEnabled && <RemoteLoadingDisabledBanner />}

    <section>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-muted-foreground">
          <Globe className="h-4 w-4" />
        </span>
        <h2 className="text-sm font-semibold">Available plugins</h2>
        <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
          {plugins.length}
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground ml-auto h-6 w-6"
          aria-label="Refresh registries"
          onClick={onRefresh}
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>
      {isLoading ? (
        <LoadingState message="Loading registries…" />
      ) : plugins.length === 0 ? (
        <EmptyState
          icon={Globe}
          message="No plugins available."
          detail="No registry is configured, or the configured registries list nothing. A deployment adds registries via plugins.admin-marketplace.remotePlugins.registryUrls in config.json."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {plugins.map((plugin) => (
            <CommunityPluginCard
              key={plugin.id}
              name={plugin.name}
              description={plugin.description}
              version={plugin.version}
              category={plugin.category}
              author={plugin.author.name}
              tags={plugin.tags}
              isInstalled={isInstalled(plugin.id)}
              isLoading={actionLoading === plugin.url}
              actionsDisabled={!remoteLoadingEnabled}
              onTry={() => onTry(plugin)}
              onInstall={() => onInstall(plugin)}
              onUninstall={() => onUninstall(plugin.id)}
            />
          ))}
        </div>
      )}
    </section>

    {installedRemotePlugins.length > 0 && (
      <section className="rounded-lg border p-3">
        <p className="text-muted-foreground mb-2 text-xs font-medium">
          Installed in this browser — loaded on every reload
        </p>
        {installedRemotePlugins.map((url) => (
          <div
            key={url}
            className="group hover:bg-muted/50 flex items-center justify-between rounded px-2 py-1.5"
          >
            <code className="text-muted-foreground mr-2 flex-1 truncate text-xs">{url}</code>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs opacity-0 transition-opacity group-hover:opacity-100"
              onClick={() => onUninstall(url)}
            >
              Remove
            </Button>
          </div>
        ))}
      </section>
    )}

    <CustomUrlSection
      disabled={!remoteLoadingEnabled}
      loading={actionLoading}
      onTry={onTryCustomUrl}
      onInstall={onInstallCustomUrl}
    />
  </div>
);

// ---------------------------------------------------------------------------
// Custom URL (advanced, collapsed by default)
// ---------------------------------------------------------------------------

const CustomUrlSection: React.FC<{
  disabled: boolean;
  loading: string | null;
  onTry: (url: string, force: boolean) => void;
  onInstall: (url: string, force: boolean) => void;
}> = ({ disabled, loading, onTry, onInstall }) => {
  const [customUrl, setCustomUrl] = useState("");
  const [forceReload, setForceReload] = useState(false);
  // Loading code from an arbitrary URL runs untrusted third-party JavaScript in
  // the admin session. Require an explicit, per-visit acknowledgement before the
  // Try/Install actions are usable — this is not persisted, so it must be
  // re-confirmed each time the section is opened.
  const [riskAcknowledged, setRiskAcknowledged] = useState(false);

  const actionsDisabled = disabled || loading !== null || !customUrl.trim() || !riskAcknowledged;

  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground h-8 gap-1.5 text-xs">
          <ChevronDown className="h-3.5 w-3.5" />
          Advanced: load a plugin from a URL (developers)
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3">
        <Card>
          <CardContent className="space-y-4 pt-5">
            <div className="border-destructive/40 bg-destructive/10 text-destructive flex gap-3 rounded-md border p-3 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="space-y-1">
                <p className="font-medium">High risk — developer use only</p>
                <p className="text-destructive/90 text-xs leading-relaxed">
                  A plugin loaded from a URL runs untrusted third-party code with your full
                  administrator session: it can read and modify any data you can, act on your
                  behalf, and persist itself. Only load URLs you have personally reviewed and trust.
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
                I understand this executes untrusted code with my administrator privileges and I
                trust this URL.
              </Label>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => onTry(customUrl.trim(), forceReload)}
                disabled={actionsDisabled}
              >
                {loading === customUrl ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                Try
              </Button>
              <Button
                size="sm"
                className="h-8"
                onClick={() => onInstall(customUrl.trim(), forceReload)}
                disabled={actionsDisabled}
              >
                {loading === customUrl ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                Install
              </Button>
            </div>
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
};

/**
 * Shown in the Discover tab when a deployment has not enabled remote plugin
 * loading. Explains the state and exactly how an administrator turns it on,
 * so the capability is discoverable rather than silently missing.
 */
const RemoteLoadingDisabledBanner: React.FC = () => (
  <div className="border-warning/40 bg-warning/10 flex gap-3 rounded-md border p-3 text-sm">
    <AlertTriangle className="text-warning mt-0.5 h-4 w-4 shrink-0" />
    <div className="space-y-1">
      <p className="font-medium">Remote plugin loading is disabled</p>
      <p className="text-muted-foreground text-xs leading-relaxed">
        Trying and installing plugins runs third-party code, so it is off by default. An
        administrator can enable it by setting{" "}
        <code className="bg-muted rounded px-1 py-0.5 text-[11px]">
          plugins.admin-marketplace.remotePlugins.enabled
        </code>{" "}
        to <code className="bg-muted rounded px-1 py-0.5 text-[11px]">true</code> in{" "}
        <code className="bg-muted rounded px-1 py-0.5 text-[11px]">config.json</code>. Installed
        (bundled, organization, local) plugins are unaffected.
      </p>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

const LoadingState: React.FC<{ message: string }> = ({ message }) => (
  <div className="text-muted-foreground flex flex-col items-center justify-center py-16">
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
    <div className="bg-muted mb-4 rounded-full p-4">
      <Icon className="text-muted-foreground h-6 w-6" />
    </div>
    <p className="text-sm font-medium">{message}</p>
    {detail && <p className="text-muted-foreground mt-1 max-w-sm text-xs">{detail}</p>}
  </div>
);
