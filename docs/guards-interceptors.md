---
title: Guards & Interceptors
description: Authentication guards and interceptor pipelines
sidebar:
  order: 5
---
## Guards

Guards run before the route handler and decide whether the request is allowed through. They implement a `canActivate` method.

### Writing a Guard

```ts
import { Context } from "@rune/core";
import { Injectable } from "@rune/decorators";

@Injectable("transient")
export class AuthGuard {
  canActivate(ctx: Context): boolean {
    const token = ctx.request.headers.get("authorization");
    return token !== null && token.startsWith("Bearer ");
  }
}
```

### Async Guard

```ts
@Injectable("transient")
export class AdminGuard {
  async canActivate(ctx: Context): Promise<boolean> {
    const auth = ctx.request.headers.get("authorization");
    if (!auth) return false;
    const user = await verifyToken(auth.slice(7));
    return user.role === "admin";
  }
}
```

### Using Guards

```ts
import { Controller, Get, UseGuard } from "@rune/decorators";

// Class-level: applies to all routes
@UseGuard(AuthGuard)
@Controller("/admin")
export class AdminController {
  @Get("/dashboard")
  dashboard() {
    return { secret: "data" };
  }

  // Method-level: additional guard
  @Get("/super-secret")
  @UseGuard(SuperAdminGuard)
  superSecret() {
    return { level: "top secret" };
  }
}
```

### Module-Level Guards

Guards defined in the module's `providers` array whose class name ends with `Guard` or which implement `canActivate` are automatically applied to all controllers in that module:

```ts
@Module({
  controllers: [AdminController],
  providers: [AuthGuard, AdminGuard],
})
export class AdminModule {}
```

### Guard Execution Order

1. Module-level guards (discovered from providers)
2. Class-level guards (`@UseGuard` on the controller class)
3. Method-level guards (`@UseGuard` on the route method)

If any guard returns `false`, the request is rejected with a **403 Forbidden** response.

## Interceptors

Interceptors wrap the route handler execution, allowing you to transform the result or perform side effects.

### Writing an Interceptor

```ts
import { Context } from "@rune/core";
import { Injectable } from "@rune/decorators";

@Injectable("transient")
export class LoggingInterceptor {
  async intercept(ctx: Context, next: () => Promise<Response>): Promise<Response> {
    console.log("Before handler");
    const result = await next();
    console.log("After handler");
    return result;
  }
}
```

### Response Transformation

```ts
@Injectable("transient")
export class WrapInterceptor {
  async intercept(_ctx: Context, next: () => Promise<Response>): Promise<Response> {
    const response = await next();
    const body = await response.json();
    const wrapped = { data: body, timestamp: new Date().toISOString() };
    return new Response(JSON.stringify(wrapped), {
      status: response.status,
      headers: response.headers,
    });
  }
}
```

### Using Interceptors

```ts
import { Controller, Get, UseInterceptor } from "@rune/decorators";

// Class-level: applies to all routes
@UseInterceptor(LoggingInterceptor)
@Controller("/api")
export class ApiController {
  @Get("/public")
  publicData() {
    return { public: true };
  }

  // Method-level interceptor
  @Get("/wrapped")
  @UseInterceptor(WrapInterceptor)
  wrappedData() {
    return { secret: "wrapped" };
  }
}
```

### Interceptor Pipeline

Multiple interceptors are composed as a chain. The outermost interceptor runs first:

```ts
@UseInterceptor(LoggingInterceptor, WrapInterceptor)
// Execution: LoggingInterceptor wraps WrapInterceptor wraps handler
```

## Guard + Interceptor Interaction

Guard rejection happens before any interceptor runs:

1. Module guards check → reject 403 if failed
2. Class guards check → reject 403 if failed
3. Method guards check → reject 403 if failed
4. Interceptor chain runs
5. Route handler executes


