import { createPlugin } from "@workspace/plugin-system";
import DefaultHeader from "./components/default-header";
import { LangSwitcher } from "./components/LangSwitcher";
import { LoginButton } from "./components/LoginButton";
import type { PluginManager } from "@workspace/plugin-system";

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
      }
    );
  },

  activate() {},

  deactivate() {},
});
