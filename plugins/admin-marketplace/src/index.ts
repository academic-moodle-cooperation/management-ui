import { ShoppingBag } from "lucide-react";

import { createPlugin } from "@workspace/plugin-system";

import { RemoteLoader } from "./services/remote-loader";
import { ThemeLoader } from "./services/theme-loader";
import { MarketplaceDashboard } from "./views/MarketplaceDashboard";

/**
 * Admin Marketplace Plugin
 *
 * Provides a marketplace interface for dynamically loading and installing
 * remote plugins at runtime using the "Parallel Engine" approach.
 *
 * Features:
 * - Browse available plugins from a registry
 * - Try plugins without installing (temporary load)
 * - Install plugins (load + persist to localStorage)
 * - Developer mode for loading custom plugin URLs
 * - Auto-load installed plugins on initialization
 *
 * Architecture:
 * This plugin follows the "Parallel Engine" approach, meaning it uses the
 * existing PluginManager to register remote modules loaded via dynamic import().
 * Remote plugins are loaded as ES modules and registered with the same
 * PluginManager instance, allowing them to extend the application just like
 * built-in plugins.
 */
export const adminMarketplacePlugin = createPlugin({
  namespace: "admin",
  type: "marketplace",
  version: "1.0.0",

  async initialize(manager) {
    console.log("Admin Marketplace plugin initializing...");

    // Load installed theme in background (do not block plugin init or router)
    void ThemeLoader.initialize();

    // Register the marketplace apps (separate routes for Plugins and Themes views)
    manager.registerObject("apps:definitions", "marketplace-plugins", {
      id: "marketplace-plugins",
      name: "Marketplace – Plugins",
      routePath: "/admin/marketplace/plugins",
      component: () => MarketplaceDashboard({ manager, view: "plugins" }),
    });

    manager.registerObject("apps:definitions", "marketplace-themes", {
      id: "marketplace-themes",
      name: "Marketplace – Themes",
      routePath: "/admin/marketplace/themes",
      component: () => MarketplaceDashboard({ manager, view: "themes" }),
    });

    // Register sidebar navigation item with sub-entries for Plugins and Themes
    manager.registerObject("sidebar:nav-items", "marketplace", {
      title: "Marketplace",
      path: "/admin/marketplace/plugins",
      icon: ShoppingBag,
      order: 1000, // Place at the end of the sidebar
      permissions: ["admin.view"],
      featureFlags: [],
      category: "admin",
      items: [
        {
          title: "Plugins",
          path: "/admin/marketplace/plugins",
        },
        {
          title: "Themes",
          path: "/admin/marketplace/themes",
        },
      ],
    });

    // Load all persisted plugins from localStorage (validates URL + version before loading)
    const savedUrls = RemoteLoader.getInstalledUrls();
    if (savedUrls.length > 0) {
      console.log(
        `Loading ${savedUrls.length} installed plugin(s) from localStorage...`
      );

      const loadResults = await Promise.allSettled(
        savedUrls.map((url) => RemoteLoader.loadAndRegister(url, manager))
      );

      loadResults.forEach((result, index) => {
        if (result.status === "rejected") {
          console.error(`Failed to load installed plugin from ${savedUrls[index]}:`, result.reason);
        }
      });
    }

    // .local-plugins/ are loaded by the core in dev (PluginInitializer); no need to load here

    console.log("Admin Marketplace plugin initialized");
  },

  activate() {
    console.log("Admin Marketplace plugin activated");
  },

  deactivate() {
    console.log("Admin Marketplace plugin deactivated");
  },
});

// Export the plugin as default for easier imports
export default adminMarketplacePlugin;

// Export services for external use if needed
export { RemoteLoader } from "./services/remote-loader";
export { ThemeLoader } from "./services/theme-loader";
export { PluginExplorer } from "./services/plugin-explorer";
export * from "./services/plugin-metadata";
export { MarketplaceDashboard } from "./views/MarketplaceDashboard";
