import { describe, expect, it } from "bun:test";
import { measure } from "../measure";

function parseQuery(url: string) {
  const [_, qs] = url.split("?");
  if (!qs) return {};
  const params: Record<string, string> = {};
  for (const pair of qs.split("&")) {
    const [k, v] = pair.split("=");
    params[decodeURIComponent(k)] = decodeURIComponent(v ?? "");
  }
  return params;
}

describe("parseQuery", () => {
  it("parses query string", () => {
    const result = parseQuery("/search?limit=10&offset=0");
    expect(result).toEqual({ limit: "10", offset: "0" });
  });

  it("handles empty query string", () => {
    const result = parseQuery("/search");
    expect(result).toEqual({});
  });

  it("handles single parameter", () => {
    const result = parseQuery("/search?q=hello");
    expect(result).toEqual({ q: "hello" });
  });

  it("handles URL-encoded parameters", () => {
    const result = parseQuery("/search?q=hello%20world&tag=rune%2Bts");
    expect(result).toEqual({ q: "hello world", tag: "rune+ts" });
  });

  it("handles multiple parameters", () => {
    const result = parseQuery("/search?limit=10&offset=0&tags=typescript,benchmark&q=performance");
    expect(result).toEqual({
      limit: "10",
      offset: "0",
      tags: "typescript,benchmark",
      q: "performance",
    });
  });
});

describe("query-param performance", () => {
  it("measures parseQuery performance", async () => {
    const url = "/search?limit=10&offset=0&tags=typescript,benchmark&q=performance";

    const result = await measure(
      "query-param parse",
      async () => {
        return parseQuery(url);
      },
      10000,
    );

    expect(result.ops).toBe(10000);
    expect(result.opsPerSec).toBeGreaterThan(10000);
  });
});
