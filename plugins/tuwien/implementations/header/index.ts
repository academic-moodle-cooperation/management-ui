import { createPlugin } from "@workspace/plugin-system";
import type { PluginManager } from "@workspace/plugin-system";

import { TUWienHeader } from "./components/TUWienHeader";

/**
 * TU Wien Header Implementation Plugin
 * University-specific header with custom branding, navigation, and mobile sidebar trigger
 */
export const tuwienHeaderImplementation = createPlugin({
  namespace: "tuwien",
  type: "header",
  version: "1.0.0",

  initialize(manager: PluginManager) {
    // Register TU Wien header with higher priority than core default
    // Uses new simplified architecture: appshell:header (not component-override)
    manager.registerComponent("appshell:header", TUWienHeader, {
      key: "tuwien-header",
      order: 50, // Higher priority than core default (100)
    });
  },

  activate() {},

  deactivate() {},
});
