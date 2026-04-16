import React from "react";

import { AppRuntimeProvider, type AppRuntimeConfig } from "@workspace/app-runtime";
import { RendererProvider } from "@workspace/plugin-system";
import {
  AuthProvider,
  AuthInitializer,
  RouterProvider,
  type AnyRouter,
} from "@workspace/router";
import { ErrorBoundary } from "@workspace/ui/components/errors/general-error";

interface AppProvidersProps {
  router: AnyRouter;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ router }) => {
  const runtimeConfig: AppRuntimeConfig = {
    isStandalone: false, // Running within core shell
    baseUrl: import.meta.env.BASE_URL,
    router,
  };

  return (
    <ErrorBoundary>
      <AppRuntimeProvider config={runtimeConfig}>
        <RendererProvider>
          <AuthProvider>
            <AuthInitializer>
              <RouterProvider router={router} />
            </AuthInitializer>
          </AuthProvider>
        </RendererProvider>
      </AppRuntimeProvider>
    </ErrorBoundary>
  );
};
