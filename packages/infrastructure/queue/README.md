# @rune/queue

Message queue abstraction. Defines publish/consume semantics. No default implementation — users provide their own adapter.

## Exports

| Name           | Kind      |
| -------------- | --------- |
| `QueueAdapter` | Interface |

## Usage

```ts
import type { QueueAdapter } from "@rune/queue";

class RedisQueueAdapter implements QueueAdapter {
  async publish(queue: string, payload: unknown) {
    /* publish to redis */
  }
  async consume(queue: string, handler: Function) {
    /* subscribe */
  }
}
```

## API

### QueueAdapter

| Method                    | Description                      |
| ------------------------- | -------------------------------- |
| `publish(queue, payload)` | Publishes a message to a queue   |
| `consume(queue, handler)` | Registers a consumer for a queue |

## Dependencies

None.
