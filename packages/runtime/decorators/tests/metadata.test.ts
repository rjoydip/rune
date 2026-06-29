import { describe, it, expect } from "bun:test";
import { setMeta, getMeta, deleteMeta, getOwnMeta, keysMeta } from "../src/metadata";

describe("metadata functions", () => {
  it("sets and gets metadata", () => {
    const obj = {};
    setMeta(obj, "key1", "value1");
    expect(getMeta(obj, "key1")).toBe("value1");
  });

  it("gets own metadata", () => {
    const obj = {};
    setMeta(obj, "key1", "value1");
    setMeta(obj, "key2", "value2");
    expect(getOwnMeta(obj)).toEqual({ key1: "value1", key2: "value2" });
  });

  it("deletes metadata", () => {
    const obj = {};
    setMeta(obj, "key1", "value1");
    deleteMeta(obj, "key1");
    expect(getMeta(obj, "key1")).toBeUndefined();
  });

  it("returns empty object for non-existent metadata", () => {
    const obj = {};
    expect(getMeta(obj, "nonexistent")).toBeUndefined();
    expect(getOwnMeta(obj)).toEqual({});
  });

  it("returns keys of metadata", () => {
    const obj = {};
    setMeta(obj, "key1", "value1");
    setMeta(obj, "key2", "value2");
    expect(keysMeta(obj)).toEqual(["key1", "key2"]);
  });
});
