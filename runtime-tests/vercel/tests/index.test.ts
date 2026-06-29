import { describe, it, expect, beforeAll } from "bun:test";
import { readFileSync, existsSync } from "fs";

type HandlerFn = (request: Request) => Response | Promise<Response>;

let handler: HandlerFn;

beforeAll(async () => {
  await Bun.build({
    entrypoints: [import.meta.dir + "/../src/handler.ts"],
    outdir: import.meta.dir + "/../dist",
    target: "node",
    format: "esm",
    external: ["@rune/core", "@rune/adapter-vercel", "@rune/decorators"],
  });
  const mod = await import(import.meta.dir + "/../dist/handler.js");
  handler = mod.default;
});

function readVercelJson() {
  const path = import.meta.dir + "/../vercel.json";
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf-8"));
}

describe("runtime-tests:vercel", () => {
  it("responds to GET /hello", async () => {
    const res = await handler(new Request("http://localhost/hello"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/json");
    expect(await res.json()).toEqual({ message: "Hello from Vercel!" });
  });

  it("responds to POST /data with body", async () => {
    const res = await handler(
      new Request("http://localhost/data", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ value: "test-data" }),
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: "test-data" });
  });

  it("returns 404 for unknown route", async () => {
    const res = await handler(new Request("http://localhost/unknown"));
    expect(res.status).toBe(404);
  });

  it("handles query string parameters", async () => {
    const res = await handler(new Request("http://localhost/hello?name=test"));
    expect(res.status).toBe(200);
  });

  it("configures edge runtime in vercel.json", () => {
    const cfg = readVercelJson();
    expect(cfg).not.toBeNull();
    expect(cfg.functions["api/index.ts"].runtime).toBe("@vercel/edge");
    expect(cfg.rewrites).toContainEqual({
      source: "/(.*)",
      destination: "/api/index.ts",
    });
  });
});
