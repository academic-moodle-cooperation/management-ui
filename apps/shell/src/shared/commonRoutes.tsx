import {
  createLoginRoute,
  createLogoutRoute,
  createRoute,
  type AnyRoute,
} from "@workspace/router";
import { AppLoader } from "@workspace/ui/components";

import { DefaultLandingComponent } from "../components/DefaultLandingComponent";

/**
 * Shared route definitions used across different router configurations.
 * This eliminates duplication between app-router.tsx and DynamicRouterProvider.tsx
 */

export const createCommonRoutes = (parentRoute: AnyRoute) => {
  const rootLandingRoute = createRoute({
    getParentRoute: () => parentRoute,
    path: "/",
    component: DefaultLandingComponent,
  });

  const homeLandingRoute = createRoute({
    getParentRoute: () => parentRoute,
    path: "/home",
    component: DefaultLandingComponent,
  });

  const indexHtmlLandingRoute = createRoute({
    getParentRoute: () => parentRoute,
    path: "/index.html",
    component: DefaultLandingComponent,
  });

  // Create auth routes with AppLoader as the loading component
  const loginRoute = createLoginRoute(parentRoute, {
    loadingComponent: AppLoader,
  });

  const logoutRoute = createLogoutRoute(parentRoute, {
    loadingComponent: AppLoader,
  });

  return {
    rootLandingRoute,
    homeLandingRoute,
    indexHtmlLandingRoute,
    loginRoute,
    logoutRoute,
  };
};
