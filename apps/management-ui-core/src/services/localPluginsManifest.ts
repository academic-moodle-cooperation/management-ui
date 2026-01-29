/**
 * Local plugins manifest (dev only).
 *
 * In development, the Vite dev server serves /local-plugins/manifest.json
 * from .local-plugins/ on disk. This module fetches that manifest so the
 * core can load .local-plugins without depending on the Admin Marketplace.
 */

export interface LocalPluginsManifestEntry {
  name: string;
  id: string;
  /** Path to plugin .mjs (e.g. /management-ui/local-plugins/my-org-plugin/my-plugin.mjs) */
  url: string;
  /** Folder name under .local-plugins/; used to filter by config.app.pluginNamespace */
  namespace?: string;
  /** Type from filename (plugin-<namespace>-<type>.mjs); used to filter by config types for that namespace */
  type?: string;
}

interface LocalPluginsManifestResponse {
  plugins: LocalPluginsManifestEntry[];
}

/**
 * Fetch the local plugins manifest from the dev server.
 * Returns empty array if not in dev or manifest is unavailable.
 */
export async function loadLocalPluginsManifest(): Promise<LocalPluginsManifestEntry[]> {
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
      (p): p is LocalPluginsManifestEntry =>
        typeof p === "object" && p !== null && typeof p.url === "string",
    );
  } catch {
    return [];
  }
}

/** Build full URL for a manifest entry. */
export function getLocalPluginFullUrl(entry: LocalPluginsManifestEntry): string {
  if (typeof window === "undefined") return entry.url;
  return new URL(entry.url, window.location.origin).href;
}
