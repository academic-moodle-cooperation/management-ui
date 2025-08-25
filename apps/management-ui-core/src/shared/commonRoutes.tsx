import React, { Suspense } from 'react';
import { createRoute } from '@tanstack/react-router';
import { DefaultLandingPage, AppLoader, Container } from '@workspace/ui/components';
import { ComponentResolver } from '@workspace/plugin-system';
import { createLoginRoute, createLogoutRoute } from '@workspace/router';

/**
 * Shared route definitions used across different router configurations.
 * This eliminates duplication between app-router.tsx and DynamicRouterProvider.tsx
 */

const DefaultLandingComponent = () => (
  <Suspense fallback={<AppLoader />}>
    <Container className="flex justify-center">
      <ComponentResolver
        componentType="appshell:landing-page"
        defaultComponent={DefaultLandingPage}
        componentProps={{}}
        loadingBehavior="loader"
        useOverridePrefix={true}
      />
    </Container>
  </Suspense>
);

export const createCommonRoutes = (parentRoute: any) => {
  const rootLandingRoute = createRoute({
    getParentRoute: () => parentRoute,
    path: '/',
    component: DefaultLandingComponent,
  });

  const homeLandingRoute = createRoute({
    getParentRoute: () => parentRoute,
    path: '/home',
    component: DefaultLandingComponent,
  });

  const indexHtmlLandingRoute = createRoute({
    getParentRoute: () => parentRoute,
    path: '/index.html',
    component: DefaultLandingComponent,
  });

  // Create auth routes with AppLoader as the loading component
  const loginRoute = createLoginRoute(parentRoute, { 
    loadingComponent: AppLoader 
  });
  
  const logoutRoute = createLogoutRoute(parentRoute, { 
    loadingComponent: AppLoader 
  });

  return {
    rootLandingRoute,
    homeLandingRoute,
    indexHtmlLandingRoute,
    loginRoute,
    logoutRoute,
  };
};