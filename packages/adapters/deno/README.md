# @rune/adapter-deno

Bridges a `RuneApp` to Deno's native HTTP server (`Deno.serve`).

## Usage

```ts
import { RuneApp } from "@rune/core";
import { serveDeno } from "@rune/adapter-deno";
import { Get } from "@rune/decorators";

class Handler {
  @Get("/hello")
  hello() {
    return { message: "Hello from Deno!" };
  }
}

const app = new RuneApp();
app.registerModule(Handler);
serveDeno(app, { port: 3000 });
```

## API

| Function                   | Description                                                                  |
| -------------------------- | ---------------------------------------------------------------------------- |
| `serveDeno(app, options?)` | Starts a Deno HTTP server using `Deno.serve()` with the app's `fetch` method |

### Options

| Property   | Type          | Default     | Description                |
| ---------- | ------------- | ----------- | -------------------------- |
| `port`     | `number`      | `3000`      | Port to listen on          |
| `hostname` | `string`      | `"0.0.0.0"` | Hostname to bind to        |
| `signal`   | `AbortSignal` | `undefined` | Signal to abort the server |
| `onError`  | `function`    | `undefined` | Custom error handler       |

## Dependencies

- `@rune/core`
