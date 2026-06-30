import express from "express";
import { toExpress } from "@rune/adapter-express";
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
  const port = 3112;

  const expressApp = toExpress(app, express());
  const server = expressApp.listen(port, () => {
    console.error("Express adapter benchmark running on port", port);
  });

  await waitForServer(port);

  const results: BenchmarkResult[] = [];
  results.push(await httpBenchmark("express-adapter GET /hello", port, "/hello", 50_000));
  results.push(await httpBenchmark("express-adapter GET /user/:id", port, "/user/42", 50_000));
  results.push(
    await httpBenchmark("express-adapter GET /search", port, "/search?limit=10&offset=0", 50_000),
  );
  results.push(
    await httpBenchmarkPost(
      "express-adapter POST /echo",
      port,
      "/echo",
      JSON.stringify({ text: "benchmark" }),
      25_000,
    ),
  );

  printResults(results, "Express Adapter");
  server.close();
  process.exit(0);
}

main();
