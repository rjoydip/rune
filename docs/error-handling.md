---
title: Error Handling
description: Error middleware, custom errors, and exception handling
sidebar:
  order: 8
---

## Default Behavior

Unhandled errors in route handlers and middleware produce a 500 response:

```json
{
  "error": "Something went wrong"
}
```

## Global Error Middleware

```ts
import { createApp } from "@rune/core";

const app = createApp();

app.use(async (_ctx, next) => {
  try {
    await next();
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { "content-type": "application/json" },
    });
  }
});
```

## Custom Error Classes

```ts
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export class NotFoundError extends HttpError {
  constructor(resource = "Resource") {
    super(404, `${resource} not found`);
  }
}

export class BadRequestError extends HttpError {
  constructor(message = "Bad request") {
    super(400, message);
  }
}
```

## Usage in Controllers

```ts
@Controller("/users")
export class UserController {
  @Get("/:id")
  async getUser(@Param() id: string) {
    const user = await db.findUser(id);
    if (!user) {
      throw new NotFoundError("User");
    }
    return user;
  }

  @Post("/")
  createUser(@Body(CreateUserDto) dto: CreateUserDto) {
    if (dto.email.endsWith("@spam.com")) {
      throw new BadRequestError("Email domain not allowed");
    }
    return { created: true };
  }
}
```

## Validation Errors

When `@Body(CreateUserDto)` receives invalid data, a 400 response is returned automatically:

```json
{
  "error": "Validation failed",
  "details": [
    {
      "property": "email",
      "constraints": {
        "isEmail": "email must be an email"
      }
    }
  ]
}
```

## Async Error Wrapping

All route handlers are wrapped in try/catch internally. You can throw synchronously or return a rejected promise — both produce a 500 response (or the status from `HttpError`).

## Per-Module Error Handling

Group related error handling behind a middleware scoped to a specific route prefix:

```ts
app.use(async (ctx, next) => {
  if (!ctx.request.url.includes("/api/admin")) {
    return next();
  }
  try {
    return await next();
  } catch (err) {
    // Admin-specific error logging
    console.error("Admin error:", err);
    throw err; // Re-throw to global handler
  }
});
```
