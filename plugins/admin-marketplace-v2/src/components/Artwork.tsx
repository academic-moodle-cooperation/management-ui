import { PluginTile } from "./PluginTile";

import type { FC } from "react";

/** The colors a generated thumbnail is drawn with. */
export interface ArtworkPalette {
  /** Behind the mock window: a gradient or color. */
  backdrop: string;
  window: string;
  sidebar: string;
  line: string;
  accent: string;
}

interface ArtworkProps {
  palette: ArtworkPalette;
  /** Drawn as a badge in the corner (the entry's tile). */
  badge?: Parameters<typeof PluginTile>[0]["plugin"];
  /** A real screenshot replaces the generated window. */
  image?: string | null;
  /** Which mock to draw — picked per entry so a grid isn't six identical cards. */
  variant?: "bars" | "lines";
  /** `card`: 16/10.5 with border + hover lift. `hero`: 16/7, edge to edge (dialog top). */
  shape?: "card" | "hero";
}

/** Stable per-name variant so the same plugin always draws the same mock. */
export function variantFor(name: string): "bars" | "lines" {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(h) % 2 === 0 ? "bars" : "lines";
}

const SHAPE: Record<NonNullable<ArtworkProps["shape"]>, string> = {
  card: "aspect-[16/10.5] rounded-xl border border-border transition-[transform,border-color] duration-200 group-hover:-translate-y-0.5 group-hover:border-input",
  hero: "aspect-[16/7]",
};

/**
 * V4's thumbnail: a little UI window on the entry's gradient — sidebar strip,
 * a chart or text lines — drawn from the palette, so it is honest about being
 * generated. A screenshot, when the entry ships one the deployment may load,
 * takes its place.
 */
const Artwork: FC<ArtworkProps> = ({ palette, badge, image, variant = "bars", shape = "card" }) => (
  <div className={`relative overflow-hidden ${SHAPE[shape]}`} style={{ background: palette.backdrop }}>
    {image ? (
      <img src={image} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
    ) : (
      <div
        aria-hidden
        className="absolute inset-[14%_10%_-6%_10%] flex overflow-hidden rounded-t-[10px]"
        style={{ background: palette.window, boxShadow: "var(--shadow-lg)" }}
      >
        <div className="flex w-[26%] flex-col gap-[5px] px-[7px] py-2" style={{ background: palette.sidebar }}>
          <i className="block h-1.5 w-3/5 rounded-full" style={{ background: palette.accent, opacity: 0.55 }} />
          <i className="block h-1.5 rounded-full" style={{ background: palette.line }} />
          <i className="block h-1.5 rounded-full" style={{ background: palette.line }} />
          <i className="block h-1.5 rounded-full" style={{ background: palette.line }} />
        </div>
        <div className="flex flex-1 flex-col gap-1.5 px-[9px] py-2">
          {variant === "bars" ? (
            <div className="flex flex-1 items-end gap-1 pt-1">
              {[35, 60, 45, 80, 55, 70].map((h, i) => (
                <i key={i} className="block flex-1 rounded-t-[3px]" style={{ height: `${h}%`, background: palette.accent }} />
              ))}
            </div>
          ) : (
            <>
              <i className="block h-[7px] w-[45%] rounded-full" style={{ background: palette.accent }} />
              <i className="block h-[7px] w-3/5 rounded-full" style={{ background: palette.line }} />
              <i className="block h-[7px] w-2/5 rounded-full" style={{ background: palette.line }} />
              <i className="block h-[7px] w-[70%] rounded-full" style={{ background: palette.line }} />
            </>
          )}
        </div>
      </div>
    )}
    {badge && (
      <div className="absolute top-2.5 left-2.5 rounded-[25%] shadow-md">
        <PluginTile plugin={badge} size={30} />
      </div>
    )}
  </div>
);

/**
 * Plugin artwork palette (V4): a paper window on the accent gradient, its
 * lines a faint tint of the accent. `paper` is whichever of the two primary
 * tokens is lighter under the live theme (see `usePaperToken`), so the window
 * reads as a bright "screenshot" in dark mode too, instead of a dark hole.
 */
export function pluginPalette(
  accent: string,
  backdrop: string,
  paper: "--primary-foreground" | "--primary" = "--primary-foreground",
): ArtworkPalette {
  const base = `var(${paper})`;
  return {
    backdrop,
    window: `color-mix(in oklab, ${base} 96%, ${accent})`,
    sidebar: `color-mix(in oklab, ${base} 90%, ${accent})`,
    line: `color-mix(in oklab, ${base} 82%, ${accent})`,
    accent,
  };
}

export { Artwork };
