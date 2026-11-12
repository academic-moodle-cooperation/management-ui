import * as Lucide from "lucide-react";

import type { RegistryCategory } from "../services/registry";

/**
 * Icon resolution for plugin artwork — the V4 tile look: a white Lucide glyph
 * on the plugin's accent gradient.
 *
 * Three-step scheme (first hit wins):
 *   1. `icon` from the registry entry / manifest — a Lucide name, PascalCase
 *      (`BarChart3`) or kebab-case (`bar-chart-3`); the author picks, review checks.
 *   2. A default per category.
 *   3. Nothing — the tile falls back to the name's initial.
 *
 * Looking an icon up by name is free: the host already ships the whole of
 * `lucide-react` as a shared module for remote plugins.
 */

const CATEGORY_ICON: Record<RegistryCategory | "config", string> = {
  feature: "Sparkles",
  integration: "Plug",
  utility: "Wrench",
  experimental: "FlaskConical",
  theme: "Palette",
  config: "Settings2",
};

/** Names that are exported from lucide-react but are not icons. */
const NOT_ICONS = new Set(["Icon", "createLucideIcon"]);

function toPascalCase(name: string): string {
  return name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

/** Resolve a Lucide icon by name; `null` when unknown (never throws). */
export function resolveIcon(name: string | undefined): Lucide.LucideIcon | null {
  if (!name) return null;
  const key = /^[A-Z]/.test(name) ? name : toPascalCase(name);
  if (!/^[A-Z][A-Za-z0-9]*$/.test(key) || NOT_ICONS.has(key)) return null;
  if (key in Lucide.icons) return Lucide.icons[key as keyof typeof Lucide.icons];
  // Aliases (e.g. `BarChart3` → `ChartColumn`) are named exports but absent from `icons`.
  const candidate = (Lucide as unknown as Record<string, unknown>)[key];
  return candidate && (typeof candidate === "object" || typeof candidate === "function")
    ? (candidate as Lucide.LucideIcon)
    : null;
}

/** The icon to draw for a catalog or inventory entry, per the scheme above. */
export function iconFor(entry: { icon?: string | undefined; category?: string | undefined }): Lucide.LucideIcon | null {
  const explicit = resolveIcon(entry.icon);
  if (explicit) return explicit;
  const byCategory = entry.category ? CATEGORY_ICON[entry.category as keyof typeof CATEGORY_ICON] : undefined;
  return resolveIcon(byCategory);
}
