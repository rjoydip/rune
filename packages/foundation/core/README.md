# @rune/core

The main orchestrator of the Rune framework. Creates the application, registers modules, sets up the middleware pipeline, and processes incoming `Request` objects through the pipeline.

## Exports

| Name                 | Kind     |
| -------------------- | -------- |
| `RuneApp`            | Class    |
| `Context`            | Class    |
| `MiddlewarePipeline` | Class    |
| `ModuleLoader`       | Class    |
| `createApp`          | Function |

## Usage

```ts
import { RuneApp } from "@rune/core";

const app = new RuneApp();
app.use(async (ctx, next) => {
  console.log(ctx.request.method, ctx.request.url);
  return next();
});
app.registerModule(AppModule);
await app.init();
const response = await app.fetch(new Request("http://localhost/hello"));
```

## API

### RuneApp

| Method                        | Description                                |
| ----------------------------- | ------------------------------------------ |
| `use(middleware)`             | Adds middleware to the pipeline            |
| `registerModule(moduleClass)` | Registers a `@Module` class                |
| `init()`                      | Initializes the app (idempotent)           |
| `fetch(request)`              | Processes a `Request` through the pipeline |

### Context

Wraps each request with `request`, `params`, `container`, `state`, and `response`. Provides `send(body)` and `sendStatus(code)` conveniences.

### MiddlewarePipeline

Composable middleware chain using a koa-style `next()` pattern.

## Dependencies

- `@rune/container`
- `@rune/router`
- `@rune/decorators`
- `@rune/validation`
