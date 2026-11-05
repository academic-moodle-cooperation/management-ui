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
  /** For trials: a registry bundle, or a preview of a deployed-but-disabled plugin. */
  trialKind?: "remote" | "local";
  /**
   * Extension points this namespace populates: from the live registry for
   * anything registered (the truth), else from the manifest's declaration.
   */
  extensionPoints?: string[];
  /** Plugin ids the manifest says must be present. */
  pluginDependencies?: string[];
  /** Showcase fields from the plugin's own `plugin.json`, when it is served. */
  manifest?: ManifestShowcase;
}

/** The presentational subset of a `plugin.json` the marketplace reads. */
export interface ManifestShowcase {
  name?: string;
  description?: string;
  tagline?: string;
  accentColor?: string;
  icon?: string;
  category?: string;
  extensionPoints?: string[];
  pluginDependencies?: string[];
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
  /** Manifests fetched for deployed plugins, by namespace. */
  manifests?: ReadonlyMap<string, ManifestShowcase>;
  /** Extension points populated at runtime, by namespace (see `pointsByNamespace`). */
  livePoints?: ReadonlyMap<string, string[]>;
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

/**
 * Which namespace populates which extension points, from the registry's own
 * ids: `registerObject` prefixes every id with the plugin name
 * (`<namespace>:<type>`), so the first segment of an id is its namespace.
 */
export function pointsByNamespace(
  types: Array<{ type: string; ids: string[] }>,
): Map<string, string[]> {
  const out = new Map<string, Set<string>>();
  for (const { type, ids } of types) {
    for (const id of ids) {
      const namespace = id.split(":")[0];
      if (!namespace) continue;
      if (!out.has(namespace)) out.set(namespace, new Set());
      out.get(namespace)!.add(type);
    }
  }
  return new Map([...out].map(([ns, set]) => [ns, [...set].sort()]));
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
  trialKind?: "remote" | "local";
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
    d.trialKind = trial.kind;
    if (trial.version) d.versions.add(trial.version);
    if (trial.kind === "remote") d.url = trial.url;
    d.registeredAny = true;
    // A local preview's modules are registered under its namespace — show them.
    for (const [name, p] of registered) {
      const parts = splitName(name);
      if (parts.namespace === trial.id) {
        if (parts.type) d.types.add(parts.type);
        d.versions.add(p.version);
      }
    }
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
    const manifest = sources.manifests?.get(d.namespace);
    const live = sources.livePoints?.get(d.namespace);
    const points = live && live.length > 0 ? live : (manifest?.extensionPoints ?? entry?.extensionPoints);
    const deps = manifest?.pluginDependencies ?? entry?.pluginDependencies;
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
      ...(d.trialKind && { trialKind: d.trialKind }),
      ...(points && points.length > 0 && { extensionPoints: points }),
      ...(deps && deps.length > 0 && { pluginDependencies: deps }),
      ...(manifest && { manifest }),
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

const JAR_LIST_TTL_MS = 30_000;
const jarListCache = new Map<string, { at: number; pending: Promise<JarEntry[]> }>();

/**
 * The deployment's JAR plugin list — same resolution the shell uses. Cached
 * briefly per URL: the inventory and the theme list both need it, and their
 * effects re-run when the merged config settles.
 */
export function fetchJarEntries(config: InventoryConfig | undefined): Promise<JarEntry[]> {
  const production = config?.productionAppPluginUrl;
  const url = production?.includes("plugins.json")
    ? production.replace(/\/$/, "")
    : `${appBase(config)}/management-tool/ui/config/plugins.json`;
  const cached = jarListCache.get(url);
  if (cached && Date.now() - cached.at < JAR_LIST_TTL_MS) return cached.pending;
  const pending = fetchJarList(url);
  jarListCache.set(url, { at: Date.now(), pending });
  return pending;
}

async function fetchJarList(url: string): Promise<JarEntry[]> {
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

/** What is actually registered where, right now (the truth for active plugins). */
export function livePointsByNamespace(manager: PluginManager): Map<string, string[]> {
  const types = manager.executeFunction<string[]>("registry.getTypes") ?? [];
  return pointsByNamespace(
    types.map((type) => ({
      type,
      ids: (manager.executeFunction<Array<{ id: string }>>("registry.getObjects", type) ?? []).map(
        (o) => o.id,
      ),
    })),
  );
}

/** Where a deployed plugin's own `plugin.json` is served (same origin). */
export function manifestUrl(entry: { namespace: string; source: "jar" | "local" }, config: InventoryConfig | undefined): string {
  const base = entry.source === "jar" ? appBase(config) : (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
  return entry.source === "jar"
    ? `${base}/static/plugins/${entry.namespace}/plugin.json`
    : `${base}/local-plugins/${entry.namespace}/plugin.json`;
}

const SHOWCASE_KEYS: Array<keyof ManifestShowcase> = [
  "name",
  "description",
  "tagline",
  "accentColor",
  "icon",
  "category",
  "extensionPoints",
  "pluginDependencies",
];

/**
 * Fetch the manifests of deployed plugins — the backend serves each JAR's
 * `plugin.json` next to its bundle, the dev server does the same for
 * `.local-plugins`. Missing or unparsable files are simply absent.
 */
export async function fetchManifests(
  jars: JarEntry[],
  locals: LocalEntry[],
  config: InventoryConfig | undefined,
): Promise<Map<string, ManifestShowcase>> {
  const candidates = [
    ...jars.map((j) => ({ namespace: j.namespace ?? splitName(j.name).namespace, source: "jar" as const })),
    ...locals.map((l) => ({ namespace: l.id || splitName(l.name).namespace, source: "local" as const })),
  ].filter((c) => c.namespace);
  const seen = new Set<string>();
  const out = new Map<string, ManifestShowcase>();
  await Promise.all(
    candidates.map(async (c) => {
      if (seen.has(c.namespace)) return;
      seen.add(c.namespace);
      const showcase = await fetchManifest(manifestUrl(c, config));
      if (showcase) out.set(c.namespace, showcase);
    }),
  );
  return out;
}

const manifestCache = new Map<string, Promise<ManifestShowcase | null>>();

/** One request per manifest URL for the page's lifetime. */
function fetchManifest(url: string): Promise<ManifestShowcase | null> {
  let pending = manifestCache.get(url);
  if (!pending) {
    pending = (async () => {
      try {
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        if (!res.ok || !(res.headers.get("content-type") ?? "").includes("json")) return null;
        const raw = (await res.json()) as Record<string, unknown>;
        const showcase: ManifestShowcase = {};
        for (const key of SHOWCASE_KEYS) {
          const value = raw[key];
          if (value === undefined) continue;
          if (key === "extensionPoints" || key === "pluginDependencies") {
            if (Array.isArray(value)) showcase[key] = value.filter((v): v is string => typeof v === "string");
          } else if (typeof value === "string") {
            showcase[key] = value;
          }
        }
        return showcase;
      } catch {
        return null; // no manifest served — fine
      }
    })();
    manifestCache.set(url, pending);
  }
  return pending;
}
