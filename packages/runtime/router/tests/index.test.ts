import { describe, it, expect } from "bun:test";
import { Router } from "../src/index";

import { Router as DistRouter } from "@rune/router";

describe("router exports", () => {
  it("exports Router class", () => {
    expect(Router).toBeDefined();
    expect(new Router()).toBeInstanceOf(Router);
  });

  it("addRoute registers a route through the dist path", () => {
    const router = new DistRouter();
    const handler = () => new Response("ok");
    router.addRoute({ method: "GET", path: "/dist-test", handler });
    const result = router.match("GET", "/dist-test");
    expect(result).not.toBeNull();
    expect(result!.handler).toBe(handler);
  });

  it("addRoutes registers multiple routes", () => {
    const router = new DistRouter();
    const handler1 = () => new Response("a");
    const handler2 = () => new Response("b");
    router.addRoutes([
      { method: "GET", path: "/a", handler: handler1 },
      { method: "POST", path: "/b", handler: handler2 },
    ]);
    const result1 = router.match("GET", "/a");
    expect(result1).not.toBeNull();
    const result2 = router.match("POST", "/b");
    expect(result2).not.toBeNull();
  });

  it("addRoute handles OPTIONS method", () => {
    const router = new DistRouter();
    const handler = () => new Response("found");
    router.addRoute({ method: "OPTIONS", path: "/options", handler });
    const result = router.match("OPTIONS", "/options");
    expect(result).not.toBeNull();
  });

  it("addRoute throws for unsupported method", () => {
    const router = new DistRouter();
    const handler = () => new Response("nope");
    expect(() => router.addRoute({ method: "INVALID" as any, path: "/x", handler })).toThrow();
  });
});
