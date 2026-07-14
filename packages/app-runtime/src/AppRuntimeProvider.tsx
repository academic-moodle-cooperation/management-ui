import React, { createContext, useContext } from "react";

import type { AppRuntimeContext, AppRuntimeConfig } from "./types";
import type { ReactNode } from "react";

export const AppRuntimeContextProvider = createContext<AppRuntimeContext | null>(null);

interface AppRuntimeProviderProps {
  children: ReactNode;
  config: AppRuntimeConfig;
}

/**
 * Provider for app runtime context. Exposes the runtime configuration; app
 * registration flows through the plugin manager (`apps:definitions`), not this
 * context.
 */
export const AppRuntimeProvider: React.FC<AppRuntimeProviderProps> = ({ children, config }) => {
  const contextValue: AppRuntimeContext = { config };

  return (
    <AppRuntimeContextProvider.Provider value={contextValue}>
      {children}
    </AppRuntimeContextProvider.Provider>
  );
};

/**
 * Hook to access app runtime context
 */
export const useAppRuntime = (): AppRuntimeContext => {
  const context = useContext(AppRuntimeContextProvider);
  if (!context) {
    throw new Error("useAppRuntime must be used within an AppRuntimeProvider");
  }
  return context;
};
