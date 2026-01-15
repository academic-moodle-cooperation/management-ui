import { createPlugin } from "@workspace/plugin-system";
import type { PluginManager } from "@workspace/plugin-system";

import { UnivieEmptyState } from "./components";

/**
 * Univie Empty State Implementation Plugin
 * University-specific empty state for series with custom links
 */
export const univieEmptyStateImplementation = createPlugin({
  namespace: "univie",
  type: "empty-state",
  version: "1.0.0",

  initialize(manager: PluginManager) {
    // Register Univie empty state with higher priority than core default
    manager.registerComponent("component-override:series:empty-state", UnivieEmptyState, {
      key: "univie-empty-state",
      order: 50, // Higher priority than core default (100)
    });
  },

  activate() {},

  deactivate() {},
});
