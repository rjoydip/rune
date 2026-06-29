# @rune/events

Event system with an adapter interface. Provides an in-memory event bus implementation.

## Exports

| Name             | Kind      |
| ---------------- | --------- |
| `EventAdapter`   | Interface |
| `MemoryEventBus` | Class     |

## Usage

```ts
import { MemoryEventBus } from "@rune/events";

const bus = new MemoryEventBus();
await bus.on("user.created", async (payload) => {
  console.log("User created:", payload);
});
await bus.emit("user.created", { id: 1, name: "Alice" });
```

## API

### EventAdapter

| Method                 | Description                          |
| ---------------------- | ------------------------------------ |
| `emit(event, payload)` | Emits an event with optional payload |
| `on(event, handler)`   | Registers a handler for an event     |

### MemoryEventBus

In-memory implementation using `Map<string, handler[]>`.

## Dependencies

None.
