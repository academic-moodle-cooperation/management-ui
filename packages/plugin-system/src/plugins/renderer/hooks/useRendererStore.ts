import { useState, useCallback, useEffect } from "react";

import { usePluginManager } from "../../../PluginProvider";

import type { RendererComponent } from "../types";

/**
 * @deprecated This hook is part of the deprecated Renderer system. Use ComponentResolver instead.
 */
export const useRendererStore = () => {
  const [components, setComponents] = useState<Map<string, RendererComponent[]>>(new Map());
  const manager = usePluginManager();

  useEffect(() => {
    // useRendererStore is deprecated. Use ComponentResolver instead.
  }, []);

  const addComponent = useCallback(
    (position: string, component: React.FC, key = crypto.randomUUID()) => {
      setComponents((prev) => {
        const newMap = new Map(prev);
        const existing = newMap.get(position) || [];
        newMap.set(position, [...existing, { component, key, position }]);
        manager.dispatchEvent("renderer.componentUpdated", { position });
        return newMap;
      });
    },
    [manager],
  );

  const removeComponent = useCallback(
    (position: string, key: string) => {
      setComponents((prev) => {
        const newMap = new Map(prev);
        const existing = newMap.get(position) || [];
        newMap.set(
          position,
          existing.filter((c) => c.key !== key),
        );
        manager.dispatchEvent("renderer.componentUpdated", { position });
        return newMap;
      });
    },
    [manager],
  );

  const getComponents = useCallback(
    (position: string) => {
      return components.get(position) || [];
    },
    [components],
  );

  return { addComponent, removeComponent, getComponents };
};
