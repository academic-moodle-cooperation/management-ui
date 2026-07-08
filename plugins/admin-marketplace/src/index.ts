import { ShoppingBag } from "lucide-react";

import { createPlugin } from "@oc-mui/plugin-system";
import { getCachedAppConfig } from "@oc-mui/query";
import { logger } from "@oc-mui/utils";

import { adminMarketplaceConfig } from "./config";
import { RemoteLoader } from "./services/remote-loader";
import { securityService } from "./services/security";
import { ThemeLoader } from "./services/theme-loader";
import { MarketplaceDashboard } from "./views/MarketplaceDashboard";

const log = logger.child({ component: "admin-marketplace" });

/**
 * Admin Marketplace Plugin
 *
 * Provides a marketplace interface for dynamically loading and installing
 * remote plugins at runtime using the "Parallel Engine" approach.
 *
 * Features:
 * - Browse available plugins from a registry
 * - Try plugins without installing (temporary load)
 * - Install plugins (load + persist to localStorage)
 * - Developer mode for loading custom plugin URLs
 * - Auto-load installed plugins on initialization
 *
 * Architecture:
 * This plugin follows the "Parallel Engine" approach, meaning it uses the
 * existing PluginManager to register remote modules loaded via dynamic import().
 * Remote plugins are loaded as ES modules and registered with the same
 * PluginManager instance, allowing them to extend the application just like
 * built-in plugins.
 */
export const adminMarketplacePlugin = createPlugin({
  namespace: "admin",
  type: "marketplace",
  version: "1.0.0",

  async initialize(manager) {
    log.debug("initializing");

    // Contribute the config defaults (remote loading OFF unless a deployment
    // opts in) and push the resolved slice into the security service so every
    // load path is fail-closed by default. If config can't be read (e.g. the
    // backend is down at boot), fall back to the defaults — which keep remote
    // loading disabled.
    adminMarketplaceConfig.register(manager);
    let appConfig: Awaited<ReturnType<typeof getCachedAppConfig>> | undefined;
    try {
      appConfig = await getCachedAppConfig();
    } catch (err) {
      // Not an error condition: failing to read config just means we keep the
      // safe default (remote loading disabled). Logged at debug so a clean boot
      // without a backend (e.g. tests) doesn't emit warnings.
      log.debug(
        `could not read app config; remote plugin loading stays disabled: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
    const cfg = adminMarketplaceConfig.read(appConfig);
    securityService.updateConfig({
      remotePluginsEnabled: cfg.remotePlugins.enabled,
      allowedDomains: cfg.remotePlugins.allowedDomains,
    });

    // Load installed theme in background (do not block plugin init or router)
    void ThemeLoader.initialize();

    // The marketplace loads and executes third-party code at runtime, so it is
    // restricted to administrators. `requiredRoles` is enforced by the shell's
    // route gate (AppProtection), matched against the user's granted roles from
    // /info/me.json. `ROLE_ADMIN` is Opencast's default admin role; a deployment
    // that uses a different admin role can override via
    // `config.plugins[<id>].protection.requiredRoles`. Governance of *which*
    // plugins may be listed/installed (approval by authorized members) is a
    // separate, still-to-be-defined policy layered on top of this access gate.
    const MARKETPLACE_ROLES = ["ROLE_ADMIN"];

    // Register the marketplace apps (separate routes for Plugins and Themes views)
    manager.registerObject("apps:definitions", "marketplace-plugins", {
      id: "marketplace-plugins",
      name: "Marketplace – Plugins",
      routePath: "/admin/marketplace/plugins",
      requiredRoles: MARKETPLACE_ROLES,
      component: () => MarketplaceDashboard({ manager, view: "plugins" }),
    });

    manager.registerObject("apps:definitions", "marketplace-themes", {
      id: "marketplace-themes",
      name: "Marketplace – Themes",
      routePath: "/admin/marketplace/themes",
      requiredRoles: MARKETPLACE_ROLES,
      component: () => MarketplaceDashboard({ manager, view: "themes" }),
    });

    // Register sidebar navigation item with sub-entries for Plugins and Themes.
    // `requiredRoles` hides the entry for non-admins so there is no dead link to
    // the role-gated route above.
    manager.registerObject("sidebar:nav-items", "marketplace", {
      title: "Marketplace",
      path: "/admin/marketplace/plugins",
      icon: ShoppingBag,
      order: 1000, // Place at the end of the sidebar
      permissions: ["admin.view"],
      requiredRoles: MARKETPLACE_ROLES,
      featureFlags: [],
      category: "admin",
      items: [
        {
          title: "Plugins",
          path: "/admin/marketplace/plugins",
        },
        {
          title: "Themes",
          path: "/admin/marketplace/themes",
        },
      ],
    });

    // Auto-load persisted plugins from localStorage — but only when remote
    // loading is enabled, so a deployment that turns it off (or never turned it
    // on) does not silently execute plugins a previous admin installed.
    const savedUrls = RemoteLoader.getInstalledUrls();
    if (savedUrls.length > 0 && !cfg.remotePlugins.enabled) {
      log.info(
        `remote plugin loading is disabled; skipping ${savedUrls.length} persisted plugin(s)`,
      );
    } else if (savedUrls.length > 0) {
      log.debug(`loading ${savedUrls.length} installed plugin(s)`);

      const loadResults = await Promise.allSettled(
        savedUrls.map((url) => RemoteLoader.loadAndRegister(url, manager))
      );

      loadResults.forEach((result, index) => {
        if (result.status === "rejected") {
          log.error(
            `failed to load installed plugin from ${savedUrls[index]}`,
            result.reason instanceof Error ? result.reason : new Error(String(result.reason)),
          );
        }
      });
    }

    // .local-plugins/ are loaded by the core in dev (PluginInitializer); no need to load here

    log.debug("initialized");
  },

  activate() {
    log.debug("activated");
  },

  deactivate() {
    log.debug("deactivated");
  },
});

// Export the plugin as default for easier imports
export default adminMarketplacePlugin;

// Export services for external use if needed
export { RemoteLoader } from "./services/remote-loader";
export { ThemeLoader } from "./services/theme-loader";
export { PluginExplorer } from "./services/plugin-explorer";
export * from "./services/plugin-metadata";
export { MarketplaceDashboard } from "./views/MarketplaceDashboard";
