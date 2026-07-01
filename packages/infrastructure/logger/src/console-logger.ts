import type { LoggerAdapter } from "./adapter.js";

/**
 * Logger implementation that writes to the console.
 * Prefixes each message with a configurable label and severity level.
 *
 * @example
 * ```ts
 * const logger = new ConsoleLogger("[MyApp]");
 * logger.info("App initialized");
 * ```
 */
export class ConsoleLogger implements LoggerAdapter {
  /**
   * @param prefix - The label prepended to all log output (default: "[Rune]").
   */
  constructor(private readonly prefix = "[Rune]") {}

  /**
   * Log an informational message to console.log.
   * @param args - The values to log.
   *
   * @example
   * ```ts
   * logger.info("Server listening on port", 8080);
   * ```
   */
  info(...args: unknown[]): void {
    console.log(this.prefix, "[INFO]", ...args);
  }

  /**
   * Log a warning message to console.warn.
   * @param args - The values to log.
   *
   * @example
   * ```ts
   * logger.warn("Rate limit approaching", req.ip);
   * ```
   */
  warn(...args: unknown[]): void {
    console.warn(this.prefix, "[WARN]", ...args);
  }

  /**
   * Log an error message to console.error.
   * @param args - The values to log.
   *
   * @example
   * ```ts
   * logger.error("Unhandled exception", error);
   * ```
   */
  error(...args: unknown[]): void {
    console.error(this.prefix, "[ERROR]", ...args);
  }

  /**
   * Log a debug message to console.debug.
   * @param args - The values to log.
   *
   * @example
   * ```ts
   * logger.debug("Request payload:", body);
   * ```
   */
  debug(...args: unknown[]): void {
    console.debug(this.prefix, "[DEBUG]", ...args);
  }
}
