/**
 * Represents a single tracing span within a distributed trace.
 * Spans track units of work and can carry attributes, events, and status.
 */
export interface Span {
  /**
   * Mark the span as finished.
   *
   * @example
   * ```ts
   * span.end();
   * ```
   */
  end(): void;
  /**
   * Set a key-value attribute on the span.
   * @param key - The attribute name.
   * @param value - The attribute value.
   *
   * @example
   * ```ts
   * span.setAttribute("http.method", "GET");
   * ```
   */
  setAttribute(key: string, value: unknown): void;
  /**
   * Record a named event with optional attributes on the span.
   * @param name - The event name.
   * @param attributes - Optional attributes associated with the event.
   *
   * @example
   * ```ts
   * span.addEvent("cache.miss", { key: "user:42" });
   * ```
   */
  addEvent(name: string, attributes?: Record<string, unknown>): void;
  /**
   * Set the status of the span (e.g. OK or ERROR).
   * @param status - An object with a numeric code and optional message.
   *
   * @example
   * ```ts
   * span.setStatus({ code: 1, message: "Success" });
   * ```
   */
  setStatus(status: { code: number; message?: string }): void;
}

/**
 * Telemetry adapter interface.
 * Provides a generic contract for tracing and error recording.
 */
export interface TelemetryAdapter {
  /**
   * Start a new span with the given name and optional attributes.
   * @param name - The span name.
   * @param attributes - Optional initial attributes for the span.
   * @returns The created span instance.
   *
   * @example
   * ```ts
   * const span = tracer.startSpan("http.request", { "http.method": "POST" });
   * span.end();
   * ```
   */
  startSpan(name: string, attributes?: Record<string, unknown>): Span;

  /**
   * Record an exception as a telemetry event.
   * @param error - The error to record.
   *
   * @example
   * ```ts
   * tracer.recordException(new Error("Database timeout"));
   * ```
   */
  recordException(error: Error): void;
}
