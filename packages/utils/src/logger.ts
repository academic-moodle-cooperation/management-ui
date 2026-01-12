/**
 * Logger utility for structured logging
 *
 * Provides environment-aware logging with different log levels.
 * In production, only warnings and errors are logged.
 * In development, all log levels are available.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment =
      typeof process !== "undefined" &&
      (process.env.NODE_ENV === "development" ||
        process.env.DEV === "true" ||
        import.meta.env?.DEV === true);
  }

  /**
   * Log a debug message (only in development)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, context || "");
    }
  }

  /**
   * Log an info message
   */
  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, context || "");
    }
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: LogContext): void {
    console.warn(`[WARN] ${message}`, context || "");
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error | LogContext, context?: LogContext): void {
    const errorContext: LogContext = {
      ...(error instanceof Error
        ? {
            error: error.message,
            stack: error.stack,
            name: error.name,
          }
        : error || {}),
      ...(context || {}),
    };

    console.error(`[ERROR] ${message}`, errorContext);
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger();
    const originalMethods = {
      debug: childLogger.debug.bind(childLogger),
      info: childLogger.info.bind(childLogger),
      warn: childLogger.warn.bind(childLogger),
      error: childLogger.error.bind(childLogger),
    };

    childLogger.debug = (message: string, additionalContext?: LogContext) => {
      originalMethods.debug(message, { ...context, ...additionalContext });
    };

    childLogger.info = (message: string, additionalContext?: LogContext) => {
      originalMethods.info(message, { ...context, ...additionalContext });
    };

    childLogger.warn = (message: string, additionalContext?: LogContext) => {
      originalMethods.warn(message, { ...context, ...additionalContext });
    };

    childLogger.error = (
      message: string,
      error?: Error | LogContext,
      additionalContext?: LogContext
    ) => {
      originalMethods.error(message, error, { ...context, ...additionalContext });
    };

    return childLogger;
  }
}

// Export singleton instance
export const logger = new Logger();

// Export Logger class for custom instances
export { Logger };
export type { LogLevel, LogContext };
