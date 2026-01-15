import { createRouter, createRoute, createRootRoute } from "@tanstack/react-router";
import React, { useState, useEffect, lazy, Suspense } from "react";

import {
  usePluginManager,
  getAllApps,
  type PluginManager,
  type AppDefinition,
} from "@workspace/plugin-system";
import { getCachedAppConfig } from "@workspace/query";
import { ProtectedRoute } from "@workspace/router";
import { AppLoader } from "@workspace/ui/components";
import { logger } from "@workspace/utils";

// Import components from the core app
import { createCommonRoutes } from "../shared/commonRoutes";

import { ErrorBoundary, ModuleErrorFallback, NotFoundError, CoreAppShellLayout } from "./index";

import type { AnyRoute, AnyRouter } from "@tanstack/react-router";

// Base root route for the application
const appCoreRootRoute = createRootRoute({
  component: CoreAppShellLayout,
  notFoundComponent: NotFoundError,
});

// Create common routes using shared utility
const commonRoutes = createCommonRoutes(appCoreRootRoute);

// Interfaces for dynamic modules
interface ClientDynamicModule {
  routePath: string;
  componentName: string;
  componentImportPath: string;
  isPluginApp?: boolean;
  appDefinition?: AppDefinition;
}

interface FetchedPluginConfig {
  name: string;
  path: string;
  scope: string;
}

interface FetchedModulesConfig {
  plugins: FetchedPluginConfig[];
}

// Get dynamic modules from dynamic-modules.json
const getDynamicModules = async (): Promise<ClientDynamicModule[]> => {
  try {
    const baseUrl = import.meta.env.BASE_URL;
    const isDev = import.meta.env.DEV;
    const appConfig = await getCachedAppConfig();
    const productionAppPluginUrl = appConfig?.productionAppPluginUrl;
    const dynamicModulesUrl = isDev
      ? `${baseUrl.replace(/\/$/, "")}/dynamic-modules.json`
      : `${productionAppPluginUrl}`;

    const response = await fetch(dynamicModulesUrl);
    if (!response.ok) {
      logger.error("Failed to fetch dynamic modules configuration", {
        statusText: response.statusText,
        url: dynamicModulesUrl,
      });
      return [];
    }
    const config: FetchedModulesConfig = await response.json();

    return config.plugins.map((plugin) => {
      const routePath = plugin.path.replace("/static/plugins", "");
      const componentImportPath = /* @vite-ignore */ `@monorepo-apps/${plugin.name}/src/App`;

      return {
        routePath,
        componentName: "default",
        componentImportPath: componentImportPath,
        isPluginApp: false,
      };
    });
  } catch (error) {
    logger.error(
      "Error fetching or parsing dynamic modules configuration",
      error instanceof Error ? error : new Error(String(error)),
    );
    return [];
  }
};

// Get plugin-based apps from the plugin system
const getPluginBasedApps = (manager: PluginManager): ClientDynamicModule[] => {
  try {
    const pluginApps = getAllApps(manager);

    return pluginApps.map((app) => ({
      routePath: app.routePath,
      componentName: "default",
      componentImportPath: "", // Not used for plugin apps
      isPluginApp: true,
      appDefinition: app,
    }));
  } catch (error) {
    logger.error(
      "Error getting plugin-based apps",
      error instanceof Error ? error : new Error(String(error)),
    );
    return [];
  }
};

// Create routes from all apps
const createRoutesFromApps = (allApps: ClientDynamicModule[]): AnyRoute[] => {
  return allApps.map((app) => {
    if (app.isPluginApp && app.appDefinition) {
      // Handle plugin-based apps
      const appDef = app.appDefinition; // Type guard: appDef is now definitely defined
      const PluginAppComponent = appDef.component;

      const pluginRoute = createRoute({
        getParentRoute: () => appCoreRootRoute,
        path: app.routePath,
        staticData: {
          appName: appDef.id,
        },
        component: () => (
          <ProtectedRoute loadingComponent={AppLoader}>
            <ErrorBoundary fallback={<ModuleErrorFallback name={appDef.name} />}>
              <Suspense fallback={<AppLoader />}>
                <PluginAppComponent />
              </Suspense>
            </ErrorBoundary>
          </ProtectedRoute>
        ),
        loader: async () => {
          try {
            const config = await getCachedAppConfig();
            const pluginConfig = config?.plugins?.[appDef.id];
            return pluginConfig;
          } catch (err) {
            logger.error(
              `Error fetching/processing config for plugin app ${appDef.id} in loader`,
              err instanceof Error ? err : new Error(String(err)),
              { appId: appDef.id },
            );
            throw err;
          }
        },
      });

      // Create a subpath route for handling additional path segments
      const pluginSubRoute = createRoute({
        getParentRoute: () => pluginRoute,
        path: "$routeSubPath",
        component: () => (
          <ProtectedRoute loadingComponent={AppLoader}>
            <ErrorBoundary fallback={<ModuleErrorFallback name={appDef.name} />}>
              <Suspense fallback={<AppLoader />}>
                <PluginAppComponent />
              </Suspense>
            </ErrorBoundary>
          </ProtectedRoute>
        ),
      });

      // Add the subpath route as a child
      pluginRoute.addChildren([pluginSubRoute]);

      return pluginRoute;
    } else {
      // Handle dynamic modules (existing logic)
      const parts = app.componentImportPath.split("/");
      const pluginname = parts.length > 1 ? parts[1] : "";

      const DynamicComponent = lazy(async () => {
        if (!pluginname) {
          const errorMsg = `Could not derive plugin name from path: ${app.componentImportPath}`;
          logger.error(errorMsg, { componentImportPath: app.componentImportPath });
          return { default: () => <ModuleErrorFallback name={errorMsg} /> };
        }

        const importPathForLogging = `@monorepo-apps/${pluginname}/src/App.tsx`;
        try {
          return await import(`@monorepo-apps/${pluginname}/src/App.tsx`);
        } catch (err: unknown) {
          const error = err instanceof Error ? err : new Error(String(err));
          logger.error(
            `Failed to load module for plugin ${pluginname} from ${importPathForLogging}`,
            error,
            { pluginname, importPath: importPathForLogging },
          );
          return {
            default: () => (
              <ModuleErrorFallback name={`Plugin: ${pluginname}, Error: ${error.message}`} />
            ),
          };
        }
      });

      const dynamicRoute = createRoute({
        getParentRoute: () => appCoreRootRoute,
        path: app.routePath,
        staticData: {
          appName: pluginname,
        },
        component: () => (
          <ProtectedRoute loadingComponent={AppLoader}>
            <ErrorBoundary fallback={<ModuleErrorFallback name={app.componentName} />}>
              <Suspense fallback={<AppLoader />}>
                <DynamicComponent />
              </Suspense>
            </ErrorBoundary>
          </ProtectedRoute>
        ),
        loader: async () => {
          if (!pluginname) {
            logger.error("Could not determine plugin name for route, cannot load config", {
              routePath: app.routePath,
            });
            throw new Error(`Could not determine plugin name for route: ${app.routePath}`);
          }
          try {
            const config = await getCachedAppConfig();
            const pluginConfig = config?.plugins?.[pluginname];
            return pluginConfig;
          } catch (err) {
            logger.error(
              `Error fetching/processing config for plugin ${pluginname} in loader`,
              err instanceof Error ? err : new Error(String(err)),
              { pluginname },
            );
            throw err;
          }
        },
      });

      // Create a subpath route for handling additional path segments
      const dynamicSubRoute = createRoute({
        getParentRoute: () => dynamicRoute,
        path: "$routeSubPath",
        component: () => (
          <ProtectedRoute loadingComponent={AppLoader}>
            <ErrorBoundary fallback={<ModuleErrorFallback name={app.componentName} />}>
              <Suspense fallback={<AppLoader />}>
                <DynamicComponent />
              </Suspense>
            </ErrorBoundary>
          </ProtectedRoute>
        ),
      });

      // Add the subpath route as a child
      dynamicRoute.addChildren([dynamicSubRoute]);

      return dynamicRoute;
    }
  });
};

interface DynamicRouterProviderProps {
  children: (router: AnyRouter) => React.ReactNode;
}

export const DynamicRouterProvider: React.FC<DynamicRouterProviderProps> = ({ children }) => {
  const manager = usePluginManager();
  const [router, setRouter] = useState<AnyRouter | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const createRouterWithPlugins = async () => {
      if (!manager.arePluginsReady) {
        return; // Wait for plugins to be ready
      }

      try {
        // Get apps from both sources
        const dynamicModules = await getDynamicModules();
        const pluginApps = getPluginBasedApps(manager);

        logger.debug("Dynamic modules loaded", {
          count: dynamicModules.length,
          modules: dynamicModules,
        });
        logger.debug("Plugin apps loaded", { count: pluginApps.length, apps: pluginApps });

        // Combine all apps
        const allApps = [...dynamicModules, ...pluginApps];

        // Create routes from all apps
        const dynamicRoutes = createRoutesFromApps(allApps);

        // Combine with static routes
        const allChildRoutes = [
          commonRoutes.rootLandingRoute,
          commonRoutes.homeLandingRoute,
          commonRoutes.indexHtmlLandingRoute,
          commonRoutes.loginRoute,
          commonRoutes.logoutRoute,
          ...dynamicRoutes,
        ];

        const routeTree = appCoreRootRoute.addChildren(allChildRoutes);

        const newRouter = createRouter({
          routeTree,
          basepath: import.meta.env.BASE_URL,
        });

        setRouter(newRouter);
        setIsLoading(false);
      } catch (error) {
        logger.error(
          "Error creating dynamic router",
          error instanceof Error ? error : new Error(String(error)),
        );
        setIsLoading(false);
      }
    };

    createRouterWithPlugins();
  }, [manager.arePluginsReady]);

  if (isLoading || !router) {
    return <AppLoader />;
  }

  // Use render prop pattern to pass router to children
  return <>{children(router)}</>;
};
