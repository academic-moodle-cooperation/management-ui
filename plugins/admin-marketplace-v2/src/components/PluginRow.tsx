import { BadgeCheck, Check } from "lucide-react";

import { useI18n } from "@oc-mui/i18n";

import { ActionPill } from "./ActionPill";
import { PluginTile } from "./PluginTile";

import type { RegistryPlugin } from "../services/registry";
import type { FC } from "react";

interface PluginRowProps {
  plugin: RegistryPlugin;
  onOpen: (plugin: RegistryPlugin) => void;
  /** Try gesture available for this entry (deployment opt-in + not a theme). */
  canTry?: boolean;
  /** A trial of this plugin is active in this tab. */
  trialActive?: boolean;
  /** The plugin is deployed here and running — nothing to try; the pill links to its Installed row. */
  activeHere?: boolean;
  onTry?: (plugin: RegistryPlugin) => void;
  /** Opens the plugin's row in the Installed tab (the "Installed" pill). */
  onOpenInstalled?: (plugin: RegistryPlugin) => void;
}

/** One-line pitch: explicit tagline, or the description's first sentence. */
export function taglineOf(plugin: Pick<RegistryPlugin, "tagline" | "description">): string {
  if (plugin.tagline) return plugin.tagline;
  const firstSentence = plugin.description.split(/(?<=\.)\s/, 1)[0] ?? plugin.description;
  return firstSentence.length > 120 ? `${firstSentence.slice(0, 117)}…` : firstSentence;
}

/**
 * Catalog list row (V4's community row): tile, name + verified mark, author,
 * version, tagline — plus the Try gesture when the deployment has enabled it.
 * Try is the only action; there is no install (permanence goes through the
 * ops path).
 */
const PluginRow: FC<PluginRowProps> = ({ plugin, onOpen, canTry, trialActive, activeHere, onTry, onOpenInstalled }) => {
  const { t } = useI18n();
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(plugin)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(plugin);
        }
      }}
      className="grid w-full cursor-pointer grid-cols-[auto_1fr_auto] items-start gap-x-3.5 gap-y-1.5 rounded-xl px-3 py-3.5 text-left transition-colors hover:bg-card"
    >
      <PluginTile plugin={plugin} />
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-[14.5px] font-semibold text-foreground">
          <span className="truncate">{plugin.name}</span>
          {plugin.verified && (
            <BadgeCheck aria-label={t("marketplace:hints.verified")} className="size-3.5 shrink-0 text-muted-foreground" />
          )}
        </span>
        <span className="mt-0.5 flex items-center gap-2.5 text-[12.5px] text-muted-foreground">
          <span className="truncate">{plugin.author.name}</span>
          <span className="shrink-0 font-mono text-xs">v{plugin.version}</span>
        </span>
      </span>
      <span className="self-center">
        {trialActive ? (
          <ActionPill tone="ok">
            {t("marketplace:actions.trialActive")} <Check className="size-3.5" strokeWidth={2.6} />
          </ActionPill>
        ) : activeHere ? (
          <ActionPill
            tone="ok"
            title={t("marketplace:hints.installed")}
            onClick={onOpenInstalled ? () => onOpenInstalled(plugin) : undefined}
          >
            {t("marketplace:actions.installed")} <Check className="size-3.5" strokeWidth={2.6} />
          </ActionPill>
        ) : canTry && onTry ? (
          <ActionPill onClick={() => onTry(plugin)}>{t("marketplace:actions.tryIt")}</ActionPill>
        ) : null}
      </span>
      <span className="col-span-2 col-start-2 line-clamp-2 text-[13px] leading-[1.45] text-muted-foreground">
        {taglineOf(plugin)}
      </span>
    </div>
  );
};

export { PluginRow };
