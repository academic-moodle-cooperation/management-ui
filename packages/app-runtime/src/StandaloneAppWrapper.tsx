import React, { ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import { QueryProvider } from '@workspace/query';
import { AppRuntimeProvider, useAppRuntime } from './AppRuntimeProvider';
import type { AppRuntimeConfig } from './types';
import '@workspace/ui/globals.css';

interface StandaloneAppWrapperProps {
  children: ReactNode;
  config?: Partial<AppRuntimeConfig>;
}

/**
 * Wrapper component that provides necessary providers for standalone app execution
 * Note: This provides minimal context for standalone apps. 
 * For full functionality when integrated with core, additional providers are needed.
 */
export const StandaloneAppWrapper: React.FC<StandaloneAppWrapperProps> = ({ 
  children, 
  config = {} 
}) => {
  const runtimeConfig: AppRuntimeConfig = {
    isStandalone: true,
    baseUrl: typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.BASE_URL : '/',
    ...config,
  };

  return (
    <QueryProvider>
      <AppRuntimeProvider config={runtimeConfig}>
        {children}
      </AppRuntimeProvider>
    </QueryProvider>
  );
};

/**
 * Utility function to bootstrap a standalone app
 * This handles the common pattern of rendering an app with all required providers
 */
export const bootstrapStandaloneApp = (
  AppComponent: React.ComponentType,
  containerId = 'root',
  config?: Partial<AppRuntimeConfig>
) => {
  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`Container element with id "${containerId}" not found`);
  }

  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <StandaloneAppWrapper config={config}>
        <AppComponent />
      </StandaloneAppWrapper>
    </React.StrictMode>
  );

  return root;
};

/**
 * Component that automatically detects if running standalone or within core
 * and provides appropriate context
 */
interface AdaptiveAppWrapperProps {
  children: ReactNode;
  fallbackConfig?: Partial<AppRuntimeConfig>;
}

export const AdaptiveAppWrapper: React.FC<AdaptiveAppWrapperProps> = ({ 
  children, 
  fallbackConfig = {} 
}) => {
  // Try to detect if we're already within an AppRuntimeProvider
  let isInCoreShell = false;
  try {
    useAppRuntime();
    isInCoreShell = true;
  } catch {
    // We're not in a core shell, need to provide standalone context
    isInCoreShell = false;
  }

  if (isInCoreShell) {
    // We're already in the core shell, just render children
    return <>{children}</>;
  }

  // We need to provide standalone context
  return (
    <StandaloneAppWrapper config={fallbackConfig}>
      {children}
    </StandaloneAppWrapper>
  );
};