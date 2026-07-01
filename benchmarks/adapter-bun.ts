import { serveBun } from "@rune/adapter-bun";
import { createApp } from "./_app";
import {
  httpBenchmark,
  httpBenchmarkPost,
  printResults,
  waitForServer,
  type BenchmarkResult,
} from "./http";

async function main() {
  const app = createApp();
  const port = 3100;

  serveBun(app, port);
  console.error("Bun adapter benchmark running on port", port);

  await waitForServer(port);

  const results: BenchmarkResult[] = [];
  results.push(await httpBenchmark("bun GET /hello", port, "/hello", 50_000));
  results.push(await httpBenchmark("bun GET /user/:id", port, "/user/42", 50_000));
  results.push(await httpBenchmark("bun GET /search", port, "/search?limit=10&offset=0", 50_000));
  results.push(
    await httpBenchmarkPost(
      "bun POST /echo",
      port,
      "/echo",
      JSON.stringify({ text: "benchmark" }),
      25_000,
    ),
  );

  printResults(results, "Bun Adapter");
  process.exit(0);
}

main();
