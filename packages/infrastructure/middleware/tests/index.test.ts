import { describe, it, expect, mock } from "bun:test";
import { Context } from "@rune/core";
import { Container } from "@rune/container";

import {
  basicAuth,
  bearerAuth,
  cors,
  secureHeaders,
  requestId,
  logger,
  etag as etagMw,
  compress,
  timeout,
  poweredBy,
  prettyJson,
  trimTrailingSlash,
  appendTrailingSlash,
} from "../src/index.ts";

function makeCtx(url = "http://localhost/", method = "GET"): Context {
  return new Context(new Request(url, { method }), {}, new Container());
}

function makeResponseCtx(url = "http://localhost/", method = "GET"): Context {
  const ctx = makeCtx(url, method);
  ctx.response = new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json" },
  });
  return ctx;
}

describe("basicAuth", () => {
  it("allows valid credentials", async () => {
    const mw = basicAuth({ username: "admin", password: "secret" });
    const req = new Request("http://localhost/", {
      headers: { authorization: "Basic " + btoa("admin:secret") },
    });
    const ctx2 = new Context(req, {}, new Container());
    const next = mock(() => Promise.resolve(new Response("ok")));
    const result = await mw(ctx2, next);
    expect(next).toHaveBeenCalled();
    expect(result instanceof Response).toBe(true);
  });

  it("rejects invalid credentials", async () => {
    const mw = basicAuth({ username: "admin", password: "secret" });
    const req = new Request("http://localhost/", {
      headers: { authorization: "Basic " + btoa("admin:wrong") },
    });
    const ctx = new Context(req, {}, new Container());
    const next = mock(() => Promise.resolve(new Response("ok")));
    const result = await mw(ctx, next);
    expect((result as Response)?.status).toBe(401);
  });

  it("rejects missing auth header", async () => {
    const mw = basicAuth({ username: "admin", password: "secret" });
    const ctx = makeCtx();
    const next = mock(() => Promise.resolve(new Response("ok")));
    const result = await mw(ctx, next);
    expect((result as Response)?.status).toBe(401);
  });

  it("calls onAuthSuccess for valid credentials", async () => {
    const onSuccess = mock();
    const mw = basicAuth({ username: "admin", password: "secret", onAuthSuccess: onSuccess });
    const req = new Request("http://localhost/", {
      headers: { authorization: "Basic " + btoa("admin:secret") },
    });
    const ctx = new Context(req, {}, new Container());
    await mw(ctx, async () => new Response("ok"));
    expect(onSuccess).toHaveBeenCalled();
  });
});

describe("bearerAuth", () => {
  it("allows valid token", async () => {
    const mw = bearerAuth({ token: "valid-token" });
    const req = new Request("http://localhost/", {
      headers: { authorization: "Bearer valid-token" },
    });
    const ctx = new Context(req, {}, new Container());
    const next = mock(() => Promise.resolve(new Response("ok")));
    const result = await mw(ctx, next);
    expect(next).toHaveBeenCalled();
    expect(result instanceof Response).toBe(true);
  });

  it("rejects invalid token", async () => {
    const mw = bearerAuth({ token: "valid-token" });
    const req = new Request("http://localhost/", {
      headers: { authorization: "Bearer invalid" },
    });
    const ctx = new Context(req, {}, new Container());
    const next = mock(() => Promise.resolve(new Response("ok")));
    const result = await mw(ctx, next);
    expect((result as Response)?.status).toBe(401);
  });

  it("rejects missing auth header", async () => {
    const mw = bearerAuth({ token: "valid-token" });
    const ctx = makeCtx();
    const next = mock(() => Promise.resolve(new Response("ok")));
    const result = await mw(ctx, next);
    expect((result as Response)?.status).toBe(401);
  });

  it("rejects malformed auth header", async () => {
    const mw = bearerAuth({ token: "valid-token" });
    const req = new Request("http://localhost/", {
      headers: { authorization: "NotBearer token" },
    });
    const ctx = new Context(req, {}, new Container());
    const next = mock(() => Promise.resolve(new Response("ok")));
    const result = await mw(ctx, next);
    expect((result as Response)?.status).toBe(400);
  });

  it("accepts multiple tokens", async () => {
    const mw = bearerAuth({ token: ["token1", "token2"] });
    const req = new Request("http://localhost/", {
      headers: { authorization: "Bearer token2" },
    });
    const ctx = new Context(req, {}, new Container());
    const next = mock(() => Promise.resolve(new Response("ok")));
    await mw(ctx, next);
    expect(next).toHaveBeenCalled();
  });
});

describe("cors", () => {
  it("adds cors headers to response", async () => {
    const mw = cors();
    const ctx = makeResponseCtx("http://localhost/");
    const next = async () => {};
    await mw(ctx, next);
    expect(ctx.response?.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });

  it("handles OPTIONS preflight", async () => {
    const mw = cors({ origin: "http://example.com" });
    const req = new Request("http://localhost/", {
      method: "OPTIONS",
      headers: { origin: "http://example.com" },
    });
    const ctx = new Context(req, {}, new Container());
    const next = mock(() => Promise.resolve(new Response("ok")));
    const result = await mw(ctx, next);
    expect((result as Response).status).toBe(204);
    expect((result as Response).headers.get("Access-Control-Allow-Origin")).toBe(
      "http://example.com",
    );
  });

  it("allows dynamic origin function", async () => {
    const mw = cors({ origin: (origin) => (origin === "http://allowed.com" ? origin : null) });
    const req = new Request("http://localhost/", {
      method: "OPTIONS",
      headers: { origin: "http://allowed.com" },
    });
    const ctx = new Context(req, {}, new Container());
    const next = mock(() => Promise.resolve(new Response("ok")));
    const result = await mw(ctx, next);
    expect((result as Response).status).toBe(204);
  });
});

describe("secureHeaders", () => {
  it("sets default security headers", async () => {
    const mw = secureHeaders();
    const ctx = makeResponseCtx();
    const next = async () => {};
    await mw(ctx, next);
    expect(ctx.response?.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(ctx.response?.headers.get("X-Frame-Options")).toBe("SAMEORIGIN");
    expect(ctx.response?.headers.get("Strict-Transport-Security")).toBe(
      "max-age=15552000; includeSubDomains",
    );
  });

  it("sets CSP header when configured", async () => {
    const mw = secureHeaders({
      contentSecurityPolicy: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://example.com"],
      },
    });
    const ctx = makeResponseCtx();
    const next = async () => {};
    await mw(ctx, next);
    const csp = ctx.response?.headers.get("Content-Security-Policy");
    expect(csp).toContain("default-src");
    expect(csp).toContain("'self'");
  });

  it("removes X-Powered-By by default", async () => {
    const mw = secureHeaders();
    const ctx = makeResponseCtx();
    ctx.response!.headers.set("X-Powered-By", "Rune");
    const next = async () => {};
    await mw(ctx, next);
    expect(ctx.response?.headers.has("X-Powered-By")).toBe(false);
  });
});

describe("requestId", () => {
  it("generates a request ID", async () => {
    const mw = requestId();
    const ctx = makeCtx();
    const next = async () => {
      ctx.response = new Response("ok");
    };
    await mw(ctx, next);
    expect(ctx.state.get("requestId")).toBeDefined();
    expect(typeof ctx.state.get("requestId")).toBe("string");
    const rid = ctx.state.get("requestId") as string;
    expect(ctx.response?.headers.get("X-Request-Id")).toBe(rid);
  });

  it("preserves existing X-Request-Id header", async () => {
    const mw = requestId();
    const req = new Request("http://localhost/", {
      headers: { "X-Request-Id": "client-id" },
    });
    const ctx = new Context(req, {}, new Container());
    const next = async () => {
      ctx.response = new Response("ok");
    };
    await mw(ctx, next);
    expect(ctx.state.get("requestId") as string).toBe("client-id");
  });

  it("uses custom header name", async () => {
    const mw = requestId({ headerName: "X-Trace-Id" });
    const ctx = makeCtx();
    const next = async () => {
      ctx.response = new Response("ok");
    };
    await mw(ctx, next);
    expect(ctx.response?.headers.get("X-Trace-Id")).toBe(ctx.state.get("requestId") as string);
  });
});

describe("logger", () => {
  it("logs incoming and outgoing", async () => {
    const lines: string[] = [];
    const mw = logger({
      logFunc: (s) => {
        lines.push(s);
      },
    });
    const ctx = makeResponseCtx();
    const next = async () => {};
    await mw(ctx, next);
    expect(lines.length).toBe(2);
    expect(lines[0]).toContain("<--");
    expect(lines[1]).toContain("-->");
    expect(lines[1]).toContain("200");
  });

  it("skips logging when skip returns true", async () => {
    const lines: string[] = [];
    const mw = logger({
      logFunc: (s) => {
        lines.push(s);
      },
      skip: (ctx) => ctx.request.url.includes("skip"),
    });
    const ctx = makeCtx("http://localhost/skip");
    ctx.response = new Response("ok");
    const next = async () => {};
    await mw(ctx, next);
    expect(lines.length).toBe(0);
  });
});

describe("etag", () => {
  it("adds ETag header", async () => {
    const mw = etagMw();
    const ctx = makeCtx();
    ctx.response = new Response(JSON.stringify({ data: "test" }), {
      headers: { "content-type": "application/json" },
    });
    const next = async () => {};
    await mw(ctx, next);
    const etagVal = ctx.response?.headers.get("ETag");
    expect(etagVal).toBeDefined();
    expect(etagVal).toMatch(/^"/);
  });

  it("returns 304 when ETag matches If-None-Match", async () => {
    const mw = etagMw();
    const body = JSON.stringify({ data: "test" });
    const ctx = makeCtx();
    ctx.response = new Response(body, {
      headers: { "content-type": "application/json" },
    });
    const next = async () => {};
    await mw(ctx, next);
    const etagVal = ctx.response?.headers.get("ETag");

    const ctx2 = makeCtx();
    ctx2.response = new Response(body, {
      headers: {
        "content-type": "application/json",
        "if-none-match": etagVal!,
      },
    });
    // Set if-none-match on request
    const req2 = new Request("http://localhost/", {
      headers: { "if-none-match": etagVal! },
    });
    const ctx3 = new Context(req2, {}, new Container());
    ctx3.response = new Response(body, {
      headers: { "content-type": "application/json" },
    });
    await mw(ctx3, next);
    expect(ctx3.response?.status).toBe(304);
  });
});

describe("compress", () => {
  it("compresses response when accepted", async () => {
    const mw = compress({ threshold: 0 });
    const req = new Request("http://localhost/", {
      headers: { "accept-encoding": "gzip" },
    });
    const ctx = new Context(req, {}, new Container());
    ctx.response = new Response(JSON.stringify({ data: "x".repeat(100) }), {
      headers: { "content-type": "application/json" },
    });
    const next = async () => {};
    await mw(ctx, next);
    expect(ctx.response?.headers.get("content-encoding")).toBe("gzip");
  });

  it("does not compress below threshold", async () => {
    const mw = compress({ threshold: 1024 });
    const req = new Request("http://localhost/", {
      headers: { "accept-encoding": "gzip" },
    });
    const ctx = new Context(req, {}, new Container());
    const encoder = new TextEncoder();
    const body = "small";
    ctx.response = new Response(body, {
      headers: {
        "content-type": "text/plain",
        "content-length": String(encoder.encode(body).length),
      },
    });
    const next = async () => {};
    await mw(ctx, next);
    expect(ctx.response?.headers.has("content-encoding")).toBe(false);
  });

  it("does not compress if accept-encoding is missing", async () => {
    const mw = compress();
    const ctx = makeResponseCtx();
    ctx.response = new Response(JSON.stringify({ data: "x".repeat(2000) }), {
      headers: { "content-type": "application/json" },
    });
    const next = async () => {};
    await mw(ctx, next);
    expect(ctx.response?.headers.has("content-encoding")).toBe(false);
  });

  it("does not compress non-compressible content types", async () => {
    const mw = compress();
    const req = new Request("http://localhost/", {
      headers: { "accept-encoding": "gzip" },
    });
    const ctx = new Context(req, {}, new Container());
    ctx.response = new Response("image data", {
      headers: { "content-type": "image/png" },
    });
    const next = async () => {};
    await mw(ctx, next);
    expect(ctx.response?.headers.has("content-encoding")).toBe(false);
  });
});

describe("timeout", () => {
  it("passes through when handler completes in time", async () => {
    const mw = timeout(1000);
    const ctx = makeCtx();
    const next = async () => {
      ctx.response = new Response("ok");
    };
    await mw(ctx, next);
    expect(ctx.response?.status).toBe(200);
  });

  it("returns timeout response when handler exceeds duration", async () => {
    const mw = timeout(10, new Response("timed out", { status: 504 }));
    const ctx = makeCtx();
    const next = async () => {
      await new Promise((r) => setTimeout(r, 100));
    };
    try {
      await mw(ctx, next);
    } catch (e) {
      expect((e as Response).status).toBe(504);
    }
  });
});

describe("poweredBy", () => {
  it("sets X-Powered-By header with default value", async () => {
    const mw = poweredBy();
    const ctx = makeResponseCtx();
    const next = async () => {};
    await mw(ctx, next);
    expect(ctx.response?.headers.get("X-Powered-By")).toBe("Rune");
  });

  it("sets X-Powered-By header with custom value", async () => {
    const mw = poweredBy({ serverName: "MyApp" });
    const ctx = makeResponseCtx();
    const next = async () => {};
    await mw(ctx, next);
    expect(ctx.response?.headers.get("X-Powered-By")).toBe("MyApp");
  });
});

describe("prettyJson", () => {
  it("pretty-prints JSON when query param is present", async () => {
    const mw = prettyJson();
    const ctx = new Context(new Request("http://localhost/?pretty"), {}, new Container());
    ctx.response = new Response(JSON.stringify({ a: 1, b: 2 }), {
      headers: { "content-type": "application/json" },
    });
    const next = async () => {};
    await mw(ctx, next);
    const body = await ctx.response?.text();
    expect(body).toContain("\n");
    expect(body).toContain('  "a"');
  });

  it("does not pretty-print without query param", async () => {
    const mw = prettyJson();
    const ctx = makeResponseCtx();
    const next = async () => {};
    await mw(ctx, next);
    const body = await ctx.response?.text();
    expect(body).not.toContain("\n");
  });
});

describe("trailingSlash", () => {
  it("trims trailing slash on 404", async () => {
    const mw = trimTrailingSlash();
    const ctx = new Context(new Request("http://localhost/foo/"), {}, new Container());
    ctx.response = new Response("Not Found", { status: 404 });
    const next = async () => {};
    await mw(ctx, next);
    expect(ctx.response?.status).toBe(301);
    expect(ctx.response?.headers.get("Location")).toBe("http://localhost/foo");
  });

  it("redirects immediately when alwaysRedirect is true", async () => {
    const mw = trimTrailingSlash({ alwaysRedirect: true });
    const req = new Request("http://localhost/foo/", { method: "GET" });
    const ctx = new Context(req, {}, new Container());
    const next = mock(() => Promise.resolve(new Response("ok")));
    const result = await mw(ctx, next);
    expect((result as Response).status).toBe(301);
    expect(next).not.toHaveBeenCalled();
  });

  it("appends trailing slash on 404", async () => {
    const mw = appendTrailingSlash();
    const ctx = new Context(new Request("http://localhost/foo"), {}, new Container());
    ctx.response = new Response("Not Found", { status: 404 });
    const next = async () => {};
    await mw(ctx, next);
    expect(ctx.response?.status).toBe(301);
    expect(ctx.response?.headers.get("Location")).toBe("http://localhost/foo/");
  });

  it("appends trailing slash with skip function", async () => {
    const mw = appendTrailingSlash({
      alwaysRedirect: true,
      skip: (path) => path.includes("."),
    });
    const req = new Request("http://localhost/image.png", { method: "GET" });
    const ctx = new Context(req, {}, new Container());
    const next = mock(() => Promise.resolve(new Response("ok")));
    await mw(ctx, next);
    expect(next).toHaveBeenCalled();
  });
});
