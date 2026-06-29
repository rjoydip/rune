import { describe, it, expect } from "bun:test";
import { MemoryCache } from "../src/memory-cache";

describe("memory-cache", () => {
  const cache = new MemoryCache();

  it("sets and gets a value", async () => {
    await cache.set("key1", "value1");
    expect(await cache.get<string>("key1")).toBe("value1");
  });

  it("returns null for missing key", async () => {
    expect(await cache.get("nonexistent")).toBeNull();
  });

  it("deletes a key", async () => {
    await cache.set("todelete", "val");
    await cache.delete("todelete");
    expect(await cache.get("todelete")).toBeNull();
  });

  it("clears all keys", async () => {
    await cache.set("a", 1);
    await cache.set("b", 2);
    await cache.clear();
    expect(await cache.get("a")).toBeNull();
    expect(await cache.get("b")).toBeNull();
  });

  it("respects TTL expiration", async () => {
    await cache.set("ttlkey", "expires", 0);
    await new Promise((r) => setTimeout(r, 10));
    expect(await cache.get("ttlkey")).toBeNull();
  });

  it("stores objects", async () => {
    const obj = { foo: [1, 2, 3] };
    await cache.set("obj", obj);
    expect(await cache.get<{ foo: number[] }>("obj")).toEqual(obj);
  });

  it("stores numbers", async () => {
    await cache.set("num", 42);
    expect(await cache.get<number>("num")).toBe(42);
  });

  it("storing null value", async () => {
    await cache.set("nullkey", null);
    expect(await cache.get("nullkey")).toBeNull();
  });

  it("TTL that hasn't expired yet (value still accessible)", async () => {
    await cache.set("alive", "still-here", 60);
    expect(await cache.get<string>("alive")).toBe("still-here");
  });

  it("overwriting existing key", async () => {
    await cache.set("overwrite", "first");
    await cache.set("overwrite", "second");
    expect(await cache.get<string>("overwrite")).toBe("second");
  });

  it("delete non-existent key (no error)", async () => {
    await expect(cache.delete("does-not-exist")).resolves.toBeUndefined();
  });

  it("clear on empty cache (no error)", async () => {
    await expect(cache.clear()).resolves.toBeUndefined();
  });
});
