import React, { ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import { QueryProvider } from '@workspace/query';
import { PluginProvider, RendererProvider } from '@workspace/plugin-system';
import { AuthProvider, AuthInitializer, RouterProvider, createStandaloneRouter } from '@workspace/router';
import { ErrorBoundary } from '@workspace/ui/components/errors/general-error';
import type { RouteComponent } from '@tanstack/react-router';
import { AppRuntimeProvider, useAppRuntime } from './AppRuntimeProvider';
import type { AppRuntimeConfig } from './types';
import type { AnyRouter } from '@tanstack/react-router';
import '@workspace/ui/globals.css';

// Default configuration for standalone apps - minimal version to avoid import issues
const standaloneAppConfig = {
  "management-ui-episodes": {
    protection: { public: false },
    episodeInfo: {
      metadata: [
        { title: { show: true, readonly: false } },
        { subject: { show: true, readonly: false } },
        { startDate: { show: true, readonly: false } },
        { source: { show: true, readonly: false } },
        { rightsHolder: { show: true, readonly: false } },
        { publisher: { show: true, readonly: true } },
        { location: { show: true, readonly: false } },
        { license: { show: true, readonly: false } },
        { language: { show: true, readonly: false } },
        { isPartOf: { show: true, readonly: false } },
        { identifier: { show: true, readonly: true } },
        { duration: { show: true, readonly: false } },
        { description: { show: true, readonly: false } },
        { creator: { show: true, readonly: true } },
        { created: { show: true, readonly: true } },
        { contributor: { show: true, readonly: false } }
      ]
    },
    episodesTable: {
      columns: [
        { title: { show: true } },
        { seriesName: { show: true } },
        { description: { show: true } },
        { contributors: { show: true } },
        { creator: { show: true } },
        { created: { show: true } },
        { eventStatus: { show: true } },
        { duration: { show: true } },
        { location: { show: true } },
        { presenters: { show: true } },
        { startDate: { show: true } },
        { actions: { show: true } }
      ]
    }
  },
  "management-ui-series": {
    protection: { public: false },
    seriesInfo: {
      metadata: [
        { title: { show: true, readonly: false } },
        { subject: { show: true, readonly: false } },
        { rightsHolder: { show: true, readonly: false } },
        { publisher: { show: true, readonly: false } },
        { license: { show: true, readonly: false } },
        { language: { show: true, readonly: false } },
        { identifier: { show: true, readonly: true } },
        { description: { show: true, readonly: false } },
        { creator: { show: true, readonly: true } },
        { contributor: { show: true, readonly: false } }
      ]
    },
    seriesTable: {
      columns: [
        { title: { show: true } },
        { created: { show: true } },
        { description: { show: true } },
        { creator: { show: true } },
        { contributors: { show: true } },
        { events: { show: true } },
        { actions: { show: true } }
      ]
    }
  },
  "management-ui-upload": {
    location: "Upload",
    workflowId: "ingest-upload",
    whitelist: ["h264", "mov", "mp4", "mp3", "wav", "avi", "m4a", "wmv", "mkv", "ac3", "webm", "ts", "ogg", "opus", "aiff", "hevc", "m2t", "mjp", "mts", "mxf", "ogv", "rm", "vob", "wtv", "swf", "3gp", "asf", "f4v", "m2v", "flv"],
    protection: { public: false }
  },
  "management-ui-test": {
    protection: { public: false }
  }
};

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
  
  // Create a router if none provided - use a simple router that renders children
  const router = providedRouter || createStandaloneRouter({
    basePath: baseUrl,
    defaultComponent: () => <>{children}</>,
  });
  
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
  
  // Try to determine app name from the current URL or package name
  const appName = determineAppName();
  
  // Create a router that will render the AppComponent for all routes
  const router = createStandaloneRouter({
    basePath: baseUrl,
    defaultComponent: AppComponent,
    appName,
    appConfig: standaloneAppConfig // Pass the hardcoded config
  });

  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <StandaloneAppWrapper config={config} router={router} />
    </React.StrictMode>
  );

  return root;
};

/**
 * Determines the app name from various sources
 */
function determineAppName(): string | undefined {
  // Try to get from package.json name if available
  if (typeof window !== 'undefined') {
    // Check if we're on a specific app URL pattern
    const pathname = window.location.pathname;
    const match = pathname.match(/^.*\/(episodes|series|upload|test)($|\/)/);
    if (match) {
      return `management-ui-${match[1]}`;
    }
    
    // Check port numbers for development
    const port = window.location.port;
    const portToApp: Record<string, string> = {
      '3001': 'management-ui-series',
      '3002': 'management-ui-episodes', 
      '3003': 'management-ui-upload',
      '3004': 'management-ui-test'
    };
    if (port && portToApp[port]) {
      return portToApp[port];
    }
  }
  
  return undefined;
}

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