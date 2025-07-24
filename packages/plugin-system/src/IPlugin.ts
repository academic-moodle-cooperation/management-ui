import { PluginManager } from './pluginManager';

export interface Plugin {
  name: string;
  version: string;
  dependencies?: string[];
  /**
   * Optional order property to control the rendering order of components.
   * Lower numbers will be rendered first. If not provided, defaults to 100.
   */
  order?: number;

  initialize?(manager: PluginManager): void;
  activate(): void;
  deactivate(): void;
} 