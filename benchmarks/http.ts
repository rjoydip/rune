import { performance } from "node:perf_hooks";
import http from "node:http";

const CONCURRENCY = 100;

const agents = new Map<number, http.Agent>();

function getAgent(port: number): http.Agent {
  let agent = agents.get(port);
  if (!agent) {
    agent = new http.Agent({
      keepAlive: true,
      maxSockets: CONCURRENCY,
      maxFreeSockets: CONCURRENCY,
    });
    agents.set(port, agent);
  }
  return agent;
}

function httpGet(port: number, path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = http.get({ hostname: "localhost", port, path, agent: getAgent(port) }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
    });
    req.on("error", reject);
    req.end();
  });
}

function httpPost(port: number, path: string, body: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "localhost",
        port,
        path,
        method: "POST",
        headers: {
          "content-type": "application/json",
          "content-length": Buffer.byteLength(body).toString(),
        },
        agent: getAgent(port),
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      },
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

export async function waitForServer(port: number): Promise<void> {
  const maxAttempts = 30;
  const delay = 200;

  for (let i = 0; i < maxAttempts; i++) {
    /* eslint-disable no-await-in-loop */
    try {
      await httpGet(port, "/hello");
      return;
    } catch {
      // Server not ready yet
    }
    await new Promise((r) => setTimeout(r, delay));
    /* eslint-enable no-await-in-loop */
  }
  throw new Error(`Server on port ${port} not ready after ${maxAttempts} attempts`);
}

export interface BenchmarkResult {
  name: string;
  ops: number;
  durationMs: number;
  opsPerSec: number;
  avgLatencyMs: number;
}

export function printResults(results: BenchmarkResult[], framework?: string) {
  const header = framework ?? "Benchmark";
  console.log(`\n### ${header}\n`);
  console.log("| Route | ops/sec | ms/op |");
  console.log("|---|---|---|");
  for (const r of results) {
    const route = r.name.includes(" ") ? r.name.split(" ").slice(1).join(" ") : r.name;
    console.log(`| ${route} | ${r.opsPerSec.toFixed(0)} | ${r.avgLatencyMs.toFixed(3)} |`);
  }
}

export async function httpBenchmark(name: string, port: number, path: string, iterations = 10_000) {
  const start = performance.now();

  let sent = 0;
  while (sent < iterations) {
    /* eslint-disable-next-line no-await-in-loop */
    const batch: Promise<string>[] = [];
    const remaining = iterations - sent;
    const count = Math.min(CONCURRENCY, remaining);
    for (let i = 0; i < count; i++) {
      batch.push(httpGet(port, path));
    }
    sent += count;
    /* eslint-disable-next-line no-await-in-loop */
    await Promise.all(batch);
  }

  const durationMs = performance.now() - start;
  return {
    name,
    ops: iterations,
    durationMs,
    opsPerSec: (iterations / durationMs) * 1000,
    avgLatencyMs: durationMs / iterations,
  };
}

export async function httpBenchmarkPost(
  name: string,
  port: number,
  path: string,
  body: string,
  iterations = 10_000,
) {
  const start = performance.now();

  let sent = 0;
  while (sent < iterations) {
    /* eslint-disable-next-line no-await-in-loop */
    const batch: Promise<string>[] = [];
    const remaining = iterations - sent;
    const count = Math.min(CONCURRENCY, remaining);
    for (let i = 0; i < count; i++) {
      batch.push(httpPost(port, path, body));
    }
    sent += count;
    /* eslint-disable-next-line no-await-in-loop */
    await Promise.all(batch);
  }

  const durationMs = performance.now() - start;
  return {
    name,
    ops: iterations,
    durationMs,
    opsPerSec: (iterations / durationMs) * 1000,
    avgLatencyMs: durationMs / iterations,
  };
}
