import { Hono } from "hono";
import { serve } from "@hono/node-server";
import {
  httpBenchmark,
  httpBenchmarkPost,
  printResults,
  waitForServer,
  type BenchmarkResult,
} from "./http";

async function main() {
  const app = new Hono();

  app.get("/hello", (c) => c.json({ message: "hello" }));

  app.get("/user/:id", (c) => {
    const id = c.req.param("id");
    return c.json({ id });
  });

  app.get("/search", (c) => {
    const limit = c.req.query("limit");
    const offset = c.req.query("offset");
    return c.json({ limit, offset });
  });

  app.post("/echo", async (c) => {
    const body = await c.req.json();
    return c.json({ echoed: body.text });
  });

  const port = 3001;
  const server = serve({ fetch: app.fetch, port });
  server.ref();
  console.error("Hono benchmark running on port", port);

  await waitForServer(port);

  const results: BenchmarkResult[] = [];
  results.push(await httpBenchmark("hono GET /hello", port, "/hello", 50_000));
  results.push(await httpBenchmark("hono GET /user/:id", port, "/user/42", 50_000));
  results.push(await httpBenchmark("hono GET /search", port, "/search?limit=10&offset=0", 50_000));
  results.push(
    await httpBenchmarkPost(
      "hono POST /echo",
      port,
      "/echo",
      JSON.stringify({ text: "benchmark" }),
      25_000,
    ),
  );

  printResults(results, "Hono");
  server.unref();
  process.exit(0);
}

main();
