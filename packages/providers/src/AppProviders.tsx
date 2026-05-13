import React from "react";

import { AppRuntimeProvider, type AppRuntimeConfig } from "@oc-mui/app-runtime";
import { RendererProvider } from "@oc-mui/plugin-system";
import {
  AuthProvider,
  AuthInitializer,
  RouterProvider,
  type AnyRouter,
} from "@oc-mui/router";
import { ErrorBoundary } from "@oc-mui/ui/components/errors/general-error";

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
