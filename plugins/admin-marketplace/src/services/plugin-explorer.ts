/**
 * Plugin Explorer Service
 *
 * Discovers all bundled plugins, tracks their loaded state, and manages
 * user overrides for temporarily enabling/disabling plugins.
 *
 * MIGRATION PATH (for future external plugins):
 * ─────────────────────────────────────────────
 * This service currently imports plugins from `@workspace/plugins` (static bundle).
 * When plugins move to external repositories:
 *
 * 1. Replace `discoverAllPlugins()` with an API call to fetch a plugin registry:
 *    ```
 *    const response = await fetch('/api/plugins/registry');
 *    const registry = await response.json();
 *    ```
 *
 * 2. Use the existing `RemoteLoader` service to dynamically load plugin code:
 *    ```
 *    await RemoteLoader.loadAndRegister(plugin.bundleUrl, manager);
 *    ```
 *
 * 3. The rest of this architecture (overrides, conflict detection, UI) remains unchanged.
 */

import type { Plugin, PluginManager } from "@workspace/plugin-system";

// Plugin discovery uses manager.executeFunction("marketplace.getAllPlugins") provided
// by the app's PluginInitializer. This avoids the admin-marketplace package importing
// the @workspace/plugins barrel (which would create a circular dependency).
//
// MIGRATION PATH (for future external plugins): Replace the app-injected function
// with an API call or registry lookup when plugins move to external repositories.

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface PluginOverride {
  enabled: boolean;
  mode: "additive" | "replacement";
}

export interface PluginOverrides {
  version: 1;
  overrides: Record<string, PluginOverride>;
}

export interface DiscoveredPlugin {
  plugin: Plugin;
  namespace: string;
  type: string;
  isLoaded: boolean;
  isOverridden: boolean;
  override?: PluginOverride | undefined;
}

export interface PluginConflict {
  pluginName: string;
  conflictsWith: string;
  extensionPoint: string; // The type they share (e.g., "footer")
  severity: "warning" | "error";
  message: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "plugin_overrides";
const STORAGE_VERSION = 1;

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if an object is a valid Plugin
 */
const isPlugin = (module: unknown): module is Plugin =>
  module !== null &&
  typeof module === "object" &&
  "name" in module &&
  "version" in module &&
  "activate" in module &&
  "deactivate" in module;

/**
 * Parse plugin name into namespace and type
 */
const parsePluginName = (name: string): { namespace: string; type: string } => {
  const [namespace, type] = name.split(":");
  return { namespace: namespace || "unknown", type: type || "unknown" };
};

// ─────────────────────────────────────────────────────────────────────────────
// Plugin Explorer Service
// ─────────────────────────────────────────────────────────────────────────────

export const PluginExplorer = {
  /**
   * Discover all plugins bundled in @workspace/plugins
   *
   * Uses dynamic import to avoid circular dependency at load time. By the time
   * the user opens the Marketplace, @workspace/plugins is already loaded.
   *
   * Note: This loads plugin metadata only - plugins are not registered until
   * explicitly enabled via the PluginManager.
   */
  /**
   * Discover all plugins. Uses the list provided by the app's PluginInitializer
   * via manager.executeFunction("marketplace.getAllPlugins") when available.
   * If that is missing or returns empty (e.g. after refresh or init race), falls
   * back to a dynamic import of @workspace/plugins. By the time the user is in
   * the marketplace, that module is already loaded by the app.
   */
  async discoverAllPlugins(manager: PluginManager): Promise<Plugin[]> {
    let plugins: Plugin[] = [];
    try {
      const fn = manager.executeFunction<() => Plugin[] | Promise<Plugin[]>>("marketplace.getAllPlugins");
      if (fn) {
        const raw = await Promise.resolve(fn());
        plugins = (Array.isArray(raw) ? raw : []).filter(isPlugin);
      }
    } catch {
      // Function not registered or threw (e.g. app does not inject it yet)
    }

    // Fallback: if the app-injected list is empty (e.g. after refresh or init
    // race), resolve from @workspace/plugins. The app has already loaded it for
    // PluginInitializer, so this import resolves from module cache. We do not
    // add @workspace/plugins as a dep to avoid circular dependencies.
    if (plugins.length === 0) {
      try {
        // @ts-expect-error - @workspace/plugins not a dep (circular); resolves at runtime in the app
        const mod = await import("@workspace/plugins");
        const all = (Object.values(mod) as unknown[]).filter(isPlugin);
        return all;
      } catch {
        // Module not available or incompatible
      }
    }
    return plugins;
  },

  /**
   * Get all discovered plugins with their current state
   */
  async getPluginsWithState(manager: PluginManager): Promise<DiscoveredPlugin[]> {
    const allPlugins = await this.discoverAllPlugins(manager);
    const overrides = this.getOverrides();

    return allPlugins.map((plugin) => {
      const { namespace, type } = parsePluginName(plugin.name);
      const isLoaded = manager.plugins.has(plugin.name);
      const override = overrides.overrides[plugin.name];

      return {
        plugin,
        namespace,
        type,
        isLoaded,
        isOverridden: !!override,
        override,
      };
    });
  },

  /**
   * Get plugins grouped by namespace
   */
  async getPluginsByNamespace(manager: PluginManager): Promise<Map<string, DiscoveredPlugin[]>> {
    const plugins = await this.getPluginsWithState(manager);
    const grouped = new Map<string, DiscoveredPlugin[]>();

    for (const plugin of plugins) {
      const existing = grouped.get(plugin.namespace) || [];
      grouped.set(plugin.namespace, [...existing, plugin]);
    }

    return grouped;
  },

  /**
   * Get currently loaded plugins from the PluginManager
   */
  getLoadedPlugins(manager: PluginManager): Plugin[] {
    return Array.from(manager.plugins.values());
  },

  /**
   * Get available (not loaded) plugins
   */
  async getAvailablePlugins(manager: PluginManager): Promise<Plugin[]> {
    const allPlugins = await this.discoverAllPlugins(manager);
    return allPlugins.filter((plugin) => !manager.plugins.has(plugin.name));
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Override Management
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get all overrides from localStorage
   */
  getOverrides(): PluginOverrides {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        return { version: STORAGE_VERSION, overrides: {} };
      }

      const parsed = JSON.parse(data) as PluginOverrides;

      // Version migration if needed in the future
      if (parsed.version !== STORAGE_VERSION) {
        console.warn("Plugin overrides version mismatch, resetting...");
        return { version: STORAGE_VERSION, overrides: {} };
      }

      return parsed;
    } catch (error) {
      console.error("Failed to parse plugin overrides:", error);
      return { version: STORAGE_VERSION, overrides: {} };
    }
  },

  /**
   * Save overrides to localStorage
   */
  saveOverrides(overrides: PluginOverrides): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
    } catch (error) {
      console.error("Failed to save plugin overrides:", error);
      throw error;
    }
  },

  /**
   * Enable a plugin override
   */
  enablePlugin(pluginName: string, mode: "additive" | "replacement" = "additive"): void {
    const overrides = this.getOverrides();
    overrides.overrides[pluginName] = { enabled: true, mode };
    this.saveOverrides(overrides);
  },

  /**
   * Disable a plugin override
   */
  disablePlugin(pluginName: string, mode: "additive" | "replacement" = "additive"): void {
    const overrides = this.getOverrides();
    overrides.overrides[pluginName] = { enabled: false, mode };
    this.saveOverrides(overrides);
  },

  /**
   * Remove an override (revert to config-based behavior)
   */
  removeOverride(pluginName: string): void {
    const overrides = this.getOverrides();
    delete overrides.overrides[pluginName];
    this.saveOverrides(overrides);
  },

  /**
   * Clear all overrides
   */
  clearAllOverrides(): void {
    localStorage.removeItem(STORAGE_KEY);
  },

  /**
   * Check if there are any pending overrides that require a page reload
   */
  hasPendingChanges(manager: PluginManager): boolean {
    const overrides = this.getOverrides();

    for (const [pluginName, override] of Object.entries(overrides.overrides)) {
      const isCurrentlyLoaded = manager.plugins.has(pluginName);

      // If override says enable but not loaded, or disable but loaded = pending change
      if (override.enabled !== isCurrentlyLoaded) {
        return true;
      }
    }

    return false;
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Conflict Detection
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Detect potential conflicts when enabling a plugin
   *
   * Conflicts occur when two plugins from different namespaces
   * register to the same extension point type (e.g., both have "footer" type)
   */
  detectConflicts(
    pluginToEnable: string,
    manager: PluginManager
  ): PluginConflict[] {
    const conflicts: PluginConflict[] = [];
    const { namespace: newNamespace, type: newType } = parsePluginName(pluginToEnable);

    // Skip conflict detection for certain types that are designed to coexist
    const coexistTypes = ["app", "navigation", "sidebar", "config"];
    if (coexistTypes.includes(newType)) {
      return conflicts;
    }

    // Check against currently loaded plugins
    for (const [loadedName] of manager.plugins) {
      const { namespace: loadedNamespace, type: loadedType } = parsePluginName(loadedName);

      // Same type from different namespace = potential conflict
      if (loadedType === newType && loadedNamespace !== newNamespace) {
        conflicts.push({
          pluginName: pluginToEnable,
          conflictsWith: loadedName,
          extensionPoint: newType,
          severity: "warning",
          message: `"${pluginToEnable}" may conflict with "${loadedName}" - both register "${newType}" components`,
        });
      }
    }

    return conflicts;
  },

  /**
   * Get plugins that would be disabled in replacement mode
   */
  getReplacementTargets(pluginToEnable: string, manager: PluginManager): string[] {
    const { namespace: newNamespace, type: newType } = parsePluginName(pluginToEnable);
    const targets: string[] = [];

    for (const [loadedName] of manager.plugins) {
      const { namespace: loadedNamespace, type: loadedType } = parsePluginName(loadedName);

      if (loadedType === newType && loadedNamespace !== newNamespace) {
        targets.push(loadedName);
      }
    }

    return targets;
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Dependency Checking
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Check if a plugin's dependencies are satisfied
   */
  checkDependencies(plugin: Plugin, manager: PluginManager): {
    satisfied: boolean;
    missing: string[];
  } {
    if (!plugin.dependencies || plugin.dependencies.length === 0) {
      return { satisfied: true, missing: [] };
    }

    const missing: string[] = [];

    for (const dep of plugin.dependencies) {
      const depName = dep.split("@")[0]; // Remove version specifier if present
      if (depName && !manager.plugins.has(depName)) {
        missing.push(depName);
      }
    }

    return {
      satisfied: missing.length === 0,
      missing,
    };
  },

  /**
   * Find plugins that depend on a given plugin
   */
  async findDependents(pluginName: string, manager: PluginManager): Promise<Plugin[]> {
    const allPlugins = await this.discoverAllPlugins(manager);
    const dependents: Plugin[] = [];

    for (const plugin of allPlugins) {
      if (plugin.dependencies) {
        const depNames = plugin.dependencies.map((d) => d.split("@")[0]);
        if (depNames.includes(pluginName)) {
          dependents.push(plugin);
        }
      }
    }

    return dependents;
  },

  /**
   * Check if disabling a plugin would break any dependents
   */
  async checkDisableSafety(pluginName: string, manager: PluginManager): Promise<{
    safe: boolean;
    wouldBreak: string[];
  }> {
    const dependents = await this.findDependents(pluginName, manager);
    const wouldBreak: string[] = [];

    for (const dependent of dependents) {
      if (manager.plugins.has(dependent.name)) {
        wouldBreak.push(dependent.name);
      }
    }

    return {
      safe: wouldBreak.length === 0,
      wouldBreak,
    };
  },
};
