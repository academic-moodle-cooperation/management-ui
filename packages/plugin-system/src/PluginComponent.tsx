import React from "react";
import { usePluginManager } from "./PluginProvider";
import type { PluginComponent as PluginComponentType, PluginProps } from "./types";

type PluginComponentProps = {
  /** Unique identifier for the component type (e.g., "acl:managed-entry") */
  componentType: string;
  /**
   * Additional props to pass to plugin components.
   * These will be merged with any extracted props from children.
   */
  pluginProps?: PluginProps;
  /**
   * Whether to use the component-override prefix for component lookup
   * @default false (uses new extension point pattern)
   */
  useOverridePrefix?: boolean;
  /** The default implementation as children */
  children: React.ReactNode;
  /** Optional fallback if no children provided */
  fallback?: React.ReactNode;
};

/**
 * A simplified wrapper for making components pluggable.
 *
 * Usage:
 * ```tsx
 * <PluginComponent componentType="acl:managed-entry" pluginProps={{ entry }}>
 *   <OverflowTooltip className="...">
 *     {entry.role} (Managed)
 *   </OverflowTooltip>
 * </PluginComponent>
 * ```
 *
 * Plugin components will receive:
 * - All props from pluginProps
 * - children: The original default implementation
 * - defaultRender: Function to render the default implementation
 */
export const PluginComponent: React.FC<PluginComponentProps> = ({
  componentType,
  pluginProps = {},
  useOverridePrefix = false,
  children,
  fallback,
}) => {
  const manager = usePluginManager();
  const [CustomComponent, setCustomComponent] = React.useState<PluginComponentType | null>(null);
  const [initialized, setInitialized] = React.useState(false);
  const [pluginsLoaded, setPluginsLoaded] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;

    const checkForComponents = () => {
      const lookupKey = useOverridePrefix ? `component-override:${componentType}` : componentType;
      const components =
        manager.executeFunction<Array<{ component: PluginComponentType }>>(
          "renderer.getComponents",
          lookupKey
        ) || [];

      if (!isMounted) return;

      if (components.length > 0) {
        setCustomComponent(() => components[0]?.component ?? null);
      } else if (!initialized) {
        // Using default component
      }

      setInitialized(true);
    };

    if (pluginsLoaded) {
      checkForComponents();
    }

    const handlePluginsReady = () => {
      if (isMounted) {
        setPluginsLoaded(true);
      }
    };

    const handlePluginChange = () => {
      if (isMounted && initialized) {
        checkForComponents();
      }
    };

    manager.addEventListener("plugins:ready", handlePluginsReady);
    manager.addEventListener("plugin:registered", handlePluginChange);

    if ("arePluginsReady" in manager && manager.arePluginsReady && !pluginsLoaded) {
      setPluginsLoaded(true);
    }

    return () => {
      isMounted = false;
      manager.removeEventListener("plugins:ready", handlePluginsReady);
      manager.removeEventListener("plugin:registered", handlePluginChange);
    };
  }, [componentType, manager, initialized, pluginsLoaded, useOverridePrefix]);

  // Don't render anything until plugins are loaded and initialized
  if (!initialized || !pluginsLoaded) {
    return null;
  }

  // Default render function that plugins can call
  const defaultRender = () => children || fallback || null;

  // If we have a custom component, render it with the enhanced props
  if (CustomComponent) {
    return (
      <CustomComponent {...pluginProps} defaultRender={defaultRender}>
        {children}
      </CustomComponent>
    );
  }

  // Otherwise render the default implementation
  return <>{defaultRender()}</>;
};
