import { PluginComponent } from "../../types";

export type RendererComponent = {
  component: PluginComponent;
  key: string;
  position: string;
  order?: number;
};

export type RendererFunctions = {
  "renderer.add": (
    position: string,
    component: PluginComponent,
    key?: string,
    order?: number
  ) => void;
  "renderer.remove": (position: string, key: string) => void;
  "renderer.getComponents": (position: string) => RendererComponent[];
};
