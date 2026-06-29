import { describe, it, expect } from "bun:test";
import { NoopTelemetry } from "../src/index";
import type { TelemetryAdapter, Span } from "../src/index";

describe("telemetry exports", () => {
  it("exports NoopTelemetry", () => {
    expect(NoopTelemetry).toBeDefined();
  });

  it("exports TelemetryAdapter type", () => {
    const t: TelemetryAdapter = new NoopTelemetry();
    expect(t).toBeDefined();
  });

  it("exports Span type", () => {
    const s: Span = new NoopTelemetry().startSpan("test");
    expect(s).toBeDefined();
  });
});
