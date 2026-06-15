import { defineConfig, loadEnv } from "vite";

import { createPluginAppViteConfig } from "@opencast-mui/vite-config";

const packageName = process.env["npm_package_name"] || "playground";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return createPluginAppViteConfig({
    packageName,
    mode,
    env,
    invokerDir: __dirname,
  });
});
