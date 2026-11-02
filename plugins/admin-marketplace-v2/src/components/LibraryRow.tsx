import { ArrowUpCircle, Check, Copy, FlaskConical } from "lucide-react";
import { useState } from "react";

import { Button, toast } from "@oc-mui/ui/components";

import { PluginTile } from "./PluginTile";

import type { InventoryItem, InventoryOrigin } from "../services/inventory";
import type { FC } from "react";

const ORIGIN_LABEL: Record<InventoryOrigin, string> = {
  builtin: "Built-in",
  jar: "Deployment (JAR)",
  local: "Local dev",
  trial: "Trial",
  shell: "Shell",
};

/** Origin → a stable tile color via the registry category palette. */
const ORIGIN_CATEGORY: Record<InventoryOrigin, "feature" | "integration" | "utility" | "experimental"> = {
  builtin: "feature",
  jar: "integration",
  local: "utility",
  trial: "experimental",
  shell: "utility",
};

interface LibraryRowProps {
  item: InventoryItem;
}

/**
 * One inventory line. Read-only on purpose; the one interaction is copying
 * the namespace — the exact `app.enabledPlugins` value an operator needs.
 */
const LibraryRow: FC<LibraryRowProps> = ({ item }) => {
  const [copied, setCopied] = useState(false);
  const tileSource = item.registryEntry ?? { category: ORIGIN_CATEGORY[item.origin] };

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
              <FlaskConical className="size-3" /> this tab
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
          </span>
          {item.types.length > 0 && (
            <span className="font-mono">
              {item.types.length === 1 ? "type" : "types"}: {item.types.join(", ")}
            </span>
          )}
          {item.version && <span className="font-mono">v{item.version}</span>}
        </div>

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

      <Button
        variant="ghost"
        size="sm"
        className="self-center text-muted-foreground"
        onClick={copyNamespace}
        title="Copy the app.enabledPlugins value"
      >
        {copied ? <Check className="size-3.5 text-ok" /> : <Copy className="size-3.5" />}
        <span className="text-xs">Copy namespace</span>
      </Button>
    </div>
  );
};

export { LibraryRow };
