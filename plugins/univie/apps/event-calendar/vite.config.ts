import { defineConfig, loadEnv } from "vite";

import { createPluginAppViteConfig } from "@workspace/vite-config";

const packageName = process.env["npm_package_name"] || "univie-event-calendar";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return createPluginAppViteConfig({
    packageName,
    mode,
    env,
    invokerDir: __dirname,
  });
});
