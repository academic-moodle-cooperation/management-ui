import React from "react";
import ReactDOM from "react-dom/client";

import { PluginProvider, RendererProvider } from "@opencast-mui/plugin-system";
import { QueryProvider } from "@opencast-mui/query";
import {
  AuthProvider,
  AuthInitializer,
  RouterProvider,
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
  type RouteComponent,
  type AnyRoute,
  type AnyRouter,
} from "@opencast-mui/router";
import { ErrorBoundary } from "@opencast-mui/ui/components/errors/general-error";

import { AppRuntimeProvider, AppRuntimeContextProvider } from "./AppRuntimeProvider";

import type { AppRuntimeConfig } from "./types";
import type { ReactNode } from "react";

import "@opencast-mui/ui/globals.css";

interface StandaloneAppWrapperProps {
  children?: ReactNode;
  config?: Partial<AppRuntimeConfig>;
  router?: AnyRouter;
}

/**
 * Creates a simplified router for standalone apps using the same architecture as DynamicRouterProvider
 */
const createStandaloneDynamicRouter = (
  AppComponent: RouteComponent,
  appName?: string,
  basePath: string = "/",
) => {
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

  // Create routes for the specific app
  const appRoutes: AnyRoute[] = [];

  // Main route that renders the app component
  const mainRoute = createRoute({
    getParentRoute: () => standaloneRootRoute,
    path: "/",
    component: AppComponent,
    loader: async () => {
      // Return empty object - app can use useAppConfig for real config
      return {};
    },
  });

  // Catch-all route for any path
  const catchAllRoute = createRoute({
    getParentRoute: () => standaloneRootRoute,
    path: "$",
    component: AppComponent,
    loader: async () => {
      return {};
    },
  });

  appRoutes.push(mainRoute, catchAllRoute);

  // If we have an appName, create a specific route for it (e.g., /episodes)
  if (appName) {
    const routePath = appName.replace("management-ui-", "");

    const specificRoute = createRoute({
      getParentRoute: () => standaloneRootRoute,
      path: `/${routePath}`,
      component: AppComponent,
      loader: async () => {
        return {};
      },
    });

    // Create a subpath route for handling additional path segments
    const specificSubRoute = createRoute({
      getParentRoute: () => specificRoute,
      path: "$routeSubPath",
      component: AppComponent,
      loader: async () => {
        return {};
      },
    });

    // Add the subpath route as a child
    specificRoute.addChildren([specificSubRoute]);
    appRoutes.push(specificRoute);
  }

  const routeTree = standaloneRootRoute.addChildren(appRoutes);

  return createRouter({
    routeTree,
    basepath: basePath,
  });
};

/**
 * Wrapper component that provides the same provider hierarchy as AppProviders
 * but optimized for standalone app execution with automatic router creation
 */
export const StandaloneAppWrapper: React.FC<StandaloneAppWrapperProps> = ({
  children,
  config = {},
  router: providedRouter,
}) => {
  const baseUrl = import.meta.env?.BASE_URL || "/";

  // Create a router if none provided - use the unified dynamic router approach
  const router =
    providedRouter || createStandaloneDynamicRouter(() => <>{children}</>, undefined, baseUrl);

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
  containerId = "root",
  config: Partial<AppRuntimeConfig>,
) => {
  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`Container element with id "${containerId}" not found`);
  }

  const baseUrl = config.baseUrl || "/";
  const appName = config.appName || undefined;

  // Create a router using the unified dynamic router approach
  const router = createStandaloneDynamicRouter(AppComponent, appName, baseUrl);

  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <StandaloneAppWrapper config={config} router={router} />
    </React.StrictMode>,
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
  fallbackConfig = {},
}) => {
  // Try to detect if we're already within an AppRuntimeProvider
  const runtimeContext = React.useContext(AppRuntimeContextProvider);
  const isInCoreShell = runtimeContext !== undefined && runtimeContext !== null;

  if (isInCoreShell) {
    // We're already in the core shell, just render children
    return <>{children}</>;
  }

  // We need to provide standalone context with full provider hierarchy
  return <StandaloneAppWrapper config={fallbackConfig}>{children}</StandaloneAppWrapper>;
};
