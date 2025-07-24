import React, { createContext, useContext, useMemo } from 'react';
import type { AppConfig } from './types';

interface ConfigContextType {
  config: AppConfig;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isFetched: boolean;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

interface ConfigProviderProps {
  children: React.ReactNode;
  configData: AppConfig;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isFetched: boolean;
}

export const ConfigProvider: React.FC<ConfigProviderProps> = ({
  children,
  configData,
  isLoading,
  isError,
  error,
  isFetched,
}: ConfigProviderProps) => {
  const contextValue = useMemo(() => ({
    config: configData,
    isLoading,
    isError,
    error,
    isFetched,
  }), [configData, isLoading, isError, error, isFetched]);

  return <ConfigContext.Provider value={contextValue}>{children}</ConfigContext.Provider>;
};

export const useAppConfig = (): ConfigContextType => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useAppConfig must be used within a ConfigProvider and have its props supplied.');
  }
  return context;
}; 