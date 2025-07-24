import React, { Suspense } from 'react';
import { Navigate } from '@tanstack/react-router';
import { useAuth } from '../auth/AuthContext';

/**
 * Higher-order component that wraps a component with authentication protection.
 * Use this to create protected route components.
 * 
 * @example
 * const ProtectedAdmin = withAuthProtection(AdminComponent, {
 *   requiredRoles: ['ROLE_ADMIN'],
 *   fallback: () => <div>Admin access required</div>
 * });
 * 
 * const route = createRoute({
 *   path: '/admin',
 *   component: ProtectedAdmin,
 * });
 */
export function withAuthProtection<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    requireAuth?: boolean;
    requiredRoles?: string[];
    redirectTo?: string;
    fallback?: React.ComponentType;
    loadingComponent?: React.ComponentType;
  } = {}
) {
  const {
    requireAuth = true,
    requiredRoles = [],
    redirectTo = '/login',
    fallback: Fallback = () => <div>Access denied</div>,
    loadingComponent: Loading = () => <div>Loading...</div>,
  } = options;

  const ProtectedComponent: React.FC<P> = (props) => {
    const { isAuthenticated, user } = useAuth();

    // Show loading if auth state is being determined
    if (requireAuth && user === undefined) {
      return <Loading />;
    }

    // Check authentication
    if (requireAuth && !isAuthenticated) {
      return <Navigate to={redirectTo} />;
    }

    // Check role requirements
    if (requiredRoles.length > 0) {
      const userRole = user?.currentUser?.userRole;
      if (!userRole || !requiredRoles.includes(userRole)) {
        return <Fallback />;
      }
    }

    // Render the protected component
    return <Component {...props} />;
  };

  ProtectedComponent.displayName = `withAuthProtection(${Component.displayName || Component.name})`;

  return ProtectedComponent;
}

/**
 * Creates a protected route component factory with pre-configured protection settings.
 * 
 * @example
 * const createAdminRoute = createProtectedComponentFactory({
 *   requiredRoles: ['ROLE_ADMIN'],
 *   fallback: () => <div>Admin access required</div>
 * });
 * 
 * const ProtectedAdmin = createAdminRoute(AdminComponent);
 */
export function createProtectedComponentFactory(defaultOptions: {
  requireAuth?: boolean;
  requiredRoles?: string[];
  redirectTo?: string;
  fallback?: React.ComponentType;
  loadingComponent?: React.ComponentType;
}) {
  return function <P extends object>(
    Component: React.ComponentType<P>,
    overrideOptions: Partial<typeof defaultOptions> = {}
  ) {
    const mergedOptions = { ...defaultOptions, ...overrideOptions };
    return withAuthProtection(Component, mergedOptions);
  };
}

/**
 * Utility to create a route component that includes Suspense and auth protection.
 * 
 * @example
 * const route = createRoute({
 *   path: '/admin',
 *   component: createProtectedRouteComponent(
 *     lazy(() => import('./AdminPage')),
 *     { requiredRoles: ['ROLE_ADMIN'] }
 *   ),
 * });
 */
export function createProtectedRouteComponent(
  Component: React.ComponentType,
  protectionOptions: Parameters<typeof withAuthProtection>[1] = {},
  suspenseProps: { fallback?: React.ReactNode } = {}
) {
  const ProtectedComponent = withAuthProtection(Component, protectionOptions);

  const ProtectedRouteComponent = () => (
    <Suspense fallback={suspenseProps.fallback || <div>Loading...</div>}>
      <ProtectedComponent />
    </Suspense>
  );

  ProtectedRouteComponent.displayName = `ProtectedRouteComponent(${Component.displayName || Component.name})`;

  return ProtectedRouteComponent;
} 