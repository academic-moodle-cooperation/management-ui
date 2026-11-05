import { Check, CircleDashed, FlaskConical, Minus, PauseCircle } from "lucide-react";

import type { InventoryStatus } from "../services/inventory";
import type { FC, ReactElement } from "react";

interface ExtendsRequiresProps {
  /** Extension points the plugin populates. */
  extensionPoints?: string[] | undefined;
  /** Plugin ids the plugin needs present. */
  pluginDependencies?: string[] | undefined;
  /** What this deployment has, by namespace — decides each dependency's state. */
  presence: ReadonlyMap<string, InventoryStatus>;
  /** `row`: one compact line (Library). `block`: two labelled rows (dialog). */
  layout?: "row" | "block";
}

const DEP_STATE: Record<InventoryStatus | "missing", { label: string; className: string; Icon: FC<{ className?: string }> }> = {
  active: { label: "present", className: "text-ok", Icon: Check },
  trial: { label: "in this tab", className: "text-warning", Icon: FlaskConical },
  disabled: { label: "present, switched off", className: "text-warning", Icon: CircleDashed },
  paused: { label: "paused in this tab", className: "text-warning", Icon: PauseCircle },
  missing: { label: "not on this deployment", className: "text-muted-foreground", Icon: Minus },
};

/**
 * "Extends" answers *where does it plug in*; "Requires" answers *is it a
 * plugin for a plugin, and is that plugin here*. Both come from the manifest
 * (`extensionPoints`, `pluginDependencies`) — for running plugins the live
 * registry is the source instead.
 */
const ExtendsRequires: FC<ExtendsRequiresProps> = ({
  extensionPoints,
  pluginDependencies,
  presence,
  layout = "block",
}) => {
  const points = extensionPoints ?? [];
  const deps = pluginDependencies ?? [];
  if (points.length === 0 && deps.length === 0) return null;

  const label = (text: string): ReactElement => (
    <span className="w-16 shrink-0 pt-px text-[10.5px] font-semibold tracking-wide text-muted-foreground uppercase">
      {text}
    </span>
  );
  const chips = points.map((pt) => (
    <code key={pt} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground">
      {pt}
    </code>
  ));
  const depItems = deps.map((dep) => {
    const state = DEP_STATE[presence.get(dep) ?? "missing"];
    return (
      <span key={dep} className="flex items-center gap-1 text-xs" title={state.label}>
        <state.Icon className={`size-3 ${state.className}`} />
        <code className="font-mono text-[11px] text-foreground">{dep}</code>
        {layout === "block" && <span className={`${state.className}`}>· {state.label}</span>}
      </span>
    );
  });

  if (layout === "row") {
    return (
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {points.length > 0 && (
          <span className="flex flex-wrap items-center gap-1">
            <span className="text-[10.5px] tracking-wide uppercase">extends</span>
            {chips}
          </span>
        )}
        {deps.length > 0 && (
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10.5px] tracking-wide uppercase">requires</span>
            {depItems}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      {points.length > 0 && (
        <div className="flex items-start gap-3">
          {label("Extends")}
          <div className="flex flex-wrap gap-1">{chips}</div>
        </div>
      )}
      {deps.length > 0 && (
        <div className="flex items-start gap-3">
          {label("Requires")}
          <div className="flex flex-wrap gap-x-4 gap-y-1">{depItems}</div>
        </div>
      )}
    </div>
  );
};

export { ExtendsRequires };
