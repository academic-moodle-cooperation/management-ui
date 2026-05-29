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
