import { createPlugin } from '@workspace/plugin-system';
import { PluginManager } from '@workspace/plugin-system';
import { CustomNavMain } from './components/CustomNavMain';
import { SidebarHeaderLogo } from './components/SidebarHeaderLogo';
import { SidebarFooter } from './components/SidebarFooter';
import React from 'react';

/**
 * University of Vienna Custom Sidebar Implementation Plugin
 * Migrated from migrate/extensions/src/univie/src/plugins/appshell-sidebar/index.tsx
 * 
 * Provides custom sidebar navigation, header, and footer components for University of Vienna
 * Replaces the default sidebar components with university-specific styling and behavior
 */

// Create wrapper components that can receive props from the plugin system
const CustomNavMainWrapper = (props: { open?: boolean; items?: any[] }) => {
  return React.createElement(CustomNavMain, { ...props, items: props.items || [] });
};

const SidebarHeaderLogoWrapper = (props: any) => {
  return React.createElement(SidebarHeaderLogo, props);
};

const SidebarFooterWrapper = (props: Record<string, unknown>) => {
  return React.createElement(SidebarFooter, props);
};

export const univieSidebarImplementation = createPlugin({
  namespace: 'univie',
  type: 'sidebar',
  version: '1.0.0',

  initialize(manager: PluginManager) {

    // Register custom navigation component with high priority
    manager.registerComponent(
      'component-override:appshell:sidebar:content',
      CustomNavMainWrapper,
      {
        key: 'univie-sidebar-content',
        order: 50 // Higher priority than core default
      }
    );

    // Register custom header logo component with high priority  
    manager.registerComponent(
      'component-override:appshell:sidebar:header',
      SidebarHeaderLogoWrapper,
      {
        key: 'univie-sidebar-header',
        order: 50 // Higher priority than core default
      }
    );

    // Register custom footer component with high priority
    manager.registerComponent(
      'component-override:appshell:sidebar:footer',
      SidebarFooterWrapper,
      {
        key: 'univie-sidebar-footer',
        order: 50 // Higher priority than core default
      }
    );

  },

  activate() {

  },

  deactivate() {

  }
}); 