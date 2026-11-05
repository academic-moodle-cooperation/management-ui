import { BadgeCheck, Check, Copy, ExternalLink, ShieldCheck } from "lucide-react";
import { useState } from "react";

import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  toast,
} from "@oc-mui/ui/components";

import { usePaperToken } from "../hooks/usePaperToken";
import { accentFor, tileGradient } from "../lib/palette";
import { namespaceOf } from "../services/registry";


import { ActionPill } from "./ActionPill";
import { Artwork, pluginPalette, variantFor } from "./Artwork";
import { ExtendsRequires } from "./ExtendsRequires";
import { PluginTile } from "./PluginTile";

import type { InventoryStatus } from "../services/inventory";
import type { RegistryPlugin } from "../services/registry";
import type { FC } from "react";

interface DetailDialogProps {
  plugin: RegistryPlugin | null;
  onClose: () => void;
  /** Try gesture available for this entry (deployment opt-in + not a theme). */
  canTry?: boolean;
  /** A trial of this plugin is active in this tab. */
  trialActive?: boolean;
  /** The plugin is deployed here and running — nothing to try. */
  activeHere?: boolean;
  onTry?: (plugin: RegistryPlugin) => void;
  onEndTrial?: (pluginId: string) => void;
  /** A screenshot the deployment may load, or null for generated artwork. */
  image?: string | null;
  /** This deployment's plugins by namespace — decides whether a dependency is present. */
  presence?: ReadonlyMap<string, InventoryStatus>;
}

function formatDate(iso?: string): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/**
 * Plugin detail: identity, provenance, metadata, description — and the one
 * thing an operator needs to make it permanent: the exact config key. Try
 * is the only action here; install stays a deployment step.
 */
const EnableHint: FC<{ plugin: RegistryPlugin }> = ({ plugin }) => {
  const [copied, setCopied] = useState(false);
  const namespace = namespaceOf(plugin);
  const snippet = `"app": { "enabledPlugins": [ …, "${namespace}" ] }`;
  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(namespace);
      setCopied(true);
      toast(`Copied "${namespace}" — add it to app.enabledPlugins`);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast(`Namespace: ${namespace}`);
    }
  };
  return (
    <div className="mt-5 rounded-xl border border-border bg-card/60 px-4 py-3 text-[13px] leading-relaxed text-muted-foreground">
      <p className="font-semibold text-foreground">Making it permanent is a deployment step.</p>
      <p className="mt-1">
        Try only loads it in this tab. For everyone: deploy the bundle (JAR or hosted file), then
        list its namespace in the deployment&apos;s <code className="font-mono">config.json</code>:
      </p>
      <div className="mt-2 flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-md bg-muted px-2.5 py-1.5 font-mono text-[12px] text-foreground">
          {snippet}
        </code>
        <button
          type="button"
          onClick={copy}
          title="Copy the namespace"
          aria-label="Copy namespace"
          className="shrink-0 rounded-md border border-border p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {copied ? <Check className="size-3.5 text-ok" /> : <Copy className="size-3.5" />}
        </button>
      </div>
      <p className="mt-1.5 text-xs">
        Already deployed here but switched off? The Library lists it under &quot;Available but
        disabled&quot;, with the same value.
      </p>
    </div>
  );
};

const DetailDialog: FC<DetailDialogProps> = ({
  plugin,
  onClose,
  canTry,
  trialActive,
  activeHere,
  onTry,
  onEndTrial,
  image = null,
  presence = new Map(),
}) => {
  const paper = usePaperToken();
  if (!plugin) return null;

  const accent = accentFor(plugin);
  const updated = formatDate(plugin.lastUpdated);

  const meta: Array<{ label: string; value: string; mono?: boolean }> = [
    { label: "Version", value: plugin.version, mono: true },
    { label: "Category", value: plugin.category },
    ...(plugin.license ? [{ label: "License", value: plugin.license }] : []),
    ...(updated ? [{ label: "Updated", value: updated }] : []),
  ];

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-xl">
        {/* The card's artwork, wider: the dialog opens on the same picture the card showed. */}
        <Artwork
          palette={pluginPalette(accent, tileGradient(plugin), paper)}
          image={image}
          variant={variantFor(plugin.id)}
          shape="hero"
        />
        <div className="px-6 pb-6">
          <DialogHeader className="text-left">
            {/* `relative` lifts the row above the hero's positioned artwork, or the tile is clipped. */}
            {/* Tile straddles the hero edge; the text starts below it (pt-10 > the 36px overhang). */}
            <div className="relative -mt-9 flex items-start gap-4">
              {/* Outer radius = tile radius (25 % of 64 = 16px) + the 4px gap, so the corners stay concentric. */}
              <div className="rounded-[20px] bg-background p-1 shadow-md">
                <PluginTile plugin={plugin} size={64} />
              </div>
              <div className="min-w-0 pt-10">
                <DialogTitle className="flex items-center gap-2 font-heading text-xl">
                  <span className="truncate">{plugin.name}</span>
                  {plugin.verified && (
                    <BadgeCheck aria-label="Verified" className="size-4.5 shrink-0 text-primary" />
                  )}
                  {plugin.integrity && (
                    <span title="Integrity-pinned: only the exact reviewed build will execute.">
                      <ShieldCheck className="size-4 shrink-0 text-muted-foreground" />
                    </span>
                  )}
                </DialogTitle>
                <DialogDescription className="mt-0.5">
                  by {plugin.author.name}
                </DialogDescription>
              </div>
              <div className="ml-auto self-start pt-10">
                {trialActive ? (
                  <span className="flex items-center gap-2">
                    <ActionPill tone="ok">
                      Trial active <Check className="size-3.5" strokeWidth={2.6} />
                    </ActionPill>
                    {onEndTrial && <ActionPill onClick={() => onEndTrial(plugin.id)}>End trial</ActionPill>}
                  </span>
                ) : activeHere ? (
                  <ActionPill tone="ok" title="Deployed and enabled on this deployment">
                    Active here <Check className="size-3.5" strokeWidth={2.6} />
                  </ActionPill>
                ) : canTry && onTry ? (
                  <ActionPill onClick={() => onTry(plugin)}>Try it</ActionPill>
                ) : null}
              </div>
            </div>
          </DialogHeader>

          <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
            {meta.map((entry) => (
              <div key={entry.label} className="bg-card px-3.5 py-2.5">
                <dt className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  {entry.label}
                </dt>
                <dd className={`mt-0.5 text-sm font-medium ${entry.mono ? "font-mono text-[13px]" : ""}`}>
                  {entry.value}
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {plugin.description}
          </p>

          <ExtendsRequires
            extensionPoints={plugin.extensionPoints}
            pluginDependencies={plugin.pluginDependencies}
            presence={presence}
          />

          <EnableHint plugin={plugin} />

          {plugin.tags && plugin.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {plugin.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-muted-foreground">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {(plugin.repositoryUrl || plugin.homepageUrl) && (
            <div className="mt-5 flex gap-2">
              {plugin.repositoryUrl && (
                <Button asChild variant="outline" size="sm">
                  <a href={plugin.repositoryUrl} target="_blank" rel="noreferrer">
                    Repository <ExternalLink className="size-3.5" />
                  </a>
                </Button>
              )}
              {plugin.homepageUrl && (
                <Button asChild variant="outline" size="sm">
                  <a href={plugin.homepageUrl} target="_blank" rel="noreferrer">
                    Homepage <ExternalLink className="size-3.5" />
                  </a>
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { DetailDialog };
