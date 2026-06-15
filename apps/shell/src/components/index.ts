// Error components — ErrorBoundary and NotFoundError live in
// `@opencast-mui/ui/components`; only the shell-specific inline fallback
// is re-exported here.
export { ModuleErrorFallback } from "./errors/ModuleErrorFallback";

// Config bootstrap error screen.
export { ConfigLoadError } from "./ConfigLoadError";

// Layout components
export { CoreAppShellLayout } from "./layout/CoreAppShellLayout";

// Plugin components
export { PluginInitializer } from "./PluginInitializer";

// Router components
export { DynamicRouterProvider } from "./DynamicRouterProvider";
