/**
 * Security gates for the Try gesture (v2).
 *
 * Ported from v1's SecurityService with two deliberate changes:
 *
 * - **Pure functions, no mutable singleton.** The allowlist comes from the
 *   validated config slice on every call — nothing can widen it at runtime.
 * - **No persistence-related paths.** v2 has no permanent install; every
 *   execution of remote code sits behind a click in an admin session (plus
 *   the session-scoped trial replay, which re-validates on every boot).
 *
 * Gate order (all fail-closed): opt-in switch → URL (protocol, HTTPS,
 * allowlist) → workspace-dependency majors → plugin API version →
 * integrity presence (when required).
 */

import {
  checkApiVersionCompatibility,
  checkSharedDependencyCompatibility,
} from "@oc-mui/plugin-system";

import type { TryConfig } from "../config";
import type { RegistryPlugin } from "./registry";

export interface ValidationResult {
  valid: boolean;
  error?: string;
  warnings: string[];
}

const DEV_ONLY_DOMAINS = ["localhost", "127.0.0.1", "0.0.0.0"];

function isDevelopment(): boolean {
  if (typeof import.meta !== "undefined" && import.meta.env) {
    return import.meta.env.DEV === true || import.meta.env.MODE === "development";
  }
  return false;
}

/** All hostnames bundles may be fetched from (dev adds localhost). */
export function allowedDomains(cfg: TryConfig): string[] {
  return isDevelopment() ? [...cfg.allowedDomains, ...DEV_ONLY_DOMAINS] : [...cfg.allowedDomains];
}

function isHostnameAllowed(hostname: string, cfg: TryConfig): boolean {
  return allowedDomains(cfg).some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
  );
}

/**
 * May a catalog image (screenshot) be loaded from `url`? Same-origin assets
 * are trusted as deployed; anything else must sit on an allowlisted host (and
 * on HTTPS in production). Images execute nothing, but loading one still
 * tells its host who is browsing — the allowlist keeps that bounded to hosts
 * the deployment already trusts for code.
 */
export function isAllowedAssetUrl(url: string, cfg: TryConfig): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url, typeof window !== "undefined" ? window.location.href : undefined);
  } catch {
    return false;
  }
  if (typeof window !== "undefined" && parsed.origin === window.location.origin) return true;
  if (!["http:", "https:"].includes(parsed.protocol)) return false;
  if (parsed.protocol === "http:" && !isDevelopment() && !cfg.allowInsecureHttp) return false;
  return isHostnameAllowed(parsed.hostname, cfg);
}

/** Validate a bundle URL against protocol, HTTPS policy, and the allowlist. */
export function validateTryUrl(url: string, cfg: TryConfig): ValidationResult {
  const warnings: string[] = [];

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { valid: false, error: `Invalid URL format: ${url}`, warnings };
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return {
      valid: false,
      error: `Invalid protocol "${parsed.protocol}". Only http: and https: are allowed.`,
      warnings,
    };
  }

  if (parsed.protocol === "http:" && !isDevelopment() && !cfg.allowInsecureHttp) {
    return {
      valid: false,
      error: "HTTPS is required in production. HTTP URLs are not allowed.",
      warnings,
    };
  }

  if (!isHostnameAllowed(parsed.hostname, cfg)) {
    return {
      valid: false,
      error:
        `Domain "${parsed.hostname}" is not in the allowed list. ` +
        `Allowed domains: ${allowedDomains(cfg).join(", ")}`,
      warnings,
    };
  }

  if (parsed.protocol === "http:") {
    warnings.push("Bundle is served over plain HTTP — fine for dev, use HTTPS in production.");
  }

  return { valid: true, warnings };
}

/**
 * Validate a full registry entry for the Try gesture: opt-in, URL,
 * compatibility, and (when required) integrity presence.
 */
export function validateTryPlugin(
  plugin: Pick<
    RegistryPlugin,
    "id" | "url" | "workspaceDependencies" | "apiVersion" | "integrity"
  >,
  cfg: TryConfig,
): ValidationResult {
  const warnings: string[] = [];

  if (!cfg.enabled) {
    return {
      valid: false,
      error:
        "The Try gesture is disabled for this deployment. An administrator can enable it by " +
        'setting plugins["admin-marketplace-v2"].try.enabled to true in config.json.',
      warnings,
    };
  }

  const urlResult = validateTryUrl(plugin.url, cfg);
  if (!urlResult.valid) return urlResult;
  warnings.push(...urlResult.warnings);

  if (plugin.workspaceDependencies) {
    const declared: Record<string, string> = {};
    for (const [name, range] of Object.entries(plugin.workspaceDependencies)) {
      if (typeof range === "string") declared[name] = range;
    }
    const compat = checkSharedDependencyCompatibility(declared);
    if (compat.unknown?.length) {
      warnings.push(
        `Cannot verify compatibility for ${compat.unknown.join(", ")}: not part of the host's shared runtime.`,
      );
    }
    if (!compat.compatible) {
      return {
        valid: false,
        error: (compat.incompatibilities ?? []).map((i) => i.reason).join(" "),
        warnings,
      };
    }
  }

  if (plugin.apiVersion !== undefined) {
    const api = checkApiVersionCompatibility(plugin.apiVersion);
    if (!api.compatible) {
      return {
        valid: false,
        error: `Plugin "${plugin.id}" rejected: ${api.reason ?? "incompatible plugin runtime API version"}.`,
        warnings,
      };
    }
  }

  if (cfg.requireIntegrity && !plugin.integrity) {
    return {
      valid: false,
      error:
        `Plugin "${plugin.id}" carries no integrity hash, and this deployment requires pinned ` +
        "builds (try.requireIntegrity). Ask the registry to pin the bundle.",
      warnings,
    };
  }
  if (!plugin.integrity) {
    warnings.push("This entry is not integrity-pinned — the bundle host is trusted as served.");
  }

  return { valid: true, warnings };
}
