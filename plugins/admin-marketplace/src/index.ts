import { createPlugin } from "@workspace/plugin-system";
import { MarketplaceDashboard } from "./views/MarketplaceDashboard";
import { RemoteLoader } from "./services/remote-loader";
import { ShoppingBag } from "lucide-react";

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
  type: "app",
  version: "1.0.0",

  initialize(manager) {
    console.log("Admin Marketplace plugin initializing...");

    // Register the marketplace app
    manager.registerObject("apps:definitions", "marketplace", {
      id: "marketplace",
      name: "Marketplace",
      routePath: "/admin/marketplace",
      component: () => MarketplaceDashboard({ manager }),
    });

    // Register sidebar navigation item
    manager.registerObject("sidebar:nav-items", "marketplace", {
      title: "Marketplace",
      path: "/admin/marketplace",
      icon: ShoppingBag,
      order: 1000, // Place at the end of the sidebar
      permissions: ["admin.view"],
      featureFlags: [],
      category: "admin",
    });

    // Load all persisted plugins from localStorage
    const savedUrls = RemoteLoader.getInstalledUrls();
    if (savedUrls.length > 0) {
      console.log(
        `Loading ${savedUrls.length} installed plugin(s) from localStorage...`
      );
      savedUrls.forEach((url) => {
        RemoteLoader.loadAndRegister(url, manager).catch((error) => {
          console.error(`Failed to load installed plugin from ${url}:`, error);
        });
      });
    }

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
export { MarketplaceDashboard } from "./views/MarketplaceDashboard";
