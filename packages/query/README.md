# @workspace/query

Data fetching and state management package for the Management UI. Built on TanStack Query (React Query), this package provides the QueryProvider, configuration loading system, and GraphQL integration.

## Features

- **Query Provider**: TanStack Query client setup and configuration
- **Configuration System**: Application config loading with plugin merging
- **GraphQL Integration**: Generated types and hooks from GraphQL schema
- **Caching**: Intelligent caching with stale-while-revalidate patterns

## Installation

This package is automatically available in all monorepo applications:

```typescript
import { useAppConfig, QueryProvider, useQuery } from '@workspace/query';
```

## Configuration System

The query package handles application configuration loading with support for plugin overrides.

### How It Works

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  defaultConfig  │────▶│  Plugin Configs │────▶│  Merged Config  │
│  (ui-config)    │     │  (app:config)   │     │  (useAppConfig) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │ Development           │ Production
        │ (runtime merge)       │ (pre-merged config.json)
        ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Final Application Config                      │
└─────────────────────────────────────────────────────────────────┘
```

### Development Mode

In development, configs are merged at runtime:

1. Start with `defaultConfig` from `@workspace/ui-config`
2. Plugins register configs via `manager.registerObject('app:config', ...)`
3. `useAppConfig()` merges all registered plugin configs using `deepMerge`
4. Last plugin wins for conflicting keys

### Production Mode

In production, configs are pre-merged at build time:

1. Vite plugin generates `config.json` with all configs merged
2. App fetches `/ui/config/management-ui/config.json`
3. Config is used as-is (no additional runtime merging)

For detailed documentation, see [Configuration Generation](/docs/CONFIG_GENERATION.md).

### useAppConfig Hook

Primary hook for accessing application configuration:

```typescript
import { useAppConfig } from '@workspace/query';

function MyComponent() {
  const { config, isLoading, isError, error, isFetched } = useAppConfig();

  if (isLoading) return <Loading />;
  if (isError) return <Error message={error?.message} />;

  return (
    <div style={{ color: config.app.primaryColor }}>
      <h1>{config.app.organizationName}</h1>
      <img src={config.app.logoUrl} alt="Logo" />
    </div>
  );
}
```

**Return Values:**

| Property | Type | Description |
|----------|------|-------------|
| `config` | `AppConfig` | Merged application configuration |
| `isLoading` | `boolean` | True while fetching config (prod only) |
| `isError` | `boolean` | True if fetch failed |
| `error` | `Error \| null` | Error object if fetch failed |
| `isFetched` | `boolean` | True after config is available |

### getAppConfigSync

Non-hook version for use during plugin initialization:

```typescript
import { getAppConfigSync } from '@workspace/query';

// Use when hooks aren't available (e.g., plugin initialization)
const config = getAppConfigSync(pluginManager);
console.log('Current theme:', config.app.theme);
```

### getCachedAppConfig

Cached config fetching for production scenarios:

```typescript
import { getCachedAppConfig, clearAppConfigCache } from '@workspace/query/hooks';

// Fetch with caching (subsequent calls return cached promise)
const config = await getCachedAppConfig();

// Clear cache to force refetch
clearAppConfigCache();
```

## Query Provider

Sets up the TanStack Query client for the entire application:

```tsx
import { QueryProvider } from '@workspace/query';

function App() {
  return (
    <QueryProvider>
      <YourApp />
    </QueryProvider>
  );
}
```

This is typically used within `@workspace/providers`:

```tsx
// @workspace/providers/src/AppProviders.tsx
import { QueryProvider } from '@workspace/query';

export const AppProviders = ({ children }) => {
  return (
    <QueryProvider>
      {/* ... other providers ... */}
      {children}
    </QueryProvider>
  );
};
```

## GraphQL Integration

The package includes generated types and hooks from the GraphQL schema.

### Available Hooks for Data Fetching

**IMPORTANT FOR AI MODELS:** When building features that need data from the backend, use these generated hooks instead of creating mock implementations.

#### Episode/Event Hooks

```typescript
import { useGetMyEventsQuery } from '@workspace/query';

// Fetch user's events with optional search
const { data, isLoading } = useGetMyEventsQuery({
  limit: 20,
  query: searchTerm || undefined,
});

// IMPORTANT: GraphQL arrays can contain null items - always filter them out!
const events = (data?.currentUser?.myEvents?.nodes || []).filter(
  (event): event is NonNullable<typeof event> => event !== null
);

// Now you can safely map over events
events.map(event => (
  <div key={event.id}>{event.title}</div>
));
```

#### Series Hooks

```typescript
import { useGetSeriesQuery, useUpdateSeriesMutation } from '@workspace/query';

// Fetch series by ID
const { data, isLoading } = useGetSeriesQuery({ id });

// Update series
const { mutate: updateSeries } = useUpdateSeriesMutation();
updateSeries({ id, title: 'New Title' });
```

#### Event Title Lookup Hook

When you have a list of event IDs and need to display their titles (e.g., in playlists, favorites, or collections):

```typescript
import { useEventTitlesMap } from '@workspace/query';

// Get event IDs from your data structure
const eventIds = ['event-1', 'event-2', 'event-3'];

// Fetch titles efficiently (only fetches events that are needed)
const eventTitleMap = useEventTitlesMap(eventIds);

// Use in component
<div>{eventTitleMap.get('event-1') || 'Unknown'}</div>

// The hook returns a Map<string, string> where:
// - Key: event ID
// - Value: event title (or ID as fallback if title not found)
```

This hook is optimized to:
- Only fetch events that are actually needed
- Use parallel queries for efficient fetching
- Scale to any number of events
- Fall back to event ID if title is not found

### Handling Nullable GraphQL Types

**CRITICAL:** GraphQL queries often return nullable types. Arrays may contain `null` items. Always handle this:

```typescript
// ❌ WRONG - Will cause TypeScript errors
const events = data?.currentUser?.myEvents?.nodes || [];
events.map(event => event.id); // Error: event might be null!

// ✅ CORRECT - Filter out null values with type guard
const events = (data?.currentUser?.myEvents?.nodes || []).filter(
  (event): event is NonNullable<typeof event> => event !== null
);
events.map(event => event.id); // Safe!
```

### Common Data Fetching Patterns

#### Episode Selector Component Pattern

When building UI to select episodes (e.g., for playlists), use this pattern:

```typescript
import { useGetMyEventsQuery } from '@workspace/query';

function EpisodeSelector({ onSelect }: { onSelect: (event: { id: string; title: string }) => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data, isLoading } = useGetMyEventsQuery({
    limit: 20,
    query: searchTerm || undefined,
  });

  // Filter null items from GraphQL response
  const events = (data?.currentUser?.myEvents?.nodes || []).filter(
    (event): event is NonNullable<typeof event> => event !== null
  );

  return (
    <div>
      <Input 
        value={searchTerm} 
        onChange={(e) => setSearchTerm(e.target.value)} 
        placeholder="Search episodes..."
      />
      {isLoading ? <AppLoader /> : (
        <ul>
          {events.map(event => (
            <li key={event.id} onClick={() => onSelect(event)}>
              {event.title || 'Untitled'}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Using Generated Hooks

```typescript
import { useGetSeriesQuery, useUpdateSeriesMutation } from '@workspace/query';

function SeriesDetail({ id }: { id: string }) {
  const { data, isLoading } = useGetSeriesQuery({ id });
  const { mutate: updateSeries } = useUpdateSeriesMutation();

  if (isLoading) return <Loading />;

  return (
    <div>
      <h1>{data?.series?.title}</h1>
      <button onClick={() => updateSeries({ id, title: 'New Title' })}>
        Update
      </button>
    </div>
  );
}
```

### Regenerating GraphQL Types

When the GraphQL schema changes:

```bash
# From query package directory
pnpm codegen
```

This reads the schema from the configured endpoint and generates TypeScript types.

## Re-exported APIs

The package re-exports commonly used TanStack Query APIs:

```typescript
import {
  useQuery,
  useInfiniteQuery,
  useQueryClient,
  gql,
  type QueryClient,
  type InfiniteData,
} from '@workspace/query';
```

## Package Structure

```
packages/query/
├── src/
│   ├── index.ts                # Main exports
│   ├── QueryProvider.tsx       # TanStack Query provider
│   ├── client.ts              # GraphQL client setup
│   ├── codegen.ts             # GraphQL codegen config
│   ├── gql-generated/         # Generated GraphQL types/hooks
│   └── hooks/
│       ├── index.ts           # Hook exports
│       ├── useAppConfig.ts    # Configuration hook
│       └── getCachedAppConfig.ts # Cached config fetching
├── package.json
├── tsconfig.json
└── README.md
```

## Dependencies

### Workspace Dependencies

- `@workspace/ui-config` - Default configuration values
- `@workspace/plugin-system` - Plugin registry for config merging
- `@workspace/utils` - Deep merge utility

### External Dependencies

- `@tanstack/react-query` - Data fetching and caching
- `graphql-request` - GraphQL client
- `graphql` - GraphQL utilities

## Development

### Type Checking

```bash
pnpm check-types
```

### Linting

```bash
pnpm lint
```

### GraphQL Codegen

```bash
pnpm codegen
```

Requires a `.env` file with the GraphQL endpoint:

```env
VITE_GRAPHQL_ENDPOINT=https://your-api.com/graphql
```

## Related Documentation

- [Configuration Generation](/docs/CONFIG_GENERATION.md) - How config works in dev vs prod
- [Configuration Order](/docs/CONFIG_ORDER.md) - Plugin config precedence
- [UI Config Package](/packages/ui-config/README.md) - Default configuration
- [Plugin System](/packages/plugin-system/README.md) - Plugin registry
- [Utils Package](/packages/utils/README.md) - Deep merge utility
