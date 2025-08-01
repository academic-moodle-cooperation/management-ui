// packages/plugin-system/src/pluginTypes.ts
export interface PluginTypeDefinition {
  type: string;
  namespace: string;
  description: string;
  extensionPoints: {
    id: string;
    description: string;
    accepts: 'component' | 'object' | 'both';
    schema?: Record<string, unknown>; // For object types, describe expected fields
  }[];
  examples: {
    title: string;
    code: string;
  }[];
}

export const PLUGIN_TYPES: PluginTypeDefinition[] = [
  {
    type: 'sidebar',
    namespace: 'ui',
    description: 'Add items to the application sidebar navigation',
    extensionPoints: [
      {
        id: 'sidebar:nav-items',
        description: 'Navigation items in the main sidebar',
        accepts: 'component'
      },
      {
        id: 'sidebar:config',
        description: 'Configuration for sidebar items',
        accepts: 'object',
        schema: {
          title: 'string',
          path: 'string',
          icon: 'string',
          permissions: 'string[]'
        }
      }
    ],
    examples: [
      {
        title: 'Adding a navigation item',
        code: `
import { createPlugin } from '@workspace/plugin-system';

const MyNavItem = () => <div>Custom Navigation</div>;

export const MyPlugin = createPlugin({
  namespace: 'my-plugin',
  type: 'sidebar',
  version: '1.0.0',
  
  initialize(manager) {
    manager.registerComponent('sidebar:nav-items', MyNavItem, { order: 10 });
    
    manager.registerObject('sidebar:config', 'my-config', {
      title: "My Plugin",
      path: "/my-plugin",
      icon: "puzzle",
      permissions: ["use_my_plugin"]
    });
  },
  
  activate() { /* Plugin activated */ },
  deactivate() { /* Plugin deactivated */ }
});
        `
      }
    ]
  },
  {
    type: 'app',
    namespace: 'apps',
    description: 'Register full applications that can be loaded by the core shell',
    extensionPoints: [
      {
        id: 'apps:definitions',
        description: 'Application definitions for dynamic loading',
        accepts: 'object',
        schema: {
          id: 'string',
          name: 'string',
          routePath: 'string',
          component: 'React.ComponentType',
          navigation: 'object',
          loader: 'function',
          version: 'string',
          description: 'string'
        }
      }
    ],
    examples: [
      {
        title: 'Registering an application',
        code: `
import { createPlugin } from '@workspace/plugin-system';
import { MyAppComponent } from './MyAppComponent';

export const MyAppPlugin = createPlugin({
  namespace: 'my-university',
  type: 'app',
  version: '1.0.0',
  
  initialize(manager) {
    manager.registerObject('apps:definitions', 'my-app', {
      id: 'my-app',
      name: 'My Custom App',
      routePath: '/my-app',
      component: MyAppComponent,
      navigation: {
        title: 'My App',
        icon: 'app-window',
        order: 100,
        permissions: ['access_my_app']
      },
      version: '1.0.0',
      description: 'A custom application for my university'
    });
  },
  
  activate() { /* Plugin activated */ },
  deactivate() { /* Plugin deactivated */ }
});
        `
      }
    ]
  },
  // Add more plugin types...
];

// Helper function to get plugin type information
export function getPluginTypeInfo(type: string): PluginTypeDefinition | undefined {
  return PLUGIN_TYPES.find(p => p.type === type);
} 