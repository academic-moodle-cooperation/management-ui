import { Check, CirclePlus, Loader2, Package } from "lucide-react";
import React from "react";

import { Badge, Button } from "@oc-mui/ui/components";

export interface CommunityPluginCardProps {
  name: string;
  description: string;
  version: string;
  category: string;
  author: string;
  tags?: string[] | undefined;
  isInstalled: boolean;
  isLoading: boolean;
  /** Remote loading disabled for this deployment — actions unavailable. */
  actionsDisabled?: boolean;
  /** Load once, for this session only. */
  onTry: () => void;
  /** Keep loaded in this browser across reloads. */
  onInstall: () => void;
  onUninstall?: (() => void) | undefined;
}

/** One registry entry in the Discover tab, with explicit Try/Install actions. */
export const CommunityPluginCard: React.FC<CommunityPluginCardProps> = ({
  name,
  description,
  version,
  category,
  author,
  tags,
  isInstalled,
  isLoading,
  actionsDisabled = false,
  onTry,
  onInstall,
  onUninstall,
}) => {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className="bg-card flex items-start gap-3 rounded-lg border p-3 shadow-sm">
      <div className="bg-muted text-muted-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-sm font-semibold">
        {initial.match(/[A-Z0-9]/i) ? initial : <Package className="h-4 w-4" aria-hidden />}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-medium">{name}</span>
          <Badge variant="outline" className="h-5 shrink-0 px-1.5 text-[10px] font-normal capitalize">
            {category}
          </Badge>
        </div>
        <p className="text-muted-foreground line-clamp-2 text-xs leading-snug">
          {description}
          <span className="text-border"> · </span>
          {author}
          <span className="text-border"> · </span>
          <span className="tabular-nums">v{version}</span>
        </p>
        {tags && tags.length > 0 && (
          <p className="text-muted-foreground/80 line-clamp-1 text-[10px]">
            {tags.slice(0, 4).join(" · ")}
            {tags.length > 4 ? "…" : ""}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1 self-center">
        {isLoading ? (
          <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" aria-hidden />
        ) : isInstalled ? (
          <>
            <span className="text-ok flex items-center gap-1 text-xs">
              <Check className="h-3.5 w-3.5" aria-hidden />
              Installed
            </span>
            {onUninstall && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground h-7 text-xs"
                onClick={onUninstall}
              >
                Remove
              </Button>
            )}
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={actionsDisabled}
              onClick={onTry}
              title="Load once — gone after the next reload"
            >
              Try
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-7 text-xs"
              disabled={actionsDisabled}
              onClick={onInstall}
              title="Keep loaded in this browser across reloads"
            >
              <CirclePlus className="mr-1 h-3.5 w-3.5" />
              Install
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
