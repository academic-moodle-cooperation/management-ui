# @workspace/providers

This package provides the core React context providers for the management UI application. It orchestrates the provider hierarchy and ensures proper composition of all application-level contexts.

## Provider Hierarchy

The `AppProviders` component composes the following providers in this order:

1. **ErrorBoundary** (@workspace/ui) - Catches application errors gracefully
2. **ConfigProvider** (@workspace/ui-config) - Provides application configuration context
3. **RendererProvider** (@workspace/plugin-system) - Provides legacy plugin rendering context (deprecated)
4. **AuthProvider** (@workspace/router) - Provides authentication context
5. **AuthInitializer** (@workspace/router) - Initializes authentication data
6. **RouterProvider** (@workspace/router) - Provides TanStack routing context (innermost)

## Usage

```tsx
import { AppProviders } from '@workspace/providers';

<AppProviders
  router={router}
  configData={config}
  isConfigLoading={isLoading}
  isConfigError={isError}
  configError={error}
  isConfigFetched={isFetched}
/>
```

## Error Handling

The entire provider hierarchy is wrapped with a single `ErrorBoundary` from the `@workspace/ui` package. This provides robust error handling without excessive nesting and follows React best practices for error boundaries.

## Plugin System Integration

The providers work seamlessly with the plugin system:
- `PluginProvider` and `QueryProvider` are initialized at the outer level in the main app
- `RendererProvider` (deprecated) provides legacy plugin rendering capabilities
- Plugin-related context is properly exposed through the provider hierarchy

## Migration Notes

- `RendererProvider` is deprecated in favor of `ComponentResolver`
- All debug logging and development-specific code has been removed for production readiness
- Single error boundary provides application-level error handling

## Architecture

```
React.StrictMode
├── PluginProvider (outer level)
└── QueryProvider (outer level)
    └── PluginInitializer
        └── AppProviders
            └── ErrorBoundary (@workspace/ui)
                ├── ConfigProvider
                │   ├── RendererProvider (deprecated)
                │   │   ├── AuthProvider
                │   │   │   └── AuthInitializer
                │   │   │       └── RouterProvider
                │   │   │           └── [Your App Components]
``` 