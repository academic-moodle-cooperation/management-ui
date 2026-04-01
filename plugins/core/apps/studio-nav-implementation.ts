import { createPlugin, type PluginManager } from "@workspace/plugin-system";
import { getCachedAppConfig } from "@workspace/query";
import { MonitorPlay } from "@workspace/ui/components";
import { logger } from "@workspace/utils";

/**
 * Studio Navigation Implementation
 * Provides a navigation item for u:stream Studio, reading the URL from the app configuration.
 *
 * The studio URL is configured in the production config.json under
 * `app.organizationUrls.studio`. When present, a "Studio" item is added to the
 * sidebar and navigated to via a full-page load (isExternal: true) because
 * /studio is served by the backend and is not a client-side route.
 *
 * Usage:
 * Set `app.organizationUrls.studio` in the instance config.json, e.g.:
 *   { "app": { "organizationUrls": { "studio": "/studio" } } }
 */
export const studioNavImplementation = createPlugin({
  namespace: "core",
  type: "studio",
  version: "1.0.0",

  async initialize(manager: PluginManager) {
    try {
      const config = await getCachedAppConfig();
      const studioUrl = config?.app?.organizationUrls?.studio;
      if (!studioUrl) {
        return;
      }

      // Determine the link target: same tab for same-origin relative paths,
      // new tab for absolute external URLs.
      const target = studioUrl.startsWith("http://") || studioUrl.startsWith("https://")
        ? "_blank"
        : "_self";

      manager.registerObject("sidebar:nav-items", "studio", {
        title: "common:studio",
        path: studioUrl,
        // Force external link rendering so the browser performs a full-page
        // navigation instead of routing through TanStack Router (which has no
        // /studio client-side route and would show a 404).
        isExternal: true,
        target,
        icon: MonitorPlay,
        order: 50,
        permissions: [],
        featureFlags: [],
        category: "content",
      });
    } catch {
      // Studio URL not available (e.g. no backend in dev mode). Skip registration.
      logger.debug("studioNavImplementation: studio URL not available, skipping nav item");
    }
  },

  activate() {},

  deactivate() {},
});
