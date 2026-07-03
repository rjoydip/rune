import { describe, it, expect } from "bun:test";
import { createLazySerializer, fastStringify } from "../src/json-serializer";

describe("createLazySerializer", () => {
  it("compiles on first call and reuses", () => {
    const serialize = createLazySerializer();
    const r1 = serialize({ msg: "hello" });
    const r2 = serialize({ msg: "world" });
    expect(r1).toBe('{"msg":"hello"}');
    expect(r2).toBe('{"msg":"world"}');
  });

  it("falls back to JSON.stringify for arrays", () => {
    const serialize = createLazySerializer();
    expect(serialize([1, 2, 3])).toBe("[1,2,3]");
  });

  it("falls back to JSON.stringify for primitives", () => {
    const serialize = createLazySerializer();
    expect(serialize("string")).toBe('"string"');
    expect(serialize(42)).toBe("42");
    expect(serialize(true)).toBe("true");
    expect(serialize(null)).toBe("null");
  });
});

describe("fastStringify", () => {
  it("serializes object with known keys", () => {
    expect(fastStringify({ id: "42" })).toBe('{"id":"42"}');
  });

  it("serializes arrays via JSON.stringify", () => {
    expect(fastStringify([1, 2])).toBe("[1,2]");
  });

  it("serializes primitives", () => {
    expect(fastStringify("hello")).toBe('"hello"');
    expect(fastStringify(42)).toBe("42");
    expect(fastStringify(null)).toBe("null");
  });

  it("caches serializers per shape", () => {
    const r1 = fastStringify({ a: 1, b: 2 });
    const r2 = fastStringify({ a: 3, b: 4 });
    expect(r1).toBe('{"a":1,"b":2}');
    expect(r2).toBe('{"a":3,"b":4}');
  });

  it("handles different shapes independently", () => {
    expect(fastStringify({ x: 1 })).toBe('{"x":1}');
    expect(fastStringify({ y: 2, z: 3 })).toBe('{"y":2,"z":3}');
  });
});
