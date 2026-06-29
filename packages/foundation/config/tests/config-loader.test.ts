import { describe, it, expect } from "bun:test";
import { ConfigLoader } from "../src/config-loader";

describe("config-loader", () => {
  it("stores and retrieves values", () => {
    const config = new ConfigLoader();
    config.set("PORT", "3000");
    expect(config.get<string>("PORT")).toBe("3000");
  });

  it("returns default for missing key", () => {
    const config = new ConfigLoader();
    expect(config.get("MISSING", "default")).toBe("default");
  });

  it("returns undefined for missing key without default", () => {
    const config = new ConfigLoader();
    expect(config.get("MISSING")).toBeUndefined();
  });

  it("parses 'true' string to boolean", () => {
    const config = new ConfigLoader();
    config.set("DEBUG", "true");
    expect(config.get<boolean>("DEBUG")).toBe(true);
  });

  it("parses 'false' string to boolean", () => {
    const config = new ConfigLoader();
    config.set("DEBUG", "false");
    expect(config.get<boolean>("DEBUG")).toBe(false);
  });

  it("parses numeric strings to numbers", () => {
    const config = new ConfigLoader();
    config.set("COUNT", "42");
    expect(config.get<number>("COUNT")).toBe(42);
  });

  it("handles 'null' string", () => {
    const config = new ConfigLoader();
    config.set("NULL", "null");
    expect(config.get("NULL")).toBeNull();
  });

  it("handles 'undefined' string", () => {
    const config = new ConfigLoader();
    config.set("UNDEF", "undefined");
    expect(config.get("UNDEF")).toBeUndefined();
  });

  it("loads from process.env", () => {
    process.env.TEST_VAR = "from_env";
    const config = new ConfigLoader();
    expect(config.get<string>("TEST_VAR")).toBe("from_env");
    delete process.env.TEST_VAR;
  });

  it("handles empty string for numeric parse", () => {
    const config = new ConfigLoader();
    config.set("EMPTY", "");
    expect(config.get<string>("EMPTY")).toBe("");
  });
});
