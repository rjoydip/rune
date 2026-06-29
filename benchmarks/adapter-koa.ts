import Koa from "koa";
import http from "node:http";
import { toKoaMiddleware } from "@rune/adapter-koa";
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
  const port = 3113;

  const koa = new Koa();
  koa.use(toKoaMiddleware(app));
  const server = http.createServer(koa.callback());
  server.listen(port, () => {
    console.log("Koa adapter benchmark running on port", port);
  });
  server.ref();

  await waitForServer(port);

  const results: BenchmarkResult[] = [];
  results.push(await httpBenchmark("koa-adapter GET /hello", port, "/hello", 50_000));
  results.push(await httpBenchmark("koa-adapter GET /user/:id", port, "/user/42", 50_000));
  results.push(
    await httpBenchmark("koa-adapter GET /search", port, "/search?limit=10&offset=0", 50_000),
  );
  results.push(
    await httpBenchmarkPost(
      "koa-adapter POST /echo",
      port,
      "/echo",
      JSON.stringify({ text: "benchmark" }),
      25_000,
    ),
  );

  printResults(results, "Koa Adapter");
  server.close();
  process.exit(0);
}

main();
