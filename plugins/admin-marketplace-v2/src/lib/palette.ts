import type { RegistryCategory, RegistryPlugin } from "../services/registry";

/**
 * Presentational color helpers for catalog artwork.
 *
 * A plugin may bring its own `accentColor` (any CSS color) from the registry;
 * otherwise a stable, theme-aware fallback is derived from its category via
 * the chart tokens — so tiles stay on-palette under every org theme.
 */

const CATEGORY_TOKEN: Record<RegistryCategory, string> = {
  feature: "var(--chart-1)",
  integration: "var(--chart-2)",
  utility: "var(--chart-3)",
  experimental: "var(--chart-4)",
  theme: "var(--chart-5)",
};

export function accentFor(plugin: Pick<RegistryPlugin, "accentColor" | "category">): string {
  return plugin.accentColor ?? CATEGORY_TOKEN[plugin.category] ?? "var(--chart-1)";
}

/**
 * Tile/artwork gradient: the accent, falling into a darkened shade of itself.
 * `color-mix` keeps this a pure function of the accent — no hardcoded second
 * color per plugin.
 */
export function tileGradient(plugin: Pick<RegistryPlugin, "accentColor" | "category">): string {
  const accent = accentFor(plugin);
  return `linear-gradient(135deg, ${accent}, color-mix(in oklab, ${accent} 65%, black))`;
}

/** Single display glyph for a plugin without artwork: its initial. */
export function glyphFor(plugin: Pick<RegistryPlugin, "name">): string {
  return (plugin.name.trim().charAt(0) || "?").toUpperCase();
}
