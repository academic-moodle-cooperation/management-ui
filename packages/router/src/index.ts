export * from "./RouterProvider";

// Public routing API. This is the stable facade; plugin authors and apps
// must import routing primitives from here, never from @tanstack/react-router
// directly. Swapping router implementations later stays a contained change.
export {
  Route,
  createRouter,
  createRoute,
  createRootRoute,
  Link,
  Navigate,
  Outlet,
  redirect,
  useNavigate,
  useRouter,
  useParams,
  useLoaderData,
  useMatch,
  useRouterState,
} from "@tanstack/react-router";

export type {
  AnyRoute,
  AnyRouter,
  RouteComponent,
} from "@tanstack/react-router";

export { AuthProvider, useAuth } from "./auth/AuthContext";
export { AuthInitializer } from "./auth/AuthInitializer";
export { useAuthActions } from "./auth/useAuthActions";
export { createLoginRoute, createLogoutRoute } from "./auth/createAuthRoutes";
export type { AuthRouteOptions, LoginFormComponentProps } from "./auth/createAuthRoutes";
export { ProtectedRoute } from "./components/ProtectedRoute";

// Route protection utilities - export everything
export * from "./route-protection";

export type { AuthContextType } from "./auth/AuthContext";
