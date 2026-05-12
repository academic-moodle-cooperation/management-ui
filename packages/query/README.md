# @oc-mui/query

**Version:** 0.0.0  
**Type:** Integration Layer  
**Last Updated:** 2025-01-15

## Purpose & Scope

The `@oc-mui/query` package serves as the centralized data fetching and state synchronization layer for the Management UI. It integrates **TanStack Query (React Query)** with **GraphQL** (via `graphql-request`) to provide a robust, type-safe, and cached data layer.

This package is responsible for all server communication, handling GraphQL operations, managing the query cache, and providing hooks for data access throughout the monorepo.

### Stability contract

This package is the **only place in the monorepo that is allowed to import from `@tanstack/react-query`**. Apps, plugins and other packages must import query primitives (`useQuery`, `useMutation`, `QueryClient`, …) from `@oc-mui/query`.

The rule is enforced by ESLint (`no-restricted-imports` in `packages/eslint-config/base.js`) with an explicit exception for this package.

Why it matters: if we ever need to replace or upgrade the query implementation across a major version, we can do so by changing the internals of `@oc-mui/query` without breaking plugins or apps. Deep imports into the underlying query library would make that impossible.

**In Scope:**

- GraphQL client initialization and management.
- TanStack Query client configuration and Provider.
- Automatic TypeScript code generation from GraphQL files (`.graphql`).
- Global hooks for common data needs (User Info, App Config).
- Caching logic for application configuration.

**Out of Scope:**

- UI components for data display (belongs in `@oc-mui/ui` or apps).
- Complex client-side state management not related to server data (belongs in `@oc-mui/store`).
- Route-specific logic (belongs in `@oc-mui/router` or apps).

## Architecture & Design Decisions

### Design Principles

- **Type Safety:** Every GraphQL operation is converted into TypeScript types and hooks via `@graphql-codegen`.
- **Centralized Fetching:** All data fetching follows the same pattern using the centralized `fetcher` and `QueryProvider`.
- **Config-Driven:** Data endpoints are derived from the application configuration.

### Key Concepts

#### GraphQL Codegen
We use `.graphql` files to define queries and mutations. The `pnpm codegen` command generates the `gql-generated.ts` file, which contains both the types and the React Query hooks.

#### Global Config Caching
The `useAppConfig` hook provides access to the global application configuration (merging defaults with plugin-specific configs) and caches it to prevent unnecessary fetches.

### Architecture Diagram

```
┌─────────────────────────────────────────┐
│ @oc-mui/query Architecture           │
├─────────────────────────────────────────┤
│ [ React Query Provider ]                │
│         ↓                               │
│ [ Generated Hooks (gql-generated.ts) ]  │
│         ↓                               │
│ [ GraphQL Client (graphql-request) ]    │
│         ↓                               │
│ [ API Endpoint (/graphql) ]             │
└─────────────────────────────────────────┘
```

### Technology Choices

- **TanStack Query (v5):** Chosen for its powerful caching, revalidation, and state management capabilities for asynchronous data.
- **graphql-request:** A lightweight GraphQL client that works perfectly with TanStack Query.
- **GraphQL Codegen:** Ensures 100% type safety between the backend schema and frontend code.

## API Surface (Public Exports)

### Exports Structure

```typescript
export { QueryProvider } from "./QueryProvider";
export { fetchData } from "./fetcher";
export { getGraphQLClient, createQueryClient } from "./client";
export { useGenericQuery } from "./hooks/useGenericQuery";
// Re-exports from @tanstack/react-query
export { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
```

### Core API

#### `QueryProvider`
**Purpose:** Wraps the application to provide the TanStack Query context and DevTools.

#### `useGenericQuery`
**Purpose:** A wrapper around `useQuery` for standardizing query calls.

#### `fetchData<TData, TVariables>`
**Purpose:** The low-level fetcher used by generated hooks to execute GraphQL requests.

## Dependencies & Coupling

### Dependency Graph

```
@oc-mui/query
├── External Dependencies
│   ├── @tanstack/react-query (^5.51.15)
│   ├── graphql (^16.9.0)
│   └── graphql-request (^7.1.0)
└── Workspace Dependencies
    ├── @oc-mui/plugin-system - For merging plugin configurations
    ├── @oc-mui/ui-config - For default application settings
    └── @oc-mui/utils - For deep merging and logging
```

### Dependency Layer

**Layer:** Integration Layer

**Allowed to depend on:** Core Infrastructure, Foundation.

**Rules:**
- Must not depend on UI components or App-specific logic.
- Should remain the primary source for server data.

### Coupling Analysis

- **Tight Coupling:** Specifically coupled to `ui-config` and `plugin-system` because it needs to know how to resolve endpoints and merge configurations (justified by design).
- **Abstraction Points:** The `fetcher` abstracts the actual `fetch` call, allowing for global error handling.

## Usage Examples

### Basic Query (using generated hooks)

```typescript
import { useGetEventByIdQuery } from "@oc-mui/query";

const MyComponent = ({ id }) => {
  const { data, isLoading } = useGetEventByIdQuery({ id });
  
  if (isLoading) return <div>Loading...</div>;
  return <div>{data?.event?.title}</div>;
};
```

### Mutation Example

```typescript
import { useMutation, gql, getGraphQLClient } from "@oc-mui/query";

const UPDATE_TITLE = gql`
  mutation UpdateTitle($id: ID!, $title: String!) {
    updateEvent(id: $id, title: $title) { id }
  }
`;

const useUpdateTitle = () => {
  const client = getGraphQLClient();
  return useMutation({
    mutationFn: (variables) => client.request(UPDATE_TITLE, variables),
  });
};
```

## Testing Strategy

### Unit Tests
Located in `src/**/*.test.ts`. Use `vitest` and `@testing-library/react`.

```bash
pnpm test
```

### Testing Patterns
When testing components that use queries, wrap them in a `QueryProvider` with a clean `QueryClient`.

## Extension Points

### Adding New Queries/Mutations
1. Create or update a `.graphql` file in `src/` (e.g., `queries.graphql`).
2. Run `pnpm codegen` from the package root or monorepo root.
3. Use the newly generated hooks (starting with `use...Query` or `use...Mutation`) in your components.

## File Structure

```
packages/query/
├── src/
│   ├── hooks/                  # Custom and cached hooks
│   ├── client.ts               # GraphQL client setup
│   ├── fetcher.ts              # Global fetch wrapper
│   ├── gql-generated.ts        # AUTO-GENERATED (Do not edit)
│   ├── queries.graphql         # GraphQL source operations
│   ├── QueryProvider.tsx       # React Query context provider
│   └── index.ts                # Public API exports
├── package.json
└── README.md                   # This file
```

## Development

### Setup

```bash
pnpm install
pnpm codegen  # Generates types from GraphQL schema
```

### Commands
- `pnpm codegen`: Generates `gql-generated.ts`. Requires an active backend or schema file.
- `pnpm test`: Runs vitest suites.
- `pnpm check-types`: Validates TypeScript.

## Performance Considerations

- **Stale Time:** Default `staleTime` is set to 5 minutes to reduce redundant network requests.
- **Bundle Size:** `graphql-request` is significantly smaller than Apollo Client.
- **Caching:** The `useAppConfig` hook uses internal caching to avoid re-fetching configuration during the session.

## Related Packages

- [`@oc-mui/plugin-system`](/packages/plugin-system/README.md) - Provides the plugin registry for config merging.
- [`@oc-mui/app-runtime`](/packages/app-runtime/README.md) - Uses query hooks for application initialization.

---

## Contributing

1. Add GraphQL operations to `.graphql` files.
2. **Always** run `pnpm codegen` after changing GraphQL files.
3. Do not manually edit `gql-generated.ts`.
4. Add tests for new custom hooks in `src/hooks/`.
