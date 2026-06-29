import { describe, it, expect } from "bun:test";
import { MemoryCache } from "@rune/cache";

describe("try-cache", () => {
  it("sets and gets values", async () => {
    const cache = new MemoryCache();
    await cache.set("key", "value");
    expect(await cache.get<string>("key")).toBe("value");
  });

  it("returns null for missing key", async () => {
    const cache = new MemoryCache();
    expect(await cache.get("missing")).toBeNull();
  });

  it("deletes keys", async () => {
    const cache = new MemoryCache();
    await cache.set("key", "value");
    await cache.delete("key");
    expect(await cache.get("key")).toBeNull();
  });

  it("clears all keys", async () => {
    const cache = new MemoryCache();
    await cache.set("a", 1);
    await cache.set("b", 2);
    await cache.clear();
    expect(await cache.get("a")).toBeNull();
    expect(await cache.get("b")).toBeNull();
  });
});
