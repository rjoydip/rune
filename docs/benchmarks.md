---
title: Benchmarks
description: HTTP throughput benchmarks comparing Rune with other frameworks, plus adapter and microbenchmark reports
sidebar:
  order: 5
---

## Overview

HTTP benchmark suite comparing Rune with other popular web frameworks, plus middleware, GraphQL, and Socket benchmarks. Benchmarks live in `benchmarks/` at the repo root.

## Frameworks Tested

| Framework        | Description                                      |
| ---------------- | ------------------------------------------------ |
| **Rune**         | Web-standard, runtime-agnostic backend framework |
| **Hono**         | Ultra-fast web framework for the Edges           |
| **Elysia**       | Fast, and friendly Bun web framework             |
| **Fastify**      | Fast and low overhead web framework              |
| **Node.js HTTP** | Native Node.js http module                       |
| **Koa**          | Expressive middleware for Node.js                |
| **Express**      | Minimal and flexible Node.js web framework       |

## Routes Tested

Each framework benchmark tests the following routes:

| Route       | Method | Description                               |
| ----------- | ------ | ----------------------------------------- |
| `/hello`    | GET    | Static route returning JSON               |
| `/user/:id` | GET    | Parameterized route extracting path param |
| `/search`   | GET    | Query string parameters                   |
| `/echo`     | POST   | Request body handling                     |

## Additional Benchmarks

| Benchmark           | Description                                         |
| ------------------- | --------------------------------------------------- |
| **Middleware**      | HTTP throughput with all built-in middleware loaded |
| **Perf Middleware** | Direct middleware function microbenchmark           |
| **Router**          | Direct route matching microbenchmark                |
| **Query Param**     | Direct query string parsing microbenchmark          |
| **Event Bus**       | Event emission and handling microbenchmark          |
| **GraphQL**         | GraphQL query execution (simple, variable, POST)    |
| **Socket**          | Socket connection management and broadcast          |

## Latest Framework Results

Results from `bun run bench` (GET: 50,000 iterations, POST: 25,000 iterations, concurrency: 20):

<!-- bench-framework:start -->
| Framework |  GET /hello | GET /user/:id | GET /search | POST /echo |
|---|---|---|---|---|
| Elysia | 12,726 ops/sec | 12,916 ops/sec | 11,360 ops/sec | 8,273 ops/sec |
| Node.js HTTP | 8,140 ops/sec | 9,349 ops/sec | 9,695 ops/sec | 7,126 ops/sec |
| Fastify | 6,955 ops/sec | 7,433 ops/sec | 7,038 ops/sec | 4,921 ops/sec |
| Hono | 6,478 ops/sec | 6,764 ops/sec | 5,881 ops/sec | 2,756 ops/sec |
| Express | 5,858 ops/sec | 6,518 ops/sec | 5,697 ops/sec | 3,261 ops/sec |
| Koa | 5,829 ops/sec | 5,953 ops/sec | 5,595 ops/sec | 2,873 ops/sec |
| Rune | 4,944 ops/sec | 5,407 ops/sec | 5,347 ops/sec | 3,683 ops/sec |
<!-- bench-framework:end -->

> Measured on GitHub Actions `ubuntu-latest` using Bun 1.4.0. Results may vary by environment.

## Adapter Benchmarks

HTTP throughput comparison of Rune running on different runtime and framework adapters.

### Runtime Adapters

| Adapter     | Description                                  |
| ----------- | -------------------------------------------- |
| **Bun**     | Rune via `@rune/adapter-bun` (Bun.serve)     |
| **Node.js** | Rune via `@rune/adapter-node` (Node.js http) |

### Framework Adapters

Rune wrapped inside another framework via its adapter.

| Adapter     | Description                      |
| ----------- | -------------------------------- |
| **Elysia**  | Rune via `@rune/adapter-elysia`  |
| **Fastify** | Rune via `@rune/adapter-fastify` |
| **Koa**     | Rune via `@rune/adapter-koa`     |
| **Express** | Rune via `@rune/adapter-express` |
| **Hono**    | Rune via `@rune/adapter-hono`    |
| **h3**      | Rune via `@rune/adapter-h3`      |

### Latest Adapter Results

Results from `bun run bench:adapters` (GET: 50,000 iterations, POST: 25,000 iterations, concurrency: 100):

<!-- bench-adapter:start -->
| Adapter |  GET /hello | GET /user/:id | GET /search | POST /echo |
| --- |--- |--- |--- |--- |
| **Bun** | 9,866 ops/sec | 10,127 ops/sec | 8,638 ops/sec | 1,711 ops/sec |
| **Elysia** | 8,755 ops/sec | 8,911 ops/sec | 8,620 ops/sec | 1,688 ops/sec |
| **Fastify** | 5,559 ops/sec | 5,836 ops/sec | 5,299 ops/sec | 3,203 ops/sec |
| **Node.js** | 5,128 ops/sec | 5,979 ops/sec | 4,674 ops/sec | 3,461 ops/sec |
| **Koa** | 4,598 ops/sec | 5,367 ops/sec | 5,316 ops/sec | 4,305 ops/sec |
| **Express** | 4,261 ops/sec | 5,067 ops/sec | 3,695 ops/sec | 3,622 ops/sec |
| **Hono** | 3,083 ops/sec | 2,897 ops/sec | 2,774 ops/sec | 1,432 ops/sec |
| **h3** | 2,966 ops/sec | 2,906 ops/sec | 2,842 ops/sec | 1,500 ops/sec |
<!-- bench-adapter:end -->

> Measured on the same machine under identical load. Results may vary by environment.

## Running Benchmarks

### Install Dependencies

```bash
bun install
```

### Run All Benchmarks

```bash
bun run bench:all
```

### Run Individual Framework Benchmarks

```bash
bun run bench:rune         # Rune
bun run bench:hono         # Hono
bun run bench:elysia       # Elysia
bun run bench:fastify      # Fastify
bun run bench:node         # Node.js native HTTP
bun run bench:koa          # Koa
bun run bench:express      # Express
```

### Run Additional Benchmarks

```bash
bun run bench:middleware        # Middleware throughput
bun run bench:perf-middleware   # Middleware microbenchmark
bun run bench:router            # Router microbenchmark
bun run bench:query-param       # Query param microbenchmark
bun run bench:event-bus         # Event bus microbenchmark
bun run bench:graphql           # GraphQL query execution
bun run bench:socket            # Socket operations
```

### Run Adapter Benchmarks

```bash
bun run bench:adapter-node      # Rune via Node.js adapter
bun run bench:adapter-bun       # Rune via Bun adapter
bun run bench:adapter-elysia    # Rune via Elysia adapter
bun run bench:adapter-hono      # Rune via Hono adapter
bun run bench:adapter-express   # Rune via Express adapter
bun run bench:adapter-koa       # Rune via Koa adapter
bun run bench:adapter-fastify   # Rune via Fastify adapter
bun run bench:adapter-h3        # Rune via h3 adapter
bun run bench:adapters          # All adapter benchmarks
```

## Benchmark Configuration

### Output Fields

| Field     | Description                                   |
| --------- | --------------------------------------------- |
| `ops/sec` | Operations per second                         |
| `ms/op`   | Average latency per operation in milliseconds |

Each benchmark runs:

- **GET routes**: 50,000 iterations
- **POST routes**: 25,000 iterations

Results are measured using `performance.now()` with parallel request batching.

## Project Structure

```bash
benchmarks/
├── http.ts               # Shared HTTP benchmarking utilities
├── _app.ts               # Shared Rune app for Rune benchmark
├── measure.ts            # Microbenchmark measurement utility
├── runner.ts             # Main runner for all framework benchmarks
├── rune.ts               # Rune framework benchmark
├── hono.ts               # Hono framework benchmark
├── elysia.ts             # Elysia framework benchmark
├── fastify.ts            # Fastify framework benchmark
├── node.ts               # Node.js native HTTP benchmark
├── koa.ts                # Koa framework benchmark
├── express.ts            # Express framework benchmark
├── middleware.ts          # Middleware throughput benchmark
├── perf-middleware.ts     # Middleware microbenchmark
├── router.ts             # Router microbenchmark
├── query-param.ts        # Query param microbenchmark
├── event-bus.ts          # Event bus microbenchmark
├── graphql.ts            # GraphQL query execution benchmark
├── socket.ts             # Socket operations benchmark
├── adapter-bun.ts        # Rune via Bun adapter benchmark
├── adapter-node.ts       # Rune via Node.js adapter benchmark
├── adapter-elysia.ts     # Rune via Elysia adapter benchmark
├── adapter-hono.ts       # Rune via Hono adapter benchmark
├── adapter-express.ts    # Rune via Express adapter benchmark
├── adapter-koa.ts        # Rune via Koa adapter benchmark
├── adapter-fastify.ts    # Rune via Fastify adapter benchmark
├── adapter-h3.ts         # Rune via h3 adapter benchmark
├── adapter-runner.ts     # Adapter benchmarks runner + report
├── tests/                # Test files for benchmarks
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md             # Benchmark details and latest results
```

## Notes

- Each benchmark starts its own server on a different port
- Benchmarks run sequentially to avoid port conflicts
- `waitForServer()` retries until each server is ready before starting measurements
- Parallel requests with keep-alive connections are used for throughput measurement
- All benchmarks use the same request/response patterns for fair comparison
- Latest results are auto-generated in `benchmarks/README.md` by the runner scripts
