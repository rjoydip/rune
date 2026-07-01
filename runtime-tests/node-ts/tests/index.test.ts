import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { spawn } from "child_process";
import { existsSync } from "fs";
import path from "path";

let proc: ReturnType<typeof spawn> | null = null;
let port: number;

beforeAll(async () => {
  // Build handler into self-contained bundle so Node can resolve everything
  await Bun.build({
    entrypoints: [path.resolve(import.meta.dir, "../src/handler.ts")],
    outdir: path.resolve(import.meta.dir, "../dist"),
    target: "node",
    format: "esm",
  });

  port = await new Promise<number>((resolve, reject) => {
    const cwd = path.resolve(import.meta.dir, "..");
    const child = spawn("node", ["dist/handler.js"], {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
    });
    proc = child;
    const timeout = setTimeout(() => reject(new Error("Timeout waiting for server")), 60000);
    let stderr = "";

    child.stdout.on("data", (data: Buffer) => {
      const match = data.toString().match(/SERVER_READY:(\d+)/);
      if (match) {
        clearTimeout(timeout);
        resolve(parseInt(match[1], 10));
      }
    });
    child.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
      const match = data.toString().match(/SERVER_READY:(\d+)/);
      if (match) {
        clearTimeout(timeout);
        resolve(parseInt(match[1], 10));
      }
    });
    child.on("error", (err: Error) => {
      clearTimeout(timeout);
      reject(new Error(`Spawn error: ${err.message}\nStderr: ${stderr}`));
    });
    child.on("close", (code: number | null) => {
      clearTimeout(timeout);
      reject(new Error(`Process exited with code ${code}\nStderr: ${stderr}`));
    });
  });
}, 120000);

afterAll(() => {
  if (proc && !proc.killed) {
    proc.kill();
  }
});

describe("runtime-tests:node-ts", () => {
  it("responds to GET /hello", async () => {
    const p = port;
    const res = await fetch(`http://localhost:${p}/hello`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/json");
    expect(await res.json()).toEqual({ message: "Hello from Node.js + TypeScript!" });
  });

  it("responds to POST /data with body", async () => {
    const p = port;
    const res = await fetch(`http://localhost:${p}/data`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ value: "test-data" }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: "test-data" });
  });

  it("returns 404 for unknown route", async () => {
    const p = port;
    const res = await fetch(`http://localhost:${p}/unknown`);
    expect(res.status).toBe(404);
  });

  it("handles query string parameters", async () => {
    const p = port;
    const res = await fetch(`http://localhost:${p}/hello?name=test`);
    expect(res.status).toBe(200);
  });

  it("configures typescript for node", () => {
    const cfgPath = path.resolve(import.meta.dir, "../tsconfig.json");
    expect(existsSync(cfgPath)).toBe(true);
  });
});
