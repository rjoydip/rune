# @rune/adapter-bun

Bridges a `RuneApp` to Bun's native HTTP server.

## Usage

```ts
import { RuneApp } from "@rune/core";
import { serveBun } from "@rune/adapter-bun";
import { Get } from "@rune/decorators";

class Handler {
  @Get("/hello")
  hello() {
    return { message: "Hello from Bun!" };
  }
}

const app = new RuneApp();
app.registerModule(Handler);
serveBun(app, 3000);
```

## API

| Function               | Description                                                                |
| ---------------------- | -------------------------------------------------------------------------- |
| `serveBun(app, port?)` | Starts a Bun HTTP server using `Bun.serve()` with the app's `fetch` method |

## Dependencies

- `@rune/core`
