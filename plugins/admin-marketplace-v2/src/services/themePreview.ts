/**
 * Tab-scoped theme preview.
 *
 * A theme is a CSS file that overrides token values, so previewing one needs
 * no boot path: inject a `<link>`, done — and remove it to end. The marker in
 * `sessionStorage` only makes the preview survive a refresh of this tab; it
 * dies with the tab. There is no "install": a theme becomes permanent through
 * `app.theme` in the deployment config.
 *
 * Exactly one theme can be previewed at a time (themes are exclusive).
 */

const MARKER_KEY = "mui.marketplace-v2.theme-preview";
const LINK_ID = "mui-marketplace-v2-theme-preview";

export type ThemeSource = "shipped" | "jar" | "local" | "registry";

export interface ThemePreview {
  id: string;
  name: string;
  url: string;
  source: ThemeSource;
  startedAt: string;
}

const listeners = new Set<() => void>();
let observer: MutationObserver | null = null;

function notify(): void {
  for (const l of listeners) l();
}

/** Subscribe to preview changes (for useSyncExternalStore). */
export function subscribeThemePreview(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readMarker(): ThemePreview | null {
  try {
    const raw = sessionStorage.getItem(MARKER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ThemePreview>;
    return parsed.id && parsed.url && parsed.name && parsed.source
      ? (parsed as ThemePreview)
      : null;
  } catch {
    return null;
  }
}

// useSyncExternalStore compares snapshots by identity, so the current preview
// is cached and only replaced when it actually changes.
let snapshot: ThemePreview | null | undefined;

export function getThemePreview(): ThemePreview | null {
  if (snapshot === undefined) snapshot = readMarker();
  return snapshot;
}

function setSnapshot(next: ThemePreview | null): void {
  snapshot = next;
  notify();
}

/**
 * The shell may inject the configured theme's `<link data-theme>` after us
 * (it probes locations asynchronously at boot). Keep our link last so the
 * preview wins the cascade — same specificity, later wins.
 */
function keepLinkLast(): void {
  if (observer || typeof MutationObserver === "undefined") return;
  observer = new MutationObserver(() => {
    const link = document.getElementById(LINK_ID);
    if (!link) return;
    const sheets = document.head.querySelectorAll('link[rel="stylesheet"], style');
    if (sheets[sheets.length - 1] !== link) document.head.appendChild(link);
  });
  observer.observe(document.head, { childList: true });
}

function inject(url: string): void {
  document.getElementById(LINK_ID)?.remove();
  const link = document.createElement("link");
  link.id = LINK_ID;
  link.rel = "stylesheet";
  link.href = url;
  link.setAttribute("data-theme-preview", "");
  document.head.appendChild(link);
  keepLinkLast();
}

/** Apply a theme in this tab immediately and remember it for refreshes. */
export function startThemePreview(theme: Omit<ThemePreview, "startedAt">): void {
  const preview: ThemePreview = { ...theme, startedAt: new Date().toISOString() };
  sessionStorage.setItem(MARKER_KEY, JSON.stringify(preview));
  inject(preview.url);
  setSnapshot(preview);
}

/** Remove the preview immediately — no reload needed. */
export function endThemePreview(): void {
  sessionStorage.removeItem(MARKER_KEY);
  document.getElementById(LINK_ID)?.remove();
  observer?.disconnect();
  observer = null;
  setSnapshot(null);
}

/**
 * Boot: re-apply a preview recorded in this tab. The caller decides whether
 * the source is still allowed (registry URLs go through the Try gates).
 */
export function restoreThemePreview(isAllowed: (preview: ThemePreview) => boolean): void {
  const preview = getThemePreview();
  if (!preview) return;
  if (!isAllowed(preview)) {
    endThemePreview();
    return;
  }
  inject(preview.url);
}
