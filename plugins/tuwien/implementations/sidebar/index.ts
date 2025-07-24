import { createPlugin } from '@workspace/plugin-system';
import { PluginManager } from '@workspace/plugin-system';
import { CustomNavMain } from './components/CustomNavMain';
import { SidebarHeader } from './components/SidebarHeader';
import { SidebarUserMenu } from './components/SidebarUserMenu';
import { SidebarToggle } from './components/SidebarToggle';
import React from 'react';

// Wrapper components that don't need props directly from the plugin system
const CustomNavMainWrapper = (props: { open?: boolean; items?: any[] }) => {
  return React.createElement(React.Fragment, {},
    React.createElement(SidebarUserMenu, { open: props.open || false }),
    React.createElement(CustomNavMain, { ...props, items: props.items || [] })
  );
};

const SidebarHeaderWrapper = (props: any) => {
  return React.createElement(SidebarHeader, props);
};

const SidebarToggleWrapper = (props: any) => {
  return React.createElement(SidebarToggle, props);
};

/**
 * TU Wien Sidebar Implementation Plugin
 * University-specific sidebar with custom navigation, header, and user menu
 */
export const tuwienSidebarImplementation = createPlugin({
  namespace: 'tuwien',
  type: 'sidebar',
  version: '1.0.0',

  initialize(manager: PluginManager) {
    console.log('Initializing TU Wien Sidebar Implementation');

    // Register TU Wien sidebar components with higher priority than core defaults
    manager.registerComponent(
      'component-override:appshell:sidebar:content',
      CustomNavMainWrapper,
      {
        key: 'tuwien-sidebar-content',
        order: 50 // Higher priority than core default (100)
      }
    );

    manager.registerComponent(
      'component-override:appshell:sidebar:header',
      SidebarHeaderWrapper,
      {
        key: 'tuwien-sidebar-header',
        order: 50 // Higher priority than core default (100)
      }
    );

    manager.registerComponent(
      'component-override:appshell:sidebar:footer',
      SidebarToggleWrapper,
      {
        key: 'tuwien-sidebar-toggle',
        order: 50 // Higher priority than core default (100)
      }
    );

    console.log('TU Wien sidebar components registered');
  },

  activate() {
    console.log('TU Wien Sidebar Implementation activated');
  },

  deactivate() {
    console.log('TU Wien Sidebar Implementation deactivated');
  }
}); 