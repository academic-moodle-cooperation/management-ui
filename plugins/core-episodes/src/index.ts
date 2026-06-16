import { Film } from "lucide-react";

import { createPlugin, type PluginManager } from "@opencast-mui/plugin-system";

import App from "./App";
import { episodesConfig } from "./config";

/**
 * Core Episodes Plugin
 *
 * Registers the `/episodes` route, its sidebar navigation entry, and the
 * plugin's default config slice through the public plugin API.
 *
 * The app `id` is `"episodes"`, matching the plugin namespace and the short
 * key in `config.plugins["episodes"]`.
 *
 * Config defaults are contributed via the `app:config:defaults` extension
 * point. That point is merged *below* the instance `config.json` so any
 * deployment-specific values in `config.plugins.episodes` still win.
 * See `packages/query/src/hooks/useAppConfig.ts` for the merge order.
 */
export const coreEpisodesPlugin = createPlugin({
  namespace: "episodes",
  type: "app",
  version: "1.0.0",

  initialize(manager: PluginManager) {
    manager.registerObject("apps:definitions", "episodes", {
      id: "episodes",
      name: "Episodes",
      routePath: "/episodes",
      component: App,
    });

    manager.registerObject("sidebar:nav-items", "episodes", {
      title: "common:episodes",
      path: "/episodes",
      icon: Film,
      order: 30,
      permissions: ["episodes.view"],
      featureFlags: [],
      category: "content",
    });

    episodesConfig.register(manager);
  },

  activate() {},

  deactivate() {},
});

export default coreEpisodesPlugin;
