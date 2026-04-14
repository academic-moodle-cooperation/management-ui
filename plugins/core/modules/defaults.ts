import { createPlugin, type PluginManager } from "@workspace/plugin-system";
import { Home } from "@workspace/ui/components";

/**
 * Core Default Implementations
 * Provides basic implementations for essential core functionality
 * Individual apps will contribute their own navigation items separately
 */
export const coreDefaultImplementations = createPlugin({
  namespace: "core",
  type: "navigation",
  version: "1.0.0",

  initialize(manager: PluginManager) {
    // Core navigation: Only Home (always present)
    manager.registerObject("sidebar:nav-items", "home", {
      title: "Home",
      path: "/",
      icon: Home,
      order: 10, // First item
      permissions: [], // Available to all users
      featureFlags: [],
      category: "core",
    });
  },

  activate() {},

  deactivate() {},
});
