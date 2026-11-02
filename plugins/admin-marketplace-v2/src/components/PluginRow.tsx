import { BadgeCheck, FlaskConical } from "lucide-react";

import { Button } from "@oc-mui/ui/components";

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
  onTry?: (plugin: RegistryPlugin) => void;
}

/** One-line pitch: explicit tagline, or the description's first sentence. */
export function taglineOf(plugin: Pick<RegistryPlugin, "tagline" | "description">): string {
  if (plugin.tagline) return plugin.tagline;
  const firstSentence = plugin.description.split(/(?<=\.)\s/, 1)[0] ?? plugin.description;
  return firstSentence.length > 120 ? `${firstSentence.slice(0, 117)}…` : firstSentence;
}

/**
 * Catalog list row: tile, name + verified mark, author, version, tagline —
 * plus the Try gesture when the deployment has enabled it. Try is the only
 * action; there is no install (permanence goes through the ops path).
 */
const PluginRow: FC<PluginRowProps> = ({ plugin, onOpen, canTry, trialActive, onTry }) => {
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
      className="grid w-full cursor-pointer grid-cols-[auto_1fr_auto] items-start gap-x-3.5 gap-y-1 rounded-xl p-3 text-left transition-colors hover:bg-card"
    >
      <PluginTile plugin={plugin} />
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <span className="truncate">{plugin.name}</span>
          {plugin.verified && (
            <BadgeCheck aria-label="Verified" className="size-3.5 shrink-0 text-primary" />
          )}
        </span>
        <span className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="truncate">{plugin.author.name}</span>
          <span className="shrink-0 font-mono">v{plugin.version}</span>
        </span>
      </span>
      <span className="self-center">
        {trialActive ? (
          <span className="flex items-center gap-1.5 rounded-lg bg-ok/15 px-2.5 py-1.5 text-xs font-semibold text-ok">
            <FlaskConical className="size-3.5" /> Trial active
          </span>
        ) : canTry && onTry ? (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onTry(plugin);
            }}
          >
            Try
          </Button>
        ) : null}
      </span>
      <span className="col-start-2 col-span-2 line-clamp-2 text-[13px] leading-snug text-muted-foreground">
        {taglineOf(plugin)}
      </span>
    </div>
  );
};

export { PluginRow };
