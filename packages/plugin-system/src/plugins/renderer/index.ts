import type { Plugin } from "../../IPlugin";
import type { RendererComponent } from "./types";
import { logger } from "@workspace/utils";

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
                typeof c.order === "number" ? c.order : 100,
              );
              const minOrder = Math.min(...orders);
              const topComponents = positionComponents.filter(
                (c) => (typeof c.order === "number" ? c.order : 100) === minOrder,
              );
              if (topComponents.length > 1 && position.startsWith("component-override:")) {
                const keys = topComponents.map((c) => c.key).join(", ");
                logger.warn(
                  `[plugin-system][renderer] Multiple components registered with the same priority (order ${minOrder}) for "${position}". The first registered will be used. Conflicting keys: ${keys}`,
                  { position, minOrder, keys: topComponents.map((c) => c.key) },
                );
              }
            }
          } catch (e) {
            logger.error(
              "[plugin-system][renderer] Failed to evaluate component priorities for warning",
              e instanceof Error ? e : new Error(String(e)),
              { position },
            );
          }
          manager.dispatchEvent("renderer.componentUpdated", { position });
        },
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
          existing.filter((c) => c.key !== key),
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
