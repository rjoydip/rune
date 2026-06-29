import { describe, it, expect } from "bun:test";
import { MemoryEventBus } from "../src/index";
import type { EventAdapter } from "../src/index";

describe("events exports", () => {
  it("exports MemoryEventBus", () => {
    expect(MemoryEventBus).toBeDefined();
  });

  it("exports EventAdapter type", () => {
    const bus: EventAdapter = new MemoryEventBus();
    expect(bus).toBeDefined();
  });
});
