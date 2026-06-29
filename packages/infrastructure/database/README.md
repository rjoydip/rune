# @rune/database

Database connection abstraction. Defines minimal lifecycle methods. No default implementation — users provide their own adapter.

## Exports

| Name              | Kind      |
| ----------------- | --------- |
| `DatabaseAdapter` | Interface |

## Usage

```ts
import type { DatabaseAdapter } from "@rune/database";

class PostgresAdapter implements DatabaseAdapter {
  async connect() {
    /* connect to postgres */
  }
  async disconnect() {
    /* close pool */
  }
}
```

## API

### DatabaseAdapter

| Method         | Description                         |
| -------------- | ----------------------------------- |
| `connect()`    | Establishes the database connection |
| `disconnect()` | Closes the database connection      |

## Dependencies

None.
