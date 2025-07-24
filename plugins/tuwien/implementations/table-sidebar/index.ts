import { createPlugin } from '@workspace/plugin-system';
import { AclEditorTab } from './components/AclEditorTab';
import { PluginManager } from '@workspace/plugin-system';

/**
 * TU Wien Table Sidebar Implementation Plugin
 * Adds ACL editor tabs to table sidebars for episodes and series
 */
export const tuwienTableSidebarImplementation = createPlugin({
  namespace: 'tuwien',
  type: 'table-sidebar',
  version: '1.0.0',

  initialize(manager: PluginManager) {
    console.log('🎯 Initializing TU Wien Table Sidebar Implementation');

    // Register ACL editor tab for episodes tables
    manager.registerComponent(
      'table-sidebar:episodes:tabs',
      AclEditorTab,
      {
        key: 'access-tab',
        order: 20 // Show after info tab (order 10)
      }
    );

    // Register ACL editor tab for series tables
    manager.registerComponent(
      'table-sidebar:series:tabs',
      AclEditorTab,
      {
        key: 'access-tab',
        order: 20 // Show after info tab (order 10)
      }
    );

    console.log('✅ TU Wien table sidebar tabs registered for episodes and series');
  },

  activate() {
    console.log('🎯 TU Wien Table Sidebar Implementation activated');
  },

  deactivate() {
    console.log('🎯 TU Wien Table Sidebar Implementation deactivated');
  }
}); 