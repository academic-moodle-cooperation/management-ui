/**
 * Shared runtime dependencies — major versions the host provides to every
 * loaded plugin. The host loads exactly one copy of each; plugins must
 * consume the host's copy rather than bundling their own, otherwise
 * React contexts break, hooks become inconsistent, and `@opencast-mui/*`
 * contracts can't be enforced.
 *
 * Plugins declare the majors they target through `workspaceDependencies`
 * in their manifest. The host loader rejects plugins whose declared
 * major doesn't match the host's.
 *
 * Versioning rules (see docs/architecture/CONTRACTS.md):
 * - Adding a new entry: **minor** bump of `@opencast-mui/plugin-system`.
 * - Bumping any entry's major: **major** bump of `@opencast-mui/plugin-system`.
 * - Removing an entry: **major** bump.
 *
 * The list itself is the source of truth. It must stay in sync with:
 * - `SHARED_MODULE_NAMES` in `@opencast-mui/remote-plugin-loader/src/transform.ts`
 *   (which controls which imports are rewritten to `window.__SHARED_MODULES__`).
 * - The actually-installed majors in the workspace.
 *
 * The export shape is a `Record<string, number>` of major numbers, not full
 * semvers, because the only thing the host promises is the *major*. Patches
 * and minors of a shared dep can roll forward freely within the same major.
 */
export const SHARED_RUNTIME_MAJORS: Readonly<Record<string, number>> = Object.freeze({
  // React and friends
  react: 19,
  "react-dom": 19,
  "react/jsx-runtime": 19,

  // The lone external library exposed today
  "lucide-react": 0,

  // Workspace packages — all 1.x for the OSS-readiness line
  "@opencast-mui/plugin-system": 1,
  "@opencast-mui/app-runtime": 1,
  "@opencast-mui/ui": 1,
  "@opencast-mui/query": 1,
  "@opencast-mui/router": 1,
  "@opencast-mui/i18n": 1,
  "@opencast-mui/utils": 1,
  "@opencast-mui/store": 1,
  "@opencast-mui/ui-config": 1,
});

export type SharedRuntimeDependencyName = keyof typeof SHARED_RUNTIME_MAJORS;

export interface SharedDependencyIncompatibility {
  /** The dependency name that failed the check. */
  name: string;
  /** The range string the plugin declared. */
  required: string;
  /** The major the host provides. */
  hostMajor: number;
  /** A one-line human-readable summary. */
  reason: string;
}

export interface SharedDependencyCheckResult {
  /** True only when every declared dep is compatible. */
  compatible: boolean;
  /** Per-dep failures. Undefined when `compatible` is true. */
  incompatibilities?: SharedDependencyIncompatibility[];
  /**
   * Plugin-declared deps that the host doesn't ship. Reported for the caller
   * to decide whether to warn — not blocking on its own, because the plugin
   * may legitimately bundle them.
   */
  unknown?: string[];
}

/**
 * Check whether a plugin's declared dependencies are compatible with the
 * host's shared runtime majors.
 *
 * @param requiredDependencies - The `workspaceDependencies` object from the
 *   plugin's manifest, mapping dep name to a version range string.
 * @param hostMajors - The host's provided majors. Defaults to
 *   {@link SHARED_RUNTIME_MAJORS}; injectable for tests.
 *
 * @returns A {@link SharedDependencyCheckResult}. `compatible` is `true` iff
 *   every entry whose name appears in `hostMajors` parses to the same major
 *   as `hostMajors[name]`. Entries whose name is not in `hostMajors` go into
 *   `unknown` and don't block compatibility.
 */
export function checkSharedDependencyCompatibility(
  requiredDependencies: Record<string, string> | undefined | null,
  hostMajors: Readonly<Record<string, number>> = SHARED_RUNTIME_MAJORS,
): SharedDependencyCheckResult {
  if (requiredDependencies == null || typeof requiredDependencies !== "object") {
    return { compatible: true };
  }

  const incompatibilities: SharedDependencyIncompatibility[] = [];
  const unknown: string[] = [];

  for (const [name, range] of Object.entries(requiredDependencies)) {
    const hostMajor = hostMajors[name];
    if (typeof hostMajor !== "number") {
      // The host doesn't ship a package by this exact name. But if it ships the
      // *same* package under its canonical scope — e.g. the plugin declares
      // "@workspace/plugin-system" (the pre-rename namespace) while the host
      // provides "@opencast-mui/plugin-system" — that's a real incompatibility (the
      // plugin targets a different host), not a benign "unknown" dependency.
      const canonical = wrongScopeHostEquivalent(name, hostMajors);
      if (canonical) {
        incompatibilities.push({
          name,
          required: String(range),
          hostMajor: hostMajors[canonical] as number,
          reason: `Plugin requires "${name}", which looks like a wrong-scope / pre-rename reference to the host package "${canonical}". Rename it to "${canonical}".`,
        });
        continue;
      }
      unknown.push(name);
      continue;
    }

    const requiredMajor = parseRangeMajor(range);
    if (requiredMajor === null) {
      incompatibilities.push({
        name,
        required: String(range),
        hostMajor,
        reason: `Plugin declared an unparseable version range "${range}" for "${name}".`,
      });
      continue;
    }

    if (requiredMajor !== hostMajor) {
      incompatibilities.push({
        name,
        required: String(range),
        hostMajor,
        reason: `Plugin requires "${name}" major ${requiredMajor}, host provides ${hostMajor}.`,
      });
    }
  }

  const result: SharedDependencyCheckResult = {
    compatible: incompatibilities.length === 0,
  };
  if (incompatibilities.length > 0) {
    result.incompatibilities = incompatibilities;
  }
  if (unknown.length > 0) {
    result.unknown = unknown;
  }
  return result;
}

/**
 * If a declared dependency isn't a host package by its exact name, but the host
 * ships the *same* package under the canonical `@opencast-mui/` scope (i.e. the plugin
 * used a different/old scope such as the pre-rename `@workspace/`), return that
 * canonical name. Lets {@link checkSharedDependencyCompatibility} turn a
 * wrong-namespace declaration into a real incompatibility instead of a silently
 * ignored "unknown" dependency.
 */
function wrongScopeHostEquivalent(
  name: string,
  hostMajors: Readonly<Record<string, number>>,
): string | null {
  const bare = name.replace(/^@[^/]+\//, "");
  if (bare === name) return null; // not a scoped package — nothing to compare
  const canonical = `@opencast-mui/${bare}`;
  return canonical !== name && canonical in hostMajors ? canonical : null;
}

/**
 * Parse the lower-bound major version from a npm-style range string.
 *
 * Accepted forms (and what they parse to):
 * - `"1"`, `"1.x"`, `"1.0.0"`, `"v1.0.0"` → `1`
 * - `"^1.0.0"`, `"~1.0.0"`, `">=1.0.0"`, `">1.0.0"` → `1`
 * - `"1.0.0-alpha"` → `1`
 * - `"0.417.0"` → `0`
 * - `"*"`, `"x"`, empty string, non-string → `null` (caller decides what to
 *   do with an "any version" declaration)
 *
 * Compound ranges (`"^1.0.0 || ^2.0.0"`) are not supported and return
 * `null`. We deliberately keep this strict — the contract is "you target
 * one major", and a plugin spanning two majors is a manifest bug.
 */
export function parseRangeMajor(range: string): number | null {
  if (typeof range !== "string") return null;
  const trimmed = range.trim();
  if (trimmed === "" || trimmed === "*" || trimmed === "x") return null;
  // Compound ranges aren't part of the contract.
  if (trimmed.includes("||")) return null;
  // Strip leading operators and the optional leading "v".
  const stripped = trimmed.replace(/^[\^~>=<v\s]+/, "");
  const match = /^(\d+)/.exec(stripped);
  if (!match) return null;
  return Number(match[1]);
}
