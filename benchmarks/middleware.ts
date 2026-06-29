import { createNodeServer } from "@rune/adapter-node";
import { createApp } from "@rune/core";
import {
  requestId,
  logger,
  cors,
  secureHeaders,
  poweredBy,
  compress,
  trimTrailingSlash,
} from "@rune/middleware";
import {
  httpBenchmark,
  httpBenchmarkPost,
  printResults,
  waitForServer,
  type BenchmarkResult,
} from "./http.ts";

async function main() {
  const app = createApp();

  // Register all built-in middlewares
  app.use(trimTrailingSlash());
  app.use(requestId());
  app.use(cors());
  app.use(secureHeaders());
  app.use(poweredBy());
  app.use(compress({ threshold: 0 }));
  app.use(
    logger({
      logFunc: () => {}, // silent
    }),
  );

  app.router.add("GET", "/hello", () => {
    return new Response(JSON.stringify({ message: "hello" }), {
      headers: { "content-type": "application/json" },
    });
  });

  app.router.add("GET", "/user/:id", (_req: Request, params: Record<string, string>) => {
    return new Response(JSON.stringify({ id: params.id }), {
      headers: { "content-type": "application/json" },
    });
  });

  app.router.add("GET", "/search", (req: Request) => {
    const url = new URL(req.url);
    return new Response(
      JSON.stringify({
        limit: url.searchParams.get("limit"),
        offset: url.searchParams.get("offset"),
      }),
      { headers: { "content-type": "application/json" } },
    );
  });

  app.router.add("POST", "/echo", async (req: Request) => {
    const body = await req.json();
    return new Response(JSON.stringify({ echoed: body.text }), {
      headers: { "content-type": "application/json" },
    });
  });

  const port = 3010;
  const server = createNodeServer(app);
  server.listen(port);
  server.ref();
  console.log("Middleware benchmark running on port", port);

  await waitForServer(port);

  const results: BenchmarkResult[] = [];
  results.push(await httpBenchmark("middleware GET /hello", port, "/hello", 50000));
  results.push(await httpBenchmark("middleware GET /user/:id", port, "/user/42", 50000));
  results.push(
    await httpBenchmark("middleware GET /search", port, "/search?limit=10&offset=0", 50000),
  );
  results.push(
    await httpBenchmarkPost(
      "middleware POST /echo",
      port,
      "/echo",
      JSON.stringify({ text: "benchmark" }),
      25000,
    ),
  );

  printResults(results, "Rune Middleware");
  server.close();
  process.exit(0);
}

main();
