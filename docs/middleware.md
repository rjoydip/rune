---
title: Middleware
description: Custom middleware patterns and the middleware pipeline
sidebar:
  order: 4
---
## Overview

Middleware functions sit between the incoming HTTP request and your route handler. They form an onion-shaped pipeline where each layer can inspect, modify, or short-circuit the request/response.

## Signature

```ts
import type { Middleware, NextFunction } from "@rune/core";

const myMiddleware: Middleware = async (ctx, next) => {
  // before handler
  await next();
  // after handler
};
```

## Registration

```ts
import { createApp } from "@rune/core";

const app = createApp();

app.use(async (ctx, next) => {
  console.log(`${ctx.request.method} ${ctx.request.url}`);
  await next();
});
```

Order of `app.use()` calls determines execution order. First registered = outermost layer.

## Context API

The `ctx` argument is a `Context` instance with:

```ts
ctx.request          // Web-standard Request object
ctx.params           // Route path parameters
ctx.query            // Parsed query string
ctx.headers          // Request headers
ctx.body             // Parsed JSON body (Promise)
ctx.state            // Mutable Map shared across middleware
ctx.container        // Request-scoped DI container
ctx.response         // Response object (set by middleware)
ctx.send(data, status?)   // Set JSON response
ctx.sendStatus(status)    // Set status-only response
```

## Common Patterns

### Logger Middleware

```ts
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${ctx.request.method} ${ctx.request.url} - ${ms}ms`);
});
```

### CORS Middleware

```ts
app.use(async (ctx, next) => {
  const response = await next();
  if (response) {
    const headers = new Headers(response.headers);
    headers.set("access-control-allow-origin", "*");
    headers.set("access-control-allow-methods", "GET, POST, PUT, DELETE, OPTIONS");
    headers.set("access-control-allow-headers", "Content-Type, Authorization");
    return new Response(response.body, {
      status: response.status,
      headers,
    });
  }
});
```

### Auth Middleware

```ts
app.use(async (ctx, next) => {
  const auth = ctx.request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }
  const token = auth.slice(7);
  ctx.state.set("user", await verifyToken(token));
  await next();
});
```

### Error Handler Middleware

```ts
app.use(async (_ctx, next) => {
  try {
    await next();
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
});
```

### Request ID Middleware

```ts
app.use(async (ctx, next) => {
  const id = crypto.randomUUID();
  ctx.state.set("requestId", id);
  const response = await next();
  if (response) {
    const headers = new Headers(response.headers);
    headers.set("x-request-id", id);
    return new Response(response.body, { status: response.status, headers });
  }
});
```

### Response Time Header

```ts
app.use(async (ctx, next) => {
  const start = performance.now();
  const response = await next();
  const elapsed = (performance.now() - start).toFixed(2);
  if (response) {
    const headers = new Headers(response.headers);
    headers.set("x-response-time", `${elapsed}ms`);
    return new Response(response.body, { status: response.status, headers });
  }
});
```

## Short-Circuiting

Return a `Response` directly from middleware to skip the handler and all inner layers:

```ts
app.use(async (ctx) => {
  if (ctx.request.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }
  // Fall through to next middleware
  const { next } = ctx.state.get("__pipeline") ?? {};
  return next ? await next() : undefined;
});
```

## Middleware Composition

For reusable middleware groups:

```ts
import { MiddlewarePipeline } from "@rune/core";

function authMiddleware(): Middleware[] {
  return [
    async (ctx, next) => {
      /* check JWT */ await next();
    },
    async (ctx, next) => {
      /* check roles */ await next();
    },
  ];
}

const pipeline = new MiddlewarePipeline();
pipeline.use(...authMiddleware());
app.use(pipeline.compose(async (ctx) => ctx.send("ok")));
```


