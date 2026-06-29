# @rune/adapter-koa

Bridges a `RuneApp` to Koa as middleware.

## Usage

```ts
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import { RuneApp } from "@rune/core";
import { toKoaMiddleware } from "@rune/adapter-koa";
import { Get } from "@rune/decorators";

class Handler {
  @Get("/hello")
  hello() {
    return { message: "Hello from Koa!" };
  }
}

const app = new RuneApp();
app.registerModule(Handler);
const koaApp = new Koa();
koaApp.use(bodyParser());
koaApp.use(toKoaMiddleware(app));
koaApp.listen(3000);
```

## API

| Function               | Description                                    |
| ---------------------- | ---------------------------------------------- |
| `toKoaMiddleware(app)` | Wraps a `RuneApp` as a Koa middleware function |

## Dependencies

- `@rune/core`
- `koa` ^2.14.2
