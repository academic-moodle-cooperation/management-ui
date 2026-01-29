/**
 * Local Plugins Manifest Loader
 *
 * In development, the Management UI Core Vite server serves a manifest at
 * /local-plugins/manifest.json listing plugins from .local-plugins/.
 * This module fetches that manifest and returns plugin URLs for auto-loading.
 *
 * Only used when import.meta.env.DEV is true. In production, .local-plugins
 * are not used.
 */

export interface LocalPluginManifestEntry {
  name: string;
  id: string;
  /** Path to plugin .mjs (e.g. /management-ui/local-plugins/my-org-plugin/my-plugin.mjs) */
  url: string;
}

interface LocalPluginsManifestResponse {
  plugins: LocalPluginManifestEntry[];
}

/**
 * Fetch the local plugins manifest from the dev server.
 * Returns empty array if not in dev, or manifest is unavailable.
 */
export async function loadLocalPluginsManifest(): Promise<LocalPluginManifestEntry[]> {
  if (typeof window === "undefined" || !import.meta.env.DEV) {
    return [];
  }

  const base = import.meta.env.BASE_URL ?? "/";
  const manifestPath = `${base.replace(/\/$/, "")}/local-plugins/manifest.json`;
  const fullUrl = new URL(manifestPath, window.location.origin).href;

  try {
    const response = await fetch(fullUrl);
    if (!response.ok) return [];
    const data = (await response.json()) as LocalPluginsManifestResponse;
    if (!data.plugins || !Array.isArray(data.plugins)) return [];
    return data.plugins.filter(
      (p): p is LocalPluginManifestEntry =>
        typeof p === "object" && p !== null && typeof p.url === "string",
    );
  } catch {
    return [];
  }
}

/**
 * Build full URL for a manifest entry (path is relative to origin).
 */
export function getLocalPluginFullUrl(entry: LocalPluginManifestEntry): string {
  if (typeof window === "undefined") return entry.url;
  return new URL(entry.url, window.location.origin).href;
}
