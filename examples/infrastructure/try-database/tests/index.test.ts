import { describe, it, expect } from "bun:test";
import type { DatabaseAdapter } from "@rune/database";

describe("try-database", () => {
  it("implements DatabaseAdapter interface", () => {
    const db: DatabaseAdapter = {
      async connect() {},
      async disconnect() {},
    };
    expect(db.connect).toBeTypeOf("function");
    expect(db.disconnect).toBeTypeOf("function");
  });

  it("mock database stores and retrieves data", async () => {
    const store = new Map<string, unknown>();
    store.set("key", "value");
    expect(store.get("key")).toBe("value");
  });
});
