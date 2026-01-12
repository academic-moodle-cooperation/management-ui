import { Plugin } from "../../IPlugin";
import { RendererComponent } from "./types";

export const createRendererPlugin = (): Plugin => {
  const components = new Map<string, RendererComponent[]>();

  return {
    name: "renderer",
    version: "1.0.0",

    initialize(manager) {
      manager.addFunction(
        "renderer.add",
        (position: string, component: React.FC, key = crypto.randomUUID(), order = 100) => {
          const existing = components.get(position) || [];
          components.set(position, [...existing, { component, key, position, order }]);
          try {
            const positionComponents = components.get(position) || [];
            if (positionComponents.length > 1) {
              const orders = positionComponents.map((c) =>
                typeof c.order === "number" ? c.order : 100
              );
              const minOrder = Math.min(...orders);
              const topComponents = positionComponents.filter(
                (c) => (typeof c.order === "number" ? c.order : 100) === minOrder
              );
              if (topComponents.length > 1 && position.startsWith("component-override:")) {
                const keys = topComponents.map((c) => c.key).join(", ");
                console.warn(
                  `[plugin-system][renderer] Multiple components registered with the same priority (order ${minOrder}) for "${position}". The first registered will be used. Conflicting keys: ${keys}`
                );
              }
            }
          } catch (e) {
            console.error(
              "[plugin-system][renderer] Failed to evaluate component priorities for warning:",
              e
            );
          }
          manager.dispatchEvent("renderer.componentUpdated", { position });
        }
      );

      manager.addFunction("renderer.getComponents", (position: string) => {
        const positionComponents = components.get(position) || [];
        // Sort components by order (lower numbers first)
        return [...positionComponents].sort((a, b) => (a.order || 100) - (b.order || 100));
      });

      manager.addFunction("renderer.remove", (position: string, key: string) => {
        const existing = components.get(position) || [];
        components.set(
          position,
          existing.filter((c) => c.key !== key)
        );
        manager.dispatchEvent("renderer.componentUpdated", { position });
      });
    },

    activate() {
      // Renderer plugin activated
    },

    deactivate() {
      // Renderer plugin deactivated
    },
  };
};
