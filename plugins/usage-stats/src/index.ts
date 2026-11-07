import { BarChart3 } from "lucide-react";

import { createPlugin, type PluginManager } from "@oc-mui/plugin-system";

import { EpisodeUsageTab } from "./components/EpisodeUsageTab";
import { usageStatsConfig } from "./config";
import { UsageStatsPage } from "./UsageStatsPage";

/**
 * Usage Statistics plugin
 *
 * Answers two questions a creator keeps asking: "how often was my video
 * watched?" and "which parts did people actually see?". It registers
 *
 * - the `/usage-stats` overview page plus its sidebar entry,
 * - an extra "Usage" tab in the episodes table's detail panel, and
 * - its config slice (`config.plugins["usage-stats"]`, see `config.ts`).
 *
 * Numbers come from Opencast's usertracking REST service when it is
 * reachable; otherwise a deterministic demo generator stands in and the UI
 * says so. See `data/useUsageStats.ts` for the source resolution.
 */
export const usageStatsPlugin = createPlugin({
  namespace: "usage-stats",
  type: "app",
  version: "1.0.0",

  initialize(manager: PluginManager) {
    manager.registerObject("apps:definitions", "usage-stats", {
      id: "usage-stats",
      name: "Usage Statistics",
      routePath: "/usage-stats",
      component: UsageStatsPage,
    });

    manager.registerObject("sidebar:nav-items", "usage-stats", {
      title: "usage-stats:nav.title",
      path: "/usage-stats",
      icon: BarChart3,
      order: 45,
      permissions: [],
      featureFlags: [],
      category: "content",
    });

    // The episodes detail panel resolves its tabs through the renderer
    // (`renderer.getComponents`), not the object registry — so this is a
    // `registerComponent` call and deliberately NOT listed in plugin.json's
    // `extensionPoints` (the contract harness only checks registry objects).
    manager.registerComponent("table-sidebar:episodes:tabs", EpisodeUsageTab, {
      key: "usage-stats:app:usage-tab",
      order: 50,
      label: "usage-stats:tab.title",
    });

    usageStatsConfig.register(manager);
  },

  activate() {},

  deactivate() {},
});

// The remote-plugin loader imports plugins via `module.default`; keep the
// default export even though this plugin ships in-tree.
export default usageStatsPlugin;
