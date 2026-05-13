import { createPlugin } from "@oc-mui/plugin-system";
import type { PluginManager } from "@oc-mui/plugin-system";

import DefaultFooter from "./components/default-footer";

// Core Footer Implementation Plugin
export const coreFooterImplementation = createPlugin({
  namespace: "core",
  type: "footer", // Changed back from 'default-implementations'
  version: "1.0.0",

  initialize(manager: PluginManager) {
    // Register the default footer component with ComponentResolver
    // Using the correct component-override prefix to override the appshell default
    manager.registerComponent(
      "component-override:appshell:footer", // CORRECT: prefix needed for ComponentResolver
      DefaultFooter,
      {
        key: "default-footer",
        order: 100, // Standard priority, allows overrides
      },
    );
  },

  activate() {},

  deactivate() {},
});
