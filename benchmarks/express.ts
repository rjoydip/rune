import express, { Request, Response } from "express";
import {
  httpBenchmark,
  httpBenchmarkPost,
  printResults,
  waitForServer,
  type BenchmarkResult,
} from "./http";

async function main() {
  const app = express();
  app.use(express.json());

  app.get("/hello", (_req: Request, res: Response) => {
    res.json({ message: "hello" });
  });

  app.get("/user/:id", (req: Request, res: Response) => {
    res.json({ id: req.params.id });
  });

  app.get("/search", (req: Request, res: Response) => {
    res.json(req.query);
  });

  app.post("/echo", (req: Request, res: Response) => {
    res.json({ echoed: (req.body as { text?: string }).text });
  });

  const port = 3006;
  const server = app.listen(port, () => {
    console.error("Express benchmark running on port", port);
  });

  server.ref();
  await waitForServer(port);

  const results: BenchmarkResult[] = [];
  results.push(await httpBenchmark("express GET /hello", port, "/hello", 50_000));
  results.push(await httpBenchmark("express GET /user/:id", port, "/user/42", 50_000));
  results.push(
    await httpBenchmark("express GET /search", port, "/search?limit=10&offset=0", 50_000),
  );
  results.push(
    await httpBenchmarkPost(
      "express POST /echo",
      port,
      "/echo",
      JSON.stringify({ text: "benchmark" }),
      25_000,
    ),
  );

  printResults(results, "Express");
  server.close();
  process.exit(0);
}

main();
