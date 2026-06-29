import { describe, it, expect, mock } from "bun:test";
import { MemoryEventBus } from "../src/memory-event-bus";

describe("memory-event-bus", () => {
  it("emits and receives events", async () => {
    const bus = new MemoryEventBus();
    const handler = mock();
    await bus.on("user.created", handler);
    await bus.emit("user.created", { id: 1 });
    expect(handler).toHaveBeenCalledWith({ id: 1 });
  });

  it("supports multiple handlers for same event", async () => {
    const bus = new MemoryEventBus();
    const h1 = mock();
    const h2 = mock();
    await bus.on("event", h1);
    await bus.on("event", h2);
    await bus.emit("event", "data");
    expect(h1).toHaveBeenCalledWith("data");
    expect(h2).toHaveBeenCalledWith("data");
  });

  it("does nothing when no handlers registered", async () => {
    const bus = new MemoryEventBus();
    await expect(bus.emit("noop", "data")).resolves.toBeUndefined();
  });

  it("supports async handlers", async () => {
    const bus = new MemoryEventBus();
    const handler = mock(async () => {});
    await bus.on("async", handler);
    await bus.emit("async", "payload");
    expect(handler).toHaveBeenCalledWith("payload");
  });

  it("handles multiple events independently", async () => {
    const bus = new MemoryEventBus();
    const h1 = mock();
    const h2 = mock();
    await bus.on("event1", h1);
    await bus.on("event2", h2);
    await bus.emit("event1", "one");
    expect(h1).toHaveBeenCalledWith("one");
    expect(h2).not.toHaveBeenCalled();
  });
});
