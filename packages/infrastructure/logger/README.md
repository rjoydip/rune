# @rune/logger

Logging abstraction with an adapter interface. Includes a console-based implementation.

## Exports

| Name            | Kind      |
| --------------- | --------- |
| `LoggerAdapter` | Interface |
| `ConsoleLogger` | Class     |

## Usage

```ts
import { ConsoleLogger } from "@rune/logger";

const logger = new ConsoleLogger();
logger.info("Server started on port", 3000);
logger.warn("Deprecated API called");
logger.error("Failed to connect", err);
logger.debug("Request details:", { method, url });
```

## API

### LoggerAdapter

| Method           | Description          |
| ---------------- | -------------------- |
| `info(...args)`  | Logs an info message |
| `warn(...args)`  | Logs a warning       |
| `error(...args)` | Logs an error        |
| `debug(...args)` | Logs a debug message |

### ConsoleLogger

Prefixes messages with `[Rune] [LEVEL]` and delegates to `console.log`/`console.warn`/`console.error`/`console.debug`.

## Dependencies

None.
