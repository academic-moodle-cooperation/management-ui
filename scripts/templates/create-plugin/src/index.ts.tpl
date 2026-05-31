import { createPlugin, type PluginManager } from "@oc-mui/plugin-system";
import { logger } from "@oc-mui/utils";

/**
 * __PLUGIN_NAME__ plugin
 *
 * TODO: describe what this plugin does in one or two sentences.
 * Reference the extension points it registers on, and link to
 * AGENTS.md → "Plugin layout" if you're new to the structure.
 */
export const __PLUGIN_VAR_NAME__Plugin = createPlugin({
  namespace: "__PLUGIN_NAME__",
  type: "header",
  version: "1.0.0",

  initialize(manager: PluginManager) {
    // Placeholder registration so the contract test passes on first run.
    // Replace with your real extension-point registrations and update
    // plugin.json's `extensionPoints` array accordingly.
    manager.registerObject("app:header-logo", "__PLUGIN_NAME__-logo", {
      src: "/assets/__PLUGIN_NAME__-logo.svg",
      alt: "__PLUGIN_NAME__",
      width: 120,
      height: 40,
      href: "/",
    });
  },

  activate() {
    // `logger.info` (→ console.info) shows at Chrome DevTools' default level.
    // `logger.debug` would be hidden unless you enable the "Verbose" filter,
    // which makes "did my plugin load?" needlessly confusing on first run.
    logger.info("[__PLUGIN_NAME__] activated");
  },

  deactivate() {
    logger.info("[__PLUGIN_NAME__] deactivated");
  },
});
