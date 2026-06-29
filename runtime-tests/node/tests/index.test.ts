import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { spawn } from "child_process";
import { readFileSync, existsSync } from "fs";

let proc: ReturnType<typeof spawn>;
let port: number;

beforeAll(async () => {
  port = await new Promise((resolve, reject) => {
    const child = spawn("bun", ["run", import.meta.dir + "/../src/handler.ts"], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    proc = child;
    const timeout = setTimeout(() => reject(new Error("Timeout waiting for server")), 15000);

    child.stdout.on("data", (data: Buffer) => {
      const match = data.toString().match(/SERVER_READY:(\d+)/);
      if (match) {
        clearTimeout(timeout);
        resolve(parseInt(match[1], 10));
      }
    });

    child.on("error", (err: Error) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
});

afterAll(() => {
  if (proc && !proc.killed) {
    proc.kill();
  }
});

function readNodeJson() {
  const path = import.meta.dir + "/../node.json";
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf-8"));
}

describe("runtime-tests:node", () => {
  it("responds to GET /hello", async () => {
    const res = await fetch(`http://localhost:${port}/hello`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/json");
    expect(await res.json()).toEqual({ message: "Hello from Node.js!" });
  });

  it("responds to POST /data with body", async () => {
    const res = await fetch(`http://localhost:${port}/data`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ value: "test-data" }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: "test-data" });
  });

  it("returns 404 for unknown route", async () => {
    const res = await fetch(`http://localhost:${port}/unknown`);
    expect(res.status).toBe(404);
  });

  it("handles query string parameters", async () => {
    const res = await fetch(`http://localhost:${port}/hello?name=test`);
    expect(res.status).toBe(200);
  });

  it("configures node deployment config", () => {
    const cfg = readNodeJson();
    expect(cfg).not.toBeNull();
    expect(cfg.buildCommand).toBeDefined();
    expect(cfg.outDir).toBeDefined();
  });
});
