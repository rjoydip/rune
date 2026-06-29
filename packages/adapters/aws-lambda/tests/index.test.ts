import { describe, it, expect } from "bun:test";
import { toAwsLambda } from "../src/index";
import type { RuneApp } from "@rune/core";

describe("adapter-aws-lambda", () => {
  it("exports toAwsLambda function", () => {
    expect(toAwsLambda).toBeTypeOf("function");
  });

  it("handles API Gateway v1 event", async () => {
    const app = {
      fetch: async () =>
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    } as unknown as RuneApp;
    const handler = toAwsLambda(app);
    const result = await handler({
      httpMethod: "GET",
      path: "/hello",
      headers: {},
      queryStringParameters: null,
      body: null,
      isBase64Encoded: false,
    });
    expect(result.statusCode).toBe(200);
  });

  it("handles API Gateway v2 event", async () => {
    const app = {
      fetch: async (req: Request) =>
        new Response(JSON.stringify({ path: new URL(req.url).pathname }), { status: 200 }),
    } as unknown as RuneApp;
    const handler = toAwsLambda(app);
    const result = await handler({
      requestContext: { http: { method: "GET", path: "/hello" } },
      headers: {},
      queryStringParameters: null,
      body: null,
      isBase64Encoded: false,
      rawPath: "/hello",
    });
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({ path: "/hello" });
  });

  it("handles POST with body", async () => {
    const app = {
      fetch: async (req: Request) => new Response(await req.text(), { status: 200 }),
    } as unknown as RuneApp;
    const handler = toAwsLambda(app);
    const result = await handler({
      httpMethod: "POST",
      path: "/data",
      headers: { "content-type": "application/json" },
      queryStringParameters: null,
      body: JSON.stringify({ key: "value" }),
      isBase64Encoded: false,
    });
    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(JSON.stringify({ key: "value" }));
  });

  it("handles query string parameters", async () => {
    const app = {
      fetch: async (req: Request) => new Response(req.url),
    } as unknown as RuneApp;
    const handler = toAwsLambda(app);
    const result = await handler({
      httpMethod: "GET",
      path: "/search",
      headers: {},
      queryStringParameters: { q: "test", page: "1" },
      body: null,
      isBase64Encoded: false,
    });
    expect(result.statusCode).toBe(200);
    expect(result.body).toContain("q=test");
    expect(result.body).toContain("page=1");
  });

  it("returns 404 for unknown route", async () => {
    const app = {
      fetch: async () => new Response("Not Found", { status: 404 }),
    } as unknown as RuneApp;
    const handler = toAwsLambda(app);
    const validResult = await handler({
      httpMethod: "GET",
      path: "/unknown",
      headers: {},
      queryStringParameters: null,
      body: null,
      isBase64Encoded: false,
    });
    expect(validResult.statusCode).toBe(404);
  });
});
