import { Check, Copy, Palette } from "lucide-react";
import { useState } from "react";

import { Button, toast } from "@oc-mui/ui/components";

import { endThemePreview } from "../services/themePreview";

import { PluginTile } from "./PluginTile";

import type { ThemeSource } from "../services/themePreview";
import type { ThemeCandidate } from "../services/themes";
import type { FC } from "react";

const SOURCE_LABEL: Record<ThemeSource, string> = {
  shipped: "Shipped",
  jar: "Deployment",
  local: "Local dev",
  registry: "Registry",
};

interface ThemeRowProps {
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
 * A theme in the catalog. Try applies it immediately in this tab; nothing is
 * installed — the row quietly shows the `app.theme` value that would make it
 * permanent.
 */
const ThemeRow: FC<ThemeRowProps> = ({ theme, isActive, isPreviewing, can, onTry }) => {
  const [copied, setCopied] = useState(false);

  const copyValue = async (): Promise<void> => {
    if (!theme.configValue) return;
    try {
      await navigator.clipboard.writeText(theme.configValue);
      setCopied(true);
      toast(`Copied "${theme.configValue}" — set it as app.theme`);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast(`app.theme value: ${theme.configValue}`);
    }
  };

  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-start gap-x-3.5 gap-y-1 rounded-xl p-3 transition-colors hover:bg-card">
      <PluginTile plugin={{ name: theme.name, category: "theme" }} />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-semibold">{theme.name}</span>
          <span className="rounded-md border border-border px-1.5 py-0.5 text-[10.5px] font-semibold tracking-wide text-muted-foreground uppercase">
            {SOURCE_LABEL[theme.source]}
          </span>
          {isActive && (
            <span className="rounded-md bg-ok/15 px-1.5 py-0.5 text-[10.5px] font-semibold text-ok">
              active for everyone
            </span>
          )}
          {isPreviewing && (
            <span className="flex items-center gap-1 rounded-md bg-warning/15 px-1.5 py-0.5 text-[10.5px] font-semibold text-warning">
              <Palette className="size-3" /> previewing · this tab
            </span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          {theme.author && <span>{theme.author}</span>}
          {theme.configValue ? (
            <span className="flex items-center gap-1">
              <span className="text-[10.5px] tracking-wide uppercase">app.theme</span>
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11.5px] text-foreground">
                {theme.configValue}
              </code>
              <button
                type="button"
                onClick={copyValue}
                title="Copy — set this as app.theme to apply it for everyone"
                aria-label="Copy app.theme value"
                className="rounded p-0.5 text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
              >
                {copied ? <Check className="size-3 text-ok" /> : <Copy className="size-3" />}
              </button>
            </span>
          ) : (
            <span title="A deployment hosts the CSS itself before it can set app.theme.">
              external — not configurable as app.theme
            </span>
          )}
        </div>
        {theme.tagline && (
          <p className="mt-1 text-[13px] leading-snug text-muted-foreground">{theme.tagline}</p>
        )}
        {!can.ok && can.reason && (
          <p className="mt-1 text-xs text-muted-foreground">{can.reason}</p>
        )}
      </div>
      <div className="self-center">
        {isPreviewing ? (
          <Button variant="outline" size="sm" onClick={endThemePreview}>
            End preview
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled={!can.ok || isActive} onClick={() => onTry(theme)} title={isActive ? "Already applied for everyone" : "Preview in this tab"}>
            <Palette className="size-3.5" /> Try
          </Button>
        )}
      </div>
    </div>
  );
};

export { ThemeRow };
