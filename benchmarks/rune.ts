import { createNodeServer } from "@rune/adapter-node";
import { createApp } from "./_app";
import {
  httpBenchmark,
  httpBenchmarkPost,
  printResults,
  type BenchmarkResult,
} from "./http";

async function main() {
  const app = createApp();
  const port = 3000;

  const server = createNodeServer(app);
  server.on("error", (err: Error) => {
    console.error("Server error:", err);
    process.exit(1);
  });
  await new Promise<void>((resolve) => server.listen(port, resolve));
  console.error("Rune benchmark running on port", port);

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
