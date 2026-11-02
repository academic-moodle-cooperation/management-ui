/**
 * Inventory — "what is on this deployment, and is it running?"
 *
 * Pure derivation over the sources the host already exposes; nothing here
 * loads or changes anything. Sources, in order of trust:
 *
 * - `manager.plugins`                — what is actually registered (the truth)
 * - `marketplace.getAllPlugins`      — every bundled plugin, incl. config-disabled
 * - `/management-tool/ui/config/plugins.json` — the deployment's JAR plugins
 * - `/local-plugins/manifest.json`   — `.local-plugins` (dev only)
 * - the tab's trials (sessionStorage)
 *
 * Plugin names are `<namespace>:<type>`; `app.enabledPlugins` lists
 * namespaces — which is exactly the value an operator needs to copy, so the
 * inventory surfaces it verbatim.
 */

import type { Plugin, PluginManager } from "@oc-mui/plugin-system";

import type { RegistryPlugin } from "./registry";
import type { Trial } from "./trials";

export type InventoryOrigin = "builtin" | "jar" | "local" | "trial" | "shell";
export type InventoryStatus = "active" | "trial" | "disabled";

export interface InventoryItem {
  /** Stable key: `<origin>:<namespace>`. One row per namespace — the unit `app.enabledPlugins` works in. */
  key: string;
  /** Human-readable name (registry name when known, else derived from the namespace). */
  displayName: string;
  namespace: string;
  /** Module types this namespace ships (`app`, `header`, …); a plugin may ship several. */
  types: string[];
  version?: string;
  origin: InventoryOrigin;
  status: InventoryStatus;
  /** Why a present plugin isn't running. */
  disabledReason?: "not-in-enabledPlugins" | "runtime-switch";
  /** Registry entry with the same id as the namespace, if any. */
  registryEntry?: RegistryPlugin;
  /** Set when the registry knows a newer version than the one present. */
  registryNewer?: string;
  /** Bundle URL for JAR / local / trial entries. */
  url?: string;
}

/** The slice of AppConfig the inventory reads — structural, to stay decoupled. */
export interface InventoryConfig {
  app?: { enabledPlugins?: string[] | undefined } | undefined;
  plugins?: Record<string, unknown> | undefined;
  api?: { baseUrl?: string | undefined } | undefined;
  productionAppPluginUrl?: string | undefined;
}

export interface JarEntry {
  name: string;
  namespace?: string;
  type?: string;
  url: string;
  version?: string;
}

export interface LocalEntry {
  name: string;
  id: string;
  url: string;
}

export interface InventorySources {
  registered: ReadonlyMap<string, Plugin>;
  bundled: Plugin[];
  jars: JarEntry[];
  locals: LocalEntry[];
  trials: Trial[];
  catalog: RegistryPlugin[];
  config: InventoryConfig | undefined;
}

/* ------------------------------------------------------------------ helpers */

export function splitName(name: string): { namespace: string; type?: string } {
  const idx = name.indexOf(":");
  if (idx === -1) return { namespace: name };
  return { namespace: name.slice(0, idx), type: name.slice(idx + 1) };
}

/** `live-polls` → `Live Polls`. */
export function humanize(namespace: string): string {
  return namespace
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** True when `candidate` is a strictly newer semver than `current`. */
export function isNewerVersion(candidate: string, current: string): boolean {
  const parse = (v: string): [number, number, number] => {
    const m = /^(\d+)\.(\d+)\.(\d+)/.exec(v.replace(/^v/, ""));
    return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : [0, 0, 0];
  };
  const [a1, a2, a3] = parse(candidate);
  const [b1, b2, b3] = parse(current);
  if (a1 !== b1) return a1 > b1;
  if (a2 !== b2) return a2 > b2;
  return a3 > b3;
}

/** Mirrors the shell's two-level gate: namespace allowlist, then runtime switch. */
export function disabledReasonFor(
  namespace: string,
  config: InventoryConfig | undefined,
): InventoryItem["disabledReason"] | undefined {
  const list = config?.app?.enabledPlugins;
  if (list && list.length > 0 && !list.includes(namespace)) return "not-in-enabledPlugins";
  // The inventory reads only the host-defined `enabled` flag of *every* slice,
  // read-only, to explain why a present plugin isn't running — the same check
  // the shell's isPluginEnabledAtRuntime performs. No slice content is consumed.
  // eslint-disable-next-line local/no-cross-plugin-config
  const slice = config?.plugins?.[namespace];
  if (slice && typeof slice === "object" && (slice as { enabled?: unknown }).enabled === false) {
    return "runtime-switch";
  }
  return undefined;
}

/* ------------------------------------------------------------------ build */

interface Draft {
  origin: InventoryOrigin;
  namespace: string;
  displayName?: string;
  types: Set<string>;
  versions: Set<string>;
  registeredAny: boolean;
  url?: string;
}

export function buildInventory(sources: InventorySources): InventoryItem[] {
  const { registered, bundled, jars, locals, trials, catalog, config } = sources;
  const byId = new Map(catalog.map((p) => [p.id, p]));
  const trialIds = new Set(trials.map((t) => t.id));
  const drafts = new Map<string, Draft>();

  const draft = (origin: InventoryOrigin, namespace: string): Draft => {
    const key = `${origin}:${namespace}`;
    let d = drafts.get(key);
    if (!d) {
      d = { origin, namespace, types: new Set(), versions: new Set(), registeredAny: false };
      drafts.set(key, d);
    }
    return d;
  };
  const registeredNamespaces = new Set([...registered.keys()].map((n) => splitName(n).namespace));
  const explained = new Set<string>();

  // 1. Trials — matched by registry id; always grouped under "trial".
  for (const trial of trials) {
    const d = draft("trial", trial.id);
    d.displayName = trial.name;
    d.versions.add(trial.version);
    d.url = trial.url;
    d.registeredAny = true;
    explained.add(trial.id);
  }

  // 2. Bundled (in-tree) — present whether or not config enables them.
  for (const plugin of bundled) {
    const { namespace, type } = splitName(plugin.name);
    if (trialIds.has(namespace)) continue;
    const d = draft("builtin", namespace);
    if (type) d.types.add(type);
    d.versions.add(plugin.version);
    if (registered.has(plugin.name)) d.registeredAny = true;
    explained.add(namespace);
  }

  // 3. JAR plugins from the deployment.
  for (const jar of jars) {
    const namespace = jar.namespace ?? splitName(jar.name).namespace;
    if (trialIds.has(namespace) || explained.has(namespace)) continue;
    const d = draft("jar", namespace);
    if (!jar.name.includes(":")) d.displayName = jar.name;
    if (jar.type) d.types.add(jar.type);
    if (jar.version) d.versions.add(jar.version);
    d.url = jar.url;
    if (registeredNamespaces.has(namespace)) {
      d.registeredAny = true;
      for (const [name, p] of registered) {
        const parts = splitName(name);
        if (parts.namespace === namespace) {
          if (parts.type) d.types.add(parts.type);
          d.versions.add(p.version);
        }
      }
    }
    explained.add(namespace);
  }

  // 4. `.local-plugins` (dev only).
  for (const local of locals) {
    const namespace = local.id || splitName(local.name).namespace;
    if (trialIds.has(namespace) || explained.has(namespace)) continue;
    const d = draft("local", namespace);
    if (local.name) d.displayName = local.name;
    d.url = local.url;
    if (registeredNamespaces.has(namespace)) {
      d.registeredAny = true;
      for (const [name, p] of registered) {
        const parts = splitName(name);
        if (parts.namespace === namespace) {
          if (parts.type) d.types.add(parts.type);
          d.versions.add(p.version);
        }
      }
    }
    explained.add(namespace);
  }

  // 5. Registered but explained by none of the above: the shell's own
  //    infrastructure plugins. Shown so the list never lies by omission.
  for (const [name, plugin] of registered) {
    const { namespace, type } = splitName(name);
    if (explained.has(namespace) || trialIds.has(namespace)) continue;
    const d = draft("shell", namespace);
    if (type) d.types.add(type);
    d.versions.add(plugin.version);
    d.registeredAny = true;
  }

  const items: InventoryItem[] = [];
  for (const [key, d] of drafts) {
    const entry = byId.get(d.namespace);
    const versions = [...d.versions];
    const version = versions.length === 1 ? versions[0] : versions[0];
    const status: InventoryStatus = d.origin === "trial" ? "trial" : d.registeredAny ? "active" : "disabled";
    const reason = status === "disabled" ? disabledReasonFor(d.namespace, config) : undefined;
    const item: InventoryItem = {
      key,
      displayName: entry?.name ?? d.displayName ?? humanize(d.namespace),
      namespace: d.namespace,
      types: [...d.types].sort(),
      ...(version !== undefined && { version }),
      origin: d.origin,
      status,
      ...(reason && { disabledReason: reason }),
      ...(entry && { registryEntry: entry }),
      ...(d.url !== undefined && { url: d.url }),
    };
    if (entry && version && isNewerVersion(entry.version, version)) {
      item.registryNewer = entry.version;
    }
    items.push(item);
  }

  const originRank: Record<InventoryOrigin, number> = { trial: 0, jar: 1, local: 2, builtin: 3, shell: 4 };
  return items.sort(
    (a, b) => originRank[a.origin] - originRank[b.origin] || a.displayName.localeCompare(b.displayName),
  );
}

/* ------------------------------------------------------------------ fetchers */

function appBase(config: InventoryConfig | undefined): string {
  const raw = config?.api?.baseUrl ?? import.meta.env.BASE_URL ?? "/";
  return (typeof raw === "string" ? raw : "/").replace(/\/$/, "");
}

/** The deployment's JAR plugin list — same resolution the shell uses. */
export async function fetchJarEntries(config: InventoryConfig | undefined): Promise<JarEntry[]> {
  const production = config?.productionAppPluginUrl;
  const url = production?.includes("plugins.json")
    ? production.replace(/\/$/, "")
    : `${appBase(config)}/management-tool/ui/config/plugins.json`;
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      plugins?: Array<{ name: string; namespace?: string; type?: string; scriptUrl?: string; path?: string; version?: string }>;
    };
    return (data.plugins ?? []).map((p) => ({
      name: p.name,
      ...(p.namespace !== undefined && { namespace: p.namespace }),
      ...(p.type !== undefined && { type: p.type }),
      ...(p.version !== undefined && { version: p.version }),
      url: p.scriptUrl ?? p.path ?? "",
    }));
  } catch {
    return [];
  }
}

/** `.local-plugins` manifest — dev server only. */
export async function fetchLocalEntries(): Promise<LocalEntry[]> {
  if (!import.meta.env.DEV || typeof window === "undefined") return [];
  const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
  try {
    const res = await fetch(`${base}/local-plugins/manifest.json`);
    if (!res.ok) return [];
    const data = (await res.json()) as { plugins?: LocalEntry[] };
    return data.plugins ?? [];
  } catch {
    return [];
  }
}

/** Every bundled plugin the shell knows about, enabled or not. */
export function bundledPlugins(manager: PluginManager): Plugin[] {
  return manager.executeFunction<Plugin[]>("marketplace.getAllPlugins") ?? [];
}
