import { describe, it, expect } from "bun:test";
import { Context } from "../src/context";
import { Container } from "@rune/container";

function makeRequest(url: string, init?: RequestInit): Request {
  return new Request(url, init);
}

describe("Context", () => {
  it("stores request and params", () => {
    const req = makeRequest("http://localhost/test");
    const ctx = new Context(req, { id: "42" }, new Container());
    expect(ctx.request).toBe(req);
    expect(ctx.params).toEqual({ id: "42" });
  });

  it("parses query string", () => {
    const req = makeRequest("http://localhost/?foo=bar&baz=1");
    const ctx = new Context(req, {}, new Container());
    expect(ctx.query).toEqual({ foo: "bar", baz: "1" });
  });

  it("returns empty query when none", () => {
    const req = makeRequest("http://localhost/");
    const ctx = new Context(req, {}, new Container());
    expect(ctx.query).toEqual({});
  });

  it("exposes request headers", () => {
    const req = makeRequest("http://localhost/", {
      headers: { "x-custom": "val" },
    });
    const ctx = new Context(req, {}, new Container());
    expect(ctx.headers.get("x-custom")).toBe("val");
  });

  it("parses JSON body", async () => {
    const req = makeRequest("http://localhost/", {
      method: "POST",
      body: JSON.stringify({ hello: "world" }),
      headers: { "content-type": "application/json" },
    });
    const ctx = new Context(req, {}, new Container());
    const body = await ctx.body;
    expect(body).toEqual({ hello: "world" });
  });

  it("send creates JSON response", () => {
    const req = makeRequest("http://localhost/");
    const ctx = new Context(req, {}, new Container());
    const res = ctx.send({ ok: true }, 201);
    expect(res.status).toBe(201);
    expect(res.headers.get("content-type")).toBe("application/json");
  });

  it("sendStatus creates response with no body", () => {
    const req = makeRequest("http://localhost/");
    const ctx = new Context(req, {}, new Container());
    const res = ctx.sendStatus(204);
    expect(res.status).toBe(204);
  });

  it("state is a Map", () => {
    const req = makeRequest("http://localhost/");
    const ctx = new Context(req, {}, new Container());
    ctx.state.set("user", "alice");
    expect(ctx.state.get("user")).toBe("alice");
  });

  it("stores response on context after send", () => {
    const req = makeRequest("http://localhost/");
    const ctx = new Context(req, {}, new Container());
    ctx.send("ok");
    expect(ctx.response).not.toBeNull();
  });

  it("paramsArray returns cached Object.values of params", () => {
    const req = makeRequest("http://localhost/");
    const ctx = new Context(req, { a: "1", b: "2" }, new Container());
    expect(ctx.paramsArray).toEqual(["1", "2"]);
    expect(ctx.paramsArray).toBe(ctx.paramsArray);
  });

  it("queryValues returns cached Object.values of query", () => {
    const req = makeRequest("http://localhost/?x=10&y=20");
    const ctx = new Context(req, {}, new Container());
    expect(ctx.queryValues).toEqual(["10", "20"]);
    expect(ctx.queryValues).toBe(ctx.queryValues);
  });
});
