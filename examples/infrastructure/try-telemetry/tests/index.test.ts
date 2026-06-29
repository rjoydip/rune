import { describe, it, expect } from "bun:test";
import { NoopTelemetry } from "@rune/telemetry";

describe("try-telemetry", () => {
  it("starts and ends spans without error", () => {
    const telemetry = new NoopTelemetry();
    expect(() => {
      const span = telemetry.startSpan("test");
      span.end();
    }).not.toThrow();
  });

  it("records exception without error", () => {
    const telemetry = new NoopTelemetry();
    expect(() => telemetry.recordException(new Error("test"))).not.toThrow();
  });

  it("adds events to span", () => {
    const telemetry = new NoopTelemetry();
    const span = telemetry.startSpan("test");
    expect(() => span.addEvent("event", { key: "val" })).not.toThrow();
  });
});
