import Koa from "koa";
import http from "node:http";
import {
  httpBenchmark,
  httpBenchmarkPost,
  printResults,
  waitForServer,
  type BenchmarkResult,
} from "./http";

function parseQuery(url: string) {
  const [_, qs] = url.split("?");
  if (!qs) return {};
  const params: Record<string, string> = {};
  for (const pair of qs.split("&")) {
    const [k, v] = pair.split("=");
    params[decodeURIComponent(k)] = decodeURIComponent(v ?? "");
  }
  return params;
}

async function main() {
  const app = new Koa();

  app.use(async (ctx, next) => {
    const url = ctx.url ?? "/";
    const [path] = url.split("?");

    if (path === "/hello" && ctx.method === "GET") {
      ctx.body = { message: "hello" };
    } else if (path.startsWith("/user/") && ctx.method === "GET") {
      const id = path.split("/")[2];
      ctx.body = { id };
    } else if (path === "/search" && ctx.method === "GET") {
      const params = parseQuery(url);
      ctx.body = params;
    } else if (path === "/echo" && ctx.method === "POST") {
      const body = await new Promise<{ text?: string }>((resolve) => {
        let data = "";
        ctx.req.on("data", (chunk) => (data += chunk));
        ctx.req.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve({});
          }
        });
      });
      ctx.body = { echoed: body.text };
    } else {
      ctx.status = 404;
      ctx.body = { error: "Not found" };
    }
    await next();
  });

  const port = 3005;
  const server = http.createServer(app.callback());

  server.listen(port, () => {
    console.log("Koa benchmark running on port", port);
  });

  server.ref();
  await waitForServer(port);

  const results: BenchmarkResult[] = [];
  results.push(await httpBenchmark("koa GET /hello", port, "/hello", 50_000));
  results.push(await httpBenchmark("koa GET /user/:id", port, "/user/42", 50_000));
  results.push(await httpBenchmark("koa GET /search", port, "/search?limit=10&offset=0", 50_000));
  results.push(
    await httpBenchmarkPost(
      "koa POST /echo",
      port,
      "/echo",
      JSON.stringify({ text: "benchmark" }),
      25_000,
    ),
  );

  printResults(results, "Koa");
  server.close();
  process.exit(0);
}

main();
