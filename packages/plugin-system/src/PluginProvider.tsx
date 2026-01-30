import React, { createContext, useContext, useMemo, type ReactNode } from "react";

import { createAppRegistryPlugin } from "./plugins/appRegistry";
import { createObjectRegistryPlugin } from "./plugins/objectRegistry";
import { createRendererPlugin } from "./plugins/renderer";
import { createPluginManager } from "./pluginManager";

const PluginContext = createContext<ReturnType<typeof createPluginManager> | null>(null);

export const PluginProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const pluginManager = useMemo(() => {
    const manager = createPluginManager();
    // Register core plugins synchronously so registry.getObjects, renderer.getComponents, etc.
    // are available from the first render (e.g. useAppConfig/useRegistry before PluginInitializer runs).
    manager.register(createObjectRegistryPlugin());
    manager.register(createRendererPlugin());
    manager.register(createAppRegistryPlugin());
    return manager;
  }, []);

  return <PluginContext.Provider value={pluginManager}>{children}</PluginContext.Provider>;
};

export const usePluginManager = () => {
  const context = useContext(PluginContext);
  if (!context) {
    throw new Error("usePluginManager must be used within a PluginProvider");
  }
  return context;
};
