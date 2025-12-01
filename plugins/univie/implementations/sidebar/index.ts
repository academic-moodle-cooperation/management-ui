import { createPlugin } from '@workspace/plugin-system';
import { PluginManager } from '@workspace/plugin-system';
import { CustomNavMain } from './components/CustomNavMain';
import { SidebarHeaderLogo } from './components/SidebarHeaderLogo';
import { SidebarFooter } from './components/SidebarFooter';
import React from 'react';
import { Video } from '@workspace/ui/components/icons';

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

export const studioUnivieNavImplementation = createPlugin({
  namespace: 'univie',
  type: 'navigation',
  version: '1.0.0',

  initialize(manager: PluginManager) {
    // Get all config objects from the plugin manager and merge them
    const configObjects = manager.getObjects<any>('app:config');

    // Merge all configs (similar to how PluginInitializer does it)
    const mergedConfig = configObjects.reduce((acc: any, obj: any) => {
      return { ...acc, ...obj };
    }, {});

    // Get Studio URL from merged config
    const studioUrl = mergedConfig?.app?.studioUrl || mergedConfig?.studioUrl || '/studio';

    // Register a plain object (not a React component)
    manager.registerObject('sidebar:nav-items', 'studio', {
      title: 'Studio',
      path: studioUrl,
      target: '_blank',
      icon: Video,
      order: 50,
      permissions: [],
      featureFlags: [],
      category: 'studio'
    });
  },

  activate() {
    console.log('[univie:navigation] Plugin activated');
  },

  deactivate() {
    console.log('[univie:navigation] Plugin deactivated');
  }
});