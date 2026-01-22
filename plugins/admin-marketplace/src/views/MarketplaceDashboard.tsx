import { AlertTriangle, RefreshCw, Check, X, Layers, LayoutGrid, TableIcon } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";

import type { PluginManager } from "@workspace/plugin-system";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Label,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components";

import { PluginExplorer, type DiscoveredPlugin, type PluginConflict } from "../services/plugin-explorer";
import { getPluginMetadataOrDefault, CATEGORY_INFO, type PluginCategory } from "../services/plugin-metadata";
import { AVAILABLE_PLUGINS } from "../services/plugin-registry";
import { RemoteLoader } from "../services/remote-loader";
import { ThemeLoader } from "../services/theme-loader";
import { AVAILABLE_THEMES } from "../services/themes";

export interface MarketplaceDashboardProps {
  manager: PluginManager;
}

/**
 * MarketplaceDashboard Component
 *
 * Provides a UI for browsing and installing remote plugins dynamically.
 * Features:
 * - Grid display of available plugins (remote)
 * - Bundled plugins explorer with enable/disable
 * - Theme switching
 * - Developer Mode for loading custom plugin URLs
 */
export const MarketplaceDashboard: React.FC<MarketplaceDashboardProps> = ({
  manager,
}) => {
  // Remote plugins state
  const [customUrl, setCustomUrl] = useState("");
  const [installedPlugins, setInstalledPlugins] = useState<string[]>(
    RemoteLoader.getInstalledUrls()
  );
  const [installedTheme, setInstalledTheme] = useState<string | null>(
    ThemeLoader.getInstalledUrl()
  );
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Bundled plugins state
  const [bundledPlugins, setBundledPlugins] = useState<Map<string, DiscoveredPlugin[]>>(new Map());
  const [bundledPluginsLoading, setBundledPluginsLoading] = useState(true);
  const [pendingChanges, setPendingChanges] = useState(false);
  const [conflicts, setConflicts] = useState<PluginConflict[]>([]);
  const [selectedModes, setSelectedModes] = useState<Record<string, "additive" | "replacement">>({});
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Load bundled plugins on mount (async: via marketplace.getAllPlugins or @workspace/plugins fallback)
  useEffect(() => {
    let cancelled = false;

    const load = async (retry = false) => {
      if (!retry) setBundledPluginsLoading(true);
      try {
        const grouped = await PluginExplorer.getPluginsByNamespace(manager);
        if (cancelled) return;
        const isEmpty = grouped.size === 0;
        if (isEmpty && !retry && manager.arePluginsReady) {
          // Possible init race: retry once after a short delay
          await new Promise((r) => setTimeout(r, 300));
          if (cancelled) return;
          const retried = await PluginExplorer.getPluginsByNamespace(manager);
          if (!cancelled) {
            setBundledPlugins(retried);
            setPendingChanges(PluginExplorer.hasPendingChanges(manager));
          }
        } else {
          setBundledPlugins(grouped);
          setPendingChanges(PluginExplorer.hasPendingChanges(manager));
        }
      } finally {
        if (!cancelled) setBundledPluginsLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [manager]);

  // Refresh bundled plugins state
  const refreshBundledPlugins = useCallback(async () => {
    const grouped = await PluginExplorer.getPluginsByNamespace(manager);
    setBundledPlugins(grouped);
    setPendingChanges(PluginExplorer.hasPendingChanges(manager));
  }, [manager]);

  // Handle enabling a bundled plugin
  const handleEnableBundledPlugin = (pluginName: string) => {
    const mode = selectedModes[pluginName] || "additive";

    // Check for conflicts
    const detectedConflicts = PluginExplorer.detectConflicts(pluginName, manager);
    if (detectedConflicts.length > 0 && mode === "additive") {
      setConflicts(detectedConflicts);
    } else {
      setConflicts([]);
    }

    PluginExplorer.enablePlugin(pluginName, mode);
    void refreshBundledPlugins();
  };

  // Handle disabling a bundled plugin
  const handleDisableBundledPlugin = async (pluginName: string) => {
    // Check if any loaded plugins depend on this one
    const safetyCheck = await PluginExplorer.checkDisableSafety(pluginName, manager);
    if (!safetyCheck.safe) {
      setError(
        `Cannot disable "${pluginName}" - the following plugins depend on it: ${safetyCheck.wouldBreak.join(", ")}`,
      );
      return;
    }

    const mode = selectedModes[pluginName] || "additive";
    PluginExplorer.disablePlugin(pluginName, mode);
    void refreshBundledPlugins();
  };

  // Handle removing an override (revert to config behavior)
  const handleRemoveOverride = (pluginName: string) => {
    PluginExplorer.removeOverride(pluginName);
    setConflicts([]);
    void refreshBundledPlugins();
  };

  // Handle mode change for a plugin
  const handleModeChange = (pluginName: string, mode: "additive" | "replacement") => {
    setSelectedModes((prev) => ({ ...prev, [pluginName]: mode }));
  };

  // Handle page reload
  const handleReload = () => {
    window.location.reload();
  };

  // Clear all overrides
  const handleClearAllOverrides = () => {
    PluginExplorer.clearAllOverrides();
    setConflicts([]);
    void refreshBundledPlugins();
  };

  const handleTryPlugin = async (url: string) => {
    setLoading(url);
    setError(null);
    try {
      await RemoteLoader.loadAndRegister(url, manager);
      console.log(`Successfully loaded plugin from ${url}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to load plugin: ${errorMessage}`);
    } finally {
      setLoading(null);
    }
  };

  const handleInstallPlugin = async (url: string) => {
    setLoading(url);
    setError(null);
    try {
      await RemoteLoader.loadAndRegister(url, manager);
      RemoteLoader.persist(url);
      setInstalledPlugins(RemoteLoader.getInstalledUrls());
      console.log(`Successfully installed plugin from ${url}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to install plugin: ${errorMessage}`);
    } finally {
      setLoading(null);
    }
  };

  const handleUninstallPlugin = (url: string) => {
    RemoteLoader.remove(url);
    setInstalledPlugins(RemoteLoader.getInstalledUrls());
    console.log(`Uninstalled plugin from ${url}`);
  };

  const handleLoadCustomUrl = async () => {
    if (!customUrl.trim()) {
      setError("Please enter a valid URL");
      return;
    }
    await handleTryPlugin(customUrl.trim());
  };

  const handleInstallCustomUrl = async () => {
    if (!customUrl.trim()) {
      setError("Please enter a valid URL");
      return;
    }
    await handleInstallPlugin(customUrl.trim());
  };

  const isInstalled = (url: string) => installedPlugins.includes(url);

  const handleTryTheme = async (url: string) => {
    setLoading(url);
    setError(null);
    try {
      await ThemeLoader.tryTheme(url);
      console.log(`Successfully applied theme from ${url}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to apply theme: ${errorMessage}`);
    } finally {
      setLoading(null);
    }
  };

  const handleInstallTheme = async (url: string) => {
    setLoading(url);
    setError(null);
    try {
      await ThemeLoader.installTheme(url);
      setInstalledTheme(url);
      console.log(`Successfully installed theme from ${url}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to install theme: ${errorMessage}`);
    } finally {
      setLoading(null);
    }
  };

  const handleUninstallTheme = () => {
    ThemeLoader.uninstallTheme();
    setInstalledTheme(null);
    console.log("Uninstalled theme");
  };

  const isThemeInstalled = (url: string) => installedTheme === url;

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Admin Marketplace</h1>
        <p className="text-muted-foreground">
          Explore bundled plugins, switch themes, and try different configurations.
          Changes to bundled plugins require a page reload to take effect.
        </p>
      </div>

      {/* Pending Changes Alert */}
      {pendingChanges && (
        <div className="border border-amber-500 bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <RefreshCw className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-800 dark:text-amber-200">Pending Changes</h3>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                You have plugin changes that require a page reload to take effect.
              </p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={handleReload} className="bg-amber-600 hover:bg-amber-700">
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Reload Now
                </Button>
                <Button size="sm" variant="outline" onClick={handleClearAllOverrides}>
                  Discard Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conflict Warnings */}
      {conflicts.length > 0 && (
        <div className="border border-destructive bg-destructive/10 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-destructive">Potential Conflicts Detected</h3>
              <ul className="mt-2 space-y-1">
                {conflicts.map((conflict, idx) => (
                  <li key={idx} className="text-sm text-destructive/90">
                    {conflict.message}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-sm text-destructive/80">
                Consider using &quot;Replacement&quot; mode to disable conflicting plugins automatically.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md flex items-center justify-between">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={() => setError(null)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Developer Mode */}
      <Card>
        <CardHeader>
          <CardTitle>Developer Mode</CardTitle>
          <CardDescription>
            Load a plugin from a custom URL (e.g., localhost during development)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="custom-url">Plugin URL</Label>
            <Input
              id="custom-url"
              type="url"
              placeholder="http://localhost:3001/plugin.js"
              value={customUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomUrl(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button
            onClick={handleLoadCustomUrl}
            disabled={loading !== null}
            variant="outline"
          >
            Try
          </Button>
          <Button
            onClick={handleInstallCustomUrl}
            disabled={loading !== null}
          >
            Install
          </Button>
        </CardFooter>
      </Card>

      {/* Available Themes Grid */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Available Themes</h2>
        <p className="text-sm text-muted-foreground">
          Customize the look and feel of your application with these theme options
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {AVAILABLE_THEMES.map((theme) => (
            <Card key={theme.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{theme.name}</CardTitle>
                    <CardDescription className="text-xs">
                      by {theme.author}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">{theme.category}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {theme.description}
                </p>
              </CardContent>
              <CardFooter className="flex gap-2">
                {isThemeInstalled(theme.previewUrl) ? (
                  <>
                    <Badge variant="default">Installed</Badge>
                    <Button
                      onClick={handleUninstallTheme}
                      variant="outline"
                      size="sm"
                      disabled={loading !== null}
                    >
                      Uninstall
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => handleTryTheme(theme.previewUrl)}
                      variant="outline"
                      size="sm"
                      disabled={loading !== null}
                    >
                      {loading === theme.previewUrl ? "Applying..." : "Try"}
                    </Button>
                    <Button
                      onClick={() => handleInstallTheme(theme.previewUrl)}
                      size="sm"
                      disabled={loading !== null}
                    >
                      {loading === theme.previewUrl ? "Installing..." : "Install"}
                    </Button>
                  </>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Bundled Plugins Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Layers className="h-6 w-6" />
              Bundled Plugins
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              All plugins included in this build. Enable or disable plugins to customize your experience.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === "cards" ? "secondary" : "ghost"}
                size="sm"
                className="rounded-r-none"
                onClick={() => setViewMode("cards")}
                title="Card view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                className="rounded-l-none"
                onClick={() => setViewMode("table")}
                title="Table view"
              >
                <TableIcon className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refreshBundledPlugins()}
              disabled={bundledPluginsLoading}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              {bundledPluginsLoading ? "Loading..." : "Refresh"}
            </Button>
          </div>
        </div>

        {bundledPluginsLoading ? (
          <p className="text-sm text-muted-foreground py-8">Loading plugins...</p>
        ) : (
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All Namespaces</TabsTrigger>
            {Array.from(bundledPlugins.keys()).map((namespace) => (
              <TabsTrigger key={namespace} value={namespace} className="capitalize">
                {namespace}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="space-y-6 mt-4">
            {viewMode === "cards" ? (
              // Card View
              Array.from(bundledPlugins.entries()).map(([namespace, plugins]) => (
                <div key={namespace} className="space-y-3">
                  <h3 className="text-lg font-medium capitalize border-b pb-2">
                    {namespace}
                    <Badge variant="outline" className="ml-2">{plugins.length} plugins</Badge>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {plugins.map((discovered) => (
                      <BundledPluginCard
                        key={discovered.plugin.name}
                        discovered={discovered}
                        selectedMode={selectedModes[discovered.plugin.name] || "additive"}
                        onModeChange={(mode) => handleModeChange(discovered.plugin.name, mode)}
                        onEnable={() => handleEnableBundledPlugin(discovered.plugin.name)}
                        onDisable={() => handleDisableBundledPlugin(discovered.plugin.name)}
                        onRemoveOverride={() => handleRemoveOverride(discovered.plugin.name)}
                        loading={loading}
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              // Table View
              <BundledPluginsTable
                plugins={Array.from(bundledPlugins.values()).flat()}
                selectedModes={selectedModes}
                onModeChange={handleModeChange}
                onEnable={handleEnableBundledPlugin}
                onDisable={handleDisableBundledPlugin}
                onRemoveOverride={handleRemoveOverride}
              />
            )}
          </TabsContent>

          {Array.from(bundledPlugins.entries()).map(([namespace, plugins]) => (
            <TabsContent key={namespace} value={namespace} className="mt-4">
              {viewMode === "cards" ? (
                // Card View for namespace
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {plugins.map((discovered) => (
                    <BundledPluginCard
                      key={discovered.plugin.name}
                      discovered={discovered}
                      selectedMode={selectedModes[discovered.plugin.name] || "additive"}
                      onModeChange={(mode) => handleModeChange(discovered.plugin.name, mode)}
                      onEnable={() => handleEnableBundledPlugin(discovered.plugin.name)}
                      onDisable={() => handleDisableBundledPlugin(discovered.plugin.name)}
                      onRemoveOverride={() => handleRemoveOverride(discovered.plugin.name)}
                      loading={loading}
                    />
                  ))}
                </div>
              ) : (
                // Table View for namespace
                <BundledPluginsTable
                  plugins={plugins}
                  selectedModes={selectedModes}
                  onModeChange={handleModeChange}
                  onEnable={handleEnableBundledPlugin}
                  onDisable={handleDisableBundledPlugin}
                  onRemoveOverride={handleRemoveOverride}
                />
              )}
            </TabsContent>
          ))}
        </Tabs>
        )}
      </div>

      {/* Remote Plugins Grid */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Remote Plugins</h2>
        <p className="text-sm text-muted-foreground">
          External plugins that can be loaded dynamically from remote URLs.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {AVAILABLE_PLUGINS.map((plugin) => (
            <Card key={plugin.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{plugin.name}</CardTitle>
                    <CardDescription className="text-xs">
                      by {plugin.author} • v{plugin.version}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">{plugin.category}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {plugin.description}
                </p>
              </CardContent>
              <CardFooter className="flex gap-2">
                {isInstalled(plugin.url) ? (
                  <>
                    <Badge variant="default">Installed</Badge>
                    <Button
                      onClick={() => handleUninstallPlugin(plugin.url)}
                      variant="outline"
                      size="sm"
                      disabled={loading !== null}
                    >
                      Uninstall
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => handleTryPlugin(plugin.url)}
                      variant="outline"
                      size="sm"
                      disabled={loading !== null}
                    >
                      {loading === plugin.url ? "Loading..." : "Try"}
                    </Button>
                    <Button
                      onClick={() => handleInstallPlugin(plugin.url)}
                      size="sm"
                      disabled={loading !== null}
                    >
                      {loading === plugin.url ? "Installing..." : "Install"}
                    </Button>
                  </>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Installed Remote Plugins Info */}
      {installedPlugins.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Installed Remote Plugins</CardTitle>
            <CardDescription>
              These remote plugins will be automatically loaded on next page load
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {installedPlugins.map((url) => (
                <li key={url} className="flex items-center justify-between">
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {url}
                  </code>
                  <Button
                    onClick={() => handleUninstallPlugin(url)}
                    variant="ghost"
                    size="sm"
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Bundled Plugin Card Component
// ─────────────────────────────────────────────────────────────────────────────

interface BundledPluginCardProps {
  discovered: DiscoveredPlugin;
  selectedMode: "additive" | "replacement";
  onModeChange: (mode: "additive" | "replacement") => void;
  onEnable: () => void;
  onDisable: () => void;
  onRemoveOverride: () => void;
  loading: string | null;
}

const BundledPluginCard: React.FC<BundledPluginCardProps> = ({
  discovered,
  selectedMode,
  onModeChange,
  onEnable,
  onDisable,
  onRemoveOverride,
}) => {
  const { plugin, isLoaded, isOverridden, override } = discovered;
  const metadata = getPluginMetadataOrDefault(plugin.name);

  // Determine the status badge
  const getStatusBadge = () => {
    if (isOverridden) {
      if (override?.enabled) {
        return <Badge className="bg-blue-500">Override: Enabled</Badge>;
      } else {
        return <Badge variant="destructive">Override: Disabled</Badge>;
      }
    }
    if (isLoaded) {
      return <Badge className="bg-green-600"><Check className="h-3 w-3 mr-1" />Loaded</Badge>;
    }
    return <Badge variant="secondary">Available</Badge>;
  };

  // Get category badge color
  const getCategoryBadgeVariant = (category: PluginCategory) => {
    switch (category) {
      case "core":
        return "default";
      case "branding":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Card className={isOverridden ? "ring-2 ring-blue-400 dark:ring-blue-600" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0 flex-1">
            <CardTitle className="text-base truncate" title={metadata.name}>
              {metadata.name}
            </CardTitle>
            <CardDescription className="text-xs">
              v{plugin.version}
              {metadata.author && ` • ${metadata.author}`}
            </CardDescription>
          </div>
          <Badge variant={getCategoryBadgeVariant(metadata.category)}>
            {CATEGORY_INFO[metadata.category]?.label || metadata.category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {metadata.description}
        </p>
        <div className="mt-2">{getStatusBadge()}</div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 pt-2">
        {/* Mode selector */}
        <div className="w-full">
          <Label className="text-xs text-muted-foreground">Mode</Label>
          <Select value={selectedMode} onValueChange={(v) => onModeChange(v as "additive" | "replacement")}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="additive">Additive (keep others)</SelectItem>
              <SelectItem value="replacement">Replacement (disable conflicts)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 w-full">
          {isOverridden ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={onRemoveOverride}
              >
                Reset
              </Button>
              {override?.enabled ? (
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  onClick={onDisable}
                >
                  Disable
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={onEnable}
                >
                  Enable
                </Button>
              )}
            </>
          ) : isLoaded ? (
            <Button
              variant="destructive"
              size="sm"
              className="flex-1"
              onClick={onDisable}
              disabled={metadata.isCore}
              title={metadata.isCore ? "Core plugins cannot be disabled" : undefined}
            >
              {metadata.isCore ? "Core Plugin" : "Disable"}
            </Button>
          ) : (
            <Button
              size="sm"
              className="flex-1"
              onClick={onEnable}
            >
              Enable
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Bundled Plugins Table Component
// ─────────────────────────────────────────────────────────────────────────────

interface BundledPluginsTableProps {
  plugins: DiscoveredPlugin[];
  selectedModes: Record<string, "additive" | "replacement">;
  onModeChange: (pluginName: string, mode: "additive" | "replacement") => void;
  onEnable: (pluginName: string) => void;
  onDisable: (pluginName: string) => void;
  onRemoveOverride: (pluginName: string) => void;
}

const BundledPluginsTable: React.FC<BundledPluginsTableProps> = ({
  plugins,
  selectedModes,
  onModeChange,
  onEnable,
  onDisable,
  onRemoveOverride,
}) => {
  // Helper to get status info
  const getStatus = (discovered: DiscoveredPlugin) => {
    if (discovered.isOverridden) {
      return discovered.override?.enabled ? "Override: Enabled" : "Override: Disabled";
    }
    return discovered.isLoaded ? "Loaded" : "Available";
  };

  const getStatusVariant = (discovered: DiscoveredPlugin): "default" | "secondary" | "destructive" | "outline" => {
    if (discovered.isOverridden) {
      return discovered.override?.enabled ? "default" : "destructive";
    }
    return discovered.isLoaded ? "default" : "secondary";
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Plugin</TableHead>
            <TableHead>Namespace</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Version</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Mode</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plugins.map((discovered) => {
            const metadata = getPluginMetadataOrDefault(discovered.plugin.name);
            const selectedMode = selectedModes[discovered.plugin.name] || "additive";

            return (
              <TableRow
                key={discovered.plugin.name}
                className={discovered.isOverridden ? "bg-blue-50 dark:bg-blue-950/20" : ""}
              >
                <TableCell className="font-medium">
                  <div>
                    <div className="font-medium">{metadata.name}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[200px]" title={metadata.description}>
                      {metadata.description}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">{discovered.namespace}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{discovered.type}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{CATEGORY_INFO[metadata.category]?.label || metadata.category}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">v{discovered.plugin.version}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(discovered)}>
                    {discovered.isLoaded && !discovered.isOverridden && <Check className="h-3 w-3 mr-1" />}
                    {getStatus(discovered)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Select
                    value={selectedMode}
                    onValueChange={(v) => onModeChange(discovered.plugin.name, v as "additive" | "replacement")}
                  >
                    <SelectTrigger className="h-8 w-[130px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="additive">Additive</SelectItem>
                      <SelectItem value="replacement">Replacement</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {discovered.isOverridden ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveOverride(discovered.plugin.name)}
                        >
                          Reset
                        </Button>
                        {discovered.override?.enabled ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => onDisable(discovered.plugin.name)}
                          >
                            Disable
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEnable(discovered.plugin.name)}
                          >
                            Enable
                          </Button>
                        )}
                      </>
                    ) : discovered.isLoaded ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => onDisable(discovered.plugin.name)}
                        disabled={metadata.isCore}
                        title={metadata.isCore ? "Core plugins cannot be disabled" : undefined}
                      >
                        {metadata.isCore ? "Core" : "Disable"}
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEnable(discovered.plugin.name)}
                      >
                        Enable
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
