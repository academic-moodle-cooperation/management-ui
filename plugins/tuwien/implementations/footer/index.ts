import { createPlugin } from "@workspace/plugin-system";
import type { PluginManager } from "@workspace/plugin-system";

import { TUWienFooter } from "./components/TUWienFooter";

/**
 * TU Wien Footer Implementation Plugin
 * University-specific footer with custom branding and links
 */
export const tuwienFooterImplementation = createPlugin({
  namespace: "tuwien",
  type: "footer",
  version: "1.0.0",

  initialize(manager: PluginManager) {
    // Register TU Wien footer with higher priority than core default
    manager.registerComponent("component-override:appshell:footer", TUWienFooter, {
      key: "tuwien-footer",
      order: 50, // Higher priority than core default (100)
    });
  },

  activate() {},

  deactivate() {},
});
