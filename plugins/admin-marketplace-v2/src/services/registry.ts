/**
 * Registry catalog service (v2, discovery-only).
 *
 * Fetches `registry.json` documents from configured URLs and merges them into
 * one catalog. This service only *reads* metadata — it never fetches or
 * executes plugin code. (Loading/executing is v1's RemoteLoader territory and
 * arrives in v2 together with the Try gesture, behind its own opt-in.)
 *
 * Compared to v1's registry-fetcher this drops the mutable singleton config,
 * URL add/remove, and update-checking; callers pass the URLs per call and the
 * module keeps a simple TTL cache per URL.
 *
 * Registry format (registry.json): see the type definitions below. `tagline`
 * and `accentColor` are v2 additions — optional showcase metadata with
 * fallbacks, so v1 registries stay fully compatible.
 */

import { logger } from "@oc-mui/utils";

const log = logger.child({ component: "marketplace-v2/registry" });

export interface PluginAuthor {
  name: string;
  email?: string;
  url?: string;
}

export type RegistryCategory =
  | "feature"
  | "theme"
  | "integration"
  | "utility"
  | "experimental";

export interface RegistryPlugin {
  /** Unique plugin identifier */
  id: string;
  /** Display name */
  name: string;
  /**
   * The plugin's `namespace` from its manifest — the value `app.enabledPlugins`
   * takes. Optional: when absent the id is assumed to be the namespace.
   */
  namespace?: string;
  /**
   * Long-form description (paragraphs, shown on the detail view).
   */
  description: string;
  /**
   * One-line pitch for cards and list rows (v2 addition). Optional: when
   * absent, the UI falls back to a truncated `description`.
   */
  tagline?: string;
  /**
   * Brand color for the plugin's tile/artwork (v2 addition), any valid CSS
   * color. Optional: when absent, the UI derives a stable color from the
   * category. Purely presentational — never used for logic.
   */
  accentColor?: string;
  /** Plugin version (semver) */
  version: string;
  /** Plugin author */
  author: PluginAuthor;
  /** URL to the plugin bundle (.mjs file) — unused by discovery, kept for parity */
  url: string;
  /** Plugin category */
  category: RegistryCategory;
  /**
   * Lucide icon name for the tile (`BarChart3` or `bar-chart-3`). Optional:
   * without it the tile shows a per-category default, then the initial.
   */
  icon?: string;
  /**
   * Screenshots for cards and the detail view — same shape as the manifest's
   * `screenshots`. Only loaded from this origin or an allowlisted host
   * (`try.allowedDomains`), otherwise the generated artwork stays.
   */
  screenshots?: Array<{ url: string; caption?: string }>;
  /** Repository URL */
  repositoryUrl?: string;
  /** Homepage URL */
  homepageUrl?: string;
  /** License */
  license?: string;
  /** Tags for search */
  tags?: string[];
  /** Version constraints for workspace packages */
  workspaceDependencies?: Record<string, string>;
  /** Base URL the plugin's locale files are served from */
  localesUrl?: string;
  /** Translation namespaces served under `localesUrl` */
  i18nNamespaces?: string[];
  /** Minimum plugin runtime API version this plugin requires */
  apiVersion?: string;
  /**
   * SRI-style hash (`sha256-|sha384-|sha512-<base64>`) of the exact bundle
   * bytes (v2 addition). When present, the Try gesture refuses to execute a
   * bundle that doesn't match — the registry pins which code runs, not the
   * host serving it. Deployments can require pinning via
   * `try.requireIntegrity`.
   */
  integrity?: string;
  /** Whether this plugin is verified by maintainers */
  verified?: boolean;
  /** Download count — present in the schema, currently not displayed */
  downloads?: number;
  /** Rating — present in the schema, currently not displayed */
  rating?: number;
  /** Last updated timestamp (ISO date) */
  lastUpdated?: string;
}

export interface PluginRegistry {
  version: string;
  plugins: RegistryPlugin[];
  name?: string;
  description?: string;
  lastUpdated?: string;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const FETCH_TIMEOUT_MS = 10_000;

interface CacheEntry {
  registry: PluginRegistry;
  fetchedAt: number;
}

const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<PluginRegistry | null>>();

async function fetchRegistry(url: string): Promise<PluginRegistry | null> {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.registry;
  }

  const existing = inFlight.get(url);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const registry = (await response.json()) as PluginRegistry;
      if (!registry.plugins || !Array.isArray(registry.plugins)) {
        throw new Error("Invalid registry format: missing plugins array");
      }
      cache.set(url, { registry, fetchedAt: Date.now() });
      log.debug(`fetched ${registry.plugins.length} plugins from ${url}`);
      return registry;
    } catch (error) {
      log.warn(
        `failed to fetch registry from ${url}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    } finally {
      inFlight.delete(url);
    }
  })();

  inFlight.set(url, promise);
  return promise;
}

/**
 * Resolve the URLs to actually contact. In dev, the local
 * `public/registry.json` is prepended so the catalog works without any
 * external registry (mirrors v1 behavior).
 */
function resolveUrls(configuredUrls: string[]): string[] {
  const urls = [...configuredUrls];
  if (import.meta.env.DEV && typeof window !== "undefined") {
    const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "") || "";
    const localUrl = new URL(`${base}/registry.json`, window.location.origin).href;
    if (!urls.includes(localUrl)) urls.unshift(localUrl);
  }
  return urls;
}

/**
 * Fetch all configured registries and merge them into one catalog.
 * Later registries win on id collisions (a deployment's own registry can
 * override a community entry).
 */
export async function fetchCatalog(configuredUrls: string[]): Promise<RegistryPlugin[]> {
  const urls = resolveUrls(configuredUrls);
  const results = await Promise.all(urls.map((url) => fetchRegistry(url)));

  const merged = new Map<string, RegistryPlugin>();
  for (const registry of results) {
    if (!registry) continue;
    for (const plugin of registry.plugins) {
      merged.set(plugin.id, plugin);
    }
  }
  return Array.from(merged.values());
}

/** Drop all cached registries (pull-to-refresh). */
export function clearCatalogCache(): void {
  cache.clear();
}
