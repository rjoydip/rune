---
title: OpenAPI
description: Auto-generating OpenAPI 3.0 specs from decorators
sidebar:
  order: 7
---

## Auto-Generation

Rune automatically generates an OpenAPI 3.0 specification from your decorators.

```ts
import { OpenAPIScanner } from "@rune/openapi";
import { AppModule } from "./app.module";

const scanner = new OpenAPIScanner("My API", "1.0.0");
const spec = scanner.scan(AppModule);

// Serve as JSON
app.use(async (ctx, next) => {
  if (ctx.request.url.endsWith("/openapi.json")) {
    return new Response(JSON.stringify(spec), {
      headers: { "content-type": "application/json" },
    });
  }
  return next();
});
```

## Swagger UI

```ts
import { getSwaggerHTML } from "@rune/openapi";

app.use(async (ctx, next) => {
  if (ctx.request.url.endsWith("/docs")) {
    return new Response(getSwaggerHTML(), {
      headers: { "content-type": "text/html" },
    });
  }
  return next();
});
```

## Generated Schema

The scanner reads:

- `@Controller("/users")` — path prefix
- `@Get("/:id")`, `@Post("/")` — methods and paths
- `@Body(CreateUserDto)`, `@Param()`, `@Query()` — parameters
- DTO class metadata (from class-validator decorators)

And produces:

```json
{
  "openapi": "3.0.3",
  "info": { "title": "My API", "version": "1.0.0" },
  "paths": {
    "/users": {
      "get": {
        "operationId": "GET_users",
        "summary": "GET /users",
        "responses": { "200": { "description": "Success" } }
      },
      "post": {
        "operationId": "POST_users",
        "summary": "POST /users",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": { "schema": { "type": "object" } }
          }
        },
        "responses": { "200": { "description": "Success" } }
      }
    }
  }
}
```
