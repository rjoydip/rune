import { Context, type NextFunction } from "@rune/core";
import { Container } from "@rune/container";
import {
  basicAuth,
  bearerAuth,
  cors,
  requestId,
  etag,
  compress,
  poweredBy,
  trimTrailingSlash,
} from "@rune/middleware";
import { measure, printResults } from "./measure";

function makeCtx(url = "http://localhost/", method = "GET"): Context {
  return new Context(new Request(url, { method }), {}, new Container());
}

const next: NextFunction = async () => {};

const pendingResults: Promise<void>[] = [];

async function main() {
  const results = [];

  results.push(
    await measure(
      "basicAuth (valid)",
      async () => {
        const req = new Request("http://localhost/", {
          headers: { authorization: "Basic " + btoa("admin:secret") },
        });
        const ctx = new Context(req, {}, new Container());
        const mw = basicAuth({ username: "admin", password: "secret" });
        await mw(ctx, next);
      },
      10000,
    ),
  );

  results.push(
    await measure(
      "bearerAuth (valid)",
      async () => {
        const req = new Request("http://localhost/", {
          headers: { authorization: "Bearer valid-token" },
        });
        const ctx = new Context(req, {}, new Container());
        const mw = bearerAuth({ token: "valid-token" });
        await mw(ctx, next);
      },
      10000,
    ),
  );

  results.push(
    await measure(
      "cors",
      async () => {
        const ctx = makeCtx();
        ctx.response = new Response("ok");
        const mw = cors();
        await mw(ctx, next);
      },
      10000,
    ),
  );

  results.push(
    await measure(
      "requestId",
      async () => {
        const ctx = makeCtx();
        ctx.response = new Response("ok");
        const mw = requestId();
        await mw(ctx, next);
      },
      10000,
    ),
  );

  results.push(
    await measure(
      "etag",
      async () => {
        const ctx = makeCtx();
        ctx.response = new Response(JSON.stringify({ data: "test" }), {
          headers: { "content-type": "application/json" },
        });
        const mw = etag();
        await mw(ctx, next);
      },
      10000,
    ),
  );

  results.push(
    await measure(
      "compress",
      async () => {
        const req = new Request("http://localhost/", {
          headers: { "accept-encoding": "gzip" },
        });
        const ctx = new Context(req, {}, new Container());
        ctx.response = new Response(JSON.stringify({ data: "x".repeat(2000) }), {
          headers: { "content-type": "application/json" },
        });
        const mw = compress({ threshold: 0 });
        await mw(ctx, next);
      },
      5000,
    ),
  );

  results.push(
    await measure(
      "poweredBy",
      async () => {
        const ctx = makeCtx();
        ctx.response = new Response("ok");
        const mw = poweredBy();
        await mw(ctx, next);
      },
      10000,
    ),
  );

  results.push(
    await measure(
      "trimTrailingSlash (pass-through)",
      async () => {
        const ctx = makeCtx("http://localhost/foo");
        ctx.response = new Response("ok", { status: 200 });
        const mw = trimTrailingSlash();
        await mw(ctx, next);
      },
      10000,
    ),
  );

  await Promise.all(pendingResults);
  printResults(results);
}

main();
