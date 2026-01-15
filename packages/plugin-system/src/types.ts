// Core plugin system types for better type safety

import React from "react";

/**
 * Base props that all plugin components receive
 */
export interface BasePluginComponentProps {
  /** Function to render the default implementation */
  defaultRender?: () => React.ReactNode;
  /** The original children from the PluginComponent */
  children?: React.ReactNode;
}

/**
 * Plugin component type that maintains flexibility for the plugin system
 * Uses any to allow maximum compatibility with existing plugins that have
 * specific prop types. This is necessary because plugins register components
 * with their own prop interfaces, and we cannot know all possible prop types
 * at compile time.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PluginComponent = React.ComponentType<any>;

/**
 * Function signature for plugin functions that can be registered
 * Uses unknown for better type safety while maintaining flexibility
 * This type accepts any function signature - specific functions will be
 * cast to this type when registered
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PluginFunction = (...args: any[]) => any;

/**
 * Event callback function signature
 */
export type EventCallback<T = unknown> = (payload: T) => void;

/**
 * Registry object metadata
 */
export interface RegistryMetadata {
  [key: string]: unknown;
}

/**
 * Plugin props with proper typing for user-defined props
 */
export interface PluginProps {
  [key: string]: unknown;
}
