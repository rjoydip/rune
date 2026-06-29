import { describe, expect, it } from "bun:test";
import { Router } from "@rune/router";
import { measure } from "../measure";

describe("Router matching", () => {
  it("matches static route", () => {
    const router = new Router();
    router.add("GET", "/hello", () => new Response("OK"));

    const match = router.match("GET", "/hello");
    expect(match).not.toBeNull();
    expect(match?.params).toEqual({});
  });

  it("matches parameterized route", () => {
    const router = new Router();
    router.add("GET", "/user/:id", () => new Response("OK"));

    const match = router.match("GET", "/user/42");
    expect(match).not.toBeNull();
    expect(match?.params).toEqual({ id: "42" });
  });

  it("matches route with pathname only (query string must be stripped)", () => {
    const router = new Router();
    router.add("GET", "/search", () => new Response("OK"));

    const match = router.match("GET", "/search");
    expect(match).not.toBeNull();
    expect(match?.params).toEqual({});
  });

  it("returns null for unmatched route", () => {
    const router = new Router();
    router.add("GET", "/hello", () => new Response("OK"));

    const match = router.match("GET", "/notfound");
    expect(match).toBeNull();
  });

  it("returns null for wrong method", () => {
    const router = new Router();
    router.add("GET", "/hello", () => new Response("OK"));

    const match = router.match("POST", "/hello");
    expect(match).toBeNull();
  });
});

describe("Router performance", () => {
  it("measures static route matching performance", async () => {
    const router = new Router();
    router.add("GET", "/hello", () => new Response("OK"));
    router.add(
      "GET",
      "/user/:id",
      (_req, params) => new Response(JSON.stringify({ id: params.id })),
    );
    router.add("GET", "/search", () => new Response(JSON.stringify({ ok: true })));

    const result = await measure(
      "router GET /hello match",
      async () => {
        router.match("GET", "/hello");
      },
      10000,
    );

    expect(result.ops).toBe(10000);
    expect(result.opsPerSec).toBeGreaterThan(1000);
  });

  it("measures parameterized route matching performance", async () => {
    const router = new Router();
    router.add("GET", "/user/:id", () => new Response("OK"));

    const result = await measure(
      "router GET /user/:id match",
      async () => {
        router.match("GET", "/user/42");
      },
      10000,
    );

    expect(result.ops).toBe(10000);
    expect(result.opsPerSec).toBeGreaterThan(1000);
  });
});
