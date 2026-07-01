import * as http from "node:http";
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

function createServer() {
  return http.createServer((req, res) => {
    const url = req.url ?? "/";
    const [path] = url.split("?");

    if (path === "/hello" && req.method === "GET") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ message: "hello" }));
    } else if (path.startsWith("/user/") && req.method === "GET") {
      const id = path.split("/")[2];
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ id }));
    } else if (path === "/search" && req.method === "GET") {
      const params = parseQuery(url);
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(params));
    } else if (path === "/echo" && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        try {
          const { text } = JSON.parse(body);
          res.writeHead(200, { "content-type": "application/json" });
          res.end(JSON.stringify({ echoed: text }));
        } catch {
          res.writeHead(400, { "content-type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid JSON" }));
        }
      });
    } else {
      res.writeHead(404, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));
    }
  });
}

async function main() {
  const port = 3004;
  const server = createServer();

  server.listen(port, () => {
    console.error("Node.js HTTP benchmark running on port", port);
  });

  server.ref();
  await waitForServer(port);

  const results: BenchmarkResult[] = [];
  results.push(await httpBenchmark("node GET /hello", port, "/hello", 50_000));
  results.push(await httpBenchmark("node GET /user/:id", port, "/user/42", 50_000));
  results.push(await httpBenchmark("node GET /search", port, "/search?limit=10&offset=0", 50_000));
  results.push(
    await httpBenchmarkPost(
      "node POST /echo",
      port,
      "/echo",
      JSON.stringify({ text: "benchmark" }),
      25_000,
    ),
  );

  printResults(results, "Node.js HTTP");
  server.close();
  process.exit(0);
}

main();
