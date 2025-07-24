// packages/plugin-system/src/plugins/objectRegistry/hooks/useRegistry.ts
import { useState, useEffect, useMemo } from 'react';
import { usePluginManager } from '../../../PluginProvider';

export function useRegistry<T = unknown>(type: string) {
  const manager = usePluginManager();
  const [items, setItems] = useState<T[]>([]);

  useEffect(() => {
    // Get initial data
    const initialItems = manager.getObjects<T>(type);
    setItems(initialItems);

    // Listen for updates
    const handleUpdate = (event: { type: string }) => {
      if (event.type === type) {
        const updatedItems = manager.getObjects<T>(type);
        
        // Only update state if the items have actually changed
        setItems(prevItems => {
          // Simple shallow comparison - if lengths are different, definitely changed
          if (prevItems.length !== updatedItems.length) {
            return updatedItems;
          }
          
          // If lengths are same, check if any items changed
          const hasChanged = prevItems.some((item, index) => item !== updatedItems[index]);
          return hasChanged ? updatedItems : prevItems;
        });
      }
    };

    manager.addEventListener('registry.objectUpdated', handleUpdate);

    return () => {
      manager.removeEventListener('registry.objectUpdated', handleUpdate);
    };
  }, [manager, type]);

  // Memoize the returned object to prevent unnecessary re-renders
  return useMemo(() => ({
    items,
    getItem: (id: string) => manager.getObject<T>(type, id),
    addItem: (id: string, data: T, metadata?: Record<string, unknown>) =>
      manager.registerObject(type, id, data, metadata),
    removeItem: (id: string) => manager.removeObject(type, id)
  }), [items, manager, type]);
} 