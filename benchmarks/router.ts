import { Router } from "@rune/router";
import { measure, printResults } from "./measure";

function createRouter() {
  const router = new Router();
  router.add("GET", "/hello", () => new Response(JSON.stringify({ message: "hello" })));
  router.add("GET", "/user/:id", (_req, params) => new Response(JSON.stringify({ id: params.id })));
  router.add("GET", "/search", () => new Response(JSON.stringify({ ok: true })));
  router.add("POST", "/echo", () => new Response(JSON.stringify({ echoed: true })));
  return router;
}

async function main() {
  const router = createRouter();

  const results = [];

  results.push(
    await measure(
      "router GET /hello match",
      async () => {
        const m = router.match("GET", "/hello");
        if (m) await m.handler(new Request("http://localhost/hello"), {}, new Map());
      },
      50_000,
    ),
  );

  results.push(
    await measure(
      "router GET /user/:id match",
      async () => {
        const m = router.match("GET", "/user/42");
        if (m) await m.handler(new Request("http://localhost/user/42"), { id: "42" }, new Map());
      },
      50_000,
    ),
  );

  results.push(
    await measure(
      "router GET /search match",
      async () => {
        const m = router.match("GET", "/search?limit=10");
        if (m) await m.handler(new Request("http://localhost/search?limit=10"), {}, new Map());
      },
      50_000,
    ),
  );

  printResults(results);
  process.exit(0);
}

main();
