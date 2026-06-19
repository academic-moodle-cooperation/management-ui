import { Component, type ErrorInfo, type ReactNode } from "react";

import { useTranslation } from "@oc-mui/i18n";
import { logger } from "@oc-mui/utils";

import { Button } from "../ui/button";

import { ErrorPage } from "./error-page";

interface GeneralErrorProps {
  /**
   * Embedded variant: hides the big "500" and the action buttons so the
   * component can be slotted into a smaller surface (e.g. a panel that
   * failed to load).
   */
  minimal?: boolean | undefined;
  /** Optional extra detail line — typically `error.message` in dev. */
  message?: string | undefined;
  onHomeClick?: (() => void) | undefined;
  onBackClick?: (() => void) | undefined;
  className?: string | undefined;
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
  const { t } = useTranslation();
  return (
    <ErrorPage
      className={className}
      code={!minimal && "500"}
      title={t("errors.general.title")}
      description={
        <>
          {message && <p className="mb-1">{message}</p>}
          <p>{t("errors.general.description")}</p>
        </>
      }
      actions={
        !minimal && (
          <>
            <Button variant="outline" onClick={onBackClick}>
              {t("goBack")}
            </Button>
            <Button onClick={onHomeClick}>{t("backToHome")}</Button>
          </>
        )
      }
    />
  );
}
