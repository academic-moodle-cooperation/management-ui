/**
 * Community Plugin Entry Point
 *
 * This is the main entry point for your plugin. It exports a default
 * plugin object created with createPlugin() that the Management UI
 * Core will load and register.
 *
 * IMPORTANT: This file must export a default plugin object.
 */

// Import plugin styles (Tailwind CSS)
// This ensures your plugin's CSS is bundled and loaded with the plugin
import "./styles/index.css";

import { createPlugin } from "@workspace/plugin-system";

import { MyPluginView } from "./views/MyPluginView";

/**
 * My Community Plugin
 *
 * TODO: Update the namespace and type to match your plugin's purpose.
 *
 * Naming Convention:
 * - namespace: Your organization or plugin family (e.g., "myorg", "analytics")
 * - type: The plugin's function (e.g., "app", "feature", "theme")
 */
const myPlugin = createPlugin({
  namespace: "my-plugin",
  type: "app",
  version: "1.0.0",

  /**
   * Initialize the plugin
   *
   * This is called when the plugin is first loaded. Use it to:
   * - Register routes/views via apps:definitions
   * - Register sidebar items via sidebar:nav-items
   * - Register custom components via component-override:*
   * - Set up any plugin-specific configuration
   */
  initialize(manager) {
    console.log("My Plugin initializing...");

    // Register the main app/view
    manager.registerObject("apps:definitions", "my-plugin-app", {
      id: "my-plugin-app",
      name: "My Plugin",
      routePath: "/my-plugin",
      component: MyPluginView,
    });

    // Register sidebar navigation
    manager.registerObject("sidebar:nav-items", "my-plugin-nav", {
      title: "My Plugin",
      path: "/my-plugin",
      // icon: YourIcon, // Import from lucide-react
      order: 100, // Higher = lower in sidebar
      permissions: [], // Optional: required permissions
      featureFlags: [], // Optional: required feature flags
    });

    console.log("My Plugin initialized");
  },

  /**
   * Activate the plugin
   *
   * Called when the plugin becomes active (e.g., user navigates to a plugin route).
   * Use it to start any background processes, WebSocket connections, etc.
   */
  activate() {
    console.log("My Plugin activated");
  },

  /**
   * Deactivate the plugin
   *
   * Called when the plugin is being disabled or unloaded.
   * Use it to clean up resources, close connections, etc.
   */
  deactivate() {
    console.log("My Plugin deactivated");
  },
});

// Export as default - this is required for dynamic loading
export default myPlugin;

// Also export named for TypeScript consumers
export { myPlugin };
