import { createPlugin, type PluginManager } from '@workspace/plugin-system';

/**
 * Table Sidebar Extension Points Plugin
 * Defines where and how table sidebar tabs can be extended by universities
 * 
 * Extension Points Defined:
 * - table-sidebar:tabs - Additional tabs for table sidebars
 * - table-sidebar:episodes:tabs - Episode-specific sidebar tabs
 * - table-sidebar:series:tabs - Series-specific sidebar tabs
 */
export const tableSidebarExtensionPoints = createPlugin({
  namespace: 'core',
  type: 'table-sidebar-extension-points',
  version: '1.0.0',

  initialize(manager: PluginManager) {

    // Document available extension points

    // Register API documentation objects that extensions can reference
    manager.registerObject('extension-points:documentation', 'table-sidebar:tabs', {
      description: 'Additional tabs for table sidebars',
      expectedSchema: {
        id: 'string - Unique tab identifier',
        label: 'string - Tab display name',
        order: 'number - Tab order (lower = left position)',
        component: 'React.Component - Tab content component',
        context: 'string[] - Which tables this applies to (episodes, series, etc.)',
        permissions: 'string[] - Required permissions',
        featureFlags: 'string[] - Required feature flags'
      },
      examples: [
        {
          id: 'access',
          label: 'Access Control',
          order: 20,
          component: 'AclEditorComponent',
          context: ['episodes', 'series'],
          permissions: ['acl.edit'],
          featureFlags: []
        }
      ]
    });

    manager.registerObject('extension-points:documentation', 'table-sidebar:episodes:tabs', {
      description: 'Episode-specific table sidebar tabs',
      expectedSchema: {
        id: 'string - Unique tab identifier',
        label: 'string - Tab display name',
        order: 'number - Tab order',
        component: 'React.Component - Tab content component'
      }
    });

    manager.registerObject('extension-points:documentation', 'table-sidebar:series:tabs', {
      description: 'Series-specific table sidebar tabs',
      expectedSchema: {
        id: 'string - Unique tab identifier',
        label: 'string - Tab display name',
        order: 'number - Tab order',
        component: 'React.Component - Tab content component'
      }
    });

  },

  activate() {

  },

  deactivate() {

  }
}); 