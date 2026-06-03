"use client";

import { createContext, useContext, type ComponentType, type ReactNode } from "react";

/**
 * Router injection for `@oc-mui/ui`.
 *
 * A handful of `@oc-mui/ui` components are inherently router-aware (the
 * sidebar `NavMain`, the data table) — they render links and read the
 * current path. Importing `@oc-mui/router` here would invert the layering
 * (UI primitives sitting *above* routing) and forms a dependency cycle that
 * blocks `@oc-mui/router` from ever importing `@oc-mui/ui` back.
 *
 * Instead the host app injects the router primitives via
 * {@link UiRouterProvider}: the shell fills `Link` with `@oc-mui/router`'s
 * Link and `usePathname` with a `useRouterState`-derived selector. The
 * context ships **functional defaults** (a plain `<a>` and an empty path),
 * so a component rendered without a provider — in a test, Storybook, or a
 * standalone consumer — still works, just without active-route awareness.
 */
export interface UiLinkProps {
  to: string;
  target?: string;
  title?: string;
  className?: string;
  activeOptions?: { exact?: boolean };
  /** TanStack Link supports a render-prop child receiving the active state. */
  children?: ReactNode | ((state: { isActive: boolean }) => ReactNode);
}

export interface UiRouterPrimitives {
  /** Router `Link` component (the shell injects `@oc-mui/router`'s Link). */
  Link: ComponentType<UiLinkProps>;
  /** The current location pathname. */
  usePathname: () => string;
}

/** Default Link: a plain anchor with no active-route awareness. */
function DefaultLink({ to, target, title, className, children }: UiLinkProps) {
  return (
    <a href={to} target={target} title={title} className={className}>
      {typeof children === "function" ? children({ isActive: false }) : children}
    </a>
  );
}

const DEFAULT_PRIMITIVES: UiRouterPrimitives = {
  Link: DefaultLink,
  usePathname: () => "",
};

const UiRouterContext = createContext<UiRouterPrimitives>(DEFAULT_PRIMITIVES);

export function UiRouterProvider({
  value,
  children,
}: {
  value: UiRouterPrimitives;
  children: ReactNode;
}) {
  return <UiRouterContext.Provider value={value}>{children}</UiRouterContext.Provider>;
}

/** Read the host-injected router primitives (falls back to plain defaults). */
export function useUiRouter(): UiRouterPrimitives {
  return useContext(UiRouterContext);
}
