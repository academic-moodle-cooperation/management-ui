import { ArrowUpCircle, Check, Copy, FlaskConical, PauseCircle } from "lucide-react";
import { useState } from "react";

import { useI18n } from "@oc-mui/i18n";
import { toast } from "@oc-mui/ui/components";

import { rich } from "../lib/rich";
import { endTrial } from "../services/trials";

import { ActionPill } from "./ActionPill";
import { ExtendsRequires } from "./ExtendsRequires";
import { PluginTile } from "./PluginTile";

import type { InventoryItem, InventoryOrigin, InventoryStatus } from "../services/inventory";
import type { FC, ReactElement } from "react";

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
  const { t } = useI18n();
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
      toast(t("marketplace:toasts.namespaceCopied", { value: item.namespace }));
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast(t("marketplace:toasts.namespace", { value: item.namespace }));
    }
  };

  // Values from the deployment (namespaces, parent names) go in as elements, not
  // interpolations, so they are never parsed as markup (see lib/rich).
  const mono = (text: string): ReactElement => <code className="font-mono">{text}</code>;

  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-start gap-x-3.5 gap-y-1 rounded-xl border border-border bg-card p-3.5">
      <PluginTile plugin={{ name: item.displayName, ...tileSource }} />

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-semibold">{item.displayName}</span>
          <span className="rounded-md border border-border px-1.5 py-0.5 text-[10.5px] font-semibold tracking-wide text-muted-foreground uppercase">
            {t(`marketplace:library.origin.${item.origin}`)}
          </span>
          {item.status === "trial" && (
            <span className="flex items-center gap-1 rounded-md bg-ok/15 px-1.5 py-0.5 text-[10.5px] font-semibold text-ok">
              <FlaskConical className="size-3" />
              {item.trialKind === "local"
                ? t("marketplace:library.badge.previewingTab")
                : t("marketplace:library.badge.thisTab")}
            </span>
          )}
          {item.status === "paused" && (
            <span className="flex items-center gap-1 rounded-md bg-warning/15 px-1.5 py-0.5 text-[10.5px] font-semibold text-warning">
              <PauseCircle className="size-3" /> {t("marketplace:library.badge.pausedTab")}
            </span>
          )}
          {item.registryNewer && (
            <span
              className="flex items-center gap-1 rounded-md bg-info/15 px-1.5 py-0.5 text-[10.5px] font-semibold text-info"
              title={t("marketplace:library.badge.registryNewerHint")}
            >
              <ArrowUpCircle className="size-3" />{" "}
              {t("marketplace:library.badge.registryNewer", { version: item.registryNewer })}
            </span>
          )}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="text-[10.5px] tracking-wide uppercase">{t("marketplace:library.namespace")}</span>
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11.5px] text-foreground">
              {item.namespace}
            </code>
            <button
              type="button"
              onClick={copyNamespace}
              title={t("marketplace:library.copyNamespaceHint")}
              aria-label={t("marketplace:library.copyNamespaceAria")}
              className="rounded p-0.5 text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
            >
              {copied ? <Check className="size-3 text-ok" /> : <Copy className="size-3" />}
            </button>
          </span>
          {item.types.length > 0 && (
            <span className="font-mono">
              {t("marketplace:library.type", { count: item.types.length })}: {item.types.join(", ")}
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
            {rich(t("marketplace:library.moduleOf"), {
              code: <code className="font-mono" />,
              parent: mono(item.moduleOf),
              parentQuoted: mono(`"${item.moduleOf}"`),
            })}
          </p>
        )}

        {item.origin === "browser" && (
          <p className="mt-1.5 text-xs text-muted-foreground">
            {t("marketplace:library.browserInstalled", {
              ids:
                item.browserInstallIds && item.browserInstallIds.length > 0
                  ? `: ${item.browserInstallIds.join(", ")}`
                  : "",
            })}
          </p>
        )}

        {item.status === "paused" && (
          <p className="mt-1.5 text-xs text-muted-foreground">{t("marketplace:library.pausedText")}</p>
        )}

        {item.status === "disabled" && (
          <p className="mt-1.5 text-xs text-muted-foreground">
            {item.disabledReason === "runtime-switch"
              ? rich(t("marketplace:library.disabledBySwitch"), {
                  switch: mono(`config.plugins.${item.namespace}.enabled: false`),
                })
              : rich(t("marketplace:library.disabledNotListed"), {
                  code: <code className="font-mono" />,
                  namespaceQuoted: mono(`"${item.namespace}"`),
                })}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1.5 self-center">
        {canTry && onTry && (
          <ActionPill onClick={() => onTry(item)} title={t("marketplace:hints.previewInTabOnly")}>
            <FlaskConical className="size-3.5" /> {t("marketplace:actions.tryIt")}
          </ActionPill>
        )}
        {item.status === "trial" && (
          <ActionPill onClick={() => endTrial(item.namespace)} title={t("marketplace:hints.unloadFromTab")}>
            {t("marketplace:actions.endTrial")}
          </ActionPill>
        )}
      </div>
    </div>
  );
};

export { LibraryRow };
