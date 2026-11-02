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
import type { PluginManager } from "@oc-mui/plugin-system";
import { loadAndRegister } from "@oc-mui/remote-plugin-loader";
import { logger } from "@oc-mui/utils";

import { validateTryPlugin } from "./security";

import type { TryConfig } from "../config";
import type { RegistryPlugin } from "./registry";

const log = logger.child({ component: "marketplace-v2/trials" });

const TRIALS_KEY = "mui.marketplace-v2.trials";
const ERRORS_KEY = "mui.marketplace-v2.trial-errors";

/** The slice of a registry entry a trial needs to replay at boot. */
export interface Trial {
  id: string;
  name: string;
  version: string;
  url: string;
  integrity?: string;
  workspaceDependencies?: Record<string, string>;
  apiVersion?: string;
  localesUrl?: string;
  i18nNamespaces?: string[];
  startedAt: string;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function getTrials(): Trial[] {
  return readJson<Trial[]>(TRIALS_KEY, []);
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

/**
 * Record a trial and reload so it loads through the boot path.
 * Caller is responsible for having confirmed with the user first.
 */
export function startTrial(plugin: RegistryPlugin): void {
  const trials = getTrials().filter((t) => t.id !== plugin.id);
  trials.push({
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
  });
  writeTrials(trials);
  window.location.reload();
}

/** End one trial (or all) and reload to unload the code. */
export function endTrial(pluginId: string): void {
  writeTrials(getTrials().filter((t) => t.id !== pluginId));
  const errors = getTrialErrors();
  delete errors[pluginId];
  writeErrors(errors);
  window.location.reload();
}

export function endAllTrials(): void {
  sessionStorage.removeItem(TRIALS_KEY);
  sessionStorage.removeItem(ERRORS_KEY);
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

  for (const trial of trials) {
    const gate = validateTryPlugin(trial, cfg);
    if (!gate.valid) {
      errors[trial.id] = gate.error ?? "Blocked by deployment policy.";
      log.warn(`trial "${trial.id}" blocked: ${errors[trial.id]}`);
      continue;
    }

    const result = await loadAndRegister(trial.url, manager, {
      ...(trial.integrity && { integrity: trial.integrity }),
    });

    if (!result.success) {
      errors[trial.id] = result.error ?? "Failed to load.";
      log.warn(`trial "${trial.id}" failed to load: ${errors[trial.id]}`);
      continue;
    }

    if (trial.localesUrl && trial.i18nNamespaces?.length) {
      registerPluginI18nNamespaces(trial.i18nNamespaces, trial.localesUrl);
    }
    log.info(`trial "${trial.id}" active (this tab only)`);
  }

  writeErrors(errors);
}
