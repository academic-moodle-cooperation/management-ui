/**
 * Registry Fetcher Service
 *
 * Fetches and manages plugin registries from remote URLs.
 * Supports multiple registries (public community + private organization)
 * with caching and deduplication.
 *
 * Registry Format (registry.json):
 * ```json
 * {
 *   "version": "1.0.0",
 *   "plugins": [
 *     {
 *       "id": "sample-university",
 *       "name": "Sample University Plugin",
 *       "description": "Description of the plugin",
 *       "version": "1.0.0",
 *       "author": { "name": "Author Name", "url": "https://example.com" },
 *       "url": "https://cdn.jsdelivr.net/gh/org/repo@v1.0.0/dist/plugin.mjs",
 *       "category": "feature",
 *       "workspaceDependencies": { "@workspace/plugin-system": ">=1.0.0" }
 *     }
 *   ]
 * }
 * ```
 */

import { type PluginVersionConstraints } from "./security";

/**
 * Author information for a plugin
 */
export interface PluginAuthor {
  name: string;
  email?: string;
  url?: string;
}

/**
 * A plugin entry in the registry
 */
export interface RegistryPlugin {
  /** Unique plugin identifier */
  id: string;
  /** Display name */
  name: string;
  /** Plugin description */
  description: string;
  /** Plugin version (semver) */
  version: string;
  /** Plugin author */
  author: PluginAuthor;
  /** URL to the plugin bundle (.mjs file) */
  url: string;
  /** Plugin category */
  category: "feature" | "theme" | "integration" | "utility" | "experimental";
  /** Icon name (from lucide-react) */
  icon?: string;
  /** Repository URL */
  repositoryUrl?: string;
  /** Homepage URL */
  homepageUrl?: string;
  /** License */
  license?: string;
  /** Tags for search */
  tags?: string[];
  /** Version constraints for workspace packages */
  workspaceDependencies?: PluginVersionConstraints;
  /**
   * Minimum plugin runtime API version this plugin requires.
   * The host loader refuses plugins whose major mismatches the host or whose
   * minor exceeds the host's minor (see `@workspace/plugin-system`'s
   * `checkApiVersionCompatibility`). If absent, "1.0.0" is assumed.
   */
  apiVersion?: string;
  /** Whether this plugin is verified by maintainers */
  verified?: boolean;
  /** Download count (optional, for display) */
  downloads?: number;
  /** Rating (optional, for display) */
  rating?: number;
  /** Last updated timestamp */
  lastUpdated?: string;
}

/**
 * Registry response format
 */
export interface PluginRegistry {
  /** Registry schema version */
  version: string;
  /** List of plugins */
  plugins: RegistryPlugin[];
  /** Registry name (for display) */
  name?: string;
  /** Registry description */
  description?: string;
  /** Last updated timestamp */
  lastUpdated?: string;
}

/**
 * Cached registry entry
 */
interface CachedRegistry {
  registry: PluginRegistry;
  fetchedAt: number;
  url: string;
}

/**
 * Configuration for the registry fetcher
 */
export interface RegistryFetcherConfig {
  /** Registry URLs to fetch from */
  registryUrls: string[];
  /** Cache TTL in milliseconds (default: 5 minutes) */
  cacheTtlMs: number;
  /** Request timeout in milliseconds */
  timeoutMs: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: RegistryFetcherConfig = {
  registryUrls: [],
  cacheTtlMs: 5 * 60 * 1000, // 5 minutes
  timeoutMs: 10000, // 10 seconds
};

/**
 * Default community registry URL
 * This should point to the official opencast-management-ui-registry repo
 */
const DEFAULT_COMMUNITY_REGISTRY =
  "https://raw.githubusercontent.com/eduardklinger/management-ui-registry/main/registry.json";

/**
 * Registry Fetcher class
 */
class RegistryFetcherService {
  private config: RegistryFetcherConfig;
  private cache: Map<string, CachedRegistry> = new Map();
  private fetchPromises: Map<string, Promise<PluginRegistry | null>> = new Map();

  constructor(config: Partial<RegistryFetcherConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Check if a cached entry is still valid
   */
  private isCacheValid(cached: CachedRegistry): boolean {
    return Date.now() - cached.fetchedAt < this.config.cacheTtlMs;
  }

  /**
   * Fetch a single registry from a URL
   */
  private async fetchRegistry(url: string): Promise<PluginRegistry | null> {
    // Check cache first
    const cached = this.cache.get(url);
    if (cached && this.isCacheValid(cached)) {
      console.log(`[RegistryFetcher] Using cached registry from ${url}`);
      return cached.registry;
    }

    // Check if there's already a fetch in progress for this URL
    const existingPromise = this.fetchPromises.get(url);
    if (existingPromise) {
      console.log(`[RegistryFetcher] Waiting for existing fetch from ${url}`);
      return existingPromise;
    }

    // Start a new fetch
    const fetchPromise = (async () => {
      try {
        console.log(`[RegistryFetcher] Fetching registry from ${url}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const registry: PluginRegistry = await response.json();

        // Validate basic structure
        if (!registry.plugins || !Array.isArray(registry.plugins)) {
          throw new Error("Invalid registry format: missing plugins array");
        }

        // Cache the result
        this.cache.set(url, {
          registry,
          fetchedAt: Date.now(),
          url,
        });

        console.log(
          `[RegistryFetcher] Fetched ${registry.plugins.length} plugins from ${url}`,
        );

        return registry;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          console.error(`[RegistryFetcher] Timeout fetching registry from ${url}`);
        } else {
          console.error(`[RegistryFetcher] Failed to fetch registry from ${url}:`, error);
        }
        return null;
      } finally {
        this.fetchPromises.delete(url);
      }
    })();

    this.fetchPromises.set(url, fetchPromise);
    return fetchPromise;
  }

  /**
   * Fetch all configured registries and merge them
   * Later registries take precedence (can override earlier ones)
   *
   * @param additionalUrls - Additional registry URLs to fetch
   * @returns Merged list of plugins
   */
  async fetchAllPlugins(additionalUrls: string[] = []): Promise<RegistryPlugin[]> {
    const allUrls = [...this.config.registryUrls, ...additionalUrls];

    // In dev, try local registry first (public/registry.json) so the flow works without the external repo
    if (import.meta.env.DEV && typeof window !== "undefined") {
      const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "") || "";
      const localRegistryUrl = new URL(`${base}/registry.json`, window.location.origin).href;
      if (!allUrls.includes(localRegistryUrl)) {
        allUrls.unshift(localRegistryUrl);
      }
    }

    // Add default community registry if no URLs configured
    if (allUrls.length === 0) {
      allUrls.push(DEFAULT_COMMUNITY_REGISTRY);
    }

    // Fetch all registries in parallel
    const results = await Promise.all(allUrls.map((url) => this.fetchRegistry(url)));

    // Merge plugins, later entries override earlier ones (by id)
    const pluginMap = new Map<string, RegistryPlugin>();

    for (const registry of results) {
      if (!registry) continue;

      for (const plugin of registry.plugins) {
        pluginMap.set(plugin.id, plugin);
      }
    }

    return Array.from(pluginMap.values());
  }

  /**
   * Get a specific plugin by ID from all registries
   *
   * @param pluginId - The plugin ID to find
   * @returns The plugin if found, null otherwise
   */
  async getPluginById(pluginId: string): Promise<RegistryPlugin | null> {
    const plugins = await this.fetchAllPlugins();
    return plugins.find((p) => p.id === pluginId) || null;
  }

  /**
   * Search plugins by query string
   *
   * @param query - Search query
   * @returns Matching plugins
   */
  async searchPlugins(query: string): Promise<RegistryPlugin[]> {
    const plugins = await this.fetchAllPlugins();
    const lowerQuery = query.toLowerCase();

    return plugins.filter((plugin) => {
      const searchableText = [
        plugin.name,
        plugin.description,
        plugin.author.name,
        ...(plugin.tags || []),
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(lowerQuery);
    });
  }

  /**
   * Filter plugins by category
   *
   * @param category - Category to filter by
   * @returns Plugins in the category
   */
  async getPluginsByCategory(
    category: RegistryPlugin["category"],
  ): Promise<RegistryPlugin[]> {
    const plugins = await this.fetchAllPlugins();
    return plugins.filter((p) => p.category === category);
  }

  /**
   * Check if updates are available for installed plugins
   *
   * @param installedPlugins - Map of plugin ID to installed version
   * @returns Plugins with available updates
   */
  async checkForUpdates(
    installedPlugins: Map<string, string>,
  ): Promise<Array<{ plugin: RegistryPlugin; installedVersion: string }>> {
    const plugins = await this.fetchAllPlugins();
    const updates: Array<{ plugin: RegistryPlugin; installedVersion: string }> = [];

    for (const plugin of plugins) {
      const installedVersion = installedPlugins.get(plugin.id);
      if (installedVersion && this.isNewerVersion(plugin.version, installedVersion)) {
        updates.push({ plugin, installedVersion });
      }
    }

    return updates;
  }

  /**
   * Simple version comparison
   * Returns true if newVersion > oldVersion
   */
  private isNewerVersion(newVersion: string, oldVersion: string): boolean {
    const parseVersion = (v: string): [number, number, number] => {
      const match = v.replace(/^v/, "").match(/^(\d+)\.(\d+)\.(\d+)/);
      if (!match || !match[1] || !match[2] || !match[3]) return [0, 0, 0];
      return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)];
    };

    const [newMajor, newMinor, newPatch] = parseVersion(newVersion);
    const [oldMajor, oldMinor, oldPatch] = parseVersion(oldVersion);

    if (newMajor > oldMajor) return true;
    if (newMajor < oldMajor) return false;
    if (newMinor > oldMinor) return true;
    if (newMinor < oldMinor) return false;
    return newPatch > oldPatch;
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log("[RegistryFetcher] Cache cleared");
  }

  /**
   * Add a registry URL
   */
  addRegistryUrl(url: string): void {
    if (!this.config.registryUrls.includes(url)) {
      this.config.registryUrls.push(url);
    }
  }

  /**
   * Remove a registry URL
   */
  removeRegistryUrl(url: string): void {
    this.config.registryUrls = this.config.registryUrls.filter((u) => u !== url);
    this.cache.delete(url);
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<RegistryFetcherConfig> {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RegistryFetcherConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Singleton instance of the Registry Fetcher
 */
export const registryFetcher = new RegistryFetcherService();

/**
 * Export the class for creating custom instances
 */
export { RegistryFetcherService };

export default registryFetcher;
