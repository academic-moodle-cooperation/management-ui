import React from 'react';
import { usePluginManager } from './PluginProvider';
import { ComponentLoader } from './ComponentLoader';

type ComponentResolverProps<P extends object = Record<string, unknown>> = {
  componentType: string;
  defaultComponent: React.ComponentType<P>;
  componentProps: P;
  /** 
   * Controls what to show during component resolution
   * - "none": Don't render anything during initialization (prevents flash)
   * - "loader": Show a placeholder loader component
   * - "default": Show the default component immediately (original behavior)
   * @default "none"
   */
  loadingBehavior?: 'none' | 'loader' | 'default';
  /** Optional custom loader component */
  loaderComponent?: React.ReactNode;
  /** Configuration for the built-in loader (when using loadingBehavior="loader") */
  loaderProps?: React.ComponentProps<typeof ComponentLoader>;
  /** 
   * Whether to use the component-override prefix for component lookup
   * - true: Look for "component-override:{componentType}" (legacy behavior)
   * - false: Look for "{componentType}" directly (new extension point pattern)
   * @default true
   */
  useOverridePrefix?: boolean;
};

export const ComponentResolver = <P extends object>({
  componentType,
  defaultComponent: DefaultComponent,
  componentProps,
  loadingBehavior = 'none',
  loaderComponent,
  loaderProps,
  useOverridePrefix = true
}: ComponentResolverProps<P>) => {
  const manager = usePluginManager();
  const [CustomComponent, setCustomComponent] = React.useState<React.ComponentType<P> | null>(null);
  const [initialized, setInitialized] = React.useState(false);
  const [pluginsLoaded, setPluginsLoaded] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;

    // Check if any plugin has registered a replacement for this component type
    const checkForComponents = () => {
      const lookupKey = useOverridePrefix ? `component-override:${componentType}` : componentType;
      const components = manager.executeFunction<Array<{ component: React.ComponentType<P> }>>(
        'renderer.getComponents',
        lookupKey
      ) || [];

      if (!isMounted) return;

      if (components.length > 0) {
        // Use the highest priority component (first in the sorted list)
        setCustomComponent(() => components[0]?.component ?? null);
      }

      setInitialized(true);
    };

    // Only check for components when plugins are loaded
    if (pluginsLoaded) {
      checkForComponents();
    }

    // Handle plugin ready state
    const handlePluginsReady = () => {
      if (isMounted) {
        setPluginsLoaded(true);
      }
    };

    // Listen for plugin changes
    const handlePluginChange = () => {
      if (isMounted && initialized) {
        checkForComponents();
      }
    };

    // Listen for plugin system events
    manager.addEventListener('plugins:ready', handlePluginsReady);
    manager.addEventListener('plugin:registered', handlePluginChange);

    // If the plugin system is already ready, check for components
    if ('arePluginsReady' in manager && manager.arePluginsReady && !pluginsLoaded) {
      setPluginsLoaded(true);
    }

    // Cleanup function
    return () => {
      isMounted = false;
      manager.removeEventListener('plugins:ready', handlePluginsReady);
      manager.removeEventListener('plugin:registered', handlePluginChange);
    };
  }, [componentType, manager, initialized, pluginsLoaded, useOverridePrefix]);

  // Don't render anything until initialization is complete and plugins are loaded
  if ((!initialized || !pluginsLoaded) && loadingBehavior === 'none') {
    return null;
  }

  // Show loader while initializing
  if ((!initialized || !pluginsLoaded) && loadingBehavior === 'loader') {
    return <>{loaderComponent || <ComponentLoader {...loaderProps} />}</>;
  }

  // Render the custom component if available, otherwise fall back to default
  return CustomComponent
    ? <CustomComponent {...componentProps} />
    : <DefaultComponent {...componentProps} />;
};

// Export the loader component for convenience
export { ComponentLoader }; 