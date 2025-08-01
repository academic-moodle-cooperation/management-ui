import React from 'react';
import { 
  createRouter, 
  createRoute, 
  createRootRoute,
  Navigate,
  Outlet
} from '@tanstack/react-router';
import type { AnyRoute, RouteComponent } from '@tanstack/react-router';

// Simple loading component since we can't import from @workspace/ui
const SimpleLoader = () => <div>Loading...</div>;

// Simple root route for standalone apps
const standaloneRootRoute = createRootRoute({
  component: () => (
    <div>
      <main>
        <Outlet />
      </main>
    </div>
  ),
  notFoundComponent: () => <div>Not Found</div>,
});

/**
 * Creates a simple router for standalone app execution
 * This provides basic routing context so apps can use useLoaderData and other router hooks
 */
export const createStandaloneRouter = (options: {
  basePath?: string;
  defaultComponent?: RouteComponent;
  routes?: AnyRoute[];
  appName?: string;
  appConfig?: any; // Configuration data for the app
} = {}) => {
  const { 
    basePath = '/', 
    defaultComponent = () => <div>Standalone App</div>,
    routes = [],
    appName,
    appConfig
  } = options;

  // Get the app config for the specific app if appName is provided
  const getAppLoaderData = async () => {
    if (appName && appConfig && appConfig[appName]) {
      return appConfig[appName];
    }
    return {};
  };

  // Create a catch-all route that renders the app component
  const defaultRoute = createRoute({
    getParentRoute: () => standaloneRootRoute,
    path: '/',
    component: defaultComponent,
    loader: getAppLoaderData,
  });

  // Create a catch-all route for any path
  const catchAllRoute = createRoute({
    getParentRoute: () => standaloneRootRoute,
    path: '$',
    component: defaultComponent,
    loader: getAppLoaderData,
  });

  // If we have an appName, create a specific route for it (e.g., /episodes)
  const specificRoutes: AnyRoute[] = [];
  if (appName) {
    // Extract the route path from app name (e.g., management-ui-episodes -> /episodes)
    const routePath = appName.replace('management-ui-', '');
    
    // Create the specific route (e.g., /episodes)
    const specificRoute = createRoute({
      getParentRoute: () => standaloneRootRoute,
      path: `/${routePath}`,
      component: defaultComponent,
      loader: getAppLoaderData,
    });

    // Create a subpath route for handling additional path segments
    const specificSubRoute = createRoute({
      getParentRoute: () => specificRoute,
      path: '$routeSubPath',
      component: defaultComponent,
      loader: getAppLoaderData,
    });

    // Add the subpath route as a child
    specificRoute.addChildren([specificSubRoute]);
    specificRoutes.push(specificRoute);
  }

  // Combine provided routes with default routes
  const allRoutes = [defaultRoute, catchAllRoute, ...specificRoutes, ...routes];
  
  const routeTree = standaloneRootRoute.addChildren(allRoutes);

  return createRouter({
    routeTree,
    basepath: basePath,
  });
};

/**
 * Creates a router specifically for a standalone app component
 * This ensures the app component is rendered for all routes
 */
export const createAppRouter = (
  AppComponent: RouteComponent,
  options: {
    basePath?: string;
    loaderData?: Record<string, any>;
    appName?: string;
    appConfig?: any;
  } = {}
) => {
  const { basePath = '/', loaderData = {}, appName, appConfig } = options;

  return createStandaloneRouter({
    basePath,
    defaultComponent: AppComponent,
    routes: [],
    appName,
    appConfig
  });
};