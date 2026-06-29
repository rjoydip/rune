import { Elysia } from "elysia";
import {
  httpBenchmark,
  httpBenchmarkPost,
  printResults,
  waitForServer,
  type BenchmarkResult,
} from "./http";

async function main() {
  const app = new Elysia()
    .get("/hello", () => ({ message: "hello" }))
    .get("/user/:id", ({ params: { id } }) => ({ id }))
    .get("/search", ({ query: { limit, offset } }) => ({ limit, offset }))
    .post("/echo", async ({ body }: { body: unknown }) => ({
      echoed: (body as { text: string }).text,
    }))
    .listen(3002);

  console.log("Elysia benchmark running on port 3002");
  app.server?.ref();
  await waitForServer(3002);

  const results: BenchmarkResult[] = [];
  results.push(await httpBenchmark("elysia GET /hello", 3002, "/hello", 50_000));
  results.push(await httpBenchmark("elysia GET /user/:id", 3002, "/user/42", 50_000));
  results.push(
    await httpBenchmark("elysia GET /search", 3002, "/search?limit=10&offset=0", 50_000),
  );
  results.push(
    await httpBenchmarkPost(
      "elysia POST /echo",
      3002,
      "/echo",
      JSON.stringify({ text: "benchmark" }),
      25_000,
    ),
  );

  printResults(results, "Elysia");
  app.stop();
  process.exit(0);
}

main();
