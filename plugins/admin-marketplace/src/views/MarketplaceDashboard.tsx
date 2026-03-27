import { AlertTriangle, RefreshCw, Check, X, LayoutGrid, TableIcon, Globe, ExternalLink, Shield, ShieldCheck, Building2, Package } from "lucide-react";
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
  Checkbox,
} from "@workspace/ui/components";

import { PluginExplorer, type DiscoveredPlugin, type PluginConflict } from "../services/plugin-explorer";
import { getPluginMetadataOrDefault, CATEGORY_INFO, type PluginCategory, getCategoryLabel } from "../services/plugin-metadata";
import { registryFetcher, type RegistryPlugin } from "../services/registry-fetcher";
import { RemoteLoader } from "../services/remote-loader";
import { securityService } from "../services/security";
import { ThemeLoader } from "../services/theme-loader";
import { AVAILABLE_THEMES } from "../services/themes";
import { getViewPreferences, updateViewPreference, type ViewMode } from "../services/view-preferences";

export interface MarketplaceDashboardProps {
  manager: PluginManager;
  view?: "themes" | "plugins";
}

/**
 * MarketplaceDashboard Component
 *
 * Provides a UI for browsing and installing remote plugins dynamically.
 * Features:
 * - Community registry browser for remote plugins
 * - Bundled plugins explorer with enable/disable
 * - Theme switching
 * - Developer Mode for loading custom plugin URLs
 */
export const MarketplaceDashboard: React.FC<MarketplaceDashboardProps> = ({
  manager,
  view = "plugins",
}) => {
  // Remote plugins state
  const [customUrl, setCustomUrl] = useState("");
  const [forceReload, setForceReload] = useState(false);
  const [installedPlugins, setInstalledPlugins] = useState<string[]>(
    RemoteLoader.getInstalledUrls()
  );
  const [installedTheme, setInstalledTheme] = useState<string | null>(
    ThemeLoader.getInstalledUrl()
  );
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Community plugins state
  const [communityPlugins, setCommunityPlugins] = useState<RegistryPlugin[]>([]);
  const [communityPluginsLoading, setCommunityPluginsLoading] = useState(true);
  const [communitySearchQuery, setCommunitySearchQuery] = useState("");
  const [communityFilterCategory, setCommunityFilterCategory] = useState<string>("all");

  // Bundled plugins state
  const [bundledPlugins, setBundledPlugins] = useState<Map<string, DiscoveredPlugin[]>>(new Map());
  const [bundledPluginsLoading, setBundledPluginsLoading] = useState(true);
  const [pendingChanges, setPendingChanges] = useState(false);
  const [conflicts, setConflicts] = useState<PluginConflict[]>([]);
  const [selectedModes, setSelectedModes] = useState<Record<string, "additive" | "replacement">>({});
  // Local development plugins (discovered via localStorage)
  const [localPlugins, setLocalPlugins] = useState<
    { id: string; name: string; url: string; metadata?: unknown }[]
  >([]);
  // JAR plugins from backend (exposed by PluginInitializer for Organization group)
  const [jarPlugins, setJarPlugins] = useState<{ name: string; path: string; scope: string; url: string }[]>([]);

  // View mode preferences (persisted to localStorage)
  const [viewModes, setViewModes] = useState(() => getViewPreferences());

  const handleViewModeChange = (section: keyof typeof viewModes, mode: ViewMode) => {
    setViewModes((prev) => {
      const updated = { ...prev, [section]: mode };
      updateViewPreference(section, mode);
      return updated;
    });
  };

  // Load local development plugins (dev-only helper via localStorage)
  useEffect(() => {
    let cancelled = false;
    const loadLocal = () => {
      if (typeof window === "undefined") return;
      try {
        const raw = window.localStorage.getItem("local_plugins");
        if (!raw) {
          if (!cancelled) setLocalPlugins([]);
          return;
        }
        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) {
          if (!cancelled) setLocalPlugins([]);
          return;
        }
        const mapped = parsed
          .filter((item): item is { id: string; name: string; url: string; metadata?: unknown } => {
            return !!item && typeof item === "object" && "id" in item && "name" in item && "url" in item;
          })
          .map((item) => ({
            id: String((item as { id: unknown }).id),
            name: String((item as { name: unknown }).name),
            url: String((item as { url: unknown }).url),
            metadata: (item as { metadata?: unknown }).metadata,
          }));
        if (!cancelled) setLocalPlugins(mapped);
      } catch {
        if (!cancelled) setLocalPlugins([]);
      }
    };
    loadLocal();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load JAR plugins list for Organization group (from PluginInitializer)
  useEffect(() => {
    if (typeof manager.executeFunction !== "function") return;
    const list = manager.executeFunction<{ name: string; path: string; scope: string; url: string }[]>("marketplace.getJarPlugins");
    setJarPlugins(Array.isArray(list) ? list : []);
  }, [manager]);

  // Load bundled plugins on mount (async: via marketplace.getAllPlugins)
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

  // Load community plugins from registry
  useEffect(() => {
    let cancelled = false;

    const loadCommunityPlugins = async () => {
      setCommunityPluginsLoading(true);
      try {
        const plugins = await registryFetcher.fetchAllPlugins();
        if (!cancelled) {
          setCommunityPlugins(plugins);
        }
      } catch (err) {
        console.error("Failed to load community plugins:", err);
        if (!cancelled) {
          setCommunityPlugins([]);
        }
      } finally {
        if (!cancelled) {
          setCommunityPluginsLoading(false);
        }
      }
    };

    loadCommunityPlugins();
    return () => { cancelled = true; };
  }, []);

  // Refresh community plugins
  const refreshCommunityPlugins = useCallback(async () => {
    setCommunityPluginsLoading(true);
    registryFetcher.clearCache();
    try {
      const plugins = await registryFetcher.fetchAllPlugins();
      setCommunityPlugins(plugins);
    } catch (err) {
      console.error("Failed to refresh community plugins:", err);
    } finally {
      setCommunityPluginsLoading(false);
    }
  }, []);

  // Filter community plugins
  const filteredCommunityPlugins = communityPlugins.filter((plugin) => {
    const matchesSearch = communitySearchQuery === "" ||
      plugin.name.toLowerCase().includes(communitySearchQuery.toLowerCase()) ||
      plugin.description.toLowerCase().includes(communitySearchQuery.toLowerCase()) ||
      (plugin.tags || []).some(tag => tag.toLowerCase().includes(communitySearchQuery.toLowerCase()));

    const matchesCategory = communityFilterCategory === "all" || plugin.category === communityFilterCategory;

    return matchesSearch && matchesCategory;
  });

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

  // Clear all overrides (bundled plugins only)
  // Note: Remote plugins are not cleared here - use Uninstall button for those
  const handleClearAllOverrides = () => {
    PluginExplorer.clearAllOverrides();
    setConflicts([]);
    setPendingChanges(false); // Clear pending flag after discarding bundled plugin changes
    void refreshBundledPlugins();
  };

  const handleTryPlugin = async (url: string, force = false) => {
    setLoading(url);
    setError(null);
    try {
      const result = await RemoteLoader.loadAndRegister(url, manager, undefined, force);
      if (!result.success) {
        setError(result.error || "Failed to load plugin");
      } else {
        console.log(`Successfully loaded plugin from ${url}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to load plugin: ${errorMessage}`);
    } finally {
      setLoading(null);
    }
  };

  const handleInstallPlugin = async (url: string, force = false) => {
    setLoading(url);
    setError(null);
    try {
      const result = await RemoteLoader.loadAndRegister(url, manager, undefined, force);
      if (!result.success) {
        setError(result.error || "Failed to install plugin");
      } else {
        RemoteLoader.persist(url, result.pluginId || "unknown", "1.0.0");
        setInstalledPlugins(RemoteLoader.getInstalledUrls());
        // Mark as pending changes since plugin is now persisted and will auto-load on reload
        setPendingChanges(true);
        console.log(`Successfully installed plugin from ${url}`);
      }
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
    // Mark as pending changes since plugin is now removed and won't load on reload
    setPendingChanges(true);
    console.log(`Uninstalled plugin from ${url}`);
  };

  // Community plugin handlers
  const handleTryCommunityPlugin = async (plugin: RegistryPlugin) => {
    setLoading(plugin.url);
    setError(null);
    try {
      const result = await RemoteLoader.loadAndRegister(plugin.url, manager, plugin);
      if (!result.success) {
        setError(result.error || "Failed to load community plugin");
      } else {
        console.log(`Successfully loaded community plugin "${plugin.name}"`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to load community plugin: ${errorMessage}`);
    } finally {
      setLoading(null);
    }
  };

  const handleInstallCommunityPlugin = async (plugin: RegistryPlugin) => {
    setLoading(plugin.url);
    setError(null);
    try {
      const result = await RemoteLoader.loadAndRegister(plugin.url, manager, plugin);
      if (!result.success) {
        setError(result.error || "Failed to install community plugin");
      } else {
        RemoteLoader.persist(plugin.url, plugin.id, plugin.version);
        setInstalledPlugins(RemoteLoader.getInstalledUrls());
        // Mark as pending changes since plugin is now persisted and will auto-load on reload
        setPendingChanges(true);
        console.log(`Successfully installed community plugin "${plugin.name}" v${plugin.version}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to install community plugin: ${errorMessage}`);
    } finally {
      setLoading(null);
    }
  };

  const isCommunityPluginInstalled = (pluginId: string) => {
    return RemoteLoader.isInstalled(pluginId);
  };

  const handleLoadCustomUrl = async () => {
    if (!customUrl.trim()) {
      setError("Please enter a valid URL");
      return;
    }
    await handleTryPlugin(customUrl.trim(), forceReload);
  };

  const handleInstallCustomUrl = async () => {
    if (!customUrl.trim()) {
      setError("Please enter a valid URL");
      return;
    }
    await handleInstallPlugin(customUrl.trim(), forceReload);
  };

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
          Changes to plugins require a page reload to take effect.
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

      {view === "themes" ? (
        <div className="space-y-6 mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Available Themes</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Customize the look and feel of your application with these theme options
                </p>
              </div>
              <div className="flex border rounded-md">
                <Button
                  variant={viewModes.themes === "cards" ? "secondary" : "ghost"}
                  size="sm"
                  className="rounded-r-none"
                  onClick={() => handleViewModeChange("themes", "cards")}
                  title="Card view"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewModes.themes === "table" ? "secondary" : "ghost"}
                  size="sm"
                  className="rounded-l-none"
                  onClick={() => handleViewModeChange("themes", "table")}
                  title="Table view"
                >
                  <TableIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {viewModes.themes === "cards" ? (
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
            ) : (
              <ThemesTable
                themes={AVAILABLE_THEMES}
                isInstalled={isThemeInstalled}
                loading={loading}
                onTry={handleTryTheme}
                onInstall={handleInstallTheme}
                onUninstall={handleUninstallTheme}
              />
            )}
          </div>
        </div>
      ) : (
        <Tabs defaultValue="development" className="w-full mt-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="development">Development / testing</TabsTrigger>
            <TabsTrigger value="bundled">Bundled plugins</TabsTrigger>
            <TabsTrigger value="organization">Organization</TabsTrigger>
            <TabsTrigger value="community">Community</TabsTrigger>
          </TabsList>

          <TabsContent value="development" className="space-y-4 mt-6">
            <div>
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Globe className="h-6 w-6" />
                Development / testing
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Try or install plugins from custom URLs. Enable/disable and uninstall apply only to this source; if a plugin still appears, it may be loaded from Organization or Built-in.
              </p>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Developer Mode</CardTitle>
                <CardDescription>
                  Load a plugin from a custom URL (e.g., 127.0.0.1 during development)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="custom-url">Plugin URL</Label>
                  <Input
                    id="custom-url"
                    type="url"
                    placeholder="http://127.0.0.1:5173/plugin.mjs"
                    value={customUrl}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomUrl(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="force-reload"
                    checked={forceReload}
                    onCheckedChange={(checked) => setForceReload(checked === true)}
                  />
                  <Label htmlFor="force-reload" className="text-sm font-normal cursor-pointer">
                    Force reload (bypass cache)
                  </Label>
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

            {localPlugins.length === 0 ? (
              <div className="text-center py-8 border rounded-lg bg-muted/30">
                <p className="text-sm text-muted-foreground">
                  No local development plugins detected. Use Developer Mode or configure
                  <code className="mx-1">local_plugins</code> in <code>localStorage</code> with your plugin URLs.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {localPlugins.map((plugin) => (
                  <Card key={plugin.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{plugin.name}</CardTitle>
                      <CardDescription className="text-xs break-all">
                        {plugin.url}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Local development plugin. It will be loaded like any other remote plugin using the given URL.
                      </p>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTryPlugin(plugin.url)}
                        disabled={loading !== null}
                      >
                        {loading === plugin.url ? "Loading..." : "Try"}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleInstallPlugin(plugin.url)}
                        disabled={loading !== null}
                      >
                        {loading === plugin.url ? "Installing..." : "Install"}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="bundled" className="space-y-4 mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold flex items-center gap-2">
                    <Package className="h-6 w-6" />
                    Included in this installation
                  </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Bundled plugins. Enable/disable uses overrides (reload required). No uninstall — they are part of the app.
                </p>
              </div>
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex border rounded-md">
              <Button
                variant={viewModes.bundledPlugins === "cards" ? "secondary" : "ghost"}
                size="sm"
                className="rounded-r-none"
                onClick={() => handleViewModeChange("bundledPlugins", "cards")}
                title="Card view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewModes.bundledPlugins === "table" ? "secondary" : "ghost"}
                size="sm"
                className="rounded-l-none"
                onClick={() => handleViewModeChange("bundledPlugins", "table")}
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
              {viewModes.bundledPlugins === "cards" ? (
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
                {viewModes.bundledPlugins === "cards" ? (
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
          </TabsContent>

          <TabsContent value="organization" className="space-y-4 mt-6">
            <div>
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Building2 className="h-6 w-6" />
                From your organization
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Plugins provided by your deployment (backend JAR). Read-only here; changes require server/deploy. In development, .local-plugins may also load from this source.
              </p>
            </div>
            {jarPlugins.length === 0 ? (
              <div className="text-center py-6 border rounded-lg bg-muted/30">
                <p className="text-sm text-muted-foreground">
                  No organization plugins from backend. They may be configured via server deployment.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {jarPlugins.map((p) => (
                  <Card key={p.scope}>
                    <CardHeader>
                      <CardTitle className="text-base">{p.name}</CardTitle>
                      <CardDescription className="text-xs break-all">
                        {p.path} • scope: {p.scope}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Loaded from backend (JAR). Managed by your organization.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Badge variant="secondary">Organization (JAR)</Badge>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="community" className="space-y-4 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  <Globe className="h-6 w-6" />
                  From the community
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Registry and installed remote plugins. Install = persist URL; Uninstall = remove from this list. If a plugin still appears after uninstall, it may be loaded from Organization or Built-in.
                </p>
              </div>
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex border rounded-md">
              <Button
                variant={viewModes.communityPlugins === "cards" ? "secondary" : "ghost"}
                size="sm"
                className="rounded-r-none"
                onClick={() => handleViewModeChange("communityPlugins", "cards")}
                title="Card view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewModes.communityPlugins === "table" ? "secondary" : "ghost"}
                size="sm"
                className="rounded-l-none"
                onClick={() => handleViewModeChange("communityPlugins", "table")}
                title="Table view"
              >
                <TableIcon className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refreshCommunityPlugins()}
              disabled={communityPluginsLoading}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              {communityPluginsLoading ? "Loading..." : "Refresh"}
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="community-search">Search</Label>
            <Input
              id="community-search"
              type="text"
              placeholder="Search plugins..."
              value={communitySearchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCommunitySearchQuery(e.target.value)}
            />
          </div>
          <div className="w-48 space-y-2">
            <Label>Category</Label>
            <Select value={communityFilterCategory} onValueChange={setCommunityFilterCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="feature">Feature</SelectItem>
                <SelectItem value="theme">Theme</SelectItem>
                <SelectItem value="integration">Integration</SelectItem>
                <SelectItem value="utility">Utility</SelectItem>
                <SelectItem value="experimental">Experimental</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Community Plugins Grid/Table */}
        {communityPluginsLoading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Loading community plugins...</p>
        ) : filteredCommunityPlugins.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-muted/30">
            <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No Community Plugins Found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {communityPlugins.length === 0
                ? "The community registry is empty or unreachable."
                : "Try adjusting your search or filters."}
            </p>
          </div>
        ) : viewModes.communityPlugins === "cards" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCommunityPlugins.map((plugin) => (
              <CommunityPluginCard
                key={plugin.id}
                plugin={plugin}
                isInstalled={isCommunityPluginInstalled(plugin.id)}
                installedVersion={RemoteLoader.getInstalledVersion(plugin.id)}
                loading={loading}
                onTry={() => handleTryCommunityPlugin(plugin)}
                onInstall={() => handleInstallCommunityPlugin(plugin)}
                onUninstall={() => handleUninstallPlugin(plugin.id)}
              />
            ))}
          </div>
        ) : (
          <CommunityPluginsTable
            plugins={filteredCommunityPlugins}
            isInstalled={isCommunityPluginInstalled}
            getInstalledVersion={(id) => RemoteLoader.getInstalledVersion(id)}
            loading={loading}
            onTry={handleTryCommunityPlugin}
            onInstall={handleInstallCommunityPlugin}
            onUninstall={handleUninstallPlugin}
          />
        )}

            {/* Installed Runtime (from community / browser-installed) */}
            {installedPlugins.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Installed Runtime Plugins</CardTitle>
                      <CardDescription>
                        These runtime-loaded plugins will be automatically loaded on next page load. Uninstall removes only from this list.
                      </CardDescription>
                    </div>
                    <div className="flex border rounded-md">
                      <Button
                        variant={viewModes.installedPlugins === "cards" ? "secondary" : "ghost"}
                        size="sm"
                        className="rounded-r-none"
                        onClick={() => handleViewModeChange("installedPlugins", "cards")}
                        title="Card view"
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewModes.installedPlugins === "table" ? "secondary" : "ghost"}
                        size="sm"
                        className="rounded-l-none"
                        onClick={() => handleViewModeChange("installedPlugins", "table")}
                        title="Table view"
                      >
                        <TableIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {viewModes.installedPlugins === "cards" ? (
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
                  ) : (
                    <InstalledPluginsTable
                      plugins={installedPlugins}
                      onUninstall={handleUninstallPlugin}
                    />
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
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

// ─────────────────────────────────────────────────────────────────────────────
// Community Plugin Card Component
// ─────────────────────────────────────────────────────────────────────────────

interface CommunityPluginCardProps {
  plugin: RegistryPlugin;
  isInstalled: boolean;
  installedVersion: string | null;
  loading: string | null;
  onTry: () => void;
  onInstall: () => void;
  onUninstall: () => void;
}

const CommunityPluginCard: React.FC<CommunityPluginCardProps> = ({
  plugin,
  isInstalled,
  installedVersion,
  loading,
  onTry,
  onInstall,
  onUninstall,
}) => {
  const isLoading = loading === plugin.url;
  const hasUpdate = isInstalled && installedVersion && installedVersion !== plugin.version;

  // Check version compatibility
  const versionCheck = plugin.workspaceDependencies
    ? securityService.checkVersionCompatibility(plugin.workspaceDependencies)
    : { valid: true, warnings: [] };

  return (
    <Card className={!versionCheck.valid ? "border-amber-500" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0 flex-1">
            <CardTitle className="text-base truncate flex items-center gap-2" title={plugin.name}>
              {plugin.name}
              {plugin.verified && (
                <ShieldCheck className="h-4 w-4 text-green-600" aria-label="Verified plugin" />
              )}
            </CardTitle>
            <CardDescription className="text-xs">
              by {plugin.author.name} • v{plugin.version}
            </CardDescription>
          </div>
          <Badge variant="secondary">{getCategoryLabel(plugin.category as PluginCategory)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {plugin.description}
        </p>

        {/* Tags */}
        {plugin.tags && plugin.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {plugin.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Status badges */}
        <div className="mt-3 flex items-center gap-2">
          {isInstalled ? (
            <>
              <Badge className="bg-green-600">
                <Check className="h-3 w-3 mr-1" />
                Installed
              </Badge>
              {hasUpdate && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                  Update: v{plugin.version}
                </Badge>
              )}
            </>
          ) : (
            <Badge variant="secondary">Available</Badge>
          )}
        </div>

        {/* Version compatibility warning */}
        {!versionCheck.valid && (
          <div className="mt-2 text-xs text-amber-600 flex items-center gap-1">
            <Shield className="h-3 w-3" />
            {versionCheck.error}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2 pt-2">
        {isInstalled ? (
          <>
            {hasUpdate && (
              <Button
                size="sm"
                className="flex-1"
                onClick={onInstall}
                disabled={isLoading || !versionCheck.valid}
              >
                {isLoading ? "Updating..." : "Update"}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className={hasUpdate ? "" : "flex-1"}
              onClick={onUninstall}
              disabled={isLoading}
            >
              Uninstall
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={onTry}
              disabled={isLoading || !versionCheck.valid}
            >
              {isLoading ? "Loading..." : "Try"}
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={onInstall}
              disabled={isLoading || !versionCheck.valid}
            >
              {isLoading ? "Installing..." : "Install"}
            </Button>
          </>
        )}

        {/* External links */}
        {(plugin.repositoryUrl || plugin.homepageUrl) && (
          <Button
            variant="ghost"
            size="sm"
            asChild
          >
            <a
              href={plugin.repositoryUrl || plugin.homepageUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="View source"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Community Plugins Table Component
// ─────────────────────────────────────────────────────────────────────────────

interface CommunityPluginsTableProps {
  plugins: RegistryPlugin[];
  isInstalled: (id: string) => boolean;
  getInstalledVersion: (id: string) => string | null;
  loading: string | null;
  onTry: (plugin: RegistryPlugin) => void;
  onInstall: (plugin: RegistryPlugin) => void;
  onUninstall: (id: string) => void;
}

const CommunityPluginsTable: React.FC<CommunityPluginsTableProps> = ({
  plugins,
  isInstalled,
  getInstalledVersion,
  loading,
  onTry,
  onInstall,
  onUninstall,
}) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Plugin</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Version</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plugins.map((plugin) => {
            const installed = isInstalled(plugin.id);
            const installedVersion = getInstalledVersion(plugin.id);
            const hasUpdate = installed && installedVersion && installedVersion !== plugin.version;
            const isLoading = loading === plugin.url;
            const versionCheck = plugin.workspaceDependencies
              ? securityService.checkVersionCompatibility(plugin.workspaceDependencies)
              : { valid: true, warnings: [] };

            return (
              <TableRow key={plugin.id} className={!versionCheck.valid ? "bg-amber-50 dark:bg-amber-950/20" : ""}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {plugin.name}
                    {plugin.verified && (
                      <ShieldCheck className="h-4 w-4 text-green-600" aria-label="Verified plugin" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {plugin.description}
                  </p>
                </TableCell>
                <TableCell>{plugin.author.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{getCategoryLabel(plugin.category as PluginCategory)}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">v{plugin.version}</TableCell>
                <TableCell>
                  {installed ? (
                    <div className="flex flex-col gap-1">
                      <Badge className="bg-green-600">
                        <Check className="h-3 w-3 mr-1" />
                        Installed
                      </Badge>
                      {hasUpdate && (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-xs">
                          Update: v{plugin.version}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <Badge variant="secondary">Available</Badge>
                  )}
                  {!versionCheck.valid && (
                    <div className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      {versionCheck.error}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {installed ? (
                      <>
                        {hasUpdate && (
                          <Button
                            size="sm"
                            onClick={() => onInstall(plugin)}
                            disabled={isLoading || !versionCheck.valid}
                          >
                            {isLoading ? "Updating..." : "Update"}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onUninstall(plugin.id)}
                          disabled={isLoading}
                        >
                          Uninstall
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onTry(plugin)}
                          disabled={isLoading || !versionCheck.valid}
                        >
                          {isLoading ? "Loading..." : "Try"}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => onInstall(plugin)}
                          disabled={isLoading || !versionCheck.valid}
                        >
                          {isLoading ? "Installing..." : "Install"}
                        </Button>
                      </>
                    )}
                    {(plugin.repositoryUrl || plugin.homepageUrl) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <a
                          href={plugin.repositoryUrl || plugin.homepageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View source"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
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

// ─────────────────────────────────────────────────────────────────────────────
// Installed Plugins Table Component
// ─────────────────────────────────────────────────────────────────────────────

interface InstalledPluginsTableProps {
  plugins: string[];
  onUninstall: (url: string) => void;
}

const InstalledPluginsTable: React.FC<InstalledPluginsTableProps> = ({
  plugins,
  onUninstall,
}) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Plugin URL</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plugins.map((url) => (
            <TableRow key={url}>
              <TableCell>
                <code className="text-sm bg-muted px-2 py-1 rounded">
                  {url}
                </code>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  onClick={() => onUninstall(url)}
                  variant="ghost"
                  size="sm"
                >
                  Remove
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Themes Table Component
// ─────────────────────────────────────────────────────────────────────────────

interface ThemesTableProps {
  themes: typeof AVAILABLE_THEMES;
  isInstalled: (url: string) => boolean;
  loading: string | null;
  onTry: (url: string) => void;
  onInstall: (url: string) => void;
  onUninstall: () => void;
}

const ThemesTable: React.FC<ThemesTableProps> = ({
  themes,
  isInstalled,
  loading,
  onTry,
  onInstall,
  onUninstall,
}) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Theme</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {themes.map((theme) => {
            const installed = isInstalled(theme.previewUrl);
            const isLoading = loading === theme.previewUrl;

            return (
              <TableRow key={theme.id}>
                <TableCell className="font-medium">{theme.name}</TableCell>
                <TableCell>{theme.author}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{theme.category}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{theme.description}</TableCell>
                <TableCell>
                  {installed ? (
                    <Badge variant="default">Installed</Badge>
                  ) : (
                    <Badge variant="secondary">Available</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {installed ? (
                      <Button
                        onClick={onUninstall}
                        variant="outline"
                        size="sm"
                        disabled={isLoading}
                      >
                        Uninstall
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={() => onTry(theme.previewUrl)}
                          variant="outline"
                          size="sm"
                          disabled={isLoading}
                        >
                          {isLoading ? "Applying..." : "Try"}
                        </Button>
                        <Button
                          onClick={() => onInstall(theme.previewUrl)}
                          size="sm"
                          disabled={isLoading}
                        >
                          {isLoading ? "Installing..." : "Install"}
                        </Button>
                      </>
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
