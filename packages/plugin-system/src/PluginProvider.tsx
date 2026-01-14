import React, { createContext, useContext, type ReactNode } from "react";

import { createPluginManager } from "./pluginManager";

const PluginContext = createContext<ReturnType<typeof createPluginManager> | null>(null);

export const PluginProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const pluginManager = createPluginManager();

  return <PluginContext.Provider value={pluginManager}>{children}</PluginContext.Provider>;
};

export const usePluginManager = () => {
  const context = useContext(PluginContext);
  if (!context) {
    throw new Error("usePluginManager must be used within a PluginProvider");
  }
  return context;
};
