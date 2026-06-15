import { Component, type ErrorInfo, type ReactNode } from "react";

import { logger } from "@opencast-mui/utils";

const boundaryLogger = logger.child({ component: "PluginErrorBoundary" });

interface PluginErrorBoundaryProps {
  children: ReactNode;
  /** Identifies the plugin surface, for logging (e.g. the extension-point key). */
  label?: string;
  /**
   * Rendered instead of the children when they throw. A `ReactNode`, or a
   * function of the error. Defaults to rendering nothing, so a broken
   * non-critical widget simply disappears rather than taking down the shell.
   */
  fallback?: ReactNode | ((error: Error) => ReactNode);
}

interface PluginErrorBoundaryState {
  error: Error | null;
}

/**
 * Isolates a plugin-provided component's render: if a third-party plugin throws
 * while rendering, this catches it so the rest of the shell keeps working
 * instead of the whole app falling to the root error boundary.
 *
 * Lives in `@opencast-mui/plugin-system` rather than `@opencast-mui/ui` on purpose —
 * `@opencast-mui/ui` already depends on this package, so importing its `ErrorBoundary`
 * here would form a cycle. The fallback is injected by the caller, keeping this
 * UI-light (no `@opencast-mui/ui` dependency).
 */
export class PluginErrorBoundary extends Component<
  PluginErrorBoundaryProps,
  PluginErrorBoundaryState
> {
  state: PluginErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): PluginErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    boundaryLogger.error(
      `Plugin component "${this.props.label ?? "unknown"}" crashed during render; isolating it.`,
      error,
      { componentStack: info.componentStack },
    );
  }

  render(): ReactNode {
    const { error } = this.state;
    if (error !== null) {
      const { fallback } = this.props;
      if (typeof fallback === "function") return fallback(error);
      return fallback ?? null;
    }
    return this.props.children;
  }
}
