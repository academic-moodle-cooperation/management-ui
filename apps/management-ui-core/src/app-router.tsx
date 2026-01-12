import React, { lazy, Suspense } from "react";
import {
  createRouter,
  createRoute,
  Outlet,
  createRootRoute,
  Navigate,
  useRouterState,
} from "@tanstack/react-router";
import type { AnyRoute } from "@tanstack/react-router";
// Types for dynamic modules - will eventually come from a more robust system
// For now, let's assume a structure similar to what useGetInstalledApps might provide.
import { useAppConfig } from "@workspace/query"; // For login/logout redirects
// Import components from the new organized structure
import {
  ErrorBoundary,
  ModuleErrorFallback,
  NotFoundError,
  CoreAppShellLayout,
} from "./components";
import { DefaultLandingPage, AppLoader, Container } from "@workspace/ui/components"; // Import DefaultLandingPage
import { getCachedAppConfig } from "@workspace/query"; // Import the new utility
import { ProtectedRoute } from "@workspace/router"; // Import ProtectedRoute for route-level protection
import { ComponentResolver } from "@workspace/plugin-system"; // Import ComponentResolver for landing page overrides
import { createCommonRoutes } from "./shared/commonRoutes"; // Import shared route definitions
import { logger } from "@workspace/utils";

// Local temporary placeholders are no longer needed and will be removed.

// Base root route for the application, defined in management-ui-core
// This is similar to baseRootRoute from @workspace/router but specific to this app's needs
// if it needs to carry app-specific context or layout that @workspace/router shouldn't know about.
const appCoreRootRoute = createRootRoute({
  component: CoreAppShellLayout,
  notFoundComponent: NotFoundError,
});

// Create common routes using shared utility
const commonRoutes = createCommonRoutes(appCoreRootRoute);

// This is the internal representation for client-side route generation
interface ClientDynamicModule {
  routePath: string; // e.g., /test
  componentName: string; // Conventionally 'default' for React.lazy with default export
  componentImportPath: string; // e.g., @monorepo-apps/management-ui-test/src/App
}

// This interface matches the structure in dynamic-modules.json (for one plugin/app)
interface FetchedPluginConfig {
  name: string; // e.g., management-ui-test
  path: string; // e.g., /static/plugins/test (server path)
  scope: string; // e.g., management_ui_test
  // No longer expecting clientRoute, clientComponentExportName, clientComponentPath from JSON
}

interface FetchedModulesConfig {
  plugins: FetchedPluginConfig[];
}

const getDynamicModules = async (): Promise<ClientDynamicModule[]> => {
  try {
    // Construct the URL relative to the application's base path
    const baseUrl = import.meta.env.BASE_URL;
    const isDev = import.meta.env.DEV;
    const appConfig = await getCachedAppConfig(); // Use the cached getter
    const productionAppPluginUrl = appConfig?.productionAppPluginUrl;
    // Ensure no double slashes if baseUrl ends with / and the path doesn't need an initial one
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
      // Derive routePath: /static/plugins/test -> /test
      const routePath = plugin.path.replace("/static/plugins", "");
      // Construct componentImportPath. Example: @monorepo-apps/management-ui-test/src/App
      const componentImportPath = /* @vite-ignore */ `@monorepo-apps/${plugin.name}/src/App`;

      return {
        routePath,
        componentName: "default", // For React.lazy with `export default App`
        componentImportPath: componentImportPath,
      };
    });
  } catch (error) {
    logger.error(
      "Error fetching or parsing dynamic modules configuration",
      error instanceof Error ? error : new Error(String(error))
    );
    return [];
  }
};

export const createDynamicRouter = async () => {
  const dynamicModules = await getDynamicModules();

  const dynamicRoutes: AnyRoute[] = dynamicModules.map((mod) => {
    // mod.componentImportPath is e.g., "@monorepo-apps/management-ui-test/src/App"
    // We need to extract "management-ui-test" to use in the template literal.
    const parts = mod.componentImportPath.split("/");
    const pluginname = parts.length > 1 ? parts[1] : ""; // Extracts "management-ui-test"

    const DynamicComponent = lazy(async () => {
      if (!pluginname) {
        const errorMsg = `Could not derive plugin name from path: ${mod.componentImportPath}`;
        logger.error(errorMsg, { componentImportPath: mod.componentImportPath });
        // Provide a fallback component for React.lazy
        return { default: () => <ModuleErrorFallback name={errorMsg} /> };
      }
      // Using the exact template literal structure the user confirmed was working.
      // This includes the .tsx extension.
      // No /* @vite-ignore */ here, as per user's working example (Vite might analyze this pattern correctly)
      const importPathForLogging = `@monorepo-apps/${pluginname}/src/App.tsx`;
      try {
        return await import(`@monorepo-apps/${pluginname}/src/App.tsx`);
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        logger.error(
          `Failed to load module for plugin ${pluginname} from ${importPathForLogging}`,
          error,
          { pluginname, importPath: importPathForLogging }
        );
        // Provide a fallback component for React.lazy
        return {
          default: () => (
            <ModuleErrorFallback name={`Plugin: ${pluginname}, Error: ${error.message}`} />
          ),
        };
      }
    });

    const dynamicRoute = createRoute({
      getParentRoute: () => appCoreRootRoute,
      path: mod.routePath,
      staticData: {
        appName: pluginname,
      },
      component: () => (
        <ProtectedRoute loadingComponent={AppLoader}>
          <ErrorBoundary fallback={<ModuleErrorFallback name={mod.componentName} />}>
            <Suspense fallback={<AppLoader />}>
              <DynamicComponent />
            </Suspense>
          </ErrorBoundary>
        </ProtectedRoute>
      ),
      loader: async () => {
        if (!pluginname) {
          logger.error("Could not determine plugin name for route, cannot load config", {
            routePath: mod.routePath,
          });
          throw new Error(`Could not determine plugin name for route: ${mod.routePath}`);
        }
        try {
          const config = await getCachedAppConfig();
          const pluginConfig = config?.plugins?.[pluginname];
          return pluginConfig;
        } catch (err) {
          logger.error(
            `Error fetching/processing config for plugin ${pluginname} in loader`,
            err instanceof Error ? err : new Error(String(err)),
            { pluginname }
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
          <ErrorBoundary fallback={<ModuleErrorFallback name={mod.componentName} />}>
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
  });

  // Use common routes to eliminate duplication
  const allChildRoutes = [
    commonRoutes.rootLandingRoute,
    commonRoutes.homeLandingRoute,
    commonRoutes.indexHtmlLandingRoute,
    commonRoutes.loginRoute,
    commonRoutes.logoutRoute,
    ...dynamicRoutes,
  ];

  const routeTree = appCoreRootRoute.addChildren(allChildRoutes);

  return createRouter({
    routeTree,
    basepath: import.meta.env.BASE_URL,
  });
};
