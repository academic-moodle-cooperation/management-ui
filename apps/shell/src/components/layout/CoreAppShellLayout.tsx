import React, { Suspense } from "react";

import { Outlet } from "@workspace/router";
import { Appshell } from "@workspace/ui/components";

import { MatomoTracker } from "../analytics/MatomoTracker";

// Development tools - only load in development
const TanStackRouterDevtools = import.meta.env.DEV
  ? React.lazy(() =>
      import("@tanstack/router-devtools").then((res) => ({
        default: res.TanStackRouterDevtools,
      })),
    )
  : () => null;

export const CoreAppShellLayout: React.FC = () => {
  return (
    <Appshell>
      <MatomoTracker />
      <Outlet />
      {import.meta.env.DEV && (
        <Suspense fallback={null}>
          <TanStackRouterDevtools />
        </Suspense>
      )}
    </Appshell>
  );
};
