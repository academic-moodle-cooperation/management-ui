import { redirect } from '@tanstack/react-router';

interface AuthContext {
  isAuthenticated: boolean;
  user: {
    currentUser?: {
      userRole?: string;
    };
  } | null;
}

interface RouteContext {
  auth?: AuthContext;
}

/**
 * Route guard that checks authentication before loading a route.
 * Use this in your route's beforeLoad function.
 * 
 * @example
 * const protectedRoute = createRoute({
 *   path: '/admin',
 *   component: AdminComponent,
 *   beforeLoad: authGuard({ requireAuth: true, requiredRoles: ['ROLE_ADMIN'] }),
 * });
 */
export function authGuard(options: {
  requireAuth?: boolean;
  requiredRoles?: string[];
  redirectTo?: string;
} = {}) {
  const { requireAuth = true, requiredRoles = [], redirectTo = '/login' } = options;

  return async ({ context }: { context: RouteContext }) => {
    // In a real application, you'd get auth state from context or a global store
    // For now, we'll use a simple check that can be enhanced

    // Note: You'll need to implement getting auth state from context
    // This is a placeholder implementation
    const authState = context?.auth || { isAuthenticated: false, user: null };

    if (requireAuth && !authState.isAuthenticated) {
      throw redirect({ to: redirectTo });
    }

    if (requiredRoles.length > 0) {
      const userRole = authState.user?.currentUser?.userRole;
      if (!userRole || !requiredRoles.includes(userRole)) {
        throw redirect({ to: '/access-denied' });
      }
    }
  };
}

/**
 * Helper to mark routes with protection metadata.
 * Use this to add protection information to staticData.
 * 
 * @example
 * const route = createRoute({
 *   path: '/admin',
 *   component: AdminComponent,
 *   staticData: {
 *     ...protectionMetadata({ requireAuth: true, roles: ['ROLE_ADMIN'] }),
 *     otherData: 'value'
 *   }
 * });
 */
export function protectionMetadata(options: {
  requireAuth?: boolean;
  roles?: string[];
  description?: string;
}) {
  return {
    protected: true,
    requireAuth: options.requireAuth ?? true,
    requiredRoles: options.roles ?? [],
    protectionDescription: options.description,
  };
}

interface RouteStaticData {
  protected?: boolean;
  requireAuth?: boolean;
  requiredRoles?: string[];
  protectionDescription?: string;
}

interface RouteWithStaticData {
  staticData?: RouteStaticData;
}

/**
 * Type guard to check if a route is protected based on its staticData.
 */
export function isProtectedRoute(route: RouteWithStaticData): boolean {
  return route.staticData?.protected === true;
}

/**
 * Get protection requirements for a route.
 */
export function getRouteProtection(route: RouteWithStaticData) {
  if (!isProtectedRoute(route)) {
    return null;
  }

  return {
    requireAuth: route.staticData?.requireAuth ?? true,
    requiredRoles: route.staticData?.requiredRoles ?? [],
    description: route.staticData?.protectionDescription,
  };
} 