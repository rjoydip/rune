import { describe, it, expect } from "bun:test";
import { NoopTelemetry } from "../src/noop-telemetry";

describe("noop-telemetry", () => {
  const telemetry = new NoopTelemetry();

  it("startSpan returns a noop span", () => {
    const span = telemetry.startSpan("test");
    expect(span).toBeDefined();
    expect(() => span.end()).not.toThrow();
    expect(() => span.setAttribute("key", "val")).not.toThrow();
    expect(() => span.addEvent("event")).not.toThrow();
    expect(() => span.setStatus({ code: 1 })).not.toThrow();
  });

  it("recordException does nothing", () => {
    expect(() => telemetry.recordException(new Error("test"))).not.toThrow();
  });

  it("reuses the same noop span instance", () => {
    const s1 = telemetry.startSpan("a");
    const s2 = telemetry.startSpan("b");
    // NoopTelemetry reuses a single noopSpan, so they're the same object
    expect(s1).toBe(s2);
  });

  it("addEvent with attributes", () => {
    const span = telemetry.startSpan("test");
    expect(() => span.addEvent("http.request", { method: "GET", status: 200 })).not.toThrow();
  });

  it("setStatus with message", () => {
    const span = telemetry.startSpan("test");
    expect(() => span.setStatus({ code: 1, message: "Success" })).not.toThrow();
  });

  it("startSpan with attributes (they are ignored)", () => {
    const span = telemetry.startSpan("named", { attr1: "val1", attr2: 42 });
    expect(span).toBeDefined();
    expect(() => span.end()).not.toThrow();
  });

  it("recordException with non-Error object", () => {
    expect(() => telemetry.recordException({ message: "uh oh" } as unknown as Error)).not.toThrow();
  });
});
