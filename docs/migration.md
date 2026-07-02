---
title: Migration Guide
description: Migrating from Express, NestJS, and other frameworks
sidebar:
  order: 3
---

## From Express

### Controller

**Express:**

```ts
const express = require("express");
const router = express.Router();

router.get("/users", async (req, res) => {
  const users = await db.findMany();
  res.json(users);
});

router.post("/users", async (req, res) => {
  const user = await db.create(req.body);
  res.status(201).json(user);
});
```

**Rune:**

```ts
import { Controller, Get, Post, Body } from "@rune/decorators";

@Controller("/users")
export class UserController {
  @Get("/")
  async findAll() {
    return await db.findMany();
  }

  @Post("/")
  async create(@Body() body: unknown) {
    const user = await db.create(body);
    return new Response(JSON.stringify(user), { status: 201 });
  }
}
```

### Middleware

**Express:**

```ts
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
```

**Rune:**

```ts
app.use(async (ctx, next) => {
  console.log(`${ctx.request.method} ${new URL(ctx.request.url).pathname}`);
  await next();
});
```

### Error Handling

**Express:**

```ts
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});
```

**Rune:**

```ts
app.use(async (_ctx, next) => {
  try {
    await next();
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
});
```

### Adapter

Run Rune inside Express as a middleware:

```ts
import express from "express";
import { toExpress } from "@rune/adapter-express";
import { createApp } from "@rune/core";

const app = createApp();
app.registerModule(AppModule);
const expressApp = toExpress(app, express());
expressApp.listen(3000);
```

Or switch entirely to a Rune-native server:

```ts
import { serveBun } from "@rune/adapter-bun";
serveBun(app, 3000);
```

## From NestJS

### Controller

**NestJS:**

```ts
@Controller("users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }
}
```

**Rune:**

```ts
import { Controller, Get, Post, Body, Deps } from "@rune/decorators";

@Controller("/users")
@Deps(UserService)
export class UserController {
  constructor(private userService: UserService) {}

  @Get("/")
  findAll() {
    return this.userService.findAll();
  }

  @Post("/")
  create(@Body(CreateUserDto) dto: CreateUserDto) {
    return this.userService.create(dto);
  }
}
```

### Module

**NestJS:**

```ts
@Module({
  imports: [DatabaseModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
```

**Rune:**

```ts
@Module({
  imports: [DatabaseModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
```

Modules are nearly identical.

### Guards

**NestJS:**

```ts
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    return request.headers.authorization?.startsWith("Bearer ");
  }
}
```

**Rune:**

```ts
@Injectable("transient")
export class AuthGuard {
  canActivate(ctx: Context) {
    return ctx.request.headers.get("authorization")?.startsWith("Bearer ") ?? false;
  }
}
```

### Key Differences

| Aspect     | NestJS                                       | Rune                                                 |
| ---------- | -------------------------------------------- | ---------------------------------------------------- |
| Decorators | Experimental (`experimentalDecorators`)      | Native TC39 stage 3                                  |
| Metadata   | `Reflect.defineMetadata`                     | WeakMap-based (`getMeta`/`setMeta`)                  |
| Platform   | Abstraction over Express/Fastify             | Web-standard Request/Response                        |
| DI         | `@Injectable()` (default singleton)          | `@Injectable("singleton" / "transient" / "request")` |
| DI deps    | Auto-resolved via `design:paramtypes`        | `@Deps(...)` for explicit wiring                     |
| Params     | Parameter decorators (`@Body()`, `@Param()`) | Method decorators (`@Body()`, `@Param()`)            |
| Runtime    | Node.js first                                | Runtime-agnostic (Bun, Node, Deno, CF Workers, etc.) |
