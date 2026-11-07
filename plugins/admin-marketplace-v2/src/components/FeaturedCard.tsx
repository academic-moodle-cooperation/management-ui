import { BadgeCheck, Check } from "lucide-react";

import { useI18n } from "@oc-mui/i18n";

import { usePaperToken } from "../hooks/usePaperToken";
import { accentFor, tileGradient } from "../lib/palette";


import { ActionPill } from "./ActionPill";
import { Artwork, pluginPalette, variantFor } from "./Artwork";

import type { RegistryPlugin } from "../services/registry";
import type { FC } from "react";

interface FeaturedCardProps {
  plugin: RegistryPlugin;
  /** A screenshot the deployment may load, or null for generated artwork. */
  image: string | null;
  onOpen: (plugin: RegistryPlugin) => void;
  canTry?: boolean;
  trialActive?: boolean;
  /** The plugin is deployed here and running — nothing to try. */
  activeHere?: boolean;
  onTry?: (plugin: RegistryPlugin) => void;
}

/**
 * V4's media card: big artwork, then name, author, version and the Try
 * gesture. Which entries get a card is the deployment's call
 * (`featured` in the plugin config); the card itself adds nothing a row
 * doesn't show — it only gives the entry room.
 */
const FeaturedCard: FC<FeaturedCardProps> = ({ plugin, image, onOpen, canTry, trialActive, activeHere, onTry }) => {
  const { t } = useI18n();
  const paper = usePaperToken();
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
    className="group cursor-pointer text-left"
  >
    <Artwork
      palette={pluginPalette(accentFor(plugin), tileGradient(plugin), paper)}
      badge={plugin}
      image={image}
      variant={variantFor(plugin.id)}
    />
    <div className="flex items-start gap-2.5 px-0.5 pt-2.5">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-[13.5px] font-semibold">
          <span className="truncate">{plugin.name}</span>
          {plugin.verified && (
            <BadgeCheck aria-label={t("marketplace:hints.verified")} className="size-3 shrink-0 text-muted-foreground" />
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs whitespace-nowrap text-muted-foreground">
          <span className="truncate">{plugin.author.name}</span>
          <span className="font-mono">v{plugin.version}</span>
        </div>
      </div>
      <div className="ml-auto shrink-0">
        {trialActive || activeHere ? (
          <ActionPill
            tone="ok"
            size="sm"
            title={activeHere ? t("marketplace:hints.activeHereShort") : t("marketplace:hints.trialActiveTab")}
          >
            <Check className="size-3.5" strokeWidth={2.6} />
          </ActionPill>
        ) : canTry && onTry ? (
          <ActionPill size="sm" onClick={() => onTry(plugin)}>
            {t("marketplace:actions.tryIt")}
          </ActionPill>
        ) : null}
      </div>
    </div>
  </div>
  );
};

export { FeaturedCard };
