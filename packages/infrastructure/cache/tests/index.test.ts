import { describe, it, expect } from "bun:test";
import { MemoryCache } from "../src/index";
import type { CacheAdapter } from "../src/index";

describe("cache exports", () => {
  it("exports MemoryCache", () => {
    expect(MemoryCache).toBeDefined();
    expect(new MemoryCache()).toBeInstanceOf(MemoryCache);
  });

  it("exports CacheAdapter type", () => {
    const adapter: CacheAdapter = new MemoryCache();
    expect(adapter).toBeDefined();
  });
});
