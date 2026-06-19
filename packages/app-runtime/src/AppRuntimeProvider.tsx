import React, { createContext, useContext, useState } from "react";

import type { AppDefinition } from "@oc-mui/plugin-system";
import { logger } from "@oc-mui/utils";

import type { AppRuntimeContext, AppRuntimeConfig } from "./types";
import type { ReactNode } from "react";

export const AppRuntimeContextProvider = createContext<AppRuntimeContext | null>(null);

interface AppRuntimeProviderProps {
  children: ReactNode;
  config: AppRuntimeConfig;
}

/**
 * Provider for app runtime context
 * Manages app registration and provides runtime configuration
 */
export const AppRuntimeProvider: React.FC<AppRuntimeProviderProps> = ({ children, config }) => {
  const [registeredApps, setRegisteredApps] = useState<AppDefinition[]>([]);

  const registerApp = (app: AppDefinition) => {
    setRegisteredApps((prev) => {
      const existing = prev.find((a) => a.id === app.id);
      if (existing) {
        logger.warn(`App with id "${app.id}" is already registered. Replacing...`, {
          appId: app.id,
        });
        return prev.map((a) => (a.id === app.id ? app : a));
      }
      return [...prev, app];
    });
  };

  const getApps = () => registeredApps;

  const contextValue: AppRuntimeContext = {
    config,
    ...(config.isStandalone ? {} : { registerApp, getApps }),
  };

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
