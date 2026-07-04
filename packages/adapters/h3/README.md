# @rune/adapter-h3

Bridges a `RuneApp` to h3.

## Usage

```ts
import { RuneApp } from "@rune/core";
import { toH3 } from "@rune/adapter-h3";
import { Get } from "@rune/decorators";
import { createServer } from "node:http";
import { toNodeHandler } from "h3/node";

class Handler {
  @Get("/hello")
  hello() {
    return { message: "Hello from h3!" };
  }
}

const app = new RuneApp();
app.registerModule(Handler);
const h3App = toH3(app);
createServer(toNodeHandler(h3App)).listen(3000);
```

## API

| Function    | Description                    |
| ----------- | ------------------------------ |
| `toH3(app)` | Wraps a `RuneApp` as an h3 app |

## Dependencies

- `@rune/core`
- `h3` ^2.0.1-rc.22
