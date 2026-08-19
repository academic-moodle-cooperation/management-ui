import type { PluginComponent } from "../../types";

export type RendererComponent = {
  component: PluginComponent;
  key: string;
  position: string;
  order?: number;
  /**
   * Optional display label, as supplied at registration.
   *
   * A translation key (`"acme:tabs.recordings"`) when the registering plugin
   * ships one; hosts resolve it at render time and fall back to deriving a
   * label from `key`. Left undefined by every registration that predates the
   * option.
   */
  label?: string;
};

export type RendererFunctions = {
  "renderer.add": (
    position: string,
    component: PluginComponent,
    key?: string,
    order?: number,
    label?: string,
  ) => void;
  "renderer.remove": (position: string, key: string) => void;
  "renderer.getComponents": (position: string) => RendererComponent[];
};
