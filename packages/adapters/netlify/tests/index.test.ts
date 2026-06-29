import { describe, it, expect, mock } from "bun:test";
import { toNetlifyEdge, toNetlifyFunction } from "../src/index";
import type { RuneApp } from "@rune/core";

describe("adapter-netlify", () => {
  describe("toNetlifyEdge", () => {
    it("exports toNetlifyEdge function", () => {
      expect(toNetlifyEdge).toBeTypeOf("function");
    });

    it("returns an edge handler function", () => {
      const app = { fetch: async () => new Response("ok") } as unknown as RuneApp;
      const handler = toNetlifyEdge(app);
      expect(handler).toBeTypeOf("function");
    });

    it("handles request and returns response", async () => {
      const app = {
        fetch: async (req: Request) =>
          new Response(JSON.stringify({ path: req.url }), {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
      } as unknown as RuneApp;
      const handler = toNetlifyEdge(app);

      const res = await handler(new Request("http://netlify.app/api"));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.path).toBe("http://netlify.app/api");
    });

    it("handles POST request delegation", async () => {
      const app = {
        fetch: mock(async (req: Request) => {
          expect(req.method).toBe("POST");
          expect(await req.text()).toBe(JSON.stringify({ title: "new" }));
          return new Response("created", { status: 201 });
        }),
      } as unknown as RuneApp;
      const handler = toNetlifyEdge(app);

      const res = await handler(
        new Request("http://netlify.app/create", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ title: "new" }),
        }),
      );
      expect(res.status).toBe(201);
      expect(await res.text()).toBe("created");
    });

    it("propagates response status", async () => {
      const app = {
        fetch: async () => new Response(null, { status: 404 }),
      } as unknown as RuneApp;
      const handler = toNetlifyEdge(app);

      const res = await handler(new Request("http://netlify.app/notfound"));
      expect(res.status).toBe(404);
    });

    it("propagates response headers", async () => {
      const app = {
        fetch: async () =>
          new Response("ok", {
            status: 200,
            headers: { "x-custom": "value", "content-type": "text/plain" },
          }),
      } as unknown as RuneApp;
      const handler = toNetlifyEdge(app);

      const res = await handler(new Request("http://netlify.app/test"));
      expect(res.headers.get("x-custom")).toBe("value");
      expect(res.headers.get("content-type")).toBe("text/plain");
    });
  });

  describe("toNetlifyFunction", () => {
    it("exports toNetlifyFunction", () => {
      expect(toNetlifyFunction).toBeTypeOf("function");
    });

    it("returns a function handler", () => {
      const app = { fetch: async () => new Response("ok") } as unknown as RuneApp;
      const handler = toNetlifyFunction(app);
      expect(handler).toBeTypeOf("function");
    });

    it("converts NetlifyEvent to Response", async () => {
      const app = {
        fetch: async (req: Request) => {
          expect(req.url).toContain("/hello");
          expect(req.method).toBe("GET");
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        },
      } as unknown as RuneApp;
      const handler = toNetlifyFunction(app);

      const result = await handler(
        {
          path: "/hello",
          httpMethod: "GET",
          headers: {},
          queryStringParameters: null,
          body: null,
          isBase64Encoded: false,
        },
        { clientContext: {} },
      );
      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual({ ok: true });
    });

    it("handles POST request with body", async () => {
      const app = {
        fetch: async (req: Request) => {
          const text = await req.text();
          return new Response(JSON.stringify({ echoed: text }), { status: 200 });
        },
      } as unknown as RuneApp;
      const handler = toNetlifyFunction(app);

      const result = await handler(
        {
          path: "/data",
          httpMethod: "POST",
          headers: { "content-type": "application/json" },
          queryStringParameters: null,
          body: JSON.stringify({ value: "test" }),
          isBase64Encoded: false,
        },
        { clientContext: {} },
      );
      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual({ echoed: JSON.stringify({ value: "test" }) });
    });

    it("handles base64 encoded body", async () => {
      const app = {
        fetch: async (req: Request) => {
          const text = await req.text();
          return new Response(JSON.stringify({ text }), { status: 200 });
        },
      } as unknown as RuneApp;
      const handler = toNetlifyFunction(app);

      const originalJson = JSON.stringify({ value: "base64-test" });
      const base64Body = Buffer.from(originalJson).toString("base64");

      const result = await handler(
        {
          path: "/data",
          httpMethod: "POST",
          headers: { "content-type": "application/octet-stream" },
          queryStringParameters: null,
          body: base64Body,
          isBase64Encoded: true,
        },
        { clientContext: {} },
      );
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.text).toBe(originalJson);
    });

    it("handles query string parameters", async () => {
      const app = {
        fetch: mock(async (req: Request) => {
          expect(req.url).toContain("foo=bar");
          return new Response("ok", { status: 200 });
        }),
      } as unknown as RuneApp;
      const handler = toNetlifyFunction(app);

      const result = await handler(
        {
          path: "/search",
          httpMethod: "GET",
          headers: {},
          queryStringParameters: { foo: "bar" },
          body: null,
          isBase64Encoded: false,
        },
        { clientContext: {} },
      );
      expect(result.statusCode).toBe(200);
    });

    it("propagates error status codes", async () => {
      const app = {
        fetch: async () => new Response("Not Found", { status: 404 }),
      } as unknown as RuneApp;
      const handler = toNetlifyFunction(app);

      const result = await handler(
        {
          path: "/missing",
          httpMethod: "GET",
          headers: {},
          queryStringParameters: null,
          body: null,
          isBase64Encoded: false,
        },
        { clientContext: {} },
      );
      expect(result.statusCode).toBe(404);
    });

    it("skips body for GET requests", async () => {
      const app = {
        fetch: async (req: Request) => {
          expect(req.method).toBe("GET");
          expect(req.body).toBeNull();
          return new Response("ok", { status: 200 });
        },
      } as unknown as RuneApp;
      const handler = toNetlifyFunction(app);

      const result = await handler(
        {
          path: "/data",
          httpMethod: "GET",
          headers: {},
          queryStringParameters: null,
          body: "should be ignored",
          isBase64Encoded: false,
        },
        { clientContext: {} },
      );
      expect(result.statusCode).toBe(200);
    });

    it("skips body for HEAD requests", async () => {
      const app = {
        fetch: async (req: Request) => {
          expect(req.method).toBe("HEAD");
          expect(req.body).toBeNull();
          return new Response(null, { status: 200 });
        },
      } as unknown as RuneApp;
      const handler = toNetlifyFunction(app);

      const result = await handler(
        {
          path: "/data",
          httpMethod: "HEAD",
          headers: {},
          queryStringParameters: null,
          body: "should be ignored",
          isBase64Encoded: false,
        },
        { clientContext: {} },
      );
      expect(result.statusCode).toBe(200);
    });

    it("handles POST without body", async () => {
      const app = {
        fetch: async (req: Request) => {
          const body = await req.text();
          return new Response(JSON.stringify({ bodyLength: body.length }), { status: 200 });
        },
      } as unknown as RuneApp;
      const handler = toNetlifyFunction(app);

      const result = await handler(
        {
          path: "/empty",
          httpMethod: "POST",
          headers: {},
          queryStringParameters: null,
          body: null,
          isBase64Encoded: false,
        },
        { clientContext: {} },
      );
      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual({ bodyLength: 0 });
    });

    it("handles null queryStringParameters", async () => {
      const app = {
        fetch: async (req: Request) => {
          expect(req.url).not.toContain("?");
          return new Response("ok", { status: 200 });
        },
      } as unknown as RuneApp;
      const handler = toNetlifyFunction(app);

      const result = await handler(
        {
          path: "/test",
          httpMethod: "GET",
          headers: {},
          queryStringParameters: null,
          body: null,
          isBase64Encoded: false,
        },
        { clientContext: {} },
      );
      expect(result.statusCode).toBe(200);
    });
  });
});
