import React from 'react';
import {
  RouterProvider as TanStackRouterProvider,
  Outlet,
  createRootRoute,
  type AnyRouter,
} from '@tanstack/react-router';

const RootLayoutComponent = () => {
  return (
    <div>
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export const baseRootRoute = createRootRoute({
  component: RootLayoutComponent,
});

interface AppRouterProviderProps {
  router: AnyRouter;
}

export const RouterProvider: React.FC<AppRouterProviderProps> = ({ router }) => {
  return <TanStackRouterProvider router={router} />;
};

declare module '@tanstack/react-router' {
  interface Register {
    router: AnyRouter;
  }
}