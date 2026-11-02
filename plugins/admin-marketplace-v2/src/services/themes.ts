/**
 * Theme discovery for the marketplace — every theme this deployment could
 * apply, from three sources:
 *
 * - **shipped**: the showcase themes under `public/plugins/themes/`, listed
 *   in `index.json` next to them (`app.theme: "<id>"` applies one)
 * - **jar / local**: org themes next to deployed plugins
 *   (`/static/plugins/<ns>/<ns>.css`, dev: `/local-plugins/<id>/themes/<id>.css`),
 *   discovered by probing the conventional path
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

/** True when `url` serves CSS (the SPA fallback answers 200 with HTML). */
export async function probeCss(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "GET" });
    return res.ok && (res.headers.get("content-type") ?? "").includes("text/css");
  } catch {
    return false;
  }
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

/** Org themes next to JAR / local plugins, confirmed by probing. */
export async function discoverOrgThemes(
  jars: JarEntry[],
  locals: LocalEntry[],
): Promise<Array<{ namespace: string; name?: string; source: "jar" | "local"; url: string }>> {
  const candidates = [
    ...jars.map((j) => ({ namespace: j.namespace ?? j.name, name: j.name, source: "jar" as const })),
    ...locals.map((l) => ({ namespace: l.id, name: l.name, source: "local" as const })),
  ].filter((c) => c.namespace);
  const checks = await Promise.all(
    candidates.map(async (c) => {
      const url = orgThemeUrl(c);
      return (await probeCss(url)) ? { ...c, url } : null;
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
