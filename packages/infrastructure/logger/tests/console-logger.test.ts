import { describe, it, expect, spyOn, beforeEach } from "bun:test";
import { ConsoleLogger } from "../src/console-logger";

describe("console-logger", () => {
  beforeEach(() => {
    spyOn(console, "log").mockImplementation(() => {});
    spyOn(console, "warn").mockImplementation(() => {});
    spyOn(console, "error").mockImplementation(() => {});
    spyOn(console, "debug").mockImplementation(() => {});
  });

  it("logs info messages", () => {
    const logger = new ConsoleLogger();
    logger.info("test info");
    expect(console.log).toHaveBeenCalledWith("[Rune]", "[INFO]", "test info");
  });

  it("logs warn messages", () => {
    const logger = new ConsoleLogger();
    logger.warn("test warn");
    expect(console.warn).toHaveBeenCalledWith("[Rune]", "[WARN]", "test warn");
  });

  it("logs error messages", () => {
    const logger = new ConsoleLogger();
    logger.error("test error");
    expect(console.error).toHaveBeenCalledWith("[Rune]", "[ERROR]", "test error");
  });

  it("logs debug messages", () => {
    const logger = new ConsoleLogger();
    logger.debug("test debug");
    expect(console.debug).toHaveBeenCalledWith("[Rune]", "[DEBUG]", "test debug");
  });

  it("accepts multiple arguments", () => {
    const logger = new ConsoleLogger();
    logger.info("a", "b", "c");
    expect(console.log).toHaveBeenCalledWith("[Rune]", "[INFO]", "a", "b", "c");
  });

  it("uses custom prefix", () => {
    const logger = new ConsoleLogger("[Custom]");
    logger.info("msg");
    expect(console.log).toHaveBeenCalledWith("[Custom]", "[INFO]", "msg");
  });

  it("empty string message", () => {
    const logger = new ConsoleLogger();
    logger.info("");
    expect(console.log).toHaveBeenCalledWith("[Rune]", "[INFO]", "");
  });

  it("multiple arguments mixing types", () => {
    const logger = new ConsoleLogger();
    logger.info("count:", 42, "active:", true, null, undefined);
    expect(console.log).toHaveBeenCalledWith(
      "[Rune]",
      "[INFO]",
      "count:",
      42,
      "active:",
      true,
      null,
      undefined,
    );
  });

  it("Error object as argument", () => {
    const logger = new ConsoleLogger();
    const err = new Error("boom");
    logger.error("Failed:", err);
    expect(console.error).toHaveBeenCalledWith("[Rune]", "[ERROR]", "Failed:", err);
  });
});
