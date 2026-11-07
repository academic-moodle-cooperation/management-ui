import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { useI18n } from "@oc-mui/i18n";
import { toast } from "@oc-mui/ui/components";

import { useIsDark } from "../hooks/useIsDark";
import { gradientFrom } from "../lib/palette";
import { endThemePreview } from "../services/themePreview";

import { ActionPill } from "./ActionPill";
import { Artwork, variantFor, type ArtworkPalette } from "./Artwork";

import type { ThemeCandidate } from "../services/themes";
import type { FC } from "react";

interface ThemeCardProps {
  theme: ThemeCandidate;
  /** This theme is the deployment's `app.theme`. */
  isActive: boolean;
  /** This theme is previewed in this tab right now. */
  isPreviewing: boolean;
  /** Preview allowed? `reason` explains a refusal (registry gates). */
  can: { ok: boolean; reason?: string };
  onTry: (theme: ThemeCandidate) => void;
}

/**
 * The card's palette is the theme's own colors (parsed from its CSS); tokens
 * it doesn't override fall back to the live theme — which is exactly what
 * applying it would do. Registry themes aren't fetched for browsing, so they
 * draw on their registry accent instead.
 */
function paletteFor(theme: ThemeCandidate, isDark: boolean): ArtworkPalette {
  const sw = theme.swatch ? (isDark ? theme.swatch.dark : theme.swatch.light) : {};
  const v = (key: keyof typeof sw): string => sw[key] ?? `var(--${key})`;
  const accent = theme.swatch ? v("primary") : (theme.registryEntry?.accentColor ?? "var(--chart-5)");
  return {
    backdrop: theme.swatch ? `linear-gradient(135deg, ${v("sidebar")}, ${accent})` : gradientFrom(accent),
    window: theme.swatch ? v("card") : "var(--card)",
    sidebar: theme.swatch ? v("sidebar") : "var(--sidebar)",
    line: theme.swatch ? v("muted") : "var(--muted)",
    accent,
  };
}

/**
 * A theme in the catalog, as a media card: the swatch artwork shows what the
 * theme would do to the interface. Try applies it immediately in this tab;
 * nothing is installed — the card quietly shows the `app.theme` value that
 * would make it permanent.
 */
const ThemeCard: FC<ThemeCardProps> = ({ theme, isActive, isPreviewing, can, onTry }) => {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const isDark = useIsDark();
  const palette = paletteFor(theme, isDark);

  const copyValue = async (): Promise<void> => {
    if (!theme.configValue) return;
    try {
      await navigator.clipboard.writeText(theme.configValue);
      setCopied(true);
      toast(t("marketplace:toasts.themeCopied", { value: theme.configValue }));
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast(t("marketplace:toasts.themeValue", { value: theme.configValue }));
    }
  };

  return (
    <div className="group">
      <Artwork
        palette={palette}
        badge={{ name: theme.name, category: "theme", icon: "Palette", accentColor: palette.accent }}
        variant={variantFor(theme.id)}
      />
      <div className="flex items-start gap-2.5 px-0.5 pt-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[13.5px] font-semibold">
            <span
              className="truncate"
              title={theme.author ? t("marketplace:hints.by", { name: theme.author }) : undefined}
            >
              {theme.name}
            </span>
            <span className="shrink-0 rounded-sm border border-border px-1 py-px text-[9.5px] font-semibold tracking-wide text-muted-foreground uppercase">
              {t(`marketplace:themeCard.source.${theme.source}`)}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs whitespace-nowrap text-muted-foreground">
            {theme.configValue ? (
              <>
                <code
                  className="rounded bg-muted px-1 py-px font-mono text-[11px] text-foreground"
                  title={t("marketplace:themeCard.configValueHint")}
                >
                  {theme.configValue}
                </code>
                <button
                  type="button"
                  onClick={copyValue}
                  title={t("marketplace:themeCard.copyHint")}
                  aria-label={t("marketplace:themeCard.copyAria")}
                  className="rounded p-0.5 text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
                >
                  {copied ? <Check className="size-3 text-ok" /> : <Copy className="size-3" />}
                </button>
              </>
            ) : (
              <>
                {theme.author && <span className="truncate">{theme.author}</span>}
                <span title={t("marketplace:themeCard.externalHint")}>{t("marketplace:themeCard.external")}</span>
              </>
            )}
          </div>
        </div>
        <div className="ml-auto shrink-0">
          {isActive ? (
            <ActionPill tone="ok" size="sm" title={t("marketplace:hints.appliedForEveryone")}>
              {t("marketplace:actions.active")} <Check className="size-3.5" strokeWidth={2.6} />
            </ActionPill>
          ) : isPreviewing ? (
            <ActionPill
              tone="warning"
              size="sm"
              onClick={endThemePreview}
              title={t("marketplace:hints.previewingClickToEnd")}
            >
              {t("marketplace:actions.endPreview")}
            </ActionPill>
          ) : (
            <ActionPill
              size="sm"
              disabled={!can.ok}
              onClick={() => onTry(theme)}
              title={can.reason ?? t("marketplace:hints.previewInTab")}
            >
              {t("marketplace:actions.tryIt")}
            </ActionPill>
          )}
        </div>
      </div>
    </div>
  );
};

export { ThemeCard };
