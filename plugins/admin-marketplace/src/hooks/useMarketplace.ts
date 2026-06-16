import { useState, useEffect, useCallback, useMemo } from "react";

import type { PluginManager } from "@opencast-mui/plugin-system";

import { PluginExplorer, type DiscoveredPlugin, type PluginConflict } from "../services/plugin-explorer";
import { registryFetcher, type RegistryPlugin } from "../services/registry-fetcher";
import { RemoteLoader, type LoadResult } from "../services/remote-loader";
import { securityService } from "../services/security";
import { ThemeLoader } from "../services/theme-loader";
import { AVAILABLE_THEMES, type ThemeDefinition } from "../services/themes";

export interface MarketplaceState {
  loading: string | null;
  error: string | null;
  pendingChanges: boolean;
  conflicts: PluginConflict[];

  bundledPlugins: Map<string, DiscoveredPlugin[]>;
  bundledPluginsLoading: boolean;

  communityPlugins: RegistryPlugin[];
  communityPluginsLoading: boolean;

  jarPlugins: { id?: string; name: string; path: string; scope: string; url: string }[];

  installedRemotePlugins: string[];
  installedTheme: string | null;

  themes: ThemeDefinition[];
}

export interface MarketplaceActions {
  clearError: () => void;

  refreshBundledPlugins: () => Promise<void>;
  enableBundledPlugin: (pluginName: string, mode?: "additive" | "replacement") => void;
  disableBundledPlugin: (pluginName: string, mode?: "additive" | "replacement") => Promise<void>;
  removeOverride: (pluginName: string) => void;
  clearAllOverrides: () => void;

  refreshCommunityPlugins: () => Promise<void>;
  tryCommunityPlugin: (plugin: RegistryPlugin) => Promise<LoadResult>;
  installCommunityPlugin: (plugin: RegistryPlugin) => Promise<LoadResult>;
  uninstallPlugin: (urlOrId: string) => void;
  isCommunityPluginInstalled: (id: string) => boolean;
  getInstalledVersion: (id: string) => string | null;
  checkVersionCompatibility: (plugin: RegistryPlugin) => { valid: boolean; error?: string; warnings: string[] };

  tryCustomUrl: (url: string, forceReload?: boolean) => Promise<LoadResult>;
  installCustomUrl: (url: string, forceReload?: boolean) => Promise<LoadResult>;

  tryTheme: (url: string) => Promise<void>;
  installTheme: (url: string) => Promise<void>;
  uninstallTheme: () => void;
  isThemeInstalled: (url: string) => boolean;

  reload: () => void;
}

export function useMarketplace(manager: PluginManager): MarketplaceState & MarketplaceActions {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState(false);
  const [conflicts, setConflicts] = useState<PluginConflict[]>([]);

  const [bundledPlugins, setBundledPlugins] = useState<Map<string, DiscoveredPlugin[]>>(new Map());
  const [bundledPluginsLoading, setBundledPluginsLoading] = useState(true);

  const [communityPlugins, setCommunityPlugins] = useState<RegistryPlugin[]>([]);
  const [communityPluginsLoading, setCommunityPluginsLoading] = useState(true);

  const [jarPlugins, setJarPlugins] = useState<{ id?: string; name: string; path: string; scope: string; url: string }[]>([]);

  const [installedRemotePlugins, setInstalledRemotePlugins] = useState<string[]>(
    RemoteLoader.getInstalledUrls(),
  );
  const [installedTheme, setInstalledTheme] = useState<string | null>(
    ThemeLoader.getInstalledUrl(),
  );

  // --- Load bundled plugins ---
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setBundledPluginsLoading(true);
      try {
        let grouped = await PluginExplorer.getPluginsByNamespace(manager);
        if (grouped.size === 0 && manager.arePluginsReady) {
          await new Promise((r) => setTimeout(r, 300));
          if (cancelled) return;
          grouped = await PluginExplorer.getPluginsByNamespace(manager);
        }
        if (!cancelled) {
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

  // --- Load community plugins ---
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setCommunityPluginsLoading(true);
      try {
        const plugins = await registryFetcher.fetchAllPlugins();
        if (!cancelled) setCommunityPlugins(plugins);
      } catch {
        if (!cancelled) setCommunityPlugins([]);
      } finally {
        if (!cancelled) setCommunityPluginsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // --- Load JAR plugins ---
  useEffect(() => {
    if (typeof manager.executeFunction !== "function") return;
    const list = manager.executeFunction<{ id?: string; name: string; path: string; scope: string; url: string }[]>(
      "marketplace.getJarPlugins",
    );
    setJarPlugins(Array.isArray(list) ? list : []);
  }, [manager]);

  // --- Actions ---

  const refreshBundledPlugins = useCallback(async () => {
    const grouped = await PluginExplorer.getPluginsByNamespace(manager);
    setBundledPlugins(grouped);
    setPendingChanges(PluginExplorer.hasPendingChanges(manager));
  }, [manager]);

  const enableBundledPlugin = useCallback((pluginName: string, mode: "additive" | "replacement" = "additive") => {
    const detectedConflicts = PluginExplorer.detectConflicts(pluginName, manager);
    if (detectedConflicts.length > 0 && mode === "additive") {
      setConflicts(detectedConflicts);
    } else {
      setConflicts([]);
    }
    PluginExplorer.enablePlugin(pluginName, mode);
    void refreshBundledPlugins();
  }, [manager, refreshBundledPlugins]);

  const disableBundledPlugin = useCallback(async (pluginName: string, mode: "additive" | "replacement" = "additive") => {
    const safety = await PluginExplorer.checkDisableSafety(pluginName, manager);
    if (!safety.safe) {
      setError(`Cannot disable "${pluginName}" — depends: ${safety.wouldBreak.join(", ")}`);
      return;
    }
    PluginExplorer.disablePlugin(pluginName, mode);
    void refreshBundledPlugins();
  }, [manager, refreshBundledPlugins]);

  const removeOverride = useCallback((pluginName: string) => {
    PluginExplorer.removeOverride(pluginName);
    setConflicts([]);
    void refreshBundledPlugins();
  }, [refreshBundledPlugins]);

  const clearAllOverrides = useCallback(() => {
    PluginExplorer.clearAllOverrides();
    setConflicts([]);
    setPendingChanges(false);
    void refreshBundledPlugins();
  }, [refreshBundledPlugins]);

  const refreshCommunityPlugins = useCallback(async () => {
    setCommunityPluginsLoading(true);
    registryFetcher.clearCache();
    try {
      const plugins = await registryFetcher.fetchAllPlugins();
      setCommunityPlugins(plugins);
    } catch {
      // keep existing
    } finally {
      setCommunityPluginsLoading(false);
    }
  }, []);

  const withLoading = useCallback(async (key: string, fn: () => Promise<LoadResult>): Promise<LoadResult> => {
    setLoading(key);
    setError(null);
    try {
      const result = await fn();
      if (!result.success) setError(result.error || "Operation failed");
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      return { success: false, error: msg, warnings: [] };
    } finally {
      setLoading(null);
    }
  }, []);

  const tryCommunityPlugin = useCallback((plugin: RegistryPlugin) => {
    return withLoading(plugin.url, () => RemoteLoader.loadAndRegister(plugin.url, manager, plugin));
  }, [manager, withLoading]);

  const installCommunityPlugin = useCallback(async (plugin: RegistryPlugin) => {
    const result = await withLoading(plugin.url, () => RemoteLoader.loadAndRegister(plugin.url, manager, plugin));
    if (result.success) {
      RemoteLoader.persist(plugin.url, plugin.id, plugin.version);
      setInstalledRemotePlugins(RemoteLoader.getInstalledUrls());
      setPendingChanges(true);
    }
    return result;
  }, [manager, withLoading]);

  const uninstallPlugin = useCallback((urlOrId: string) => {
    RemoteLoader.remove(urlOrId);
    setInstalledRemotePlugins(RemoteLoader.getInstalledUrls());
    setPendingChanges(true);
  }, []);

  const isCommunityPluginInstalled = useCallback((id: string) => RemoteLoader.isInstalled(id), []);
  const getInstalledVersion = useCallback((id: string) => RemoteLoader.getInstalledVersion(id), []);

  const checkVersionCompatibility = useCallback((plugin: RegistryPlugin) => {
    if (!plugin.workspaceDependencies) return { valid: true, warnings: [] as string[] };
    return securityService.checkVersionCompatibility(plugin.workspaceDependencies);
  }, []);

  const tryCustomUrl = useCallback((url: string, forceReload = false) => {
    return withLoading(url, () => RemoteLoader.loadAndRegister(url, manager, undefined, forceReload));
  }, [manager, withLoading]);

  const installCustomUrl = useCallback(async (url: string, forceReload = false) => {
    const result = await withLoading(url, () => RemoteLoader.loadAndRegister(url, manager, undefined, forceReload));
    if (result.success) {
      RemoteLoader.persist(url, result.pluginId || "unknown", "1.0.0");
      setInstalledRemotePlugins(RemoteLoader.getInstalledUrls());
      setPendingChanges(true);
    }
    return result;
  }, [manager, withLoading]);

  const tryTheme = useCallback(async (url: string) => {
    setLoading(url);
    setError(null);
    try {
      await ThemeLoader.tryTheme(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply theme");
    } finally {
      setLoading(null);
    }
  }, []);

  const installTheme = useCallback(async (url: string) => {
    setLoading(url);
    setError(null);
    try {
      await ThemeLoader.installTheme(url);
      setInstalledTheme(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to install theme");
    } finally {
      setLoading(null);
    }
  }, []);

  const uninstallTheme = useCallback(() => {
    ThemeLoader.uninstallTheme();
    setInstalledTheme(null);
  }, []);

  const isThemeInstalled = useCallback((url: string) => installedTheme === url, [installedTheme]);

  const themes = useMemo(() => AVAILABLE_THEMES, []);

  return {
    loading, error, pendingChanges, conflicts,
    bundledPlugins, bundledPluginsLoading,
    communityPlugins, communityPluginsLoading,
    jarPlugins,
    installedRemotePlugins, installedTheme,
    themes,

    clearError: () => setError(null),
    refreshBundledPlugins, enableBundledPlugin, disableBundledPlugin,
    removeOverride, clearAllOverrides,
    refreshCommunityPlugins, tryCommunityPlugin, installCommunityPlugin,
    uninstallPlugin, isCommunityPluginInstalled, getInstalledVersion, checkVersionCompatibility,
    tryCustomUrl, installCustomUrl,
    tryTheme, installTheme, uninstallTheme, isThemeInstalled,
    reload: () => window.location.reload(),
  };
}
