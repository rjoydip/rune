/**
 * Re-exports for the logger module.
 * @module @rune/logger
 */

/** Logger adapter type definition. */
export type { LoggerAdapter } from "./adapter.js";
/** Console-based logger implementation. */
export { ConsoleLogger } from "./console-logger.js";
