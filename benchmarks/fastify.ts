import Fastify from "fastify";
import {
  httpBenchmark,
  httpBenchmarkPost,
  printResults,
  waitForServer,
  type BenchmarkResult,
} from "./http";

async function main() {
  const fastify = Fastify({ logger: false });

  fastify.get("/hello", async () => ({ message: "hello" }));

  fastify.get("/user/:id", async (request) => {
    const { id } = request.params as { id: string };
    return { id };
  });

  fastify.get("/search", async (request) => {
    const { limit, offset } = request.query as { limit?: string; offset?: string };
    return { limit, offset };
  });

  fastify.post("/echo", async (request) => {
    const { text } = request.body as { text: string };
    return { echoed: text };
  });

  await fastify.listen({ port: 3003, host: "0.0.0.0" });
  console.log("Fastify benchmark running on port 3003");
  await waitForServer(3003);

  const results: BenchmarkResult[] = [];
  results.push(await httpBenchmark("fastify GET /hello", 3003, "/hello", 50_000));
  results.push(await httpBenchmark("fastify GET /user/:id", 3003, "/user/42", 50_000));
  results.push(
    await httpBenchmark("fastify GET /search", 3003, "/search?limit=10&offset=0", 50_000),
  );
  results.push(
    await httpBenchmarkPost(
      "fastify POST /echo",
      3003,
      "/echo",
      JSON.stringify({ text: "benchmark" }),
      25_000,
    ),
  );

  printResults(results, "Fastify");
  await fastify.close();
  process.exit(0);
}

main();
