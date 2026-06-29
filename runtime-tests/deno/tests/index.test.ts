import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { spawn, execSync } from "child_process";
import { readFileSync, existsSync } from "fs";

let proc: ReturnType<typeof spawn> | null = null;
let port: number;

const hasDeno = (() => {
  try {
    execSync("deno --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
})();

beforeAll(async () => {
  await Bun.build({
    entrypoints: [import.meta.dir + "/../src/server.ts"],
    outdir: import.meta.dir + "/../dist",
    target: "bun",
    format: "esm",
  });

  port = await new Promise((resolve, reject) => {
    const child = spawn("deno", ["run", "--allow-net", import.meta.dir + "/../dist/server.js"], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    proc = child;
    const timeout = setTimeout(() => reject(new Error("Timeout waiting for Deno server")), 15000);
    let stderrBuf = "";

    child.stdout.on("data", (data: Buffer) => {
      const match = data.toString().match(/SERVER_READY:(\d+)/);
      if (match) {
        clearTimeout(timeout);
        resolve(parseInt(match[1], 10));
      }
    });

    child.stderr.on("data", (data: Buffer) => {
      stderrBuf += data.toString();
    });

    child.on("error", (err: Error) => {
      clearTimeout(timeout);
      reject(new Error(`Failed to spawn deno: ${err.message}\n${stderrBuf}`));
    });

    child.on("exit", (code: number | null) => {
      if (code !== null && code !== 0) {
        clearTimeout(timeout);
        reject(new Error(`Deno exited with code ${code}\n${stderrBuf}`));
      }
    });
  });
});

afterAll(() => {
  if (proc && !proc.killed) {
    proc.kill();
  }
});

function readDenoJson() {
  const path = import.meta.dir + "/../deno.json";
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf-8"));
}

const describeDeno = hasDeno ? describe : describe.skip;

describeDeno("runtime-tests:deno", () => {
  it("responds to GET /hello", async () => {
    const res = await fetch(`http://localhost:${port}/hello`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/json");
    expect(await res.json()).toEqual({ message: "Hello from Deno!" });
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

  it("configures deno json config", () => {
    const cfg = readDenoJson();
    expect(cfg).not.toBeNull();
    expect(cfg.tasks).toBeDefined();
  });
});
