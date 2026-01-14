import React from "react";

import { createPlugin } from "@workspace/plugin-system";
import type { PluginManager } from "@workspace/plugin-system";
import type { NavMainProps } from "@workspace/ui/components";
import { Video, ExternalLink } from "@workspace/ui/components/icons";
import { logger } from "@workspace/utils";

import { CustomNavMain } from "./components/CustomNavMain";
import { SidebarFooter } from "./components/SidebarFooter";
import { SidebarHeaderLogo } from "./components/SidebarHeaderLogo";

/**
 * University of Vienna Custom Sidebar Implementation Plugin
 * Migrated from migrate/extensions/src/univie/src/plugins/appshell-sidebar/index.tsx
 *
 * Provides custom sidebar navigation, header, and footer components for University of Vienna
 * Replaces the default sidebar components with university-specific styling and behavior
 */

// Create wrapper components that can receive props from the plugin system
const CustomNavMainWrapper = (props: { open?: boolean; items?: NavMainProps["items"] }) => {
  return React.createElement(CustomNavMain, { ...props, items: props.items || [] });
};

const SidebarHeaderLogoWrapper = (props: React.ComponentProps<typeof SidebarHeaderLogo>) => {
  return React.createElement(SidebarHeaderLogo, props);
};

const SidebarFooterWrapper = (props: Record<string, unknown>) => {
  return React.createElement(SidebarFooter, props);
};

export const univieSidebarImplementation = createPlugin({
  namespace: "univie",
  type: "sidebar",
  version: "1.0.0",

  initialize(manager: PluginManager) {
    // Register custom navigation component with high priority
    manager.registerComponent("component-override:appshell:sidebar:content", CustomNavMainWrapper, {
      key: "univie-sidebar-content",
      order: 50, // Higher priority than core default
    });

    // Register custom header logo component with high priority
    manager.registerComponent(
      "component-override:appshell:sidebar:header",
      SidebarHeaderLogoWrapper,
      {
        key: "univie-sidebar-header",
        order: 50, // Higher priority than core default
      },
    );

    // Register custom footer component with high priority
    manager.registerComponent("component-override:appshell:sidebar:footer", SidebarFooterWrapper, {
      key: "univie-sidebar-footer",
      order: 50, // Higher priority than core default
    });
  },

  activate() {},

  deactivate() {},
});

export const studioUnivieNavImplementation = createPlugin({
  namespace: "univie",
  type: "navigation",
  version: "1.0.0",

  initialize(manager: PluginManager) {
    // Get all config objects from the plugin manager and merge them
    const configObjects = manager.getObjects<Record<string, unknown>>("app:config");

    // Merge all configs (similar to how PluginInitializer does it)
    const mergedConfig = configObjects.reduce(
      (acc: Record<string, unknown>, obj: Record<string, unknown>) => {
        return { ...acc, ...obj };
      },
      {},
    );

    // Get Studio URL from merged config
    const appConfig = mergedConfig?.["app"] as { studioUrl?: string } | undefined;
    const studioUrl =
      appConfig?.studioUrl || (mergedConfig?.["studioUrl"] as string | undefined) || "/studio";

    // Register a plain object (not a React component)
    manager.registerObject("sidebar:nav-items", "studio", {
      title: "Studio",
      path: studioUrl,
      target: "_blank",
      icon: Video,
      order: 50,
      permissions: [],
      featureFlags: [],
      category: "studio",
    });
  },

  activate() {
    logger.debug("[univie:navigation] Plugin activated");
  },

  deactivate() {
    logger.debug("[univie:navigation] Plugin deactivated");
  },
});

export const captureUnivieNavImplementation = createPlugin({
  namespace: "univie",
  type: "navigation",
  version: "1.0.0",

  initialize(manager: PluginManager) {
    // Get all config objects from the plugin manager and merge them
    const configObjects = manager.getObjects<Record<string, unknown>>("app:config");

    // Merge all configs (similar to how PluginInitializer does it)
    const mergedConfig = configObjects.reduce(
      (acc: Record<string, unknown>, obj: Record<string, unknown>) => {
        return { ...acc, ...obj };
      },
      {},
    );

    // Get Capture URL from merged config
    const appConfig = mergedConfig?.["app"] as { captureUrl?: string } | undefined;
    const captureUrl =
      appConfig?.captureUrl || (mergedConfig?.["captureUrl"] as string | undefined) || "/capture";

    // Register a plain object (not a React component)
    // Title will be translated in CustomNavMain component
    manager.registerObject("sidebar:nav-items", "capture", {
      title: "univie-sidebar:capture", // i18n key
      path: captureUrl,
      target: "_blank",
      icon: ExternalLink,
      order: 51,
      permissions: [],
      featureFlags: [],
      category: "capture",
    });
  },

  activate() {
    logger.debug("[univie:navigation:capture] Plugin activated");
  },

  deactivate() {
    logger.debug("[univie:navigation:capture] Plugin deactivated");
  },
});
