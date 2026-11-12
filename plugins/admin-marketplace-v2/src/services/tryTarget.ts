/**
 * What "Try it" on a catalog entry should actually do.
 *
 * A catalog entry may describe a plugin that is *already deployed here* as a
 * JAR (same id as its namespace). Then the honest trial is the local preview
 * — the host's own copy, through the preview contract, with the overlap/pause
 * logic — not fetching the bundle a second time. And when that copy is
 * already running, there is nothing to try.
 */

import { namespaceOf, type RegistryPlugin } from "./registry";

import type { InventoryItem } from "./inventory";

export type TryTarget =
  /** Not present here: fetch the registry bundle (remote trial). */
  | { kind: "remote" }
  /** Deployed here but off (or paused): preview the local copy. */
  | { kind: "local"; item: InventoryItem }
  /** Deployed here and running, or already on trial — nothing to try. */
  | { kind: "present"; status: "active" | "trial"; item: InventoryItem };

export function resolveTryTarget(
  plugin: Pick<RegistryPlugin, "id" | "namespace">,
  inventory: readonly InventoryItem[],
): TryTarget {
  const namespace = namespaceOf(plugin);
  const item = inventory.find((i) => i.namespace === namespace && i.origin !== "shell");
  if (!item) return { kind: "remote" };
  if (item.status === "active" || item.status === "trial") return { kind: "present", status: item.status, item };
  return { kind: "local", item };
}
