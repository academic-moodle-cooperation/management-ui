import { i18next } from '@workspace/i18n';
import { createPlugin, type PluginManager } from '@workspace/plugin-system';
import { ListVideo } from '@workspace/ui/components';

/**
 * Series Navigation Implementation
 * Provides navigation item for the Series app
 * 
 * Usage in series app:
 * import { seriesNavImplementation } from '@workspace/plugins';
 * manager.register(seriesNavImplementation);
 */
export const seriesNavImplementation = createPlugin({
  namespace: 'series',
  type: 'navigation',
  version: '1.0.0',

  initialize(manager: PluginManager) {

    manager.registerObject('sidebar:nav-items', 'series', {
      title: i18next.t('common:series'),
      path: '/series',
      icon: ListVideo,
      order: 20, // After Home (10), before Episodes (30)
      permissions: ['series.view'],
      featureFlags: [],
      category: 'content'
    });

  },

  activate() {

  },

  deactivate() {

  }
}); 