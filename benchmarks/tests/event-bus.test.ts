import { describe, expect, it } from "bun:test";
import { MemoryEventBus } from "@rune/events";
import { measure } from "../measure";

describe("MemoryEventBus", () => {
  it("emits and receives events", async () => {
    const bus = new MemoryEventBus();
    let received = 0;

    await bus.on("test.event", async () => {
      received++;
    });

    await bus.emit("test.event", { data: 1 });
    expect(received).toBe(1);
  });

  it("handles multiple listeners", async () => {
    const bus = new MemoryEventBus();
    let count1 = 0;
    let count2 = 0;

    await bus.on("test.event", async () => {
      count1++;
    });
    await bus.on("test.event", async () => {
      count2++;
    });

    await bus.emit("test.event", {});
    expect(count1).toBe(1);
    expect(count2).toBe(1);
  });

  it("handles emit with no listeners", async () => {
    const bus = new MemoryEventBus();

    expect(() => bus.emit("noop.event", {})).not.toThrow();
  });
});

describe("event-bus performance", () => {
  it("measures emit + handle performance", async () => {
    const bus = new MemoryEventBus();
    await bus.on("test.event", async () => {});

    const result = await measure(
      "event-bus emit + handle",
      async () => {
        await bus.emit("test.event", { data: 1 });
      },
      5000,
    );

    expect(result.ops).toBe(5000);
    expect(result.opsPerSec).toBeGreaterThan(100);
  });

  it("measures emit without listeners performance", async () => {
    const bus = new MemoryEventBus();

    const result = await measure(
      "event-bus emit (no listeners)",
      async () => {
        await bus.emit("noop.event", { data: 1 });
      },
      5000,
    );

    expect(result.ops).toBe(5000);
    expect(result.opsPerSec).toBeGreaterThan(100);
  });
});
