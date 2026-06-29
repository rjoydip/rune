import { describe, it, expect, beforeAll } from "bun:test";
import { readFileSync, existsSync } from "fs";

type HandlerFn = (
  event: Record<string, unknown>,
  context?: Record<string, unknown>,
) =>
  | {
      statusCode: number;
      headers: Record<string, string>;
      body: string;
    }
  | Promise<{ statusCode: number; headers: Record<string, string>; body: string }>;

let handler: HandlerFn;

beforeAll(async () => {
  await Bun.build({
    entrypoints: [import.meta.dir + "/../src/handler.ts"],
    outdir: import.meta.dir + "/../dist",
    target: "node",
    format: "esm",
    external: ["@rune/core", "@rune/adapter-netlify", "@rune/decorators"],
  });
  const mod = await import(import.meta.dir + "/../dist/handler.js");
  handler = mod.handler;
});

function netlifyEvent(method: string, path: string, body?: string) {
  return {
    path,
    httpMethod: method,
    headers: { host: "localhost", "content-type": "application/json" },
    queryStringParameters: null,
    body: body || null,
    isBase64Encoded: false,
  };
}

function readNetlifyJson() {
  const path = import.meta.dir + "/../netlify.json";
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf-8"));
}

describe("runtime-tests:netlify", () => {
  it("responds to GET /hello", async () => {
    const res = await handler(netlifyEvent("GET", "/hello"));
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toBe("application/json");
    expect(JSON.parse(res.body)).toEqual({ message: "Hello from Netlify!" });
  });

  it("responds to POST /data with body", async () => {
    const res = await handler(
      netlifyEvent("POST", "/data", JSON.stringify({ value: "test-data" })),
    );
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ received: "test-data" });
  });

  it("returns 404 for unknown route", async () => {
    const res = await handler(netlifyEvent("GET", "/unknown"));
    expect(res.statusCode).toBe(404);
  });

  it("handles query string parameters", async () => {
    const event = {
      path: "/hello",
      httpMethod: "GET",
      headers: { host: "localhost" },
      queryStringParameters: { name: "test" },
      body: null,
      isBase64Encoded: false,
    };
    const res = await handler(event);
    expect(res.statusCode).toBe(200);
  });

  it("configures netlify deployment config", () => {
    const cfg = readNetlifyJson();
    expect(cfg).not.toBeNull();
    expect(cfg.functions["*"]).toBeDefined();
    expect(cfg.redirects).toBeDefined();
  });
});
