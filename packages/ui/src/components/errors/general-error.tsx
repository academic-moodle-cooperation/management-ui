import { Component, type ErrorInfo, type ReactNode } from "react";

import { Button } from "../ui/button";
import { cn } from "@workspace/ui/lib/utils";
import { logger } from "@workspace/utils";

interface GeneralErrorProps extends React.HTMLAttributes<HTMLDivElement> {
  minimal?: boolean | undefined;
  message?: string | undefined;
  onHomeClick?: (() => void) | undefined;
  onBackClick?: (() => void) | undefined;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.props.onError?.(error, errorInfo);

    // Log the error during development
    if (import.meta.env.DEV) {
      logger.error("ErrorBoundary caught an error", error, {
        componentStack: errorInfo.componentStack,
      });
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      const { fallback } = this.props;
      if (typeof fallback === "function" && this.state.error) {
        return fallback(this.state.error);
      }
      if (fallback && typeof fallback !== "function") {
        return fallback;
      }
      return (
        <GeneralError
          message={
            import.meta.env.DEV
              ? `${this.state.error?.name}: ${this.state.error?.message}`
              : undefined
          }
        />
      );
    }
    return this.props.children;
  }
}

export function GeneralError({
  className,
  minimal = false,
  message,
  onHomeClick,
  onBackClick,
}: GeneralErrorProps) {
  return (
    <div className={cn("h-svh w-full", className)}>
      <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2">
        {!minimal && <h1 className="text-[7rem] font-bold leading-tight">500</h1>}
        <span className="font-medium">Oops! Something went wrong {`:')`}</span>
        {message && <p className="text-center text-muted-foreground">{message}</p>}
        <p className="text-center text-muted-foreground">
          We apologize for the inconvenience. <br /> Please try again later.
        </p>
        {!minimal && (
          <div className="mt-6 flex gap-4">
            <Button variant="outline" onClick={onBackClick}>
              Go Back
            </Button>
            <Button onClick={onHomeClick}>Back to Home</Button>
          </div>
        )}
      </div>
    </div>
  );
}
