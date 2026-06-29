---
title: Core Concepts
description: App, Context, Middleware, and Modules explained
sidebar:
  order: 3
---

## RuneApp

The main application class. Orchestrates the entire request pipeline.

```ts
import { createApp } from "@rune/core";

const app = createApp();

// Register middleware
app.use(async (ctx, next) => {
  console.log(`${ctx.request.method} ${ctx.request.url}`);
  return next();
});

// Register modules
app.registerModule(AppModule);

// Initialize
app.init();

// Handle requests (universal)
app.fetch(request).then(response => { ... });
```

## Context

Wraps each request with utilities and state.

```ts
interface Context {
  request: Request; // Web API Request
  params: Record<string, string>; // Route params
  query: Record<string, string>; // Query string
  headers: Headers; // Request headers
  container: Container; // Request-scoped DI container
  state: Map<string, unknown>; // Shared state
  response: Response | null; // Set to short-circuit

  send(data: unknown, status?: number): Response;
  sendStatus(status: number): Response;
}
```

## Middleware

Functions that run before the controller. Can modify the request, response, or short-circuit.

```ts
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${ctx.request.method} ${ctx.request.url} - ${ms}ms`);
});

app.use(async (ctx, next) => {
  // Short-circuit example
  if (ctx.request.headers.get("x-maintenance") === "true") {
    return new Response("Under maintenance", { status: 503 });
  }
  return next();
});
```

## Modules

Organize your application into feature modules.

```ts
@Module({
  controllers: [UserController, ProfileController],
  providers: [UserService, ProfileService],
  imports: [DatabaseModule],
  exports: [UserService],
})
export class UserModule {}
```

## Controllers

Handle incoming requests and return responses.

```ts
@Controller("/users")
export class UserController {
  @Get("/")
  findAll() {
    return [{ id: 1, name: "Alice" }];
  }

  @Get("/:id")
  findOne(@Param() id: string) {
    return { id, name: "Alice" };
  }

  @Post("/")
  create(@Body() data: CreateUserDto) {
    return { created: data };
  }

  @Put("/:id")
  update(@Param() id: string, @Body() data: UpdateUserDto) {
    return { updated: { id, ...data } };
  }

  @Delete("/:id")
  remove(@Param() id: string) {
    return { deleted: id };
  }
}
```

## Dependency Injection

Three scopes available:

```ts
@Injectable("singleton")  // Single instance across the app
@Injectable("transient")  // New instance every injection
@Injectable("request")    // New instance per request
```

## Exception Handling

Errors propagate to the global error handler and return JSON:

```json
{
  "error": "Validation failed",
  "details": [...]
}
```
