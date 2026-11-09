/**
 * Trial management for the Try gesture.
 *
 * Design (see README / the feature discussion): a trial must go through the
 * boot path to actually work — routes, config defaults, and i18n are consumed
 * at app start, so a plugin loaded mid-session registers into lists nobody
 * re-reads. "Try" therefore records a marker and reloads the page; on boot the
 * marker is re-validated against every security gate and the plugin loads
 * like a built-in one.
 *
 * The marker lives in **`sessionStorage`**: it survives reloads in this tab
 * but dies with it. The ephemerality is enforced by the browser, not by UI
 * copy — and the only auto-load path in v2 is tab-scoped, short-lived, and
 * re-validated on every boot.
 */

import { registerPluginI18nNamespaces } from "@oc-mui/i18n";
import {
  addPluginPause,
  addPluginPreview,
  getAllApps,
  removePluginPause,
  removePluginPreview,
  writePluginPauses,
  writePluginPreviews,
} from "@oc-mui/plugin-system";
import type { AppDefinition, PluginManager } from "@oc-mui/plugin-system";
import { loadAndRegister } from "@oc-mui/remote-plugin-loader";
import { logger } from "@oc-mui/utils";

import { validateTryPlugin } from "./security";

import type { TryConfig } from "../config";
import type { RegistryPlugin } from "./registry";

const log = logger.child({ component: "marketplace-v2/trials" });

const TRIALS_KEY = "mui.marketplace-v2.trials";
const ERRORS_KEY = "mui.marketplace-v2.trial-errors";
/** Per trial id: the apps its bundle registered at boot (for route-collision reporting). */
const APPS_KEY = "mui.marketplace-v2.trial-apps";

/** What a trial's bundle registered on `apps:definitions`. */
export interface TrialApp {
  id: string;
  routePath: string;
}

interface TrialBase {
  id: string;
  name: string;
  version: string;
  startedAt: string;
  /**
   * Namespaces paused in this tab for the trial's sake (plugins that fill the
   * same slots). Restored when the trial ends.
   */
  paused?: string[];
}

export interface TrialOptions {
  /** Namespaces to pause in this tab while the trial runs. */
  pause?: string[];
}

/** A registry bundle loaded ephemerally into this tab (the Explore gesture). */
export interface RemoteTrial extends TrialBase {
  kind: "remote";
  url: string;
  integrity?: string;
  workspaceDependencies?: Record<string, string>;
  apiVersion?: string;
  localesUrl?: string;
  i18nNamespaces?: string[];
}

/**
 * A plugin already present on the deployment but switched off by config,
 * previewed in this tab (the Library gesture). No code is fetched by us: the
 * host honours the namespace via `@oc-mui/plugin-system`'s preview contract.
 * `id` is the namespace.
 */
export interface LocalTrial extends TrialBase {
  kind: "local";
}

export type Trial = RemoteTrial | LocalTrial;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function getTrials(): Trial[] {
  // Entries written before `kind` existed are remote trials. A deployed plugin
  // may carry no version at all (plugins.json has none) — an empty string is a
  // valid trial, not a malformed one; dropping it would hide the End button.
  return readJson<Array<Partial<Trial> & { url?: string }>>(TRIALS_KEY, []).flatMap((t) =>
    t.id && t.name && typeof t.version === "string" && t.startedAt
      ? [{ ...t, kind: t.kind ?? "remote" } as Trial]
      : [],
  );
}

export function isTrialActive(pluginId: string): boolean {
  return getTrials().some((t) => t.id === pluginId);
}

/** Boot-time load errors per trial id, for the banner. */
export function getTrialErrors(): Record<string, string> {
  return readJson<Record<string, string>>(ERRORS_KEY, {});
}

function writeTrials(trials: Trial[]): void {
  sessionStorage.setItem(TRIALS_KEY, JSON.stringify(trials));
}

function writeErrors(errors: Record<string, string>): void {
  sessionStorage.setItem(ERRORS_KEY, JSON.stringify(errors));
}

/** Apps each trial registered at boot, keyed by trial id. */
export function getTrialApps(): Record<string, TrialApp[]> {
  return readJson<Record<string, TrialApp[]>>(APPS_KEY, {});
}

function writeTrialApps(apps: Record<string, TrialApp[]>): void {
  sessionStorage.setItem(APPS_KEY, JSON.stringify(apps));
}

/** `/support/` and `support` are one route to the router. */
function normalizeRoutePath(routePath: string): string {
  const trimmed = routePath.trim().replace(/\/+$/, "");
  if (trimmed === "") return "/";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

/** Apps currently registered, or none when the apps registry is not available. */
function currentApps(manager: PluginManager): Array<Pick<AppDefinition, "id" | "routePath">> {
  try {
    return getAllApps(manager).map((a) => ({ id: a.id, routePath: a.routePath }));
  } catch {
    return [];
  }
}

/**
 * A trial whose app lands on a route another app already serves is not a
 * load error — the bundle ran fine — but only one of the two is reachable,
 * and the shell decides which. Name it on the trial so End trial is the
 * obvious way out. Pure: both inputs come from the caller.
 */
export function findRouteCollisions(
  trialApps: Record<string, TrialApp[]>,
  allApps: ReadonlyArray<Pick<AppDefinition, "id" | "routePath">>,
): Record<string, string> {
  const collisions: Record<string, string> = {};
  for (const [trialId, apps] of Object.entries(trialApps)) {
    const own = new Set(apps.map((a) => a.id));
    for (const app of apps) {
      const path = normalizeRoutePath(app.routePath);
      const other = allApps.find((a) => !own.has(a.id) && normalizeRoutePath(a.routePath) === path);
      if (other) {
        collisions[trialId] = `Shares route ${path} with "${other.id}"; only one of them is reachable in this tab.`;
        break;
      }
    }
  }
  return collisions;
}

/** Route collisions of this tab's trials against everything registered now. */
export function getTrialCollisions(manager: PluginManager): Record<string, string> {
  const trialApps = getTrialApps();
  if (Object.keys(trialApps).length === 0) return {};
  return findRouteCollisions(trialApps, currentApps(manager));
}

/**
 * Record a trial and reload so it loads through the boot path.
 * Caller is responsible for having confirmed with the user first.
 */
export function startTrial(plugin: RegistryPlugin, options: TrialOptions = {}): void {
  const trials = getTrials().filter((t) => t.id !== plugin.id);
  const paused = pauseFor(options);
  trials.push({
    kind: "remote",
    id: plugin.id,
    name: plugin.name,
    version: plugin.version,
    url: plugin.url,
    ...(plugin.integrity && { integrity: plugin.integrity }),
    ...(plugin.workspaceDependencies && { workspaceDependencies: plugin.workspaceDependencies }),
    ...(plugin.apiVersion && { apiVersion: plugin.apiVersion }),
    ...(plugin.localesUrl && { localesUrl: plugin.localesUrl }),
    ...(plugin.i18nNamespaces?.length && { i18nNamespaces: plugin.i18nNamespaces }),
    startedAt: new Date().toISOString(),
    ...(paused.length > 0 && { paused }),
  });
  writeTrials(trials);
  window.location.reload();
}

/** Register the pauses with the host contract; returns the list recorded on the trial. */
function pauseFor(options: TrialOptions): string[] {
  const paused = [...new Set((options.pause ?? []).filter((n) => n.length > 0))];
  for (const ns of paused) addPluginPause(ns);
  return paused;
}

/**
 * Preview a plugin that is present on this deployment but disabled by config:
 * record the trial, register the namespace with the host's preview contract,
 * and reload so it goes through the boot path like an enabled plugin.
 */
export function startLocalTrial(
  plugin: { namespace: string; name: string; version?: string },
  options: TrialOptions = {},
): void {
  const trials = getTrials().filter((t) => t.id !== plugin.namespace);
  const paused = pauseFor(options);
  trials.push({
    kind: "local",
    id: plugin.namespace,
    name: plugin.name,
    version: plugin.version ?? "",
    startedAt: new Date().toISOString(),
    ...(paused.length > 0 && { paused }),
  });
  writeTrials(trials);
  addPluginPreview(plugin.namespace);
  window.location.reload();
}

/**
 * End one trial and reload to unload the code. Pauses the trial held are
 * lifted — unless another trial in this tab still needs them.
 */
export function endTrial(pluginId: string): void {
  const all = getTrials();
  const ending = all.find((t) => t.id === pluginId);
  const remaining = all.filter((t) => t.id !== pluginId);
  writeTrials(remaining);
  removePluginPreview(pluginId);
  const stillNeeded = new Set(remaining.flatMap((t) => t.paused ?? []));
  for (const ns of ending?.paused ?? []) {
    if (!stillNeeded.has(ns)) removePluginPause(ns);
  }
  const errors = getTrialErrors();
  delete errors[pluginId];
  writeErrors(errors);
  const apps = getTrialApps();
  delete apps[pluginId];
  writeTrialApps(apps);
  window.location.reload();
}

export function endAllTrials(): void {
  sessionStorage.removeItem(TRIALS_KEY);
  sessionStorage.removeItem(ERRORS_KEY);
  sessionStorage.removeItem(APPS_KEY);
  writePluginPreviews([]);
  writePluginPauses([]);
  window.location.reload();
}

/**
 * Boot-time replay: load every recorded trial, re-validating each against the
 * current security gates first. Failures don't remove the marker — they are
 * surfaced in the trial banner so the admin sees *why* and can end the trial.
 */
export async function loadTrials(manager: PluginManager, cfg: TryConfig): Promise<void> {
  const trials = getTrials();
  if (trials.length === 0) return;

  const errors: Record<string, string> = {};
  const trialApps: Record<string, TrialApp[]> = {};

  for (const trial of trials) {
    // Local previews are loaded by the host itself (preview contract); nothing
    // to fetch here. Whether it actually registered shows in the Library.
    if (trial.kind === "local") continue;

    const gate = validateTryPlugin(trial, cfg);
    if (!gate.valid) {
      errors[trial.id] = gate.error ?? "Blocked by deployment policy.";
      log.warn(`trial "${trial.id}" blocked: ${errors[trial.id]}`);
      continue;
    }

    const before = new Set(currentApps(manager).map((a) => a.id));
    const result = await loadAndRegister(trial.url, manager, {
      ...(trial.integrity && { integrity: trial.integrity }),
    });

    if (!result.success) {
      errors[trial.id] = result.error ?? "Failed to load.";
      log.warn(`trial "${trial.id}" failed to load: ${errors[trial.id]}`);
      continue;
    }

    // Remember what the bundle registered: deployed plugins load after the
    // trials, so a route collision can only be judged later, at render time.
    trialApps[trial.id] = currentApps(manager).filter((a) => !before.has(a.id));

    if (trial.localesUrl && trial.i18nNamespaces?.length) {
      registerPluginI18nNamespaces(trial.i18nNamespaces, trial.localesUrl);
    }
    log.info(`trial "${trial.id}" active (this tab only)`);
  }

  writeErrors(errors);
  writeTrialApps(trialApps);
}
