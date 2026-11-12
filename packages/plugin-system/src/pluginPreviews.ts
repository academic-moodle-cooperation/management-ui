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
 * **Pauses** are the mirror image: a plugin that *is* enabled on the
 * deployment, stepped aside in this tab only — so a trial of a plugin that
 * fills the same slots (footer, landing page, sidebar, …) can be seen without
 * the two fighting. The host skips paused namespaces at every load gate; the
 * marketplace writes the list together with the trial that needs it and
 * clears it when that trial ends.
 *
 * This module is the single contract both sides share; neither the shell nor
 * a plugin should touch the storage keys directly.
 */

export const PLUGIN_PREVIEWS_STORAGE_KEY = "mui.plugin-previews";
export const PLUGIN_PAUSES_STORAGE_KEY = "mui.plugin-pauses";

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

function readList(key: string): string[] {
  const s = storage();
  if (!s) return [];
  try {
    const raw = s.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<PluginPreviews>;
    if (parsed.version !== 1 || !Array.isArray(parsed.namespaces)) return [];
    return parsed.namespaces.filter((n): n is string => typeof n === "string" && n.length > 0);
  } catch {
    return [];
  }
}

function writeList(key: string, namespaces: string[]): void {
  const s = storage();
  if (!s) return;
  const unique = [...new Set(namespaces.filter((n) => n.length > 0))];
  if (unique.length === 0) {
    s.removeItem(key);
    return;
  }
  const value: PluginPreviews = { version: 1, namespaces: unique };
  s.setItem(key, JSON.stringify(value));
}

/** Namespaces previewed in this tab. Empty when unset, malformed, or unavailable. */
export function readPluginPreviews(): string[] {
  return readList(PLUGIN_PREVIEWS_STORAGE_KEY);
}

/** Replace the preview list for this tab (deduplicated, order kept). */
export function writePluginPreviews(namespaces: string[]): void {
  writeList(PLUGIN_PREVIEWS_STORAGE_KEY, namespaces);
}

export function addPluginPreview(namespace: string): void {
  writePluginPreviews([...readPluginPreviews(), namespace]);
}

export function removePluginPreview(namespace: string): void {
  writePluginPreviews(readPluginPreviews().filter((n) => n !== namespace));
}

/** Namespaces paused in this tab (enabled on the deployment, skipped here). */
export function readPluginPauses(): string[] {
  return readList(PLUGIN_PAUSES_STORAGE_KEY);
}

/** Replace the pause list for this tab (deduplicated, order kept). */
export function writePluginPauses(namespaces: string[]): void {
  writeList(PLUGIN_PAUSES_STORAGE_KEY, namespaces);
}

export function addPluginPause(namespace: string): void {
  writePluginPauses([...readPluginPauses(), namespace]);
}

export function removePluginPause(namespace: string): void {
  writePluginPauses(readPluginPauses().filter((n) => n !== namespace));
}
