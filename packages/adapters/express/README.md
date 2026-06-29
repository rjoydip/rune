# @rune/adapter-express

Bridges a `RuneApp` to Express.

## Usage

```ts
import express from "express";
import { RuneApp } from "@rune/core";
import { toExpress } from "@rune/adapter-express";
import { Get } from "@rune/decorators";

class Handler {
  @Get("/hello")
  hello() {
    return { message: "Hello from Express!" };
  }
}

const app = new RuneApp();
app.registerModule(Handler);
const expressApp = express();
expressApp.use(express.json());
toExpress(app, expressApp);
expressApp.listen(3000);
```

## API

| Function                     | Description                                   |
| ---------------------------- | --------------------------------------------- |
| `toExpress(app, expressApp)` | Wraps a `RuneApp` into an Express application |

## Dependencies

- `@rune/core`
- `express` ^4.18.2
