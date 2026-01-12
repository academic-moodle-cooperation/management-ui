import React, { createContext, useContext, useState, useMemo, useEffect, useRef } from 'react';
import { usePluginManager } from './PluginProvider';
import { logger } from '@workspace/utils';

type ComponentEntry = {
  key: string;
  Component: React.FC;
};

type RendererContextType = {
  registerComponent: (position: string, key: string, Component: React.FC) => void;
  unregisterComponent: (position: string, key: string) => void;
  getComponentsForPosition: (position: string) => Promise<ComponentEntry[]>;
};

const RendererContext = createContext<RendererContextType | null>(null);

/**
 * @deprecated The RendererProvider is part of the legacy rendering system. 
 * Use ComponentResolver for new code.
 */
export const RendererProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [components, setComponents] = useState<Record<string, ComponentEntry[]>>({});
  const manager = usePluginManager();
  const registrationComplete = useRef(false);
  const warnedAboutDeprecation = useRef(false);

  useEffect(() => {
    logger.warn('RendererProvider is deprecated. Use ComponentResolver for new code.');
    warnedAboutDeprecation.current = true;
  }, []);

  // Listen for plugin registration events
  useEffect(() => {
    const handlePluginRegistered = () => {
      // Force a re-render of the renderer context when plugins change
      setComponents(prev => ({ ...prev }));
    };

    manager.addEventListener('plugin:registered', handlePluginRegistered);

    return () => {
      manager.removeEventListener('plugin:registered', handlePluginRegistered);
    };
  }, [manager]);

  const value = useMemo(() => ({
    registerComponent: (position: string, key: string, Component: React.FC) => {
      logger.warn('registerComponent via RendererContext is deprecated. Use manager.registerComponent instead.', { position, key });

      setComponents(prev => {
        const existingComponents = prev[position] || [];
        const componentExists = existingComponents.some(c => c.key === key);

        if (componentExists) {
          return {
            ...prev,
            [position]: existingComponents.map(c =>
              c.key === key ? { key, Component } : c
            )
          };
        }

        return {
          ...prev,
          [position]: [...existingComponents, { key, Component }]
        };
      });
    },
    unregisterComponent: (position: string, key: string) => {
      logger.warn('unregisterComponent via RendererContext is deprecated.', { position, key });

      setComponents(prev => ({
        ...prev,
        [position]: (prev[position] || []).filter(c => c.key !== key)
      }));
    },
    getComponentsForPosition: async (position: string): Promise<ComponentEntry[]> => {
      try {
        if (!registrationComplete.current) {
          await new Promise<void>(resolve => {
            // Only wait for initial plugin registration
            const timeout = setTimeout(() => {
              logger.warn(`Timeout waiting for plugins at position ${position}`, { position });
              registrationComplete.current = true;
              resolve();
            }, 1000);

            const checkRegistration = () => {
              if (manager.plugins.size > 0) {
                clearTimeout(timeout);
                registrationComplete.current = true;
                resolve();
              } else {
                setTimeout(checkRegistration, 50);
              }
            };

            checkRegistration();
          });
        }

        const registeredComponents = components[position] || [];

        // Add error handling when executing plugin functions
        let pluginComponents: ComponentEntry[] = [];
        try {
          // This dynamic function lookup pattern is deprecated
          const functionName = `get${position.charAt(0).toUpperCase() + position.slice(1)}Components`;
          logger.warn(`DEPRECATED: Using dynamic function lookup (${functionName}). Use ComponentResolver instead.`, { position, functionName });
          
          pluginComponents = manager.executeFunction<ComponentEntry[]>(functionName) || [];
        } catch (e) {
          logger.warn(`Error getting components for position ${position}`, e instanceof Error ? e : new Error(String(e)), { position });
        }

        return [...registeredComponents, ...pluginComponents];
      } catch (error) {
        logger.error(`Error in getComponentsForPosition for ${position}`, error instanceof Error ? error : new Error(String(error)), { position });
        return [];
      }
    }
  }), [components, manager]);

  return (
    <RendererContext.Provider value={value}>
      {children}
    </RendererContext.Provider>
  );
};

/**
 * @deprecated Use ComponentResolver instead.
 */
export const useRenderer = () => {
  logger.warn('useRenderer is deprecated. Use ComponentResolver instead.');

  const context = useContext(RendererContext);
  if (!context) {
    throw new Error('useRenderer must be used within a RendererProvider');
  }
  return context;
}; 