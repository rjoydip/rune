import { describe, it, expect } from "bun:test";
import app from "../index.ts";

describe("try-middleware", () => {
  it("responds with JSON from root", async () => {
    const res = await app.fetch(new Request("http://localhost/"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe("Hello from Rune Middleware!");
  });

  it("includes CORS headers", async () => {
    const req = new Request("http://localhost/", {
      headers: { origin: "http://example.com" },
    });
    const res = await app.fetch(req);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });

  it("includes X-Powered-By header", async () => {
    const res = await app.fetch(new Request("http://localhost/"));
    expect(res.headers.get("X-Powered-By")).toBe("Rune Middleware Demo");
  });

  it("includes security headers", async () => {
    const res = await app.fetch(new Request("http://localhost/"));
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("X-Frame-Options")).toBe("SAMEORIGIN");
  });

  it("includes request ID header", async () => {
    const res = await app.fetch(new Request("http://localhost/"));
    expect(res.headers.get("X-Request-Id")).toBeTruthy();
  });

  it("compresses large responses", async () => {
    const req = new Request("http://localhost/large", {
      headers: { "accept-encoding": "gzip" },
    });
    const res = await app.fetch(req);
    expect(res.headers.get("content-encoding")).toBe("gzip");
  });

  it("pretty-prints JSON with ?pretty param", async () => {
    const res = await app.fetch(new Request("http://localhost/?pretty"));
    const body = await res.text();
    expect(body).toContain("\n");
  });

  it("handles POST /echo", async () => {
    const res = await app.fetch(
      new Request("http://localhost/echo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: "hello" }),
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.echoed.text).toBe("hello");
  });
});
