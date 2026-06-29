import { toElysia } from "@rune/adapter-elysia";
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
  const port = 3110;

  const elysia = toElysia(app);
  elysia.listen(port);
  console.log("Elysia adapter benchmark running on port", port);

  await waitForServer(port);

  const results: BenchmarkResult[] = [];
  results.push(await httpBenchmark("elysia-adapter GET /hello", port, "/hello", 50_000));
  results.push(await httpBenchmark("elysia-adapter GET /user/:id", port, "/user/42", 50_000));
  results.push(
    await httpBenchmark("elysia-adapter GET /search", port, "/search?limit=10&offset=0", 50_000),
  );
  results.push(
    await httpBenchmarkPost(
      "elysia-adapter POST /echo",
      port,
      "/echo",
      JSON.stringify({ text: "benchmark" }),
      25_000,
    ),
  );

  printResults(results, "Elysia Adapter");
  process.exit(0);
}

main();
