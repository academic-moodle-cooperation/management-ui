import { Plugin } from '../../IPlugin';

export type RegistryObject = {
  id: string;
  type: string;
  data: unknown;
  metadata?: Record<string, unknown>;
};

export const createObjectRegistryPlugin = (): Plugin => {
  const registryItems = new Map<string, Map<string, RegistryObject>>();

  return {
    name: 'registry',
    version: '1.0.0',

    initialize(manager) {
      // Register an object
      manager.addFunction('registry.addObject', (type: string, id: string, data: unknown, metadata?: Record<string, unknown>) => {
        if (!registryItems.has(type)) {
          registryItems.set(type, new Map());
        }
        const typeRegistry = registryItems.get(type)!;
        typeRegistry.set(id, { id, type, data, metadata });
        manager.dispatchEvent('registry.objectUpdated', { type, id });
      });

      // Get all objects of a specific type
      manager.addFunction('registry.getObjects', (type: string) => {
        const typeRegistry = registryItems.get(type);
        if (!typeRegistry) {
          return [];
        }
        const items = Array.from(typeRegistry.values());
        return items;
      });

      // Get a specific object
      manager.addFunction('registry.getObject', (type: string, id: string) => {
        const typeRegistry = registryItems.get(type);
        if (!typeRegistry) return null;
        return typeRegistry.get(id) || null;
      });

      // Remove an object
      manager.addFunction('registry.removeObject', (type: string, id: string) => {
        const typeRegistry = registryItems.get(type);
        if (typeRegistry && typeRegistry.has(id)) {
          typeRegistry.delete(id);
          manager.dispatchEvent('registry.objectUpdated', { type, id });
          return true;
        }
        return false;
      });
    },

    activate() {
      // Object Registry plugin activated
    },

    deactivate() {
      // Object Registry plugin deactivated
    }
  };
}; 
