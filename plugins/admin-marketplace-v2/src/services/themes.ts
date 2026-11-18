/**
 * Theme discovery for the marketplace — every theme this deployment could
 * apply, from three sources:
 *
 * - **shipped**: the showcase themes under `public/plugins/themes/`, listed
 *   in `index.json` next to them (`app.theme: "<id>"` applies one)
 * - **jar / local**: org themes next to deployed plugins
 *   (`/static/plugins/<ns>/<ns>.css`, dev: `/local-plugins/<id>/themes/<id>.css`),
 *   discovered by probing the conventional path and kept only when the
 *   stylesheet sets theme tokens (a feature plugin's own CSS lives there too)
 * - **registry**: catalog entries of category `theme` whose `url` is a CSS
 *   file — external, therefore subject to the same Try gates as plugin code
 */

import { validateTryUrl } from "./security";

import type { TryConfig } from "../config";
import type { JarEntry, LocalEntry } from "./inventory";
import type { RegistryPlugin } from "./registry";
import type { ThemeSource } from "./themePreview";

export interface ThemeCandidate {
  id: string;
  name: string;
  tagline?: string;
  author?: string;
  source: ThemeSource;
  /** CSS URL to preview. */
  url: string;
  /**
   * The value for `app.theme` that makes this theme permanent — undefined for
   * registry themes, which a deployment must host itself first.
   */
  configValue?: string;
  /** Registry entry (for the detail dialog), registry source only. */
  registryEntry?: RegistryPlugin;
  /**
   * The theme's own colors, parsed from its CSS (same-origin sources only —
   * registry CSS is never fetched for browsing). Drives the swatch artwork.
   */
  swatch?: ThemeSwatches;
}

/** Token values a theme card is drawn with; missing ones fall back to the live theme. */
export type ThemeSwatch = Partial<
  Record<"background" | "card" | "primary" | "sidebar" | "muted" | "border", string>
>;
export interface ThemeSwatches {
  light: ThemeSwatch;
  dark: ThemeSwatch;
}

const SWATCH_VARS = ["background", "card", "primary", "sidebar", "muted", "border"] as const;

function declarations(block: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of block.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
    out[m[1]!] = m[2]!.trim();
  }
  return out;
}

/** One level of `var(--x)` indirection, within the same declaration set. */
function resolveVar(value: string, vars: Record<string, string>): string {
  const m = /^var\(--([a-z0-9-]+)\)$/i.exec(value);
  if (!m) return value;
  const target = vars[m[1]!];
  return target && !/^var\(/.test(target) ? target : value;
}

/**
 * Pull the swatch tokens out of a theme file: `:root` is the light set,
 * `.dark` overlays it. Pure string work — the CSS is never applied.
 */
export function parseThemeSwatches(css: string): ThemeSwatches {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const light: Record<string, string> = {};
  const dark: Record<string, string> = {};
  for (const m of clean.matchAll(/(?:^|[}\s,])(:root|\.dark)\s*\{([^}]*)\}/g)) {
    Object.assign(m[1] === ".dark" ? dark : light, declarations(m[2]!));
  }
  const pick = (vars: Record<string, string>): ThemeSwatch => {
    const out: ThemeSwatch = {};
    for (const key of SWATCH_VARS) {
      const value = vars[key];
      if (value !== undefined) out[key] = resolveVar(value, vars);
    }
    return out;
  };
  return { light: pick(light), dark: pick({ ...light, ...dark }) };
}

/** Parse a same-origin theme's swatch; the CSS comes from the shared per-URL cache. */
export async function fetchThemeSwatches(url: string): Promise<ThemeSwatches | null> {
  const css = await fetchCss(url);
  return css === null ? null : parseThemeSwatches(css);
}

export interface ShippedThemeEntry {
  id: string;
  name: string;
  tagline?: string;
  author?: string;
}

export function appBase(): string {
  return (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
}

/** Shipped showcase themes from `public/plugins/themes/index.json`. */
export async function fetchShippedThemes(): Promise<ShippedThemeEntry[]> {
  try {
    const res = await fetch(`${appBase()}/plugins/themes/index.json`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { themes?: ShippedThemeEntry[] };
    return (data.themes ?? []).filter((t) => t.id && t.name);
  } catch {
    return [];
  }
}

const cssCache = new Map<string, Promise<string | null>>();

/**
 * Fetch a stylesheet's text once per URL — `null` when the URL doesn't
 * serve CSS (the SPA fallback answers 200 with HTML). Shared by org-theme
 * discovery and the swatch parser so a theme is downloaded once, not per
 * consumer.
 */
export function fetchCss(url: string): Promise<string | null> {
  let pending = cssCache.get(url);
  if (!pending) {
    pending = (async () => {
      try {
        const res = await fetch(url, { method: "GET" });
        if (!res.ok || !(res.headers.get("content-type") ?? "").includes("text/css")) return null;
        return await res.text();
      } catch {
        return null;
      }
    })();
    cssCache.set(url, pending);
  }
  return pending;
}

/**
 * True when a stylesheet is a theme: it sets at least one swatch token in
 * `:root` or `.dark`. A feature plugin's own stylesheet sits at the same
 * conventional path as an org theme, but its Tailwind build only emits
 * `:root, :host { --color-*: …; }` — none of the host's tokens.
 */
export function isThemeCss(css: string): boolean {
  const { light, dark } = parseThemeSwatches(css);
  return Object.keys(light).length > 0 || Object.keys(dark).length > 0;
}

/** Conventional theme CSS paths for deployed / local plugins. */
export function orgThemeUrl(entry: { namespace: string; source: "jar" | "local" }): string {
  const base = appBase();
  return entry.source === "jar"
    ? `${base}/static/plugins/${entry.namespace}/${entry.namespace}.css`
    : `${base}/local-plugins/${entry.namespace}/themes/${entry.namespace}.css`;
}

/** Pure assembly — no network. `orgThemes` is what probing confirmed. */
export function collectThemes(input: {
  shipped: ShippedThemeEntry[];
  orgThemes: Array<{ namespace: string; name?: string; source: "jar" | "local"; url: string }>;
  catalog: RegistryPlugin[];
}): ThemeCandidate[] {
  const out: ThemeCandidate[] = [];
  for (const t of input.shipped) {
    out.push({
      id: `shipped:${t.id}`,
      name: t.name,
      ...(t.tagline !== undefined && { tagline: t.tagline }),
      ...(t.author !== undefined && { author: t.author }),
      source: "shipped",
      url: `${appBase()}/plugins/themes/${t.id}.css`,
      configValue: t.id,
    });
  }
  for (const o of input.orgThemes) {
    out.push({
      id: `${o.source}:${o.namespace}`,
      name: o.name ?? o.namespace,
      source: o.source,
      url: o.url,
      configValue: o.namespace,
    });
  }
  for (const p of input.catalog) {
    if (p.category !== "theme") continue;
    out.push({
      id: `registry:${p.id}`,
      name: p.name,
      ...(p.tagline !== undefined && { tagline: p.tagline }),
      author: p.author.name,
      source: "registry",
      url: p.url,
      registryEntry: p,
    });
  }
  return out;
}

/**
 * Org themes next to JAR / local plugins, confirmed by probing: the
 * conventional path must serve CSS, and that CSS must be a theme.
 */
export async function discoverOrgThemes(
  jars: JarEntry[],
  locals: LocalEntry[],
): Promise<Array<{ namespace: string; name?: string; source: "jar" | "local"; url: string }>> {
  // One probe per namespace: a multi-module JAR lists one entry per module.
  const seen = new Set<string>();
  const candidates = [
    ...jars.map((j) => ({ namespace: j.namespace ?? j.name, name: j.name, source: "jar" as const })),
    ...locals.map((l) => ({ namespace: l.id, name: l.name, source: "local" as const })),
  ].filter((c) => {
    const key = `${c.source}:${c.namespace}`;
    if (!c.namespace || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const checks = await Promise.all(
    candidates.map(async (c) => {
      const url = orgThemeUrl(c);
      const css = await fetchCss(url);
      return css !== null && isThemeCss(css) ? { ...c, url } : null;
    }),
  );
  return checks.filter((c): c is NonNullable<typeof c> => c !== null);
}

/**
 * Whether a theme may be previewed. Same-origin themes (shipped, jar, local)
 * are trusted as deployed; registry CSS is external and goes through the Try
 * gates — CSS can pull remote fonts/images, which leaks viewer IPs.
 */
export function canPreviewTheme(
  theme: Pick<ThemeCandidate, "source" | "url">,
  cfg: TryConfig,
): { ok: boolean; reason?: string } {
  if (theme.source !== "registry") return { ok: true };
  if (!cfg.enabled) {
    return { ok: false, reason: "Previewing registry themes requires try.enabled in the deployment config." };
  }
  const v = validateTryUrl(theme.url, cfg);
  return v.valid ? { ok: true } : { ok: false, ...(v.error && { reason: v.error }) };
}
