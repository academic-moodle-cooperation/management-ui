import { i18next } from "@workspace/i18n";
import { createPlugin, type PluginManager } from "@workspace/plugin-system";
import { Film } from "@workspace/ui/components";

/**
 * Episodes Navigation Implementation
 * Provides navigation item for the Episodes app
 *
 * Usage in episodes app:
 * import { episodesNavImplementation } from '@workspace/plugins';
 * manager.register(episodesNavImplementation);
 */
export const episodesNavImplementation = createPlugin({
  namespace: "episodes",
  type: "navigation",
  version: "1.0.0",

  initialize(manager: PluginManager) {
    manager.registerObject("sidebar:nav-items", "episodes", {
      title: i18next.t("common:episodes"),
      path: "/episodes",
      icon: Film,
      order: 30, // After Home (10), before Upload (40)
      permissions: ["episodes.view"],
      featureFlags: [],
      category: "content",
    });
  },

  activate() {},

  deactivate() {},
});
