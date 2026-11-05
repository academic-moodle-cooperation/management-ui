/**
 * Overlap detection for the Try gesture.
 *
 * Some slots only one plugin can meaningfully fill — the footer, the landing
 * page, the sidebar, the header. Two org plugins that both ship them don't
 * compose, they fight: whichever registers last wins, per slot. Before a
 * trial, the marketplace names the plugins already filling those slots on
 * this deployment and offers to pause them in this tab (see the preview
 * contract's `pauses` in `@oc-mui/plugin-system`).
 *
 * Slots are recognised from module types (`plugins.json` / manifest `type`)
 * and from the extension points a plugin declares or populates. The lists are
 * a heuristic, not a contract: unknown types never count as exclusive.
 */

import type { InventoryItem } from "./inventory";

/** Module types that fill a single slot. */
export const EXCLUSIVE_TYPES: Record<string, string> = {
  footer: "footer",
  header: "header",
  "landing-page": "landing page",
  sidebar: "sidebar",
  navigation: "navigation",
  layout: "layout",
  theme: "theme",
};

/** Extension points that fill a single slot. */
export const EXCLUSIVE_POINTS: Record<string, string> = {
  "app:footer": "footer",
  "appshell:header": "header",
  "app:branding": "branding",
};

/** Namespaces that ship the *defaults* for those slots — never a conflict. */
const DEFAULT_PROVIDERS = new Set(["core"]);

export interface SlotCandidate {
  namespace: string;
  types?: string[] | undefined;
  extensionPoints?: string[] | undefined;
}

export interface Conflict {
  namespace: string;
  displayName: string;
  /** Human-readable slot names both plugins fill. */
  slots: string[];
}

/** The exclusive slots a plugin fills, as readable names. */
export function exclusiveSlots(candidate: SlotCandidate): string[] {
  const slots = new Set<string>();
  for (const t of candidate.types ?? []) {
    const name = EXCLUSIVE_TYPES[t];
    if (name) slots.add(name);
  }
  for (const pt of candidate.extensionPoints ?? []) {
    const name = EXCLUSIVE_POINTS[pt];
    if (name) slots.add(name);
  }
  return [...slots].sort();
}

/**
 * Active plugins on this deployment that fill a slot the candidate also
 * fills. Pure: pass the inventory.
 */
export function findConflicts(candidate: SlotCandidate, inventory: readonly InventoryItem[]): Conflict[] {
  const wanted = new Set(exclusiveSlots(candidate));
  if (wanted.size === 0) return [];
  const out: Conflict[] = [];
  for (const item of inventory) {
    if (item.status !== "active" || item.origin === "shell") continue;
    if (item.namespace === candidate.namespace || DEFAULT_PROVIDERS.has(item.namespace)) continue;
    const shared = exclusiveSlots(item).filter((slot) => wanted.has(slot));
    if (shared.length > 0) out.push({ namespace: item.namespace, displayName: item.displayName, slots: shared });
  }
  return out;
}
