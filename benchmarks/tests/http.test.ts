import { describe, expect, it } from "bun:test";
import { httpBenchmark, httpBenchmarkPost } from "../http";

describe("httpBenchmark", () => {
  it("returns result with correct structure", async () => {
    const server = Bun.serve({
      port: 0,
      fetch: () => new Response("OK"),
    });

    try {
      const result = await httpBenchmark("test GET", server.port as number, "/", 10);

      expect(result).toHaveProperty("name", "test GET");
      expect(result).toHaveProperty("ops", 10);
      expect(result).toHaveProperty("durationMs");
      expect(result).toHaveProperty("opsPerSec");
      expect(result).toHaveProperty("avgLatencyMs");
      expect(result.durationMs).toBeGreaterThan(0);
    } finally {
      server.stop();
    }
  });

  it("handles query parameters in URL", async () => {
    const server = Bun.serve({
      port: 0,
      fetch: (req) => {
        return new Response(req.url);
      },
    });

    try {
      const result = await httpBenchmark(
        "test query",
        server.port as number,
        "/search?limit=10&offset=0",
        5,
      );

      expect(result.ops).toBe(5);
      expect(result.durationMs).toBeGreaterThan(0);
    } finally {
      server.stop();
    }
  });
});

describe("httpBenchmarkPost", () => {
  it("returns result with correct structure", async () => {
    const server = Bun.serve({
      port: 0,
      fetch: async (req) => {
        const body = await req.text();
        return new Response(body);
      },
    });

    try {
      const result = await httpBenchmarkPost(
        "test POST",
        server.port as number,
        "/echo",
        JSON.stringify({ text: "hello" }),
        10,
      );

      expect(result).toHaveProperty("name", "test POST");
      expect(result).toHaveProperty("ops", 10);
      expect(result).toHaveProperty("durationMs");
      expect(result).toHaveProperty("opsPerSec");
      expect(result).toHaveProperty("avgLatencyMs");
      expect(result.durationMs).toBeGreaterThan(0);
    } finally {
      server.stop();
    }
  });

  it("sends JSON body correctly", async () => {
    let receivedBody: unknown = null;

    const server = Bun.serve({
      port: 0,
      fetch: async (req) => {
        receivedBody = await req.json();
        return new Response("OK");
      },
    });

    try {
      const testBody = { message: "test", count: 42 };
      await httpBenchmarkPost(
        "test JSON",
        server.port as number,
        "/api",
        JSON.stringify(testBody),
        5,
      );

      expect(receivedBody).toEqual(testBody);
    } finally {
      server.stop();
    }
  });
});
