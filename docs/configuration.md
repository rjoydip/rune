---
title: Configuration
description: Environment-based configuration with ConfigLoader
sidebar:
  order: 4
---
## ConfigLoader

`@rune/config` provides an environment-based configuration loader that auto-parses typed values.

### Basic Usage

```ts
import { ConfigLoader } from "@rune/config";

const config = new ConfigLoader();

const port = config.get<number>("PORT", 3000);
const dbUrl = config.get<string>("DATABASE_URL");
const debug = config.get<boolean>("DEBUG", false);
```

### Auto-Parsing

Values from `process.env` are automatically parsed:

| Environment Value | Parsed Type                    |
| ----------------- | ------------------------------ |
| `"true"`          | `true`                         |
| `"false"`         | `false`                        |
| `"null"`          | `null`                         |
| `"undefined"`     | `undefined`                    |
| `"8080"`          | `8080` (number)                |
| `"hello"`         | `"hello"` (string, unmodified) |

Exception: the key `"PORT"` is always stored as a string.

### Explicit Set

```ts
config.set("DATABASE_URL", "postgres://localhost:5432/myapp");
config.set("MAX_CONNECTIONS", "100"); // stored as number 100
config.set("PORT", "8080"); // stored as string "8080"
```

### Typed Access

```ts
const timeout = config.get<number>("REQUEST_TIMEOUT", 5000);
const allowed = config.get<string[]>("ALLOWED_ORIGINS", ["*"]);
```

## With DI

Register the config as a provider:

```ts
import { ConfigLoader } from "@rune/config";
import { Module, Injectable } from "@rune/decorators";

@Injectable("singleton")
export class AppConfig {
  readonly port: number;
  readonly dbUrl: string;
  readonly jwtSecret: string;

  constructor() {
    const config = new ConfigLoader();
    this.port = config.get<number>("PORT", 3000);
    this.dbUrl = config.get<string>("DATABASE_URL", "postgres://localhost:5432/app");
    this.jwtSecret = config.get<string>("JWT_SECRET", "dev-secret");
  }
}
```

## With Module

```ts
@Module({
  providers: [AppConfig],
  controllers: [UserController],
})
export class AppModule {}
```

## Best Practices

- Prefix env vars with your app name (`MYAPP_DB_URL`, `MYAPP_PORT`)
- Use `.env` files in development (loaded by Bun natively, or via `dotenv` in Node)
- Never commit secrets. Document required env vars in a `.env.example` file:

```
PORT=3000
DATABASE_URL=postgres://localhost:5432/myapp
JWT_SECRET=change-me-in-production
```


