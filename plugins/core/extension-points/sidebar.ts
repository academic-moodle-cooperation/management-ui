import { createPlugin, type PluginManager } from "@oc-mui/plugin-system";

/**
 * Sidebar Extension Points Plugin
 * Defines where and how sidebar items can be extended by universities
 *
 * Extension Points Defined:
 * - sidebar:nav-items - Main navigation items
 * - sidebar:user-items - User-specific actions (profile, logout, etc.)
 * - sidebar:admin-items - Administrative functions
 * - sidebar:help-items - Help and support items
 */
export const sidebarExtensionPoints = createPlugin({
  namespace: "core",
  type: "sidebar",
  version: "1.0.0",

  initialize(manager: PluginManager) {
    // Document available extension points

    // Register API documentation objects that extensions can reference
    manager.registerObject("extension-points:documentation", "sidebar:nav-items", {
      description: "Main navigation items in the sidebar",
      expectedSchema: {
        title: "string - Display name",
        path: "string - Route path",
        icon: "string|Component - Icon identifier or component",
        order: "number - Display order (lower = higher up)",
        permissions: "string[] - Required permissions",
        featureFlags: "string[] - Required feature flags",
        category: "string - Grouping category (optional)",
      },
      examples: [
        {
          title: "Series",
          path: "/series",
          icon: "list-video",
          order: 20,
          permissions: ["series.view"],
          featureFlags: [],
          category: "content",
        },
      ],
    });

    manager.registerObject("extension-points:documentation", "sidebar:user-items", {
      description: "User-specific actions and settings",
      expectedSchema: {
        title: "string - Display name",
        action: "function - Click handler",
        icon: "string|Component - Icon identifier",
        order: "number - Display order",
        permissions: "string[] - Required permissions",
      },
    });

    manager.registerObject("extension-points:documentation", "sidebar:admin-items", {
      description: "Administrative functions for authorized users",
      expectedSchema: {
        title: "string - Display name",
        path: "string - Route path",
        icon: "string|Component - Icon identifier",
        order: "number - Display order",
        permissions: "string[] - Required admin permissions",
      },
    });

    manager.registerObject("extension-points:documentation", "sidebar:help-items", {
      description: "Help, support, and documentation links",
      expectedSchema: {
        title: "string - Display name",
        path: "string - Route path or external URL",
        icon: "string|Component - Icon identifier",
        order: "number - Display order",
        external: "boolean - Whether link opens in new tab",
      },
    });
  },

  activate() {},

  deactivate() {},
});
