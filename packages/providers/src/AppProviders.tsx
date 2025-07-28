import React from 'react';
import { RendererProvider } from '@workspace/plugin-system';
import { AuthProvider, AuthInitializer, RouterProvider } from '@workspace/router';
import { ErrorBoundary } from '@workspace/ui/components/errors/general-error';
import type { AnyRouter } from '@tanstack/react-router';

interface AppProvidersProps {
  router: AnyRouter;
}

export const AppProviders: React.FC<AppProvidersProps> = ({
  router,
}) => {
  return (
    <ErrorBoundary>
      <RendererProvider>
        <AuthProvider>
          <AuthInitializer>
            <RouterProvider router={router} />
          </AuthInitializer>
        </AuthProvider>
      </RendererProvider>
    </ErrorBoundary>
  );
}; 