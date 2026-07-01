import Fastify from "fastify";
import { toFastify } from "@rune/adapter-fastify";
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
  const port = 3114;

  const fastify = toFastify(app, Fastify({ logger: false }));
  await fastify.listen({ port, host: "0.0.0.0" });
  console.error("Fastify adapter benchmark running on port", port);

  await waitForServer(port);

  const results: BenchmarkResult[] = [];
  results.push(await httpBenchmark("fastify-adapter GET /hello", port, "/hello", 50_000));
  results.push(await httpBenchmark("fastify-adapter GET /user/:id", port, "/user/42", 50_000));
  results.push(
    await httpBenchmark("fastify-adapter GET /search", port, "/search?limit=10&offset=0", 50_000),
  );
  results.push(
    await httpBenchmarkPost(
      "fastify-adapter POST /echo",
      port,
      "/echo",
      JSON.stringify({ text: "benchmark" }),
      25_000,
    ),
  );

  printResults(results, "Fastify Adapter");
  await fastify.close();
  process.exit(0);
}

main();
