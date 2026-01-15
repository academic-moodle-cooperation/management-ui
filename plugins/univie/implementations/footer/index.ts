import { createPlugin } from "@workspace/plugin-system";
import type { PluginManager } from "@workspace/plugin-system";

import { UnivieFooter } from "./components/UnivieFooter";

/**
 * University of Vienna Footer Implementation Plugin
 * University-specific footer with custom branding and links
 * Migrated from migrate/extensions/src/univie/
 */
export const univieFooterImplementation = createPlugin({
  namespace: "univie",
  type: "footer",
  version: "1.0.0",

  initialize(manager: PluginManager) {
    // Register University of Vienna footer with higher priority than core default
    manager.registerComponent("component-override:appshell:footer", UnivieFooter, {
      key: "univie-footer",
      order: 50, // Higher priority than core default (100), higher than TU Wien (150)
    });
  },

  activate() {},

  deactivate() {},
});
