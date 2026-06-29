import { describe, it, expect } from "bun:test";
import { ConsoleLogger } from "@rune/logger";

describe("try-logger", () => {
  it("logs messages without throwing", () => {
    const logger = new ConsoleLogger("Test");
    expect(() => {
      logger.info("test");
      logger.warn("test");
      logger.error("test");
      logger.debug("test");
    }).not.toThrow();
  });

  it("accepts multiple arguments", () => {
    const logger = new ConsoleLogger("Test");
    expect(() => logger.info("msg", { key: "value" })).not.toThrow();
  });
});
