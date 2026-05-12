import {
  createLoginRoute,
  createLogoutRoute,
  createRoute,
  type AnyRoute,
} from "@oc-mui/router";
import { AppLoader } from "@oc-mui/ui/components";

import { DefaultLandingComponent } from "../components/DefaultLandingComponent";

/**
 * Shared route definitions (landing, login, logout) used by the shell router.
 *
 * Previously reused across both `app-router.tsx` and `DynamicRouterProvider.tsx`;
 * after the Phase 3 migration (ADR-003) only `DynamicRouterProvider` remains,
 * but these routes are kept in a separate module so plugin-author-facing tests
 * can build mini-routers with the same landing/login/logout set.
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
