export interface LocalPluginInfo {
  /** Unique identifier for the plugin (matches registry id where possible) */
  id: string;
  /** Human-readable name */
  name: string;
  /** URL to the plugin .mjs bundle */
  url: string;
  /** Optional raw metadata loaded from plugin-metadata.json */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any;
}

const LOCAL_STORAGE_KEY = "local_plugins";

/**
 * Local Plugin Discovery
 *
 * NOTE:
 * - The browser cannot directly read from `.local-plugins/` on disk.
 * - For development, we use `localStorage` as a lightweight registry:
 *   - Key: `local_plugins`
 *   - Value: JSON array of `{ id, name, url, metadata? }`
 *
 * This keeps the implementation simple while still following the spirit
 * of the plan: a dedicated discovery service for local dev plugins.
 */
export async function discoverLocalPlugins(): Promise<LocalPluginInfo[]> {
  if (typeof window === "undefined") {
    // SSR / non-browser environment – nothing to discover
    return [];
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    const plugins: LocalPluginInfo[] = [];

    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const candidate = item as Partial<LocalPluginInfo>;
      if (!candidate.id || !candidate.name || !candidate.url) continue;
      plugins.push({
        id: String(candidate.id),
        name: String(candidate.name),
        url: String(candidate.url),
        metadata: candidate.metadata,
      });
    }

    return plugins;
  } catch {
    // On any parsing error, return an empty list to avoid breaking the UI
    return [];
  }
}

