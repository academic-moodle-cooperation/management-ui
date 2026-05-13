import { createPlugin } from "@oc-mui/plugin-system";
import type { PluginManager } from "@oc-mui/plugin-system";

import DefaultHeader from "./components/default-header";

// Core Header Implementation Plugin
// This plugin provides a complete header component with built-in functionality
export const coreHeaderImplementation = createPlugin({
  namespace: "core",
  type: "header",
  version: "1.0.0",

  initialize(manager: PluginManager) {
    // Register complete header component using new extension point pattern
    // No more granular extension points - complete header components only
    manager.registerComponent(
      "appshell:header", // NEW: Direct registration, no component-override prefix
      DefaultHeader,
      {
        key: "default-header",
        order: 100, // Standard priority, allows overrides
      },
    );
  },

  activate() {},

  deactivate() {},
});
