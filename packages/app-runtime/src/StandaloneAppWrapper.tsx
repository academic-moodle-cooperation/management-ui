import React, { ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import { QueryProvider } from '@workspace/query';
import { PluginProvider, RendererProvider } from '@workspace/plugin-system';
import { AuthProvider, AuthInitializer, RouterProvider, createAppRouter } from '@workspace/router';
import { ErrorBoundary } from '@workspace/ui/components/errors/general-error';
import type { RouteComponent } from '@tanstack/react-router';
import { AppRuntimeProvider, useAppRuntime } from './AppRuntimeProvider';
import type { AppRuntimeConfig } from './types';
import type { AnyRouter } from '@tanstack/react-router';
import '@workspace/ui/globals.css';

interface StandaloneAppWrapperProps {
  children: ReactNode;
  config?: Partial<AppRuntimeConfig>;
  router?: AnyRouter;
}

/**
 * Wrapper component that provides the same provider hierarchy as AppProviders
 * but optimized for standalone app execution with automatic router creation
 */
export const StandaloneAppWrapper: React.FC<StandaloneAppWrapperProps> = ({ 
  children, 
  config = {},
  router: providedRouter
}) => {
  const baseUrl = (import.meta as any)?.env?.BASE_URL || '/';
  
  // Create a router if none provided
  const router = providedRouter || createAppRouter(() => <>{children}</>, { basePath: baseUrl });
  
  const runtimeConfig: AppRuntimeConfig = {
    isStandalone: true,
    baseUrl,
    router,
    ...config,
  };

  return (
    <ErrorBoundary>
      <PluginProvider>
        <QueryProvider>
          <AppRuntimeProvider config={runtimeConfig}>
            <RendererProvider>
              <AuthProvider>
                <AuthInitializer>
                  <RouterProvider router={router} />
                </AuthInitializer>
              </AuthProvider>
            </RendererProvider>
          </AppRuntimeProvider>
        </QueryProvider>
      </PluginProvider>
    </ErrorBoundary>
  );
};

/**
 * Utility function to bootstrap a standalone app with full provider context
 * This handles the common pattern of rendering an app with all required providers
 */
export const bootstrapStandaloneApp = (
  AppComponent: RouteComponent,
  containerId = 'root',
  config?: Partial<AppRuntimeConfig>
) => {
  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`Container element with id "${containerId}" not found`);
  }

  const baseUrl = (import.meta as any)?.env?.BASE_URL || '/';
  
  // Create a router specifically for this app
  const router = createAppRouter(AppComponent, { basePath: baseUrl });

  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <StandaloneAppWrapper config={config} router={router}>
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

  // We need to provide standalone context with full provider hierarchy
  return (
    <StandaloneAppWrapper config={fallbackConfig}>
      {children}
    </StandaloneAppWrapper>
  );
};