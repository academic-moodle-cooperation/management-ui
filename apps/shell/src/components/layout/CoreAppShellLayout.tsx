import React, { Suspense } from "react";

import { Outlet, useRouterState } from "@opencast-mui/router";
import { Appshell } from "@opencast-mui/ui/components";

import { MatomoTracker } from "../analytics/MatomoTracker";

// Development tools - only load in development
const TanStackRouterDevtools = import.meta.env.DEV
  ? React.lazy(() =>
      import("@tanstack/router-devtools").then((res) => ({
        default: res.TanStackRouterDevtools,
      })),
    )
  : () => null;

/**
 * Auth gate routes render *without* the app shell chrome (no sidebar /
 * header / footer). A signed-out user on `/login` shouldn't see nav they
 * can't use or a redundant header "Login" button, and `LoginForm` is built
 * as a full-screen, vertically-centered page — wrapping it in `<Appshell>`
 * (whose header offsets the content area) is what pushed the card low.
 * `/logout` is bare for the same reason: it only shows a loader while it
 * redirects, so the chrome would just flash.
 *
 * `useRouterState().location.pathname` has the router basepath stripped, so
 * this matches whether or not the app is served under a sub-path.
 */
const isBareRoute = (pathname: string): boolean => {
  const path = pathname.replace(/\/+$/, "");
  return path.endsWith("/login") || path.endsWith("/logout");
};

export const CoreAppShellLayout: React.FC = () => {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const devtools = import.meta.env.DEV && (
    <Suspense fallback={null}>
      <TanStackRouterDevtools />
    </Suspense>
  );

  // Bare layout for auth gate routes — just the routed content, no chrome.
  if (isBareRoute(pathname)) {
    return (
      <>
        <MatomoTracker />
        <Outlet />
        {devtools}
      </>
    );
  }

  return (
    <Appshell>
      <MatomoTracker />
      <Outlet />
      {devtools}
    </Appshell>
  );
};
