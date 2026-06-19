import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { defineConfig, loadEnv } from "vite";

import {
  createShellAppViteConfig,
  localConfigDevPlugin,
  localPluginsDevPlugin,
} from "@oc-mui/vite-config";

const packageName = process.env["npm_package_name"] || "shell";

/**
 * Build-time app version. Prefers an explicit release value (set
 * `VITE_APP_VERSION` when cutting a release — e.g. from the release workflow),
 * then falls back to this app's package.json version.
 */
function resolveAppVersion(): string {
  const explicit = process.env["VITE_APP_VERSION"];
  if (explicit) return explicit.replace(/^v/i, "");
  try {
    const pkg = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, "package.json"), "utf8"),
    ) as { version?: string };
    // package.json is still the 0.0.0 dev placeholder pre-release; fall back to
    // the 1.x baseline so the UI shows a meaningful version until a release sets
    // VITE_APP_VERSION.
    return pkg.version && pkg.version !== "0.0.0" ? pkg.version : "1.0.0";
  } catch {
    return "1.0.0";
  }
}

/**
 * Short SHA of the deployed commit. Prefers a CI-provided env var (GITHUB_SHA),
 * then asks git directly. Returns "" when unavailable — the footer then renders
 * the version without a commit link.
 */
function resolveGitCommit(): string {
  const fromCi = process.env["GITHUB_SHA"] ? process.env["GITHUB_SHA"].slice(0, 7) : "";
  if (fromCi) return fromCi;
  try {
    return execSync("git rev-parse --short HEAD", {
      cwd: __dirname,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return "";
  }
}

export default defineConfig(({ mode }) => {
  const monorepoRootPath = path.resolve(__dirname, "../..");
  const env = loadEnv(mode, monorepoRootPath, "");

  const baseConfig = createShellAppViteConfig({
    packageName,
    mode,
    env,
    invokerDir: __dirname,
  });

  // Build-time constants, replaced inline across the bundle (including the
  // footer and landing page, which are aliased to source). Consumed via
  // `__APP_VERSION__` / `__GIT_COMMIT__` with `typeof` guards.
  baseConfig.define = {
    ...(baseConfig.define ?? {}),
    __APP_VERSION__: JSON.stringify(resolveAppVersion()),
    __GIT_COMMIT__: JSON.stringify(resolveGitCommit()),
  };

  // In dev, serve .local-plugins/ and expose /local-plugins/manifest.json
  if (mode === "development") {
    const shellBasePath = baseConfig.base ?? "/";
    baseConfig.plugins = baseConfig.plugins || [];
    baseConfig.plugins.push(
      localPluginsDevPlugin({
        monorepoRoot: monorepoRootPath,
        basePath: shellBasePath.replace(/\/$/, ""),
      }),
    );

    // Serve the committed default config.json locally when there's no backend,
    // or when VITE_LOCAL_CONFIG=true forces it (edit config locally while
    // data/auth still hit VITE_PROXY_TARGET). With a backend and the flag off,
    // the config path is proxied instead (see proxy.ts) so the real config wins.
    const serveLocalConfig =
      !env["VITE_PROXY_TARGET"] || env["VITE_LOCAL_CONFIG"] === "true";
    if (serveLocalConfig) {
      baseConfig.plugins.push(
        localConfigDevPlugin({
          configFilePath: path.resolve(
            __dirname,
            "public/ui/config/management-ui/config.json",
          ),
        }),
      );
    }
  }

  return baseConfig;
});
