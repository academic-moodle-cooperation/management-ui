import { Film } from "lucide-react";

import { createPlugin, type PluginManager } from "@workspace/plugin-system";

import App from "./App";

/**
 * Core Episodes Plugin
 *
 * Registers the `/episodes` route and its sidebar navigation entry through
 * the public plugin API. Replaces the legacy `apps/management-ui-episodes`
 * Vite app + the separate `episodes-nav-implementation.ts` plugin, per
 * ADR-003.
 *
 * Note: the app `id` remains `"management-ui-episodes"` so that existing
 * `config.plugins["management-ui-episodes"]` lookups (and the `appName`-based
 * route protection) keep working during the Phase 3 migration. A follow-up
 * phase (config redesign) may normalize this to `"episodes"`.
 */
export const coreEpisodesPlugin = createPlugin({
  namespace: "episodes",
  type: "app",
  version: "1.0.0",

  initialize(manager: PluginManager) {
    manager.registerObject("apps:definitions", "management-ui-episodes", {
      id: "management-ui-episodes",
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
  },

  activate() {},

  deactivate() {},
});

export default coreEpisodesPlugin;
