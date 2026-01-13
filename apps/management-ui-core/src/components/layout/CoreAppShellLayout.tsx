import React, { Suspense } from "react";
import { Outlet } from "@tanstack/react-router";
import { Appshell } from "@workspace/ui/components";

// Development tools - only load in development
const TanStackRouterDevtools = import.meta.env.DEV
  ? React.lazy(() =>
    import("@tanstack/router-devtools").then((res) => ({
      default: res.TanStackRouterDevtools,
    }))
  )
  : () => null;

export const CoreAppShellLayout: React.FC = () => {
  return (
    <Appshell>
      <Outlet />
      {import.meta.env.DEV && (
        <Suspense fallback={null}>
          <TanStackRouterDevtools />
        </Suspense>
      )}
    </Appshell>
  );
};
