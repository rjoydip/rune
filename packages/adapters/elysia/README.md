# @rune/adapter-elysia

Bridges a `RuneApp` to Elysia.

## Usage

```ts
import { RuneApp } from "@rune/core";
import { toElysia } from "@rune/adapter-elysia";
import { Get } from "@rune/decorators";

class Handler {
  @Get("/hello")
  hello() {
    return { message: "Hello from Elysia!" };
  }
}

const app = new RuneApp();
app.registerModule(Handler);
const elysia = toElysia(app);
elysia.listen(3000);
```

## API

| Function        | Description                                |
| --------------- | ------------------------------------------ |
| `toElysia(app)` | Wraps a `RuneApp` as an Elysia application |

## Dependencies

- `@rune/core`
- `elysia` ^1.4.29
