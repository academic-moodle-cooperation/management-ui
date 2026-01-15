import type { PluginManager } from "./pluginManager";

export interface Plugin {
  name: string;
  version: string;
  dependencies?: string[] | undefined;
  /**
   * Optional order property to control the rendering order of components.
   * Lower numbers will be rendered first. If not provided, defaults to 100.
   */
  order?: number | undefined;

  initialize?: ((manager: PluginManager) => void) | undefined;
  activate(): void;
  deactivate(): void;
}
