import { Sparkles } from "lucide-react";

import { createPlugin, type PluginManager } from "@oc-mui/plugin-system";
import { logger } from "@oc-mui/utils";

import { __PLUGIN_PASCAL_NAME__Page } from "./__PLUGIN_PASCAL_NAME__Page";

/**
 * __PLUGIN_NAME__ plugin — a screen with a sidebar entry.
 *
 * Registers a route + component on `apps:definitions` (the shell mounts
 * it at /__PLUGIN_NAME__) and a left-nav link on `sidebar:nav-items`.
 * Both render in dev AND production. Swap the page, title, icon, and
 * route for your own, and keep plugin.json's `extensionPoints` in sync if
 * you register on different points. See docs/plugins/creating-a-plugin.md.
 */
export const __PLUGIN_VAR_NAME__Plugin = createPlugin({
  namespace: "__PLUGIN_NAME__",
  type: "app",
  version: "1.0.0",

  initialize(manager: PluginManager) {
    // 1) The screen: a route + component the shell mounts at /__PLUGIN_NAME__.
    manager.registerObject("apps:definitions", "__PLUGIN_NAME__", {
      id: "__PLUGIN_NAME__",
      name: "__PLUGIN_PASCAL_NAME__",
      routePath: "/__PLUGIN_NAME__",
      component: __PLUGIN_PASCAL_NAME__Page,
    });

    // 2) The left-nav entry that links to it.
    manager.registerObject("sidebar:nav-items", "__PLUGIN_NAME__", {
      title: "__PLUGIN_PASCAL_NAME__",
      path: "/__PLUGIN_NAME__",
      icon: Sparkles, // any lucide-react icon *component* (not a string)
      order: 50, // lower numbers sort higher in the sidebar
      permissions: [], // e.g. ["__PLUGIN_NAME__.view"] to gate visibility
      featureFlags: [],
      category: "content",
    });
  },

  activate() {
    logger.info("[__PLUGIN_NAME__] activated");
  },

  deactivate() {
    logger.info("[__PLUGIN_NAME__] deactivated");
  },
});

// The remote-plugin loader (used for .local-plugins and JAR plugins)
// imports the plugin via `module.default`, so the plugin object MUST be
// the default export. The named export above is kept for tests/imports.
export default __PLUGIN_VAR_NAME__Plugin;
