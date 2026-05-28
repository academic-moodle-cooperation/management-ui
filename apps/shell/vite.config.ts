import path from "node:path";

import { defineConfig, loadEnv } from "vite";

import {
  createShellAppViteConfig,
  localConfigDevPlugin,
  localPluginsDevPlugin,
} from "@oc-mui/vite-config";

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

    // Serve the committed default config.json locally only when no backend
    // is configured. With VITE_PROXY_TARGET set, the config path is proxied
    // to that backend instead (see proxy.ts), so its real config wins.
    if (!env["VITE_PROXY_TARGET"]) {
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
