import { describe, expect, it } from "bun:test";
import { Context } from "@rune/core";
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
import { measure } from "../measure";

function makeCtx(url = "http://localhost/", method = "GET"): Context {
  return new Context(new Request(url, { method }), {}, new Container());
}

const next = async () => {};

describe("middleware perf", () => {
  it("basicAuth (valid) completes within bounds", async () => {
    const result = await measure(
      "basicAuth",
      async () => {
        const req = new Request("http://localhost/", {
          headers: { authorization: "Basic " + btoa("admin:secret") },
        });
        const ctx = new Context(req, {}, new Container());
        const mw = basicAuth({ username: "admin", password: "secret" });
        await mw(ctx, next);
      },
      1000,
    );
    expect(result.avgLatencyMs).toBeLessThan(1);
  });

  it("bearerAuth (valid) completes within bounds", async () => {
    const result = await measure(
      "bearerAuth",
      async () => {
        const req = new Request("http://localhost/", {
          headers: { authorization: "Bearer valid-token" },
        });
        const ctx = new Context(req, {}, new Container());
        const mw = bearerAuth({ token: "valid-token" });
        await mw(ctx, next);
      },
      1000,
    );
    expect(result.avgLatencyMs).toBeLessThan(1);
  });

  it("cors completes within bounds", async () => {
    const result = await measure(
      "cors",
      async () => {
        const ctx = makeCtx();
        ctx.response = new Response("ok");
        const mw = cors();
        await mw(ctx, next);
      },
      1000,
    );
    expect(result.avgLatencyMs).toBeLessThan(1);
  });

  it("requestId completes within bounds", async () => {
    const result = await measure(
      "requestId",
      async () => {
        const ctx = makeCtx();
        ctx.response = new Response("ok");
        const mw = requestId();
        await mw(ctx, next);
      },
      1000,
    );
    expect(result.avgLatencyMs).toBeLessThan(1);
  });

  it("etag completes within bounds", async () => {
    const result = await measure(
      "etag",
      async () => {
        const ctx = makeCtx();
        ctx.response = new Response(JSON.stringify({ data: "test" }), {
          headers: { "content-type": "application/json" },
        });
        const mw = etag();
        await mw(ctx, next);
      },
      1000,
    );
    expect(result.avgLatencyMs).toBeLessThan(5);
  });

  it("poweredBy completes within bounds", async () => {
    const result = await measure(
      "poweredBy",
      async () => {
        const ctx = makeCtx();
        ctx.response = new Response("ok");
        const mw = poweredBy();
        await mw(ctx, next);
      },
      1000,
    );
    expect(result.avgLatencyMs).toBeLessThan(1);
  });

  it("compress (small payload) completes within bounds", async () => {
    const result = await measure(
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
      500,
    );
    expect(result.avgLatencyMs).toBeLessThan(10);
  });

  it("trimTrailingSlash (pass-through) completes within bounds", async () => {
    const result = await measure(
      "trimTrailingSlash",
      async () => {
        const ctx = makeCtx("http://localhost/foo");
        ctx.response = new Response("ok", { status: 200 });
        const mw = trimTrailingSlash();
        await mw(ctx, next);
      },
      1000,
    );
    expect(result.avgLatencyMs).toBeLessThan(1);
  });
});
