export * from "./RouterProvider";

export {
  Route,
  createRouter,
  createRoute,
  Link,
  Navigate,
  useNavigate,
  useRouter,
  useParams,
  useLoaderData,
  useMatch,
  useRouterState,
} from "@tanstack/react-router";

export { AuthProvider, useAuth } from "./auth/AuthContext";
export { AuthInitializer } from "./auth/AuthInitializer";
export { useAuthActions } from "./auth/useAuthActions";
export { createLoginRoute, createLogoutRoute } from "./auth/createAuthRoutes";
export { ProtectedRoute } from "./components/ProtectedRoute";

// Route protection utilities - export everything
export * from "./route-protection";

export type { AuthContextType } from "./auth/AuthContext";
