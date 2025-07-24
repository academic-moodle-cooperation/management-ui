# @workspace/router

This package provides routing capabilities for the platform using TanStack Router.

## Features

- Exports a `RouterProvider` component to be used in `@workspace/providers`.
- Designed to support dynamically generated route trees based on active applications, plugins, and extensions.

## Usage

The `RouterProvider` is intended to be used within the main `AppProviders` from `@workspace/providers`.
The actual route tree will be constructed dynamically, likely by `management-ui-core`, and passed to this provider.

```tsx
// Example in @workspace/providers/src/AppProviders.tsx
import { RouterProvider } from '@workspace/router';
// ... other provider imports

export const AppProviders = ({ children }) => {
  // Logic to generate or fetch the dynamic route tree
  const dynamicRouteTree = getDynamicRouteTree(); 

  return (
    // ... other providers ...
    <RouterProvider routeTree={dynamicRouteTree}>
      {children} // Or Outlet if RouterProvider handles the root layout
    </RouterProvider>
    // ... other providers ...
  );
};
``` 