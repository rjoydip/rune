# @rune/telemetry

Observability/tracing abstraction. Defines span and telemetry adapter interfaces. Includes a no-op implementation.

## Exports

| Name               | Kind      |
| ------------------ | --------- |
| `TelemetryAdapter` | Interface |
| `Span`             | Interface |
| `NoopTelemetry`    | Class     |

## Usage

```ts
import { NoopTelemetry } from "@rune/telemetry";

const telemetry = new NoopTelemetry();
const span = telemetry.startSpan("request", { method: "GET" });
span.setAttribute("user.id", "42");
span.addEvent("cache.hit");
span.end();
```

## API

### TelemetryAdapter

| Method                         | Description          |
| ------------------------------ | -------------------- |
| `startSpan(name, attributes?)` | Starts a new span    |
| `recordException(error)`       | Records an exception |

### Span

| Method                        | Description          |
| ----------------------------- | -------------------- |
| `end()`                       | Ends the span        |
| `setAttribute(key, value)`    | Sets an attribute    |
| `addEvent(name, attributes?)` | Adds an event        |
| `setStatus(status)`           | Sets the span status |

### NoopTelemetry

Silent no-op implementation where all operations are no-ops.

## Dependencies

None.
