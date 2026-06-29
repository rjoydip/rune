import { createNodeServer } from "@rune/adapter-node";
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
  const port = 3000;

  const server = createNodeServer(app);
  server.listen(port);
  server.ref();
  console.log("Rune benchmark running on port", port);

  await waitForServer(port);

  const results: BenchmarkResult[] = [];
  results.push(await httpBenchmark("rune GET /hello", port, "/hello", 50_000));
  results.push(await httpBenchmark("rune GET /user/:id", port, "/user/42", 50_000));
  results.push(await httpBenchmark("rune GET /search", port, "/search?limit=10&offset=0", 50_000));
  results.push(
    await httpBenchmarkPost(
      "rune POST /echo",
      port,
      "/echo",
      JSON.stringify({ text: "benchmark" }),
      25_000,
    ),
  );

  printResults(results, "Rune");
  server.close();
  process.exit(0);
}

main();
