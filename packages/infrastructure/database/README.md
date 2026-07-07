# @rune/database

Database connection abstraction with built-in ORM adapters.

## Package Structure

```
@rune/database             ← umbrella (re-exports from sub-packages)
├── @rune/database-core    ← interfaces: DatabaseAdapter, OnAppInit, OnAppDestroy, DatabaseModule
├── @rune/database-drizzle ← DrizzleAdapter
└── @rune/database-prisma  ← PrismaAdapter
```

You can import from the umbrella `@rune/database` or directly from a sub-package.

## Exports

| Name              | Kind      | Package            | Description                             |
| ----------------- | --------- | ------------------ | --------------------------------------- |
| `DatabaseAdapter` | Interface | `database-core`    | Minimal lifecycle interface             |
| `OnAppInit`       | Interface | `database-core`    | Lifecycle hook for app initialization   |
| `OnAppDestroy`    | Interface | `database-core`    | Lifecycle hook for app shutdown         |
| `DatabaseModule`  | Class     | `database-core`    | Module factory for dependency injection |
| `DrizzleAdapter`  | Class     | `database-drizzle` | Wraps a Drizzle ORM database instance   |
| `PrismaAdapter`   | Class     | `database-prisma`  | Wraps a PrismaClient instance           |

## Usage

```ts
// Import from umbrella (recommended)
import { DrizzleAdapter, PrismaAdapter, DatabaseAdapter } from "@rune/database";

// Or import directly from sub-packages
import { DrizzleAdapter } from "@rune/database-drizzle";
import { PrismaAdapter } from "@rune/database-prisma";
import type { DatabaseAdapter, OnAppInit } from "@rune/database-core";
```

### DrizzleAdapter

```ts
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { DrizzleAdapter } from "@rune/database";

const sqlite = new Database("app.db");
const db = drizzle(sqlite);
const adapter = new DrizzleAdapter(db);

await adapter.connect();
const rows = adapter.client.select().from(myTable).all();
await adapter.disconnect();
```

### PrismaAdapter

```ts
import { PrismaClient } from "@prisma/client";
import { PrismaAdapter } from "@rune/database";

const prisma = new PrismaClient();
const adapter = new PrismaAdapter(prisma);

await adapter.connect(); // calls prisma.$connect()
const users = await adapter.client.user.findMany();
await adapter.disconnect(); // calls prisma.$disconnect()
```

### Lifecycle hooks with RuneApp

```ts
import { createApp } from "@rune/core";
import { DrizzleAdapter } from "@rune/database";

const adapter = new DrizzleAdapter(db);
const app = createApp();

app.onInit(() => adapter.onAppInit());
app.onDestroy(() => adapter.onAppDestroy());

await app.init();
// Application is ready
await app.destroy();
// Clean shutdown
```

### Module registration

```ts
import { Module, Deps } from "@rune/decorators";
import { DrizzleAdapter } from "@rune/database";

@Deps(DrizzleAdapter)
class MyService {
  constructor(private db: DrizzleAdapter<any>) {}
}

@Module({
  controllers: [MyController],
  providers: [MyService, DrizzleAdapter],
})
class AppModule {}
```

## API

### DatabaseAdapter

| Method         | Description                         |
| -------------- | ----------------------------------- |
| `connect()`    | Establishes the database connection |
| `disconnect()` | Closes the database connection      |

### DrizzleAdapter

Constructor: `new DrizzleAdapter<T>(client: T)`

| Method         | Description                              |
| -------------- | ---------------------------------------- |
| `connect()`    | Calls driver `.connect()` if available   |
| `disconnect()` | Calls driver `.end()` or `.close()`      |
| `client`       | The underlying Drizzle database instance |

Supports any Drizzle-compatible driver (`better-sqlite3`, `postgres.js`, `pg`, `mysql2`, `@libsql/client`).

### PrismaAdapter

Constructor: `new PrismaAdapter<T>(client: T)`

| Method         | Description                  |
| -------------- | ---------------------------- |
| `connect()`    | Calls `client.$connect()`    |
| `disconnect()` | Calls `client.$disconnect()` |
| `client`       | The underlying PrismaClient  |

### OnAppInit / OnAppDestroy

```ts
interface OnAppInit {
  onAppInit(): Promise<void>;
}

interface OnAppDestroy {
  onAppDestroy(): Promise<void>;
}
```

## Dependencies

- `@rune/database-core` — required (always)
- `@rune/database-drizzle` — required for `DrizzleAdapter`
- `@rune/database-prisma` — required for `PrismaAdapter`
- `drizzle-orm` (optional peer) — required when using `DrizzleAdapter`
- `@prisma/client` (optional peer) — required when using `PrismaAdapter`
