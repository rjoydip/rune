import { describe, it, expect } from "bun:test";
import { ConsoleLogger } from "../src/index";
import type { LoggerAdapter } from "../src/index";

describe("logger exports", () => {
  it("exports ConsoleLogger", () => {
    expect(ConsoleLogger).toBeDefined();
  });

  it("exports LoggerAdapter type", () => {
    const logger: LoggerAdapter = new ConsoleLogger();
    expect(logger).toBeDefined();
  });
});
