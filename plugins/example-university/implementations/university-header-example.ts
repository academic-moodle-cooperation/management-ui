import { createPlugin, type PluginManager } from "@workspace/plugin-system";
import { logger } from "@workspace/utils";

/**
 * Example University Header Extension
 * Shows how universities can add their logo to the header
 *
 * The core header implementation provides:
 * - Language switcher (order: 10)
 * - Login button (order: 20)
 *
 * This university extension ONLY ADDS:
 * - University logo (displayed on the left side)
 *
 * Result: [☰] [University Logo] ──── [🌐 Language] [👤 Login]
 */
export const universityHeaderExample = createPlugin({
  namespace: "university",
  type: "header-extension",
  version: "1.0.0",

  initialize(manager: PluginManager) {
    logger.debug("Initializing University Header Extension");

    // Add university logo to the header (appears on left side)
    // The default header only provides language switcher + login button
    manager.registerObject("app:header-logo", "university-logo", {
      src: "/assets/university-logo.png",
      alt: import.meta.env["VITE_INSTITUTION_NAME"] || "University",
      width: 120,
      height: 40,
      href: import.meta.env["VITE_INSTITUTION_WEBSITE"] || "/",
    });

    logger.debug("University header extension registered (logo only)");
  },

  activate() {
    logger.debug("University Header Extension activated");
  },

  deactivate() {
    logger.debug("University Header Extension deactivated");
  },
});

// Export for optional use - universities can import and register this
// or create their own implementations following this pattern
