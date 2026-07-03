/**
 * Remote Loader Service (Marketplace)
 *
 * Handles dynamic loading and registration of remote ES module plugins for the
 * marketplace: URL validation, version checks, persistence, and delegation
 * to @oc-mui/remote-plugin-loader for fetch/transform/register.
 *
 * Security: URL allowlist, HTTPS in production, version compatibility (here).
 * Loading: Delegated to @oc-mui/remote-plugin-loader (shared with core JAR loading).
 */

import {
  type PluginManager,
  checkApiVersionCompatibility,
  fragmentRegistry,
} from "@oc-mui/plugin-system";
import { loadAndRegister as loadAndRegisterFromPackage } from "@oc-mui/remote-plugin-loader";
import type { LoadResult } from "@oc-mui/remote-plugin-loader";
import { logger } from "@oc-mui/utils";

import { type RegistryPlugin } from "./registry-fetcher";
import {
  securityService,
  validatePluginUrl,
} from "./security";

const STORAGE_KEY = "installed_remote_plugins";
const INSTALLED_VERSIONS_KEY = "installed_plugin_versions";

const remoteLogger = logger.child({ component: "RemoteLoader" });

/**
 * Installed plugin info stored in localStorage
 */
interface InstalledPluginInfo {
  url: string;
  id: string;
  version: string;
  installedAt: string;
}

export type { LoadResult } from "@oc-mui/remote-plugin-loader";

export const RemoteLoader = {
  /**
   * Validate URL and version, then load and register the plugin via shared loader.
   *
   * @param url - URL to the remote ES module
   * @param manager - PluginManager instance to register the plugin with
   * @param metadata - Optional plugin metadata for version checking
   * @param forceReload - If true, bypasses all caches (HTTP and module cache)
   * @returns LoadResult with success status and any errors/warnings
   */
  async loadAndRegister(
    url: string,
    manager: PluginManager,
    metadata?: RegistryPlugin,
    forceReload = false,
  ): Promise<LoadResult> {
    const warnings: string[] = [];

    // Fail-closed choke point: every remote plugin load (community, developer
    // URL, and the boot-time auto-load) routes through here. Refuse before any
    // fetch/execute unless a deployment has explicitly enabled remote loading.
    if (!securityService.isRemotePluginsEnabled()) {
      return {
        success: false,
        error:
          "Remote plugin loading is disabled. An administrator can enable it by setting " +
          "plugins.admin-marketplace.remotePlugins.enabled to true in config.json.",
        warnings,
      };
    }

    const securityResult = validatePluginUrl(url);
    if (!securityResult.valid) {
      return {
        success: false,
        error: securityResult.error || "Security validation failed",
        warnings: securityResult.warnings,
      };
    }
    warnings.push(...securityResult.warnings);

    if (metadata?.workspaceDependencies) {
      const versionResult = securityService.checkVersionCompatibility(
        metadata.workspaceDependencies,
      );
      if (!versionResult.valid) {
        return {
          success: false,
          error: versionResult.error || "Version compatibility check failed",
          warnings: [...warnings, ...versionResult.warnings],
        };
      }
      warnings.push(...versionResult.warnings);
    }

    // Plugin runtime API contract gate: refuse plugins whose declared
    // `apiVersion` does not match this host's PLUGIN_API_VERSION semantics
    // (see docs/architecture/CONTRACTS.md and `@oc-mui/plugin-system`'s
    // `checkApiVersionCompatibility`). A missing `apiVersion` is treated as
    // "1.0.0" by the checker, so older registry entries continue to load.
    if (metadata?.apiVersion !== undefined) {
      const apiResult = checkApiVersionCompatibility(metadata.apiVersion);
      if (!apiResult.compatible) {
        return {
          success: false,
          error:
            `Plugin "${metadata.id}" rejected: ${apiResult.reason ?? "incompatible plugin runtime API version"}.`,
          warnings,
        };
      }
    }

    const result = await loadAndRegisterFromPackage(url, manager, { forceReload });
    return {
      ...result,
      warnings: [...warnings, ...result.warnings],
    };
  },

  /**
   * Persist a plugin URL and info to localStorage
   *
   * @param url - URL to persist
   * @param pluginId - Plugin identifier
   * @param version - Plugin version
   */
  persist(url: string, pluginId: string, version: string): void {
    const installed = this.getInstalledPlugins();
    const existingIndex = installed.findIndex((p) => p.url === url || p.id === pluginId);

    const pluginInfo: InstalledPluginInfo = {
      url,
      id: pluginId,
      version,
      installedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      // Update existing entry
      installed[existingIndex] = pluginInfo;
    } else {
      // Add new entry
      installed.push(pluginInfo);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(installed));
    remoteLogger.debug(`Persisted plugin "${pluginId}"`, { version });
  },

  /**
   * Remove a plugin URL from localStorage
   *
   * @param urlOrId - URL or plugin ID to remove
   */
  remove(urlOrId: string): void {
    const installed = this.getInstalledPlugins();
    const filtered = installed.filter((p) => p.url !== urlOrId && p.id !== urlOrId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

    // Also unregister fragments
    fragmentRegistry.unregisterPlugin(urlOrId);

    remoteLogger.debug(`Removed plugin "${urlOrId}"`);
  },

  /**
   * Get all installed plugin URLs from localStorage
   * @returns Array of plugin URLs
   * @deprecated Use getInstalledPlugins() instead
   */
  getInstalledUrls(): string[] {
    return this.getInstalledPlugins().map((p) => p.url);
  },

  /**
   * Get all installed plugins with full info
   *
   * @returns Array of installed plugin info
   */
  getInstalledPlugins(): InstalledPluginInfo[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];

      const parsed = JSON.parse(data);

      // Handle legacy format (array of strings)
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "string") {
        // Migrate legacy format
        const migrated: InstalledPluginInfo[] = parsed.map((url: string) => ({
          url,
          id: url.split("/").pop()?.replace(".mjs", "").replace(".js", "") || "unknown",
          version: "unknown",
          installedAt: new Date().toISOString(),
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      }

      return parsed as InstalledPluginInfo[];
    } catch (error) {
      remoteLogger.error("Failed to parse installed plugins", error instanceof Error ? error : new Error(String(error)));
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
  },

  /**
   * Get installed version of a plugin
   *
   * @param pluginId - Plugin ID
   * @returns Version string or null if not installed
   */
  getInstalledVersion(pluginId: string): string | null {
    const plugins = this.getInstalledPlugins();
    const plugin = plugins.find((p) => p.id === pluginId);
    return plugin?.version || null;
  },

  /**
   * Check if a plugin is installed
   *
   * @param urlOrId - URL or plugin ID
   * @returns true if installed
   */
  isInstalled(urlOrId: string): boolean {
    const plugins = this.getInstalledPlugins();
    return plugins.some((p) => p.url === urlOrId || p.id === urlOrId);
  },

  /**
   * Clear all installed plugin URLs from localStorage
   */
  clearAll(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(INSTALLED_VERSIONS_KEY);
    fragmentRegistry.clear();
    remoteLogger.debug("Cleared all installed plugins");
  },

  /**
   * Load all persisted plugins
   *
   * @param manager - PluginManager instance
   * @returns Results for each plugin
   */
  async loadAllInstalled(manager: PluginManager): Promise<LoadResult[]> {
    const plugins = this.getInstalledPlugins();

    if (plugins.length === 0) {
      remoteLogger.debug("No installed plugins to load");
      return [];
    }

    remoteLogger.debug(`Loading ${plugins.length} installed plugin(s)`);

    const results = await Promise.all(
      plugins.map(async (plugin) => {
        const result = await this.loadAndRegister(plugin.url, manager);

        // If load failed, we might want to remove it from storage
        if (!result.success) {
          remoteLogger.warn(`Failed to load installed plugin "${plugin.id}"`, { error: result.error });
        }

        return {
          ...result,
          pluginId: result.pluginId || plugin.id,
        };
      }),
    );

    const successful = results.filter((r) => r.success).length;
    const failed = results.length - successful;

    if (failed > 0) {
      remoteLogger.warn(`Loaded ${successful} plugin(s), ${failed} failed`, { successful, failed });
    } else {
      remoteLogger.debug(`Loaded ${successful} plugin(s)`, { count: successful });
    }

    return results;
  },

  /**
   * Update a plugin to a new version
   *
   * @param pluginId - Plugin ID to update
   * @param newUrl - URL to the new version
   * @param newVersion - New version string
   * @param manager - PluginManager instance
   * @returns LoadResult
   */
  async update(
    pluginId: string,
    newUrl: string,
    newVersion: string,
    manager: PluginManager,
  ): Promise<LoadResult> {
    // First, try to load the new version
    const result = await this.loadAndRegister(newUrl, manager);

    if (result.success) {
      // Update the persisted info
      this.persist(newUrl, pluginId, newVersion);
      remoteLogger.info(`Updated plugin "${pluginId}"`, { version: newVersion });
    }

    return result;
  },
};

export default RemoteLoader;
