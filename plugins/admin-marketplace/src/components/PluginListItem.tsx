import { Check, Circle, CirclePlus, Loader2, Package, PowerOff, ShieldCheck } from "lucide-react";
import React from "react";

import { Badge, Button } from "@workspace/ui/components";

// ---------------------------------------------------------------------------
// Bundled / local plugin row
// ---------------------------------------------------------------------------

export interface PluginListItemProps {
  name: string;
  displayName: string;
  description: string;
  version: string;
  namespace: string;
  author?: string | undefined;
  isLoaded: boolean;
  isOverridden: boolean;
  isCore?: boolean | undefined;
  onClick: () => void;
}

export const PluginListItem: React.FC<PluginListItemProps> = ({
  name,
  displayName,
  description,
  version,
  namespace,
  author,
  isLoaded,
  isOverridden,
  isCore,
  onClick,
}) => {
  const dotClass = isOverridden
    ? "bg-amber-500"
    : isLoaded
      ? "bg-emerald-500"
      : "bg-muted-foreground/40";

  const canDisable = isLoaded && !isCore;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  const title = [name, `v${version}`, author].filter(Boolean).join(" · ");

  return (
    <div
      role="button"
      tabIndex={0}
      title={title}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className="flex cursor-pointer items-center gap-3 border-b px-3 py-2.5 text-left transition-colors duration-150 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
        <span className={`h-2 w-2 rounded-full ${dotClass}`} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{displayName}</div>
        <p className="truncate text-xs text-muted-foreground">{description}</p>
      </div>

      <Badge variant="secondary" className="h-5 shrink-0 px-1.5 text-[10px] font-normal font-mono">
        {namespace}
      </Badge>

      <div className="flex shrink-0 items-center gap-1 text-muted-foreground">
        {!isLoaded && <CirclePlus className="h-4 w-4" aria-hidden />}
        {isLoaded && <Check className="h-4 w-4 text-emerald-600" aria-hidden />}
        {canDisable && <PowerOff className="h-4 w-4" aria-hidden />}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Bundled / local plugin — Codex-style grid card (2-column layout)
// ---------------------------------------------------------------------------

export const PluginGridCard: React.FC<PluginListItemProps> = ({
  displayName,
  description,
  version,
  namespace,
  author,
  isLoaded,
  isOverridden,
  isCore,
  onClick,
}) => {
  const dotClass = isOverridden
    ? "bg-amber-500"
    : isLoaded
      ? "bg-emerald-500"
      : "bg-muted-foreground/40";
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

  return (
    <button
      type="button"
      title={[displayName, `v${version}`, author].filter(Boolean).join(" · ")}
      onClick={onClick}
      className="flex w-full items-start gap-3 rounded-lg border bg-card p-3 text-left shadow-sm transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-semibold text-muted-foreground">
        {initial.match(/[A-Z0-9]/i) ? initial : <Package className="h-4 w-4" aria-hidden />}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2 gap-y-1">
          <span className="truncate text-sm font-medium text-foreground">{displayName}</span>
          <Badge variant="secondary" className="h-5 shrink-0 px-1.5 font-mono text-[10px] font-normal">
            {namespace}
          </Badge>
        </div>
        <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">{description}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5 pt-0.5">
        <span className="relative flex h-2 w-2" aria-hidden title={isLoaded ? "Active" : "Not loaded"}>
          <span className={`h-2 w-2 rounded-full ${dotClass}`} />
        </span>
        <div className="flex items-center gap-0.5 text-muted-foreground">
          {!isLoaded && <CirclePlus className="h-4 w-4" aria-hidden />}
          {isLoaded && <Check className="h-4 w-4 text-emerald-600" aria-hidden />}
          {isLoaded && !isCore && <PowerOff className="h-3.5 w-3.5 opacity-40" aria-hidden />}
        </div>
      </div>
    </button>
  );
};

// ---------------------------------------------------------------------------
// Community registry row
// ---------------------------------------------------------------------------

export interface CommunityPluginListItemProps {
  name: string;
  description: string;
  version: string;
  category: string;
  author: string;
  tags?: string[] | undefined;
  isInstalled: boolean;
  isLoading: boolean;
  onClick: () => void;
  onInstall: () => void;
}

export const CommunityPluginListItem: React.FC<CommunityPluginListItemProps> = ({
  name,
  description,
  version,
  category,
  author,
  tags,
  isInstalled,
  isLoading,
  onClick,
  onInstall,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className="flex cursor-pointer items-center gap-3 border-b px-1 py-2.5 text-left transition-colors duration-150 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
        <span
          className={`h-2 w-2 rounded-full ${isInstalled ? "bg-emerald-500" : "bg-muted-foreground/40"}`}
        />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="truncate font-medium text-sm">{name}</span>
          {isInstalled && (
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600/80" aria-hidden />
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {description}
          <span className="text-border"> · </span>
          {author}
          <span className="text-border"> · </span>
          <span className="tabular-nums">v{version}</span>
          {tags && tags.length > 0 && (
            <>
              <span className="text-border"> · </span>
              <span className="inline-flex items-center gap-1">
                {tags.slice(0, 2).map((t, i) => (
                  <React.Fragment key={t}>
                    {i > 0 && <Circle className="h-1 w-1 shrink-0 fill-muted-foreground/50" aria-hidden />}
                    {t}
                  </React.Fragment>
                ))}
                {tags.length > 2 ? "…" : ""}
              </span>
            </>
          )}
        </p>
      </div>

      <Badge variant="outline" className="h-5 shrink-0 px-1.5 text-[10px] font-normal capitalize">
        {category}
      </Badge>

      <div className="flex shrink-0 items-center gap-1">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />
        ) : isInstalled ? (
          <Check className="h-4 w-4 text-emerald-600" aria-hidden />
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onInstall();
            }}
            title="Install"
          >
            <CirclePlus className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Community registry — grid card
// ---------------------------------------------------------------------------

export const CommunityPluginGridCard: React.FC<CommunityPluginListItemProps> = ({
  name,
  description,
  version,
  category,
  author,
  tags,
  isInstalled,
  isLoading,
  onClick,
  onInstall,
}) => {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card p-3 shadow-sm">
      <button
        type="button"
        onClick={onClick}
        className="flex min-w-0 flex-1 items-start gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-semibold text-muted-foreground">
          {initial.match(/[A-Z0-9]/i) ? initial : <Package className="h-4 w-4" aria-hidden />}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-medium">{name}</span>
            {isInstalled && (
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600/80" aria-hidden />
            )}
            <Badge variant="outline" className="h-5 shrink-0 px-1.5 text-[10px] font-normal capitalize">
              {category}
            </Badge>
          </div>
          <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
            {description}
            <span className="text-border"> · </span>
            {author}
            <span className="text-border"> · </span>
            <span className="tabular-nums">v{version}</span>
          </p>
          {tags && tags.length > 0 && (
            <p className="line-clamp-1 text-[10px] text-muted-foreground/80">
              {tags.slice(0, 4).join(" · ")}
              {tags.length > 4 ? "…" : ""}
            </p>
          )}
        </div>
      </button>
      <div className="flex shrink-0 flex-col items-end justify-center self-stretch pt-1">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />
        ) : isInstalled ? (
          <Check className="h-4 w-4 text-emerald-600" aria-hidden />
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onInstall();
            }}
            title="Install"
          >
            <CirclePlus className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
