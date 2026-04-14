import {
  ArrowLeft,
  Building2,
  Check,
  ChevronRight,
  Circle,
  Code2,
  Info,
  Package,
  Power,
  PowerOff,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import React from "react";

import type { PluginSource } from "../services/plugin-explorer";

import { Badge, Button } from "@workspace/ui/components";

const PendingChangesNotice: React.FC<{
  onReload: () => void;
  onDiscardChanges: () => void;
}> = ({ onReload, onDiscardChanges }) => (
  <div
    role="status"
    aria-live="polite"
    className="flex flex-col gap-3 rounded-lg border border-amber-500/50 bg-amber-50 px-4 py-3 dark:bg-amber-950/20 sm:flex-row sm:items-center"
  >
    <div className="flex flex-1 items-start gap-2">
      <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
      <div>
        <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Change saved</p>
        <p className="text-xs text-amber-800/90 dark:text-amber-200/90">
          Reload the page for enable/disable to take effect.
        </p>
      </div>
    </div>
    <div className="flex shrink-0 gap-2 sm:justify-end">
      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={onDiscardChanges}>
        Discard
      </Button>
      <Button
        size="sm"
        className="h-8 bg-amber-600 text-xs text-white hover:bg-amber-700"
        onClick={onReload}
      >
        Reload
      </Button>
    </div>
  </div>
);

const SOURCE_LABELS: Record<PluginSource, { label: string; icon: React.ReactNode; hint: string }> = {
  bundled: {
    label: "Bundled",
    icon: <Package className="h-3.5 w-3.5" />,
    hint: "Shipped with this installation. Disabling takes effect after reload.",
  },
  "local-dev": {
    label: "Local Development",
    icon: <Code2 className="h-3.5 w-3.5" />,
    hint: "Loaded from .local-plugins/ folder. Disabling takes effect after reload.",
  },
  jar: {
    label: "Organization (JAR)",
    icon: <Building2 className="h-3.5 w-3.5" />,
    hint: "Deployed via backend JAR bundle. Disabling takes effect after reload.",
  },
  remote: {
    label: "Remote",
    icon: <Package className="h-3.5 w-3.5" />,
    hint: "Loaded from a remote URL.",
  },
};

export interface PluginDetailViewProps {
  pluginName: string;
  displayName: string;
  description: string;
  version: string;
  category: string;
  author?: string | undefined;
  source?: PluginSource | undefined;
  extensionPoints: string[];
  isLoaded: boolean;
  isOverridden: boolean;
  isCore?: boolean | undefined;
  tags?: string[] | undefined;
  onBack: () => void;
  onEnable: () => void;
  onDisable: () => void;
  onRemoveOverride: () => void;
  /** When true, show inline reload notice (same semantics as marketplace banner). */
  pendingChanges?: boolean | undefined;
  onReload?: (() => void) | undefined;
  onDiscardChanges?: (() => void) | undefined;
}

export const PluginDetailView: React.FC<PluginDetailViewProps> = ({
  pluginName,
  displayName,
  description,
  version,
  category,
  author,
  source,
  extensionPoints,
  isLoaded,
  isOverridden,
  isCore,
  tags,
  onBack,
  onEnable,
  onDisable,
  onRemoveOverride,
  pendingChanges,
  onReload,
  onDiscardChanges,
}) => {
  const sourceInfo = source ? SOURCE_LABELS[source] : null;
  const showPending =
    pendingChanges === true && typeof onReload === "function" && typeof onDiscardChanges === "function";

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-1">
      <nav className="flex flex-wrap items-center gap-1 text-sm" aria-label="Breadcrumb">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          <span>Plugins</span>
        </button>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="font-medium text-foreground">{displayName}</span>
      </nav>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight">{displayName}</h1>
          <Badge variant="outline" className="font-normal">
            v{version}
          </Badge>
          <Badge variant="outline" className="font-normal capitalize">
            {category}
          </Badge>
        </div>
        {author && (
          <p className="text-sm text-muted-foreground">
            by <span className="text-foreground/90">{author}</span>
          </p>
        )}
        <p className="font-mono text-xs text-muted-foreground">{pluginName}</p>
        {sourceInfo && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {sourceInfo.icon}
            <span>{sourceInfo.label}</span>
          </div>
        )}
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {isLoaded && (
          <Badge className="border-0 bg-emerald-600 text-white hover:bg-emerald-600">
            <Check className="mr-1 h-3 w-3" aria-hidden />
            Active
          </Badge>
        )}
        {isOverridden && (
          <Badge
            variant="outline"
            className="border-amber-400/60 bg-amber-500/10 text-amber-800 dark:text-amber-200"
          >
            Overridden
          </Badge>
        )}
        {isCore && (
          <Badge variant="secondary" className="gap-1 font-normal">
            <ShieldCheck className="h-3 w-3" aria-hidden />
            Core
          </Badge>
        )}
        {!isLoaded && (
          <Badge variant="secondary" className="gap-1 font-normal text-muted-foreground">
            <Circle className="h-3 w-3 fill-current" aria-hidden />
            Available
          </Badge>
        )}
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>

      {showPending && (
        <PendingChangesNotice onReload={onReload} onDiscardChanges={onDiscardChanges} />
      )}

      {extensionPoints.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-foreground">Includes</h2>
          <ul className="flex flex-wrap gap-1.5">
            {extensionPoints.map((point) => (
              <li key={point}>
                <Badge
                  variant="secondary"
                  className="font-mono text-xs font-normal text-foreground/90"
                >
                  {point}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tags && tags.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-foreground">Tags</h2>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs font-normal">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3 border-t pt-4">
        {isCore ? (
          <p className="text-sm text-muted-foreground">Core plugin — always active</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              {isOverridden && (
                <Button type="button" variant="outline" size="sm" onClick={onRemoveOverride}>
                  <RotateCcw className="mr-2 h-4 w-4" aria-hidden />
                  Reset to Default
                </Button>
              )}
              {isLoaded && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={onDisable}
                >
                  <PowerOff className="mr-2 h-4 w-4" aria-hidden />
                  Disable
                </Button>
              )}
              {!isLoaded && (
                <Button type="button" variant="default" size="sm" onClick={onEnable}>
                  <Power className="mr-2 h-4 w-4" aria-hidden />
                  Enable
                </Button>
              )}
            </div>
            {sourceInfo && (
              <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
                {sourceInfo.hint}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};
