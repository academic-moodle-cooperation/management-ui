import { glyphFor, tileGradient } from "../lib/palette";

import type { RegistryPlugin } from "../services/registry";
import type { FC } from "react";

interface PluginTileProps {
  plugin: Pick<RegistryPlugin, "name" | "accentColor" | "category">;
  /** Edge length in px (default 44). */
  size?: number;
}

/**
 * The plugin's visual identity in lists and dialogs: its initial on the
 * plugin's accent gradient. Registries don't ship image assets (yet), so the
 * tile is generated — one consistent look instead of a wall of mismatched
 * icons.
 */
const PluginTile: FC<PluginTileProps> = ({ plugin, size = 44 }) => {
  return (
    <div
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-xl font-heading font-semibold text-primary-foreground shadow-sm ring-1 ring-inset ring-border/40"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.44,
        background: tileGradient(plugin),
      }}
    >
      {glyphFor(plugin)}
    </div>
  );
};

export { PluginTile };
