import { describe, it, expect } from "bun:test";
import { createLazySerializer } from "../src/json-serializer";

describe("createLazySerializer", () => {
  it("compiles on first call and reuses", () => {
    const serialize = createLazySerializer();
    const r1 = serialize({ msg: "hello" });
    const r2 = serialize({ msg: "world" });
    expect(r1).toBe('{"msg":"hello"}');
    expect(r2).toBe('{"msg":"world"}');
  });

  it("recompiles when object shape changes", () => {
    const serialize = createLazySerializer();
    expect(serialize({ msg: "hello" })).toBe('{"msg":"hello"}');
    expect(serialize({ id: 42 })).toBe('{"id":42}');
    expect(serialize({ msg: "hello" })).toBe('{"msg":"hello"}');
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
