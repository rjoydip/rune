---
title: Runtime Adapters
description: Deploying to Node, Bun, Deno, Cloudflare Workers, and more
sidebar:
  order: 1
---
Deploy the same application code to any runtime.

## Node.js

```ts
import { createServer } from "node:http";
import { createApp } from "@rune/core";

const app = createApp();
app.registerModule(AppModule);

const server = createServer(async (req, res) => {
  const url = `http://${req.headers.host}${req.url}`;
  const request = new Request(url, {
    method: req.method,
    headers: req.headers as Record<string, string>,
  });
  const response = await app.fetch(request);
  res.statusCode = response.status;
  response.headers.forEach((v, k) => res.setHeader(k, v));
  res.end(await response.text());
});

server.listen(3000);
```

## Bun

```ts
import { createApp } from "@rune/core";
const app = createApp();
app.registerModule(AppModule);

Bun.serve({
  port: 3000,
  fetch: (req) => app.fetch(req),
});
```

## Hono

```ts
import { Hono } from "hono";
import { toHono } from "@rune/adapter-hono";
import { createApp } from "@rune/core";

const app = createApp();
app.registerModule(AppModule);
const hono = toHono(app);

export default hono;
```

## Fastify

```ts
import Fastify from "fastify";
import { toFastify } from "@rune/adapter-fastify";
import { createApp } from "@rune/core";

const app = createApp();
app.registerModule(AppModule);
const fastify = toFastify(app, Fastify());

fastify.listen({ port: 3000 });
```

## Express

```ts
import express from "express";
import { toExpress } from "@rune/adapter-express";
import { createApp } from "@rune/core";

const app = createApp();
app.registerModule(AppModule);
const expressApp = toExpress(app, express());

expressApp.listen(3000);
```

## Koa

```ts
import Koa from "koa";
import { toKoaMiddleware } from "@rune/adapter-koa";
import { createApp } from "@rune/core";

const app = createApp();
app.registerModule(AppModule);
const koa = new Koa();

koa.use(toKoaMiddleware(app));
koa.listen(3000);
```

## Cloudflare Workers

```ts
import { toCloudflareWorker } from "@rune/adapter-cloudflare-workers";
import { createApp } from "@rune/core";

const app = createApp();
app.registerModule(AppModule);

export default { fetch: toCloudflareWorker(app) };
```

## Cloudflare Pages

```ts
import { toCloudflarePagesFunction } from "@rune/adapter-cloudflare-pages";
import { createApp } from "@rune/core";

const app = createApp();
app.registerModule(AppModule);

export const onRequest = toCloudflarePagesFunction(app);
```

## AWS Lambda (API Gateway / Function URL)

```ts
import { toAwsLambda } from "@rune/adapter-aws-lambda";
import { createApp } from "@rune/core";

const app = createApp();
app.registerModule(AppModule);

export const handler = toAwsLambda(app);
```

## Lambda@Edge (CloudFront)

```ts
import { toLambdaEdgeHandler, toAPIGatewayHandler } from "@rune/adapter-lambda-edge";
import { createApp } from "@rune/core";

const app = createApp();
app.registerModule(AppModule);

// For CloudFront events
export const edgeHandler = toLambdaEdgeHandler(app);
// For API Gateway events
export const apiHandler = toAPIGatewayHandler(app);
```

## Service Worker

```ts
import { toServiceWorker } from "@rune/adapter-service-worker";
import { createApp } from "@rune/core";

const app = createApp();
app.registerModule(AppModule);

self.addEventListener("fetch", toServiceWorker(app));
```

## Netlify Edge / Functions

```ts
import { toNetlifyEdge, toNetlifyFunction } from "@rune/adapter-netlify";
import { createApp } from "@rune/core";

const app = createApp();
app.registerModule(AppModule);

// Edge Functions
export default toNetlifyEdge(app);

// Serverless Functions
export const handler = toNetlifyFunction(app);
```

## Vercel Edge

```ts
import { toVercelEdge } from "@rune/adapter-vercel";
import { createApp } from "@rune/core";

const app = createApp();
app.registerModule(AppModule);

export const config = { runtime: "edge" };
export default toVercelEdge(app);
```

## Runtime Test Coverage

Each runtime adapter has integration tests under `runtime-tests/<runtime>/` that validate the adapter in its target runtime:

| Runtime      | Test directory              | Adapter tested             | Execution                       |
| ------------ | --------------------------- | -------------------------- | ------------------------------- |
| Vercel       | `runtime-tests/vercel/`     | `toVercelEdge`             | Compiled → direct fn import     |
| Cloudflare   | `runtime-tests/cloudflare/` | `toCloudflareWorker`       | Compiled → direct fn import     |
| Deno         | `runtime-tests/deno/`       | `Deno.serve` + `app.fetch` | Bun bundle → `deno run` process |
| Netlify      | `runtime-tests/netlify/`    | `toNetlifyFunction`        | Compiled → direct fn import     |
| Node.js      | `runtime-tests/node/`       | `createNodeServer`         | `bun run` child process + HTTP  |
| Node.js + TS | `runtime-tests/node-ts/`    | Raw `app.fetch()`          | Direct TypeScript import (Bun)  |

Run individual test suites:

```bash
bun run test:runtime:vercel
bun run test:runtime:cloudflare
bun run test:runtime:deno
bun run test:runtime:netlify
bun run test:runtime:node
bun run test:runtime:node-ts
```


