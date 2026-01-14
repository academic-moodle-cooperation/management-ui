import { createPlugin } from "@workspace/plugin-system";
import type { PluginManager } from "@workspace/plugin-system";

import { InfoPage } from "./components/InfoPage";

/**
 * University of Vienna Landing Page Implementation Plugin
 * University-specific landing page with Univie branding
 */
export const univieLandingPageImplementation = createPlugin({
  namespace: "univie",
  type: "landing-page",
  version: "1.0.0",

  initialize(manager: PluginManager) {
    // Register Univie landing page with higher priority than core default
    manager.registerComponent("component-override:appshell:landing-page", InfoPage, {
      key: "univie-landing-page",
      order: 50, // Higher priority than core default (100)
    });
  },

  activate() {},

  deactivate() {},
});
