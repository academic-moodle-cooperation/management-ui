import React, { lazy, Suspense } from 'react';
import { createRoute } from '@tanstack/react-router';
import type { AnyRoute } from '@tanstack/react-router';
import { usePluginManager, getAllApps, type AppDefinition } from '@workspace/plugin-system';
import { ErrorBoundary, ModuleErrorFallback } from '../components';
import { AppLoader } from '@workspace/ui/components';
import { ProtectedRoute } from '@workspace/router';
import { getCachedAppConfig } from '@workspace/query';

/**
 * Creates dynamic routes from registered app definitions
 */
export const createPluginBasedRoutes = (rootRoute: AnyRoute): AnyRoute[] => {
  // This function will be called after plugins are loaded
  // We need to get the plugin manager instance to access registered apps
  const routes: AnyRoute[] = [];
  
  // This is a placeholder - we'll need to access the plugin manager
  // from the context where this is called
  return routes;
};

/**
 * Hook to get registered apps from plugin system
 * This should be used within components that have access to plugin context
 */
export const useRegisteredApps = (): AppDefinition[] => {
  const manager = usePluginManager();
  return getAllApps(manager);
};

/**
 * Creates a route from an app definition
 */
export const createAppRoute = (app: AppDefinition, rootRoute: AnyRoute): AnyRoute => {
  const AppComponent = app.component;

  const dynamicRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: app.routePath,
    staticData: {
      appName: app.name,
      appId: app.id,
    },
    component: () => (
      <ProtectedRoute loadingComponent={AppLoader}>
        <ErrorBoundary fallback={<ModuleErrorFallback name={app.name} />}>
          <Suspense fallback={<AppLoader />}>
            <AppComponent />
          </Suspense>
        </ErrorBoundary>
      </ProtectedRoute>
    ),
    loader: async () => {
      try {
        // Call app-specific loader if available
        const appData = app.loader ? await app.loader() : null;
        
        // Also provide general config
        const config = await getCachedAppConfig();
        const pluginConfig = config?.plugins?.[app.id];
        
        return {
          appData,
          pluginConfig,
          app,
        };
      } catch (err) {
        console.error(`Error loading data for app ${app.id}:`, err);
        throw err;
      }
    },
  });

  // Create a subpath route for handling additional path segments
  const dynamicSubRoute = createRoute({
    getParentRoute: () => dynamicRoute,
    path: '$routeSubPath',
    component: () => (
      <ProtectedRoute loadingComponent={AppLoader}>
        <ErrorBoundary fallback={<ModuleErrorFallback name={app.name} />}>
          <Suspense fallback={<AppLoader />}>
            <AppComponent />
          </Suspense>
        </ErrorBoundary>
      </ProtectedRoute>
    ),
  });

  // Add the subpath route as a child
  dynamicRoute.addChildren([dynamicSubRoute]);

  return dynamicRoute;
};