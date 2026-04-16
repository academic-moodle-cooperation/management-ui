/**
 * Plugin Runtime API version shipped by this host.
 *
 * Semantics (see docs/architecture/CONTRACTS.md):
 * - Patch: no plugin-observable behaviour change.
 * - Minor: new capabilities added; existing plugins continue to work unchanged.
 * - Major: removal or behaviour change that may break existing plugins.
 *
 * Plugins declare the minimum version they require via `apiVersion` in plugin.json.
 * The host loader refuses plugins whose required major does not match this host's major,
 * or whose minor is higher than this host's minor.
 */
export const PLUGIN_API_VERSION = "1.0.0" as const;

export interface ParsedSemver {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
}

/**
 * Parse a strict semver string (MAJOR.MINOR.PATCH, optional prerelease).
 * Returns null if the input is not a valid semver.
 */
export function parseSemver(input: string | undefined | null): ParsedSemver | null {
  if (typeof input !== "string") return null;
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.]+))?$/.exec(input.trim());
  if (!match) return null;
  const [, majorStr, minorStr, patchStr, prerelease] = match;
  const result: ParsedSemver = {
    major: Number(majorStr),
    minor: Number(minorStr),
    patch: Number(patchStr),
  };
  if (prerelease !== undefined) {
    result.prerelease = prerelease;
  }
  return result;
}

export interface ApiVersionCheckResult {
  compatible: boolean;
  /** Human-readable reason when incompatible. */
  reason?: string;
}

/**
 * Check whether a plugin declaring `requiredApiVersion` can run against this host.
 *
 * A missing `requiredApiVersion` is treated as "1.0.0" (i.e. plugin opts into baseline API).
 * This is compatible with all 1.x hosts and will remain compatible even after the 1.x → 2.x bump
 * only if the plugin was written against 1.0 semantics; the loader still refuses it to be safe.
 *
 * Rules:
 * - If required major != host major → incompatible.
 * - If required minor > host minor → incompatible (plugin asks for features this host lacks).
 * - Otherwise compatible.
 */
export function checkApiVersionCompatibility(
  requiredApiVersion: string | undefined | null,
  hostApiVersion: string = PLUGIN_API_VERSION,
): ApiVersionCheckResult {
  const host = parseSemver(hostApiVersion);
  if (!host) {
    return {
      compatible: false,
      reason: `Host API version "${hostApiVersion}" is not a valid semver`,
    };
  }

  const requiredRaw =
    typeof requiredApiVersion === "string" && requiredApiVersion.trim() !== ""
      ? requiredApiVersion
      : "1.0.0";
  const required = parseSemver(requiredRaw);
  if (!required) {
    return {
      compatible: false,
      reason: `Plugin apiVersion "${requiredApiVersion}" is not a valid semver`,
    };
  }

  if (required.major !== host.major) {
    return {
      compatible: false,
      reason: `Plugin requires API major ${required.major}, host provides ${host.major}`,
    };
  }

  if (required.minor > host.minor) {
    return {
      compatible: false,
      reason: `Plugin requires API minor version >=${required.major}.${required.minor}, host provides ${host.major}.${host.minor}`,
    };
  }

  return { compatible: true };
}
