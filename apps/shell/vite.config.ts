import path from "node:path";

import { defineConfig, loadEnv } from "vite";

import { createShellAppViteConfig, localPluginsDevPlugin } from "@workspace/vite-config";

const packageName = process.env["npm_package_name"] || "shell";

export default defineConfig(({ mode }) => {
  const monorepoRootPath = path.resolve(__dirname, "../..");
  const env = loadEnv(mode, monorepoRootPath, "");

  const baseConfig = createShellAppViteConfig({
    packageName,
    mode,
    env,
    invokerDir: __dirname,
  });

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
  }

  return baseConfig;
});
