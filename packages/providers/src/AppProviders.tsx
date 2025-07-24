import React from 'react';
import { ConfigProvider } from '@workspace/ui-config';
import { RendererProvider } from '@workspace/plugin-system';
import { AuthProvider, AuthInitializer, RouterProvider } from '@workspace/router';
import { ErrorBoundary } from '@workspace/ui/components/errors/general-error';
import type { AnyRouter } from '@tanstack/react-router';
import type { AppConfig } from '@workspace/ui-config';

interface AppProvidersProps {
  router: AnyRouter;
  configData: AppConfig;
  isConfigLoading: boolean;
  isConfigError: boolean;
  configError: Error | null;
  isConfigFetched: boolean;
}

export const AppProviders: React.FC<AppProvidersProps> = ({
  router,
  configData,
  isConfigLoading,
  isConfigError,
  configError,
  isConfigFetched,
}) => {
  return (
    <ErrorBoundary>
      <ConfigProvider
        configData={configData}
        isLoading={isConfigLoading}
        isError={isConfigError}
        error={configError}
        isFetched={isConfigFetched}
      >
        <RendererProvider>
          <AuthProvider>
            <AuthInitializer>
              <RouterProvider router={router} />
            </AuthInitializer>
          </AuthProvider>
        </RendererProvider>
      </ConfigProvider>
    </ErrorBoundary>
  );
}; 