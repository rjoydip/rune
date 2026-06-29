/**
 * Re-exports for the telemetry module.
 * @module @rune/telemetry
 */

/** Telemetry adapter and span type definitions. */
export type { TelemetryAdapter, Span } from "./adapter.js";
/** No-op telemetry implementation. */
export { NoopTelemetry } from "./noop-telemetry.js";
