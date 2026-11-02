import { Store } from "lucide-react";

import { createPlugin, type PluginManager } from "@oc-mui/plugin-system";
import { getCachedAppConfig } from "@oc-mui/query";
import { logger } from "@oc-mui/utils";

import { marketplaceV2Config } from "./config";
import { loadTrials } from "./services/trials";
import { Discover } from "./views/Discover";

const log = logger.child({ component: "admin-marketplace-v2" });

/**
 * admin-marketplace-v2 — ground-up marketplace rebuild.
 *
 * Runs in parallel to `admin-marketplace` (the upload-v2 pattern) while
 * features migrate piece by piece; each feature is discussed against
 * INTENT.md before it lands. Current scope: the Discover catalog —
 * read-only browsing of configured registries. No remote code is fetched
 * or executed by this plugin.
 *
 * Like v1, the marketplace is an admin-only surface (INTENT.md: admins
 * curate what their org sees). `requiredRoles` is enforced by the shell's
 * route gate; deployments override via
 * `config.plugins["admin-marketplace-v2"].protection.requiredRoles`.
 */
const MARKETPLACE_ROLES = ["ROLE_ADMIN"];

export const adminMarketplaceV2Plugin = createPlugin({
  namespace: "admin-marketplace-v2",
  type: "marketplace",
  version: "0.1.0",

  async initialize(manager: PluginManager) {
    marketplaceV2Config.register(manager);

    manager.registerObject("apps:definitions", "marketplace-v2", {
      id: "marketplace-v2",
      name: "Marketplace v2",
      routePath: "/admin/marketplace-v2",
      requiredRoles: MARKETPLACE_ROLES,
      component: Discover,
    });

    manager.registerObject("sidebar:nav-items", "marketplace-v2", {
      title: "Marketplace v2",
      path: "/admin/marketplace-v2",
      icon: Store,
      order: 1001, // right below the v1 marketplace entry while both exist
      permissions: ["admin.view"],
      requiredRoles: MARKETPLACE_ROLES,
      featureFlags: [],
      category: "admin",
    });

    // Replay tab-scoped trials through the boot path (see services/trials.ts).
    // Config unreadable (e.g. backend down at boot) → safe defaults, which
    // keep the Try gesture disabled and therefore skip every trial.
    let appConfig: Awaited<ReturnType<typeof getCachedAppConfig>> | undefined;
    try {
      appConfig = await getCachedAppConfig();
    } catch (err) {
      log.debug(
        `could not read app config; trials stay disabled: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    const cfg = marketplaceV2Config.read(appConfig);
    await loadTrials(manager, cfg.try);
  },

  activate() {},

  deactivate() {},
});

// The remote-plugin loader imports the plugin via `module.default`, so the
// plugin object MUST be the default export (see the contract test).
export default adminMarketplaceV2Plugin;
