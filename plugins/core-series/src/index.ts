import { ListVideo } from "lucide-react";

import { createPlugin, type PluginManager } from "@workspace/plugin-system";

import App from "./App";
import { CreateSeriesToolbarAction } from "./components/CreateSeriesToolbarAction";
import { SERIES_PLUGIN_ID, seriesConfigDefaults } from "./config";

/**
 * Core Series Plugin
 *
 * Registers the `/series` route, its sidebar navigation entry, and the
 * default "Create series" toolbar action through the public plugin API.
 * Replaces the legacy `apps/management-ui-series` Vite app + the separate
 * `series-nav-implementation.ts` and `series-create-implementation.ts`
 * plugins, per ADR-003.
 *
 * The app `id` is `"series"`, matching the plugin namespace and the short
 * key in `config.plugins["series"]`.
 */
export const coreSeriesPlugin = createPlugin({
  namespace: "series",
  type: "app",
  version: "1.0.0",

  initialize(manager: PluginManager) {
    manager.registerObject("apps:definitions", "series", {
      id: "series",
      name: "Series",
      routePath: "/series",
      component: App,
    });

    manager.registerObject("sidebar:nav-items", "series", {
      title: "common:series",
      path: "/series",
      icon: ListVideo,
      order: 20,
      permissions: ["series.view"],
      featureFlags: [],
      category: "content",
    });

    manager.registerObject("series:table:toolbar-end-actions", "create-series", {
      id: "create-series",
      order: 100,
      component: CreateSeriesToolbarAction,
    });

    manager.registerObject("app:config:defaults", `${SERIES_PLUGIN_ID}-defaults`, {
      plugins: { [SERIES_PLUGIN_ID]: seriesConfigDefaults },
    });
  },

  activate() {},

  deactivate() {},
});

export default coreSeriesPlugin;
