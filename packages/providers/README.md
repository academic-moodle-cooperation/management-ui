# @workspace/providers

This package provides the core React context providers for the management UI application. It orchestrates the provider hierarchy and ensures proper composition of all application-level contexts.

## Provider Hierarchy

The `AppProviders` component composes the following providers in this order:

1. **ErrorBoundary** (@workspace/ui) - Catches application errors gracefully
2. **RendererProvider** (@workspace/plugin-system) - Provides legacy plugin rendering context (deprecated)
3. **AuthProvider** (@workspace/router) - Provides authentication context
4. **AuthInitializer** (@workspace/router) - Initializes authentication data
5. **RouterProvider** (@workspace/router) - Provides TanStack routing context (innermost)

**Note**: Configuration is now handled automatically by the `useAppConfig` hook from `@workspace/query`, eliminating the need for a separate `ConfigProvider`.

## Usage

```tsx
import { AppProviders } from '@workspace/providers';

<AppProviders
  router={router}
/>
```

**Migration Note**: The `configData`, `isConfigLoading`, `isConfigError`, `configError`, and `isConfigFetched` props are no longer needed as configuration is handled internally by `@workspace/query`.

## Error Handling

The entire provider hierarchy is wrapped with a single `ErrorBoundary` from the `@workspace/ui` package. This provides robust error handling without excessive nesting and follows React best practices for error boundaries.

## Plugin System Integration

The providers work seamlessly with the plugin system:
- `PluginProvider` and `QueryProvider` are initialized at the outer level in the main app
- `RendererProvider` (deprecated) provides legacy plugin rendering capabilities
- Plugin-related context is properly exposed through the provider hierarchy

## Migration Notes

- `RendererProvider` is deprecated in favor of `ComponentResolver`
- `ConfigProvider` has been removed - configuration is now handled by `useAppConfig` hook from `@workspace/query`
- All debug logging and development-specific code has been removed for production readiness
- Single error boundary provides application-level error handling

## Architecture

```
React.StrictMode
├── PluginProvider (outer level)
└── QueryProvider (outer level) - handles configuration via useAppConfig hook
    └── PluginInitializer
        └── AppProviders
            └── ErrorBoundary (@workspace/ui)
                ├── RendererProvider (deprecated)
                │   ├── AuthProvider
                │   │   └── AuthInitializer
                │   │       └── RouterProvider
                │   │           └── [Your App Components]
``` 