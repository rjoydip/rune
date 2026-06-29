/**
 * Logger adapter interface.
 * Provides a generic contract for structured logging at various severity levels.
 */
export interface LoggerAdapter {
  /**
   * Log an informational message.
   * @param args - The values to log.
   *
   * @example
   * ```ts
   * logger.info("Server started on port", 3000);
   * ```
   */
  info(...args: unknown[]): void;

  /**
   * Log a warning message.
   * @param args - The values to log.
   *
   * @example
   * ```ts
   * logger.warn("Disk space low:", freeSpace);
   * ```
   */
  warn(...args: unknown[]): void;

  /**
   * Log an error message.
   * @param args - The values to log.
   *
   * @example
   * ```ts
   * logger.error("Request failed:", err);
   * ```
   */
  error(...args: unknown[]): void;

  /**
   * Log a debug message.
   * @param args - The values to log.
   *
   * @example
   * ```ts
   * logger.debug("Query result:", result);
   * ```
   */
  debug(...args: unknown[]): void;
}
