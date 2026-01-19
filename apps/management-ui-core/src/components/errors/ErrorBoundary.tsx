import React, { Component } from "react";

import { useI18n } from "@workspace/i18n";
import { logger } from "@workspace/utils";

import type { ReactNode } from "react";

interface ErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
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

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error("ErrorBoundary caught an error", error, {
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

export const ModuleErrorFallback: React.FC<{ name?: string }> = ({ name }) => {
  const { t } = useI18n();
  
  return (
    <div className="flex items-center justify-center min-h-64 bg-red-50 border border-red-200 rounded-lg">
      <div className="text-center text-red-700">
        <h3 className="text-lg font-semibold mb-2">{t("common:moduleError")}</h3>
        <p>{name ? `${t("common:errorLoadingModule")}: ${name}` : t("common:errorLoadingModule")}</p>
        <p className="text-sm mt-2">{t("common:pleaseRefreshPage")}</p>
      </div>
    </div>
  );
};

export const NotFoundError: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-gray-400 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-700 mb-2">Page Not Found</h2>
      <p className="text-gray-600">The page you&apos;re looking for doesn&apos;t exist.</p>
    </div>
  </div>
);
