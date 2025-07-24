import { Plugin } from './IPlugin';
import { PluginManager } from './pluginManager';

/**
 * Options for creating a plugin
 */
export interface PluginOptions {
  /**
   * The namespace for the plugin (e.g., 'episodes', 'series')
   */
  namespace: string;

  /**
   * The type of plugin (e.g., 'sidebar', 'renderer')
   */
  type: string;

  /**
   * The version of the plugin
   */
  version: string;

  /**
   * Optional order for plugin processing (lower numbers processed first)
   * @default 100
   */
  order?: number;

  /**
   * Optional dependencies required by this plugin
   */
  dependencies?: string[];

  /**
   * Initialization function called when the plugin is registered
   * @param manager The plugin manager instance
   */
  initialize?: (manager: PluginManager) => void;

  /**
   * Activation function called after initialization
   */
  activate: () => void;

  /**
   * Deactivation function called when the plugin is deregistered
   */
  deactivate: () => void;
}

/**
 * Creates a properly formatted plugin with consistent naming conventions
 * 
 * @example
 * ```typescript
 * const sidebarPlugin = createPlugin({
 *   namespace: 'episodes',
 *   type: 'sidebar',
 *   version: '1.0.0',
 *   initialize: (manager) => {
 *     manager.registerComponent('sidebar:nav-items', EpisodesNavItem, { order: 10 });
 *   },
 *   activate: () => { // Episodes sidebar plugin activated },
 *   deactivate: () => { // Episodes sidebar plugin deactivated }
 * });
 * ```
 */
export function createPlugin(options: PluginOptions): Plugin {
  const { namespace, type, version, order = 100, dependencies, initialize, activate, deactivate } = options;

  // Ensure namespace and type are valid
  if (!namespace || namespace.includes(':')) {
    throw new Error(`Invalid namespace: "${namespace}". Namespace should not contain colons.`);
  }

  if (!type || type.includes(':')) {
    throw new Error(`Invalid type: "${type}". Type should not contain colons.`);
  }

  return {
    name: `${namespace}:${type}`,
    version,
    order,
    dependencies,
    initialize,
    activate,
    deactivate
  };
} 