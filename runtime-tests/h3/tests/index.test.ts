import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { spawn } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

let baseUrl: string;
let serverProcess: ReturnType<typeof spawn>;

function waitForServerReady(): Promise<string> {
  return new Promise((resolvePromise, reject) => {
    const timeout = setTimeout(() => reject(new Error("Timeout waiting for server")), 15000);

    serverProcess.stdout!.on("data", (data: Buffer) => {
      const text = data.toString();
      const match = text.match(/SERVER_READY:(\d+)/);
      if (match) {
        clearTimeout(timeout);
        resolvePromise(match[1]);
      }
    });

    serverProcess.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

beforeAll(async () => {
  serverProcess = spawn("bun", ["run", "src/handler.ts"], {
    cwd: resolve(import.meta.dirname, ".."),
    stdio: ["pipe", "pipe", "pipe"],
  });

  const port = await waitForServerReady();
  baseUrl = `http://localhost:${port}`;
});

afterAll(() => {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill();
  }
});

describe("runtime-test-h3", () => {
  it("responds to GET /hello", async () => {
    const res = await fetch(`${baseUrl}/hello`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ message: "Hello from h3!" });
  });

  it("responds to POST /data with body", async () => {
    const res = await fetch(`${baseUrl}/data`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ value: "test-data" }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: "test-data" });
  });

  it("returns 404 for unknown route", async () => {
    const res = await fetch(`${baseUrl}/unknown`);
    expect(res.status).toBe(404);
  });

  it("handles query string", async () => {
    const res = await fetch(`${baseUrl}/hello?foo=bar`);
    expect(res.status).toBe(200);
  });

  it("reads h3.json config", () => {
    const configPath = resolve(import.meta.dirname, "..", "h3.json");
    expect(existsSync(configPath)).toBe(true);
    const config = JSON.parse(readFileSync(configPath, "utf8"));
    expect(config).toHaveProperty("buildCommand");
    expect(config).toHaveProperty("outDir");
    expect(config).toHaveProperty("startCommand");
  });
});
