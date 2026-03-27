import { createPlugin, type PluginManager } from "@workspace/plugin-system";

import { CreateSeriesToolbarAction } from "./components/CreateSeriesToolbarAction";

/**
 * Series Create Implementation
 * Provides default create series action in the series table toolbar
 */
export const seriesCreateImplementation = createPlugin({
  namespace: "series",
  type: "create-series",
  version: "1.0.0",

  initialize(manager: PluginManager) {
    manager.registerObject("series:table:toolbar-end-actions", "create-series", {
      id: "create-series",
      order: 100,
      component: CreateSeriesToolbarAction,
    });
  },

  activate() {},

  deactivate() {},
});
