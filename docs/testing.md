---
title: Testing
description: Unit testing controllers, middleware, and services
sidebar:
  order: 2
---

Rune uses `bun:test` for testing. Since the framework is built on web-standard `Request` / `Response`, you can test route handlers directly without a running server.

## Setting Up

Rune's own test suite uses `bun:test` with `@rune/core` and `@rune/decorators`:

```ts
import { describe, it, expect, beforeAll } from "bun:test";
import { createApp } from "@rune/core";
```

## Testing a Controller

### 1. Define the controller

```ts
// app.controller.ts
import { Controller, Get, Post, Body } from "@rune/decorators";

@Controller("/")
export class AppController {
  @Get("/hello")
  hello() {
    return { message: "Hello, Rune!" };
  }

  @Post("/echo")
  echo(@Body() body: unknown) {
    return { received: body };
  }
}
```

### 2. Write the test

```ts
// app.test.ts
import { describe, it, expect } from "bun:test";
import { createApp } from "@rune/core";
import { Module } from "@rune/decorators";
import { AppController } from "./app.controller.ts";

@Module({
  controllers: [AppController],
  providers: [],
})
class TestModule {}

describe("AppController", () => {
  const app = createApp();
  app.registerModule(TestModule);

  it("GET /hello returns greeting", async () => {
    const res = await app.fetch(new Request("http://localhost/hello"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ message: "Hello, Rune!" });
  });

  it("POST /echo returns body", async () => {
    const res = await app.fetch(
      new Request("http://localhost/echo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ foo: "bar" }),
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ received: { foo: "bar" } });
  });
});
```

## Testing 404

```ts
it("returns 404 for unknown routes", async () => {
  const res = await app.fetch(new Request("http://localhost/nonexistent"));
  expect(res.status).toBe(404);
});
```

## Testing Guards

```ts
@Module({
  controllers: [AdminController],
  providers: [AuthGuard],
})
class AdminTestModule {}

it("rejects unauthenticated requests", async () => {
  const app = createApp();
  app.registerModule(AdminTestModule);

  const res = await app.fetch(new Request("http://localhost/admin/dashboard"));
  expect(res.status).toBe(403);
});

it("allows authenticated requests", async () => {
  const app = createApp();
  app.registerModule(AdminTestModule);

  const res = await app.fetch(
    new Request("http://localhost/admin/dashboard", {
      headers: { authorization: "Bearer valid-token" },
    }),
  );
  expect(res.status).toBe(200);
});
```

## Testing Middleware

```ts
it("adds request ID header", async () => {
  const app = createApp();
  app.use(async (ctx, next) => {
    ctx.state.set("requestId", crypto.randomUUID());
    const response = await next();
    if (response) {
      const headers = new Headers(response.headers);
      headers.set("x-request-id", ctx.state.get("requestId") as string);
      return new Response(response.body, { status: response.status, headers });
    }
  });
  app.registerModule(TestModule);

  const res = await app.fetch(new Request("http://localhost/hello"));
  expect(res.headers.has("x-request-id")).toBe(true);
});
```

## Running Tests

```bash
bun test
bun test --coverage
bun test --watch
```

## Best Practices

- Create a fresh `RuneApp` instance per test with a test-specific module
- Use meaningful URLs (`http://localhost/path`) — the hostname is irrelevant
- Test status codes, response body shape, and headers
- Test both success and error paths (400, 403, 404, 500)
- Avoid testing runtime adapter integration (Express/Hono/Koa) — test the raw `app.fetch()` instead
