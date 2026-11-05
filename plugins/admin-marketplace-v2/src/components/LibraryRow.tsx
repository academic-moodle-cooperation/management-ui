import { ArrowUpCircle, Check, Copy, FlaskConical, PauseCircle } from "lucide-react";
import { useState } from "react";

import { toast } from "@oc-mui/ui/components";

import { endTrial } from "../services/trials";

import { ActionPill } from "./ActionPill";
import { ExtendsRequires } from "./ExtendsRequires";
import { PluginTile } from "./PluginTile";

import type { InventoryItem, InventoryOrigin, InventoryStatus } from "../services/inventory";
import type { FC } from "react";

const ORIGIN_LABEL: Record<InventoryOrigin, string> = {
  builtin: "Built-in",
  jar: "Deployment (JAR)",
  local: "Local dev",
  trial: "Trial",
  browser: "This browser",
  shell: "Shell",
};

/** Origin → a stable tile color via the registry category palette. */
const ORIGIN_CATEGORY: Record<InventoryOrigin, "feature" | "integration" | "utility" | "experimental"> = {
  builtin: "feature",
  jar: "integration",
  local: "utility",
  trial: "experimental",
  browser: "experimental",
  shell: "utility",
};

interface LibraryRowProps {
  item: InventoryItem;
  /** Offered for present-but-disabled plugins: preview in this tab only. */
  onTry?: (item: InventoryItem) => void;
  /** The whole inventory by namespace, for dependency states. */
  presence: ReadonlyMap<string, InventoryStatus>;
}

/**
 * One inventory line. Read-only on purpose; the one interaction is copying
 * the namespace — the exact `app.enabledPlugins` value an operator needs.
 */
const LibraryRow: FC<LibraryRowProps> = ({ item, onTry, presence }) => {
  const canTry = item.status === "disabled" && item.origin !== "shell" && Boolean(onTry);
  const [copied, setCopied] = useState(false);
  // Artwork: the registry entry, else the plugin's own manifest, else a color by origin.
  const tileSource = item.registryEntry ??
    (item.manifest
      ? { ...item.manifest, category: item.manifest.category ?? ORIGIN_CATEGORY[item.origin] }
      : { category: ORIGIN_CATEGORY[item.origin] });

  const copyNamespace = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(item.namespace);
      setCopied(true);
      toast(`Copied "${item.namespace}" — add it to app.enabledPlugins`);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast(`Namespace: ${item.namespace}`);
    }
  };

  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-start gap-x-3.5 gap-y-1 rounded-xl border border-border bg-card p-3.5">
      <PluginTile plugin={{ name: item.displayName, ...tileSource }} />

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-semibold">{item.displayName}</span>
          <span className="rounded-md border border-border px-1.5 py-0.5 text-[10.5px] font-semibold tracking-wide text-muted-foreground uppercase">
            {ORIGIN_LABEL[item.origin]}
          </span>
          {item.status === "trial" && (
            <span className="flex items-center gap-1 rounded-md bg-ok/15 px-1.5 py-0.5 text-[10.5px] font-semibold text-ok">
              <FlaskConical className="size-3" />
              {item.trialKind === "local" ? "previewing · this tab" : "this tab"}
            </span>
          )}
          {item.moduleOf && (
          <p className="mt-1.5 text-xs text-muted-foreground">
            A module of the <code className="font-mono">{item.moduleOf}</code> plugin, registered under its own
            namespace. It is switched on and off together with{" "}
            <code className="font-mono">&quot;{item.moduleOf}&quot;</code> in{" "}
            <code className="font-mono">app.enabledPlugins</code>, not separately.
          </p>
        )}

        {item.origin === "browser" && (
          <p className="mt-1.5 text-xs text-muted-foreground">
            Installed in this browser by the previous marketplace (localStorage
            {item.browserInstallIds && item.browserInstallIds.length > 0 && (
              <>: <code className="font-mono">{item.browserInstallIds.join(", ")}</code></>
            )}
            ). It loads on every visit from this browser only — nobody else sees it. Remove it in the
            previous marketplace&apos;s Library, or clear that key.
          </p>
        )}

        {item.status === "paused" && (
            <span className="flex items-center gap-1 rounded-md bg-warning/15 px-1.5 py-0.5 text-[10.5px] font-semibold text-warning">
              <PauseCircle className="size-3" /> paused · this tab
            </span>
          )}
          {item.registryNewer && (
            <span
              className="flex items-center gap-1 rounded-md bg-info/15 px-1.5 py-0.5 text-[10.5px] font-semibold text-info"
              title="The registry lists a newer version. Updating is a deployment step."
            >
              <ArrowUpCircle className="size-3" /> Registry: {item.registryNewer}
            </span>
          )}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="text-[10.5px] tracking-wide uppercase">namespace</span>
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11.5px] text-foreground">
              {item.namespace}
            </code>
            <button
              type="button"
              onClick={copyNamespace}
              title="Copy — this is the app.enabledPlugins value"
              aria-label="Copy namespace"
              className="rounded p-0.5 text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
            >
              {copied ? <Check className="size-3 text-ok" /> : <Copy className="size-3" />}
            </button>
          </span>
          {item.types.length > 0 && (
            <span className="font-mono">
              {item.types.length === 1 ? "type" : "types"}: {item.types.join(", ")}
            </span>
          )}
          {item.version && <span className="font-mono">v{item.version}</span>}
        </div>

        <ExtendsRequires
          extensionPoints={item.extensionPoints}
          pluginDependencies={item.pluginDependencies}
          presence={presence}
          layout="row"
        />

        {item.moduleOf && (
          <p className="mt-1.5 text-xs text-muted-foreground">
            A module of the <code className="font-mono">{item.moduleOf}</code> plugin, registered under its own
            namespace. It is switched on and off together with{" "}
            <code className="font-mono">&quot;{item.moduleOf}&quot;</code> in{" "}
            <code className="font-mono">app.enabledPlugins</code>, not separately.
          </p>
        )}

        {item.origin === "browser" && (
          <p className="mt-1.5 text-xs text-muted-foreground">
            Installed in this browser by the previous marketplace (localStorage
            {item.browserInstallIds && item.browserInstallIds.length > 0 && (
              <>: <code className="font-mono">{item.browserInstallIds.join(", ")}</code></>
            )}
            ). It loads on every visit from this browser only — nobody else sees it. Remove it in the
            previous marketplace&apos;s Library, or clear that key.
          </p>
        )}

        {item.status === "paused" && (
          <p className="mt-1.5 text-xs text-muted-foreground">
            Enabled for everyone, stepped aside in this tab so a trial can fill its slots. Ending that
            trial brings it back.
          </p>
        )}

        {item.status === "disabled" && (
          <p className="mt-1.5 text-xs text-muted-foreground">
            {item.disabledReason === "runtime-switch" ? (
              <>
                Present, but switched off via{" "}
                <code className="font-mono">config.plugins.{item.namespace}.enabled: false</code>.
              </>
            ) : (
              <>
                Present, but not listed in <code className="font-mono">app.enabledPlugins</code>. To
                enable it for everyone, add <code className="font-mono">&quot;{item.namespace}&quot;</code> to
                that list in the deployment&apos;s <code className="font-mono">config.json</code>.
              </>
            )}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1.5 self-center">
        {canTry && onTry && (
          <ActionPill onClick={() => onTry(item)} title="Preview in this tab only">
            <FlaskConical className="size-3.5" /> Try it
          </ActionPill>
        )}
        {item.status === "trial" && (
          <ActionPill onClick={() => endTrial(item.namespace)} title="Unload it from this tab (reloads)">
            End trial
          </ActionPill>
        )}
      </div>
    </div>
  );
};

export { LibraryRow };
