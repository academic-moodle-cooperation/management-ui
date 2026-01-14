import React from "react";

import { createPlugin } from "@workspace/plugin-system";
import type { PluginManager } from "@workspace/plugin-system";
import type { NavMainProps } from "@workspace/ui/components";
import { Video } from "@workspace/ui/components/icons";
import { logger } from "@workspace/utils";

import { CustomNavMain } from "./components/CustomNavMain";
import { SidebarHeader } from "./components/SidebarHeader";
import { SidebarToggle } from "./components/SidebarToggle";
import { SidebarUserMenu } from "./components/SidebarUserMenu";

// Wrapper components that don't need props directly from the plugin system
const CustomNavMainWrapper = (props: { open?: boolean; items?: NavMainProps["items"] }) => {
  return React.createElement(
    React.Fragment,
    {},
    React.createElement(SidebarUserMenu, { open: props.open || false }),
    React.createElement(CustomNavMain, { ...props, items: props.items || [] }),
  );
};

const SidebarHeaderWrapper = (props: React.ComponentProps<typeof SidebarHeader>) => {
  return React.createElement(SidebarHeader, props);
};

const SidebarToggleWrapper = () => {
  return React.createElement(SidebarToggle);
};

/**
 * TU Wien Sidebar Implementation Plugin
 * University-specific sidebar with custom navigation, header, and user menu
 */
export const tuwienSidebarImplementation = createPlugin({
  namespace: "tuwien",
  type: "sidebar",
  version: "1.0.0",

  initialize(manager: PluginManager) {
    logger.debug("Initializing TU Wien Sidebar Implementation");

    // Register TU Wien sidebar components with higher priority than core defaults
    manager.registerComponent("component-override:appshell:sidebar:content", CustomNavMainWrapper, {
      key: "tuwien-sidebar-content",
      order: 50, // Higher priority than core default (100)
    });

    manager.registerComponent("component-override:appshell:sidebar:header", SidebarHeaderWrapper, {
      key: "tuwien-sidebar-header",
      order: 50, // Higher priority than core default (100)
    });

    manager.registerComponent("component-override:appshell:sidebar:footer", SidebarToggleWrapper, {
      key: "tuwien-sidebar-toggle",
      order: 50, // Higher priority than core default (100)
    });

    logger.debug("TU Wien sidebar components registered");
  },

  activate() {
    logger.debug("TU Wien Sidebar Implementation activated");
  },

  deactivate() {
    logger.debug("TU Wien Sidebar Implementation deactivated");
  },
});

export const studioNavImplementation = createPlugin({
  namespace: "tuwien",
  type: "navigation",
  version: "1.0.0",

  initialize(manager: PluginManager) {
    manager.registerObject("sidebar:nav-items", "studio", {
      title: "Studio",
      path: "https://studio.tuwien.ac.at",
      target: "_blank",
      icon: Video,
      order: 50,
      permissions: [],
      featureFlags: [],
      category: "studio",
    });
  },

  activate() {},

  deactivate() {},
});
