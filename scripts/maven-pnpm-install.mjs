#!/usr/bin/env node
/**
 * maven-pnpm-install.mjs — the workspace install the Maven build runs (#255).
 *
 * Why this exists: `pnpm-workspace.yaml` includes `.local-plugins/*`, but that
 * directory is gitignored by design — its content varies per deployment and the
 * committed `pnpm-lock.yaml` can never cover it. A strict
 * `pnpm install --frozen-lockfile` therefore fails with ERR_PNPM_OUTDATED_LOCKFILE
 * the moment an org/community plugin checkout sits in `.local-plugins/`
 * (the server-side Maven build, or any org developing local plugins).
 *
 * There is no pnpm mechanism that keeps the frozen check for the committed
 * workspace while tolerating extra importers: `--filter` still validates the
 * whole workspace against the lockfile, and `--ignore-workspace` installs the
 * root importer only (verified against pnpm 10.28, see #255).
 *
 * So this script chooses the lockfile mode by looking at `.local-plugins/`:
 *
 * - EMPTY (the OSS/CI/release case): `--frozen-lockfile`. Reproducibility of
 *   the JAR build stays exactly as strict as before.
 * - POPULATED: `--no-frozen-lockfile`, with a loud warning. pnpm still reuses
 *   the committed lockfile's resolutions for every importer it already knows,
 *   so the core dependency graph stays pinned; only the local plugins' own
 *   dependencies are resolved fresh. The working-tree `pnpm-lock.yaml` gets
 *   updated as a side effect — do not commit that.
 *
 * Force a mode with OC_MUI_LOCKFILE_MODE=frozen|no-frozen (e.g. `frozen` to
 * make a deployment build fail loudly instead of falling back).
 */
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const localPluginsDir = join(repoRoot, ".local-plugins");

// A `.local-plugins/*` entry only joins the pnpm workspace if it is a
// directory with a package.json (dot-directories are not matched by the
// workspace glob). Mirror exactly that.
const localPlugins = !existsSync(localPluginsDir)
  ? []
  : readdirSync(localPluginsDir, { withFileTypes: true })
      .filter(
        (entry) =>
          entry.isDirectory() &&
          !entry.name.startsWith(".") &&
          entry.name !== "node_modules" &&
          existsSync(join(localPluginsDir, entry.name, "package.json")),
      )
      .map((entry) => entry.name)
      .sort();

const forcedMode = process.env.OC_MUI_LOCKFILE_MODE;
if (forcedMode && forcedMode !== "frozen" && forcedMode !== "no-frozen") {
  console.error(
    `maven-pnpm-install: invalid OC_MUI_LOCKFILE_MODE "${forcedMode}" (use "frozen" or "no-frozen")`,
  );
  process.exit(1);
}
const frozen = forcedMode ? forcedMode === "frozen" : localPlugins.length === 0;

const args = [
  "install",
  "--engine-strict",
  frozen ? "--frozen-lockfile" : "--no-frozen-lockfile",
  "--prefer-offline",
  "--link-workspace-packages",
];

if (localPlugins.length === 0) {
  console.log("maven-pnpm-install: .local-plugins/ is empty — strict --frozen-lockfile install.");
} else {
  const banner = frozen
    ? "OC_MUI_LOCKFILE_MODE=frozen forced — install will fail if the lockfile does not cover them"
    : "falling back to --no-frozen-lockfile (the gitignored plugins cannot be in the committed lockfile, see issue #255)";
  console.warn(
    [
      "",
      "=".repeat(78),
      `WARNING: .local-plugins/ contains workspace packages: ${localPlugins.join(", ")}`,
      `         ${banner}.`,
      "         Core dependencies stay pinned by pnpm-lock.yaml; only the local",
      "         plugins' own dependencies are resolved fresh. pnpm-lock.yaml is",
      "         updated in the working tree — do NOT commit that change.",
      "=".repeat(78),
      "",
    ].join("\n"),
  );
}
console.log(`maven-pnpm-install: pnpm ${args.join(" ")}`);

// Re-enter the exact pnpm that invoked this script (npm_execpath is set by
// pnpm when running package.json scripts) so the Maven-provisioned pnpm
// version is used, not whatever happens to be on PATH.
const execPath = process.env.npm_execpath;
const [cmd, cmdArgs] =
  execPath && /\.c?js$/.test(execPath)
    ? [process.execPath, [execPath, ...args]]
    : [execPath || "pnpm", args];

const result = spawnSync(cmd, cmdArgs, { cwd: repoRoot, stdio: "inherit" });
process.exit(result.status ?? 1);
