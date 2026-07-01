import type { Span, TelemetryAdapter } from "./adapter.js";

/**
 * No-op span implementation. All methods are empty and do nothing.
 * Used as a default / fallback span when no real tracer is configured.
 */
class NoopSpan implements Span {
  /** Does nothing. */
  end(): void {}
  /** Does nothing. */
  setAttribute(_key: string, _value: unknown): void {}
  /** Does nothing. */
  addEvent(_name: string, _attributes?: Record<string, unknown>): void {}
  /** Does nothing. */
  setStatus(_status: { code: number; message?: string }): void {}
}

/**
 * No-op telemetry adapter implementation.
 * All methods are empty and do nothing. Useful as a default when no real
 * telemetry backend has been configured.
 *
 * @example
 * ```ts
 * const telemetry = new NoopTelemetry();
 * const span = telemetry.startSpan("work");
 * span.end();
 * ```
 */
export class NoopTelemetry implements TelemetryAdapter {
  private readonly noopSpan = new NoopSpan();

  /**
   * Return a no-op span instance.
   * @param _name - Ignored.
   * @param _attributes - Ignored.
   * @returns A no-op span.
   *
   * @example
   * ```ts
   * const span = telemetry.startSpan("any-operation");
   * span.end();
   * ```
   */
  startSpan(_name: string, _attributes?: Record<string, unknown>): Span {
    return this.noopSpan;
  }

  /** Does nothing. */
  recordException(_error: Error): void {}
}
