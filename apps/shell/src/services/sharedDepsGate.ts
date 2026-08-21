/**
 * Shared-runtime-dependency gate for the JAR and .local-plugins loaders.
 *
 * The host ships exactly one copy of each shared dependency (React, the
 * `@oc-mui/*` packages, …). A plugin that targets a different *major* would
 * break React contexts/hooks or the `@oc-mui/*` contracts, so it must not load.
 *
 * This mirrors the marketplace's compatibility gate — all three loader paths
 * funnel through the same canonical `checkSharedDependencyCompatibility` in
 * `@oc-mui/plugin-system`, the single source of truth for the host's majors.
 */

import { checkSharedDependencyCompatibility } from "@oc-mui/plugin-system";
import { logger } from "@oc-mui/utils";

const gateLogger = logger.child({ component: "SharedDepsGate" });

/**
 * Decide whether a plugin manifest entry may load, based on its declared
 * `workspaceDependencies` vs the host's shared runtime majors.
 *
 * Entries that declare no `workspaceDependencies` always pass — e.g. JAR
 * plugins whose `plugins.json` doesn't yet carry the field (the backend has
 * to surface it; see `docs/reference/open-followups.md` §5.3). Deps the host
 * doesn't ship are logged but don't block (the plugin may bundle them).
 *
 * @returns `true` when the entry is compatible and should be loaded.
 */
export function passesSharedDependencyGate(entry: {
  name: string;
  workspaceDependencies?: Record<string, string> | undefined;
}): boolean {
  const declared = entry.workspaceDependencies;
  if (!declared) return true;

  const result = checkSharedDependencyCompatibility(declared);

  if (result.unknown?.length) {
    gateLogger.warn(
      `Plugin "${entry.name}" declares shared dependencies the host doesn't provide: ${result.unknown.join(
        ", ",
      )} (not blocking — the plugin may bundle them).`,
    );
  }

  if (!result.compatible) {
    gateLogger.warn(
      `Plugin "${entry.name}" rejected — incompatible shared runtime dependency: ${(
        result.incompatibilities ?? []
      )
        .map((i) => i.reason)
        .join(" ")}`,
    );
    return false;
  }

  return true;
}
