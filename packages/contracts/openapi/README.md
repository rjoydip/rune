# @rune/openapi

Auto-generates an OpenAPI 3.0.3 specification from decorator metadata.

## Exports

| Name             | Kind     |
| ---------------- | -------- |
| `OpenAPIScanner` | Class    |
| `getSwaggerHTML` | Function |

## Usage

```ts
import { RuneApp } from "@rune/core";
import { OpenAPIScanner, getSwaggerHTML } from "@rune/openapi";
import { Controller, Get, Post, Body, Module } from "@rune/decorators";

@Controller("/api")
class ApiController {
  @Get("/hello")
  hello() {
    return { message: "Hello" };
  }
}

@Module({ controllers: [ApiController] })
class AppModule {}

const app = new RuneApp();
app.registerModule(AppModule);
await app.init();

const scanner = new OpenAPIScanner(app);
const spec = scanner.generateSpec({
  title: "My API",
  version: "1.0.0",
});

// Serve Swagger UI
const html = getSwaggerHTML();
app.use(async (ctx, next) => {
  if (ctx.request.url === "/openapi.json") {
    return new Response(JSON.stringify(spec), {
      headers: { "content-type": "application/json" },
    });
  }
  if (ctx.request.url === "/docs") {
    return new Response(html, {
      headers: { "content-type": "text/html" },
    });
  }
  return next();
});
```

## API

### OpenAPIScanner

| Method               | Description                                               |
| -------------------- | --------------------------------------------------------- |
| `generateSpec(info)` | Walks module metadata and generates an OpenAPI 3.0.3 spec |

### getSwaggerHTML

Returns an HTML page that renders Swagger UI pointing at `/openapi.json`.

## Dependencies

- `@rune/decorators`
