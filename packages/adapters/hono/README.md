# @rune/adapter-hono

Bridges a `RuneApp` to Hono.

## Usage

```ts
import { RuneApp } from "@rune/core";
import { toHono } from "@rune/adapter-hono";
import { Get } from "@rune/decorators";
import { serve } from "@hono/node-server";

class Handler {
  @Get("/hello")
  hello() {
    return { message: "Hello from Hono!" };
  }
}

const app = new RuneApp();
app.registerModule(Handler);
const hono = toHono(app);
serve({ fetch: hono.fetch, port: 3000 });
```

## API

| Function      | Description                             |
| ------------- | --------------------------------------- |
| `toHono(app)` | Wraps a `RuneApp` as a Hono application |

## Dependencies

- `@rune/core`
- `hono` ^4.12.26
