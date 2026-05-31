/**
 * Vite config — builds this plugin into a single ES module at
 * `dist/__PLUGIN_NAME__.mjs` that the Management UI loads dynamically
 * (via `.local-plugins/` in dev, or the JAR in production).
 *
 * `createCommunityPluginConfig` (from `@oc-mui/vite-config`) handles
 * library mode, externalizing the host-provided packages (react,
 * `@oc-mui/*`, …) so they aren't bundled, and auto-extracting any
 * GraphQL fragments under `src/`.
 */
import { createCommunityPluginConfig } from "@oc-mui/vite-config";

export default createCommunityPluginConfig({
  pluginName: "__PLUGIN_NAME__",
});
