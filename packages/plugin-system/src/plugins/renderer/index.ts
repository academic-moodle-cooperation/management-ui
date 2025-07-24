import { Plugin } from '../../IPlugin';
import { RendererComponent } from './types';

export const createRendererPlugin = (): Plugin => {
  const components = new Map<string, RendererComponent[]>();

  return {
    name: 'renderer',
    version: '1.0.0',

    initialize(manager) {
      manager.addFunction('renderer.add', (position: string, component: React.FC, key = crypto.randomUUID(), order = 100) => {
        const existing = components.get(position) || [];
        components.set(position, [...existing, { component, key, position, order }]);
        manager.dispatchEvent('renderer.componentUpdated', { position });
      });

      manager.addFunction('renderer.getComponents', (position: string) => {
        const positionComponents = components.get(position) || [];
        // Sort components by order (lower numbers first)
        return [...positionComponents].sort((a, b) => (a.order || 100) - (b.order || 100));
      });

      manager.addFunction('renderer.remove', (position: string, key: string) => {
        const existing = components.get(position) || [];
        components.set(position, existing.filter(c => c.key !== key));
        manager.dispatchEvent('renderer.componentUpdated', { position });
      });
    },

    activate() {
      // Renderer plugin activated
    },

    deactivate() {
      // Renderer plugin deactivated
    }
  };
}; 
