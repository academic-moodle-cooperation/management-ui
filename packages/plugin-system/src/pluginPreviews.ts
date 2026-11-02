/**
 * Tab-scoped plugin previews.
 *
 * A preview lets an administrator see a plugin that is *present on the
 * deployment but switched off by configuration* (not in `app.enabledPlugins`,
 * or `config.plugins.<ns>.enabled: false`) — in their own browser tab only,
 * without enabling it for anyone else. The host treats previewed namespaces
 * as enabled at every load gate; the marketplace writes the list.
 *
 * The list lives in **`sessionStorage`**: it survives reloads of the tab (a
 * preview has to go through the boot path to actually work) and dies with
 * the tab. Nothing is persisted across sessions, so a preview can never be
 * mistaken for an installation.
 *
 * This module is the single contract both sides share; neither the shell nor
 * a plugin should touch the storage key directly.
 */

export const PLUGIN_PREVIEWS_STORAGE_KEY = "mui.plugin-previews";

export interface PluginPreviews {
  version: 1;
  /** Plugin namespaces (the unit `app.enabledPlugins` works in). */
  namespaces: string[];
}

function storage(): Storage | undefined {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : undefined;
  } catch {
    return undefined;
  }
}

/** Namespaces previewed in this tab. Empty when unset, malformed, or unavailable. */
export function readPluginPreviews(): string[] {
  const s = storage();
  if (!s) return [];
  try {
    const raw = s.getItem(PLUGIN_PREVIEWS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<PluginPreviews>;
    if (parsed.version !== 1 || !Array.isArray(parsed.namespaces)) return [];
    return parsed.namespaces.filter((n): n is string => typeof n === "string" && n.length > 0);
  } catch {
    return [];
  }
}

/** Replace the preview list for this tab (deduplicated, order kept). */
export function writePluginPreviews(namespaces: string[]): void {
  const s = storage();
  if (!s) return;
  const unique = [...new Set(namespaces.filter((n) => n.length > 0))];
  if (unique.length === 0) {
    s.removeItem(PLUGIN_PREVIEWS_STORAGE_KEY);
    return;
  }
  const value: PluginPreviews = { version: 1, namespaces: unique };
  s.setItem(PLUGIN_PREVIEWS_STORAGE_KEY, JSON.stringify(value));
}

export function addPluginPreview(namespace: string): void {
  writePluginPreviews([...readPluginPreviews(), namespace]);
}

export function removePluginPreview(namespace: string): void {
  writePluginPreviews(readPluginPreviews().filter((n) => n !== namespace));
}
