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

export interface AccentSource {
  accentColor?: string | undefined;
  category?: string | undefined;
}

export function accentFor(plugin: AccentSource): string {
  return (
    plugin.accentColor ??
    (plugin.category ? CATEGORY_TOKEN[plugin.category as RegistryCategory] : undefined) ??
    "var(--chart-1)"
  );
}

/**
 * Tile/artwork gradient — the V4 look: a lighter tint of the accent falling
 * into the accent itself. `color-mix` keeps this a pure function of the
 * accent — no hardcoded second color per plugin.
 */
export function tileGradient(plugin: AccentSource): string {
  return gradientFrom(accentFor(plugin));
}

export function gradientFrom(accent: string): string {
  return `linear-gradient(135deg, color-mix(in oklab, ${accent} 72%, white), ${accent})`;
}

/** The faint inner edge every tile carries (V4: a 1px inset at ~12 % white). */
export const TILE_INSET_SHADOW =
  "inset 0 0 0 1px color-mix(in srgb, var(--primary-foreground) 14%, transparent)";

/** Single display glyph for a plugin without artwork: its initial. */
export function glyphFor(plugin: Pick<RegistryPlugin, "name">): string {
  return (plugin.name.trim().charAt(0) || "?").toUpperCase();
}
