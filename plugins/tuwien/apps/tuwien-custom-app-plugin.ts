import { createPlugin, type PluginManager } from "@workspace/plugin-system";
import { logger } from "@workspace/utils";

import { TuWienCustomApp } from "./TuWienCustomApp";

/**
 * TU Wien custom app plugin
 * This demonstrates how universities can add their own applications through plugins
 */
export const tuWienCustomAppPlugin = createPlugin({
  namespace: "tuwien",
  type: "app",
  version: "1.0.0",

  initialize(manager: PluginManager) {
    // Register the custom app through the plugin system
    manager.registerObject("apps:definitions", "tuwien-custom-app", {
      id: "tuwien-custom-app",
      name: "TU Wien Custom App",
      routePath: "/tuwien-custom",
      component: TuWienCustomApp,
      navigation: {
        title: "TU Wien App",
        icon: "building-2",
        order: 150,
        permissions: ["access_tuwien_app"],
      },
      version: "1.0.0",
      description: "Custom application for TU Wien with university-specific features",
    });

    logger.debug("TU Wien custom app plugin initialized");
  },

  activate() {
    logger.debug("TU Wien custom app plugin activated");
  },

  deactivate() {
    logger.debug("TU Wien custom app plugin deactivated");
  },
});
