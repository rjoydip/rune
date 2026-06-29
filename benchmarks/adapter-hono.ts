import { toHono } from "@rune/adapter-hono";
import { serve } from "@hono/node-server";
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
  const port = 3111;

  const hono = toHono(app);
  const server = serve({ fetch: hono.fetch, port });
  server.ref();
  console.log("Hono adapter benchmark running on port", port);

  await waitForServer(port);

  const results: BenchmarkResult[] = [];
  results.push(await httpBenchmark("hono-adapter GET /hello", port, "/hello", 50_000));
  results.push(await httpBenchmark("hono-adapter GET /user/:id", port, "/user/42", 50_000));
  results.push(
    await httpBenchmark("hono-adapter GET /search", port, "/search?limit=10&offset=0", 50_000),
  );
  results.push(
    await httpBenchmarkPost(
      "hono-adapter POST /echo",
      port,
      "/echo",
      JSON.stringify({ text: "benchmark" }),
      25_000,
    ),
  );

  printResults(results, "Hono Adapter");
  server.unref();
  process.exit(0);
}

main();
