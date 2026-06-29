import { performance } from "node:perf_hooks";

export interface BenchmarkResult {
  name: string;
  ops: number;
  durationMs: number;
  opsPerSec: number;
  avgLatencyMs: number;
}

export async function measure<T>(
  name: string,
  fn: () => Promise<T>,
  iterations = 10_000,
  warmup = 1000,
): Promise<BenchmarkResult> {
  if (typeof globalThis.gc === "function") {
    globalThis.gc();
  }

  /* eslint-disable no-await-in-loop */
  for (let i = 0; i < warmup; i++) {
    await fn();
  }

  let durationMs = 0;
  let count = 0;

  if (iterations <= 100) {
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      await fn();
    }
    durationMs = performance.now() - start;
    count = iterations;
  } else {
    const batchSize = 100;
    const batches = Math.floor(iterations / batchSize);
    const start = performance.now();
    for (let b = 0; b < batches; b++) {
      for (let i = 0; i < batchSize; i++) {
        await fn();
      }
    }
    const remaining = iterations - batches * batchSize;
    for (let i = 0; i < remaining; i++) {
      await fn();
    }
    durationMs = performance.now() - start;
    count = batches * batchSize + remaining;
  }
  /* eslint-enable no-await-in-loop */

  return {
    name,
    ops: count,
    durationMs,
    opsPerSec: (count / durationMs) * 1000,
    avgLatencyMs: durationMs / count,
  };
}

export function printResults(results: BenchmarkResult[]) {
  console.log("\n=== Benchmark Results ===\n");
  for (const r of results) {
    console.log(
      `${r.name.padEnd(40)} ${r.opsPerSec.toFixed(0).padStart(10)} ops/sec  ${r.avgLatencyMs.toFixed(3)} ms/op`,
    );
  }
}
