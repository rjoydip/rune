import { describe, it, expect } from "bun:test";
import { toLambdaEdgeHandler, toAPIGatewayHandler, toLambdaHandler } from "../src/index";
import type { RuneApp } from "@rune/core";

describe("adapter-lambda-edge", () => {
  describe("toLambdaEdgeHandler (CloudFront)", () => {
    it("exports toLambdaEdgeHandler function", () => {
      expect(toLambdaEdgeHandler).toBeTypeOf("function");
    });

    it("returns a handler function", () => {
      const app = {
        fetch: async () => new Response(JSON.stringify({ ok: true })),
      } as unknown as RuneApp;
      const handler = toLambdaEdgeHandler(app);
      expect(handler).toBeTypeOf("function");
    });

    it("parses CloudFront event and returns response", async () => {
      const app = {
        fetch: async (req: Request) =>
          new Response(JSON.stringify({ path: new URL(req.url).pathname }), {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
      } as unknown as RuneApp;
      const handler = toLambdaEdgeHandler(app);
      const result = await handler({
        Records: [
          {
            cf: {
              request: {
                uri: "/hello",
                method: "GET",
                headers: { host: [{ key: "Host", value: "example.com" }] },
                querystring: "",
                clientIp: "1.2.3.4",
              },
              config: { distributionId: "d123", requestId: "req1" },
            },
          },
        ],
      });
      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual({ path: "/hello" });
    });

    it("handles query string in CloudFront event", async () => {
      const app = {
        fetch: async (req: Request) => new Response(req.url),
      } as unknown as RuneApp;
      const handler = toLambdaEdgeHandler(app);

      const result = await handler({
        Records: [
          {
            cf: {
              request: {
                uri: "/search",
                method: "GET",
                headers: { host: [{ key: "Host", value: "example.com" }] },
                querystring: "q=test",
                clientIp: "1.2.3.4",
              },
              config: { distributionId: "d123", requestId: "req1" },
            },
          },
        ],
      });
      expect(result.statusCode).toBe(200);
      expect(result.body).toContain("q=test");
    });
  });

  describe("toAPIGatewayHandler (API Gateway)", () => {
    it("exports toAPIGatewayHandler function", () => {
      expect(toAPIGatewayHandler).toBeTypeOf("function");
    });

    it("handles basic API Gateway event", async () => {
      const app = {
        fetch: async () =>
          new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
      } as unknown as RuneApp;
      const handler = toAPIGatewayHandler(app);
      const result = await handler({
        httpMethod: "GET",
        path: "/test",
        headers: {},
        queryStringParameters: null,
        body: null,
        isBase64Encoded: false,
      });
      expect(result.statusCode).toBe(200);
      expect(result.isBase64Encoded).toBe(false);
    });

    it("handles query string parameters", async () => {
      const app = {
        fetch: async (req: Request) => new Response(req.url),
      } as unknown as RuneApp;
      const handler = toAPIGatewayHandler(app);
      const result = await handler({
        httpMethod: "GET",
        path: "/search",
        headers: {},
        queryStringParameters: { q: "test" },
        body: null,
        isBase64Encoded: false,
      });
      expect(result.statusCode).toBe(200);
    });

    it("handles POST request with body", async () => {
      const app = {
        fetch: async (req: Request) => new Response(await req.text(), { status: 200 }),
      } as unknown as RuneApp;
      const handler = toAPIGatewayHandler(app);
      const result = await handler({
        httpMethod: "POST",
        path: "/data",
        headers: { "content-type": "application/json" },
        queryStringParameters: null,
        body: JSON.stringify({ value: "test" }),
        isBase64Encoded: false,
      });
      expect(result.statusCode).toBe(200);
      expect(result.body).toBe(JSON.stringify({ value: "test" }));
    });

    it("exports toLambdaHandler as alias", () => {
      expect(toLambdaHandler).toBe(toAPIGatewayHandler);
    });
  });
});
