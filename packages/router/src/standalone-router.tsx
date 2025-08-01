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
} = {}) => {
  const { 
    basePath = '/', 
    defaultComponent = () => <div>Standalone App</div>,
    routes = []
  } = options;

  // Create a catch-all route that renders the app component
  const defaultRoute = createRoute({
    getParentRoute: () => standaloneRootRoute,
    path: '/',
    component: defaultComponent,
    loader: async () => {
      // Provide empty loader data for compatibility
      return {};
    },
  });

  // Create a catch-all route for any path
  const catchAllRoute = createRoute({
    getParentRoute: () => standaloneRootRoute,
    path: '$',
    component: defaultComponent,
    loader: async () => {
      // Provide empty loader data for compatibility
      return {};
    },
  });

  // Combine provided routes with default routes
  const allRoutes = [defaultRoute, catchAllRoute, ...routes];
  
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
  } = {}
) => {
  const { basePath = '/', loaderData = {} } = options;

  return createStandaloneRouter({
    basePath,
    defaultComponent: AppComponent,
    routes: []
  });
};