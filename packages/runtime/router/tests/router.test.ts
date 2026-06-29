import { describe, it, expect } from "bun:test";
import { Router } from "../src/router";

describe("Router", () => {
  it("matches GET route", () => {
    const r = new Router();
    r.add("GET", "/users", () => new Response("ok"));
    const match = r.match("GET", "/users");
    expect(match).not.toBeNull();
    expect(match!.params).toEqual({});
  });

  it("matches POST route", () => {
    const r = new Router();
    r.add("POST", "/users", () => new Response("ok"));
    const match = r.match("POST", "/users");
    expect(match).not.toBeNull();
  });

  it("matches PUT route", () => {
    const r = new Router();
    r.add("PUT", "/users/:id", () => new Response("ok"));
    const match = r.match("PUT", "/users/42");
    expect(match).not.toBeNull();
  });

  it("matches DELETE route", () => {
    const r = new Router();
    r.add("DELETE", "/users/:id", () => new Response("ok"));
    const match = r.match("DELETE", "/users/1");
    expect(match).not.toBeNull();
  });

  it("matches PATCH route", () => {
    const r = new Router();
    r.add("PATCH", "/users/:id", () => new Response("ok"));
    const match = r.match("PATCH", "/users/1");
    expect(match).not.toBeNull();
  });

  it("matches HEAD route", () => {
    const r = new Router();
    r.add("HEAD", "/health", () => new Response("ok"));
    const match = r.match("HEAD", "/health");
    expect(match).not.toBeNull();
  });

  it("matches OPTIONS route", () => {
    const r = new Router();
    r.add("OPTIONS", "/", () => new Response("ok"));
    const match = r.match("OPTIONS", "/");
    expect(match).not.toBeNull();
  });

  it("returns null for unmatched route", () => {
    const r = new Router();
    r.add("GET", "/users", () => new Response("ok"));
    expect(r.match("GET", "/notfound")).toBeNull();
  });

  it("returns null for unsupported HTTP method", () => {
    const r = new Router();
    expect(r.match("TRACE", "/users")).toBeNull();
  });

  it("extracts URL parameters", () => {
    const r = new Router();
    r.add("GET", "/users/:id/posts/:postId", () => new Response("ok"));
    const match = r.match("GET", "/users/42/posts/99");
    expect(match!.params).toEqual({ id: "42", postId: "99" });
  });

  it("supports addRoute with RouteDefinition", () => {
    const r = new Router();
    r.addRoute({
      method: "GET",
      path: "/test",
      handler: () => new Response("ok"),
    });
    expect(r.match("GET", "/test")).not.toBeNull();
  });

  it("supports addRoutes with multiple definitions", () => {
    const r = new Router();
    r.addRoutes([
      { method: "GET", path: "/a", handler: () => new Response("a") },
      { method: "POST", path: "/b", handler: () => new Response("b") },
    ]);
    expect(r.match("GET", "/a")).not.toBeNull();
    expect(r.match("POST", "/b")).not.toBeNull();
  });

  it("handler receives request, params, context", async () => {
    const r = new Router();
    r.add("GET", "/hello/:name", async (req, params, _ctx) => {
      return new Response(`Hello ${params.name}`);
    });
    const match = r.match("GET", "/hello/world")!;
    const res = await match.handler(new Request("http://test"), match.params, new Map());
    expect(await res.text()).toBe("Hello world");
  });

  it("throws for unsupported method on add", () => {
    const r = new Router();
    expect(() => r.add("INVALID" as any, "/", () => new Response())).toThrow();
  });
});
