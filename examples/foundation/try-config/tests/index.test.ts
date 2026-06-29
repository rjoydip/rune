import { describe, it, expect } from "bun:test";
import { ConfigLoader } from "@rune/config";

describe("try-config", () => {
  it("stores and retrieves values", () => {
    const config = new ConfigLoader();
    config.set("KEY", "value");
    expect(config.get<string>("KEY")).toBe("value");
  });

  it("returns default for missing key", () => {
    const config = new ConfigLoader();
    expect(config.get<string>("MISSING", "fallback")).toBe("fallback");
  });

  it("parses numeric strings via set", () => {
    const config = new ConfigLoader();
    config.set("MAX_CONNECTIONS", "100");
    expect(config.get<number>("MAX_CONNECTIONS")).toBe(100);
  });

  it("parses boolean strings via set", () => {
    const config = new ConfigLoader();
    config.set("FLAG", "true");
    expect(config.get<boolean>("FLAG")).toBe(true);
  });
});
