import { iconFor } from "../lib/icons";
import { glyphFor, TILE_INSET_SHADOW, tileGradient } from "../lib/palette";

import type { FC } from "react";

interface PluginTileProps {
  plugin: {
    name: string;
    accentColor?: string | undefined;
    category?: string | undefined;
    icon?: string | undefined;
  };
  /** Edge length in px (default 44). */
  size?: number;
  className?: string;
}

/**
 * The plugin's visual identity in lists, cards and dialogs: a Lucide glyph
 * (see `lib/icons.ts` for how it is chosen) on the plugin's accent gradient,
 * the initial when no icon resolves. Generated, not shipped — one consistent
 * look instead of a wall of mismatched images.
 */
const PluginTile: FC<PluginTileProps> = ({ plugin, size = 44, className }) => {
  const Icon = iconFor(plugin);
  return (
    <div
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-[25%] font-heading font-semibold text-primary-foreground ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.44,
        background: tileGradient(plugin),
        boxShadow: TILE_INSET_SHADOW,
      }}
    >
      {Icon ? (
        <Icon style={{ width: size * 0.5, height: size * 0.5 }} strokeWidth={2.2} absoluteStrokeWidth={false} />
      ) : (
        glyphFor(plugin)
      )}
    </div>
  );
};

export { PluginTile };
