import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { spawn } from "child_process";
import path from "path";
import { readFileSync, existsSync } from "fs";

let proc: ReturnType<typeof spawn> | null = null;
let baseUrl: string;

const hasWrangler = existsSync(path.resolve(import.meta.dir, "../node_modules/wrangler/package.json"));

function readWranglerToml() {
  const p = path.resolve(import.meta.dir, "../wrangler.toml");
  if (!existsSync(p)) return null;
  return readFileSync(p, "utf-8");
}

beforeAll(async () => {
  baseUrl = await new Promise<string>((resolve, reject) => {
    const cwd = path.resolve(import.meta.dir, "..");
    const child = spawn("npx", ["wrangler", "dev"], {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      shell: true,
    });
    proc = child;
    const timeout = setTimeout(() => reject(new Error("Timeout waiting for wrangler")), 60000);
    let stderr = "";

    function checkLine(line: string) {
      const match = line.match(/Ready on (https?:\/\/[^\s]+)/);
      if (match) {
        clearTimeout(timeout);
        resolve(match[1]);
      }
    }

    child.stdout.on("data", (data: Buffer) => {
      for (const line of data.toString().split("\n")) checkLine(line);
    });
    child.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
      for (const line of data.toString().split("\n")) checkLine(line);
    });
    child.on("error", (err: Error) => {
      clearTimeout(timeout);
      reject(new Error(`Spawn error: ${err.message}\nStderr: ${stderr}`));
    });
    child.on("close", (code: number | null) => {
      clearTimeout(timeout);
      reject(new Error(`wrangler exited with code ${code}\nStderr: ${stderr}`));
    });
  });
}, 120000);

afterAll(() => {
  if (proc && !proc.killed) {
    proc.kill();
  }
});

const describeCloudflare = hasWrangler ? describe : describe.skip;

describeCloudflare("runtime-tests:cloudflare", () => {
  it("responds to GET /hello", async () => {
    const url = baseUrl;
    const res = await fetch(`${url}/hello`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/json");
    expect(await res.json()).toEqual({ message: "Hello from Cloudflare Workers!" });
  });

  it("responds to POST /data with body", async () => {
    const url = baseUrl;
    const res = await fetch(`${url}/data`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ value: "test-data" }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: "test-data" });
  });

  it("returns 404 for unknown route", async () => {
    const url = baseUrl;
    const res = await fetch(`${url}/unknown`);
    expect(res.status).toBe(404);
  });

  it("handles query string parameters", async () => {
    const url = baseUrl;
    const res = await fetch(`${url}/hello?name=test`);
    expect(res.status).toBe(200);
  });

  it("configures cloudflare deployment config", () => {
    const config = readWranglerToml();
    expect(config).not.toBeNull();
    expect(config).toContain("name");
    expect(config).toContain("main");
    expect(config).toContain("compatibility_date");
  });
});
