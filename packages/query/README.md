# @workspace/query

This package provides data fetching capabilities for the platform using TanStack Query (React Query).

## Features

- Exports a `QueryProvider` to be used in `@workspace/providers` to set up the React Query client.
- Will export common custom hooks for data fetching.

## Usage

### Provider Setup

The `QueryProvider` is intended to be used within the main `AppProviders` from `@workspace/providers`.

```tsx
// Example in @workspace/providers/src/AppProviders.tsx
import { QueryProvider } from '@workspace/query';
// ... other provider imports

export const AppProviders = ({ children }) => {
  return (
    <QueryProvider>
      {/* ... other providers ... */}
      {children}
    </QueryProvider>
  );
};
```

### Using Hooks (Conceptual)

Once custom hooks are added:

```tsx
import { useSomeData } from '@workspace/query/hooks';

function MyComponent() {
  const { data, isLoading, error } = useSomeData();

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error fetching data.</p>;

  return <div>{JSON.stringify(data)}</div>;
}
```

## Development

Remember to run `pnpm install` in the monorepo root to install dependencies and link packages. 