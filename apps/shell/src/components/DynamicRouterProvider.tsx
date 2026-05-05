import React, { useState, useEffect, Suspense } from "react";

import {
  usePluginManager,
  getAllApps,
  type PluginManager,
  type AppDefinition,
} from "@workspace/plugin-system";
import { getCachedAppConfig } from "@workspace/query";
import {
  AppProtection,
  createRouter,
  createRoute,
  createRootRoute,
  type AnyRoute,
  type AnyRouter,
} from "@workspace/router";
import { AppLoader } from "@workspace/ui/components";
import { logger } from "@workspace/utils";

import { createCommonRoutes } from "../shared/commonRoutes";

import { ErrorBoundary, ModuleErrorFallback, NotFoundError } from "./errors/ErrorBoundary";
import { CoreAppShellLayout } from "./layout/CoreAppShellLayout";

/**
 * Builds the shell router at runtime.
 *
 * Since Phase 3 of the open-source cleanup, apps are no longer standalone Vite
 * packages under `apps/` loaded via a `dynamic-modules.json` / `@monorepo-apps`
 * Vite alias. Every app is now a core plugin that registers an `AppDefinition`
 * on the `apps:definitions` extension point (see ADR-003). The router simply
 * reads those definitions and materializes one route (plus a `$routeSubPath`
 * child for nested paths) per app.
 */

const appCoreRootRoute = createRootRoute({
  component: CoreAppShellLayout,
  notFoundComponent: NotFoundError,
});

const commonRoutes = createCommonRoutes(appCoreRootRoute);

const getPluginBasedApps = (manager: PluginManager): AppDefinition[] => {
  try {
    return getAllApps(manager);
  } catch (error) {
    logger.error(
      "Error getting plugin-based apps",
      error instanceof Error ? error : new Error(String(error)),
    );
    return [];
  }
};

const createRoutesFromApps = (apps: AppDefinition[]): AnyRoute[] => {
  return apps.map((appDef) => {
    const PluginAppComponent = appDef.component;

    const renderApp = () => (
      <AppProtection appName={appDef.id} loadingComponent={AppLoader}>
        <ErrorBoundary fallback={<ModuleErrorFallback name={appDef.name} />}>
          <Suspense fallback={<AppLoader />}>
            <PluginAppComponent />
          </Suspense>
        </ErrorBoundary>
      </AppProtection>
    );

    const pluginRoute = createRoute({
      getParentRoute: () => appCoreRootRoute,
      path: appDef.routePath,
      staticData: {
        appName: appDef.id,
      },
      component: renderApp,
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

    // Generic sub-path child so apps can own nested routes like /upload/:id
    // without having to register them individually.
    const pluginSubRoute = createRoute({
      getParentRoute: () => pluginRoute,
      path: "$routeSubPath",
      component: renderApp,
    });

    pluginRoute.addChildren([pluginSubRoute]);

    return pluginRoute;
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
        return;
      }

      try {
        const pluginApps = getPluginBasedApps(manager);
        logger.debug("Plugin apps loaded", { count: pluginApps.length, apps: pluginApps });

        const dynamicRoutes = createRoutesFromApps(pluginApps);

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
  }, [manager]);

  if (isLoading || !router) {
    return <AppLoader />;
  }

  return <>{children(router)}</>;
};
