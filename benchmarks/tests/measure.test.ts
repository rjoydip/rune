import { describe, expect, it } from "bun:test";
import { measure, printResults, type BenchmarkResult } from "../measure";

describe("measure", () => {
  it("returns benchmark result with correct structure", async () => {
    const result = await measure("test operation", async () => {}, 100);

    expect(result).toHaveProperty("name", "test operation");
    expect(result).toHaveProperty("ops", 100);
    expect(result).toHaveProperty("durationMs");
    expect(result).toHaveProperty("opsPerSec");
    expect(result).toHaveProperty("avgLatencyMs");
    expect(result.durationMs).toBeGreaterThan(0);
    expect(result.opsPerSec).toBeGreaterThan(0);
    expect(result.avgLatencyMs).toBeGreaterThan(0);
  });

  it("calculates ops per second correctly", async () => {
    const result = await measure(
      "fast operation",
      async () => {
        const start = Date.now();
        while (Date.now() - start < 1) {}
      },
      10,
    );

    expect(result.opsPerSec).toBeGreaterThan(0);
    expect(result.avgLatencyMs).toBeGreaterThan(0);
  });

  it("handles async operations", async () => {
    const result = await measure(
      "async operation",
      async () => {
        await new Promise((r) => setTimeout(r, 0));
      },
      20,
      10,
    );

    expect(result.ops).toBe(20);
    expect(result.durationMs).toBeGreaterThan(0);
  });

  it("uses default iterations of 10000", async () => {
    const result = await measure("default iterations", async () => {});
    expect(result.ops).toBe(10000);
  });
});

describe("printResults", () => {
  it("prints benchmark results without throwing", () => {
    const results: BenchmarkResult[] = [
      {
        name: "test 1",
        ops: 10000,
        durationMs: 100,
        opsPerSec: 100000,
        avgLatencyMs: 0.01,
      },
      {
        name: "test 2",
        ops: 5000,
        durationMs: 50,
        opsPerSec: 100000,
        avgLatencyMs: 0.01,
      },
    ];

    expect(() => printResults(results)).not.toThrow();
  });

  it("handles empty results array", () => {
    expect(() => printResults([])).not.toThrow();
  });
});
