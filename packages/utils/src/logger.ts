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
    // Check Node.js environment first (for build-time packages like vite-config)
    // Use type guard to safely check process in both Node.js and browser environments
    let nodeEnv = false;
    if (typeof process !== "undefined" && process !== null) {
      const proc = process as { env?: { NODE_ENV?: string; DEV?: string } };
      nodeEnv = proc.env?.NODE_ENV === "development" || proc.env?.DEV === "true";
    }

    // Check Vite environment (for runtime packages).
    // IMPORTANT: read the *literal* `import.meta.env.DEV`. Vite replaces
    // that exact token at compile time; it does NOT expose `env` on the
    // native `import.meta` object. Aliasing first (`const meta =
    // import.meta; meta.env.DEV`) defeats the replacement, leaving the
    // read permanently `undefined` — which silently disabled all dev-only
    // logging (logger.info / logger.debug) in the browser.
    let viteEnv = false;
    try {
      // @ts-expect-error `import.meta.env` is injected by Vite at build time and
      // is intentionally untyped here (this package carries no vite/client types,
      // and a global ImportMeta augmentation would clash with consumers' types).
      viteEnv = import.meta.env.DEV === true;
    } catch {
      // import.meta.env not available (e.g., in Node.js build context)
      viteEnv = false;
    }

    this.isDevelopment = nodeEnv || viteEnv;
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
      additionalContext?: LogContext,
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
