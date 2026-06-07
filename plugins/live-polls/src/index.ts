import { Vote } from "lucide-react";

import { createPlugin, type PluginManager } from "@oc-mui/plugin-system";

import App from "./App";
import { livePollsConfig } from "./config";

import "./i18n"; // registers the bundled `live-polls` i18n namespace on import

/**
 * Live Polls Plugin (audience response / SRS)
 *
 * Registers the `/live-polls` route, its sidebar entry, and the plugin's config
 * defaults. The route's internal views (deck list, editor, presenter, audience)
 * are switched inside `App` from the shell-provided `$routeSubPath` segment.
 *
 * The app `id` is `"live-polls"`, matching the plugin namespace and the short
 * key in `config.plugins["live-polls"]`.
 */
export const livePollsPlugin = createPlugin({
  namespace: "live-polls",
  type: "app",
  version: "1.0.0",

  initialize(manager: PluginManager) {
    manager.registerObject("apps:definitions", "live-polls", {
      id: "live-polls",
      name: "Live Polls",
      routePath: "/live-polls",
      component: App,
    });

    manager.registerObject("sidebar:nav-items", "live-polls", {
      title: "live-polls:nav.title",
      path: "/live-polls",
      icon: Vote,
      order: 40,
      permissions: [],
      featureFlags: [],
      category: "content",
    });

    livePollsConfig.register(manager);
  },

  activate() {},

  deactivate() {},
});

export default livePollsPlugin;
