import { toH3 } from "@rune/adapter-h3";
import { toNodeHandler } from "h3/node";
import { createServer } from "node:http";
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
  const port = 3115;

  const h3App = toH3(app);
  const server = createServer(toNodeHandler(h3App));
  server.listen(port, () => {
    console.error("h3 adapter benchmark running on port", port);
  });
  server.ref();

  await waitForServer(port);

  const results: BenchmarkResult[] = [];
  results.push(await httpBenchmark("h3-adapter GET /hello", port, "/hello", 50_000));
  results.push(await httpBenchmark("h3-adapter GET /user/:id", port, "/user/42", 50_000));
  results.push(
    await httpBenchmark("h3-adapter GET /search", port, "/search?limit=10&offset=0", 50_000),
  );
  results.push(
    await httpBenchmarkPost(
      "h3-adapter POST /echo",
      port,
      "/echo",
      JSON.stringify({ text: "benchmark" }),
      25_000,
    ),
  );

  printResults(results, "h3 Adapter");
  server.close();
  process.exit(0);
}

main();
