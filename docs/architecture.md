---
title: Architecture
description: How the Rune request pipeline works
sidebar:
  order: 2
---

## Request Pipeline

```
Incoming Request
        │
        ▼
      Router  (rou3)
   ─ Matches method + path
   ─ Extracts URL params
        │
        ▼
Middleware Pipeline
   ─ app.use(middleware)
   ─ Each middleware calls next()
   ─ Can short-circuit response
        │
        ▼
     Guards
   ─ Authentication checks
   ─ Authorization checks
   ─ canActivate() returns boolean
        │
        ▼
Validation Pipe
   ─ plainToInstance() via class-transformer
   ─ validate() via class-validator
   ─ Throws ValidationErrorBag on failure
        │
        ▼
   Controller
   ─ Method invoked with resolved params
   ─ Return value serialized to JSON Response
        │
        ▼
  Response
   ─ Web API Response object
   ─ content-type: application/json
```

## Module System

```
Root Module
  ├── imports → [FeatureModule, SharedModule]
  ├── controllers → [UserController, HealthController]
  └── providers → [UserService, EmailService]

Feature Module
  ├── controllers → [ProductController]
  └── providers → [ProductService, ProductRepository]
```

## Dependency Graph

```
@rune/decorators ← @rune/core → @rune/router (rou3)
       ↑                      ↑
@rune/validation ─────────────┘
       ↑
@rune/container

@rune/cache    (interface) → @rune/cache-redis (impl)
@rune/logger   (interface) → @rune/logger-pino (impl)
@rune/events   (interface) → @rune/events-kafka (impl)
@rune/graphql  (interface) → @rune/graphql-handler (built-in)
@rune/queue    (interface) → @rune/queue-bullmq (impl)
@rune/mail     (interface) → @rune/mail-resend (impl)
@rune/database-core    (interface + DatabaseModule)
@rune/database-drizzle  (DrizzleAdapter — wraps Drizzle ORM)
@rune/database-prisma   (PrismaAdapter — wraps PrismaClient)
@rune/socket   (interface) → @rune/socket-handler (built-in)
@rune/telemetry(interface) → @rune/otel (impl)
```

## Adapter Architecture

```
┌─────────────────────────────────────────┐
│            Application Code              │
│  @Controller, @Get, @Body, @Injectable  │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│            @rune/core                   │
│  RuneApp.fetch(request) → Response     │
└────────────┬────────────────────────────┘
             │
             │
    ┌────────┴────────┐
    │                  │
┌───▼────┐     ┌──────▼───┐
│ Runtime  │     │Infrastructure│
│Adapter   │     │Adapter      │
│          │     │             │
│Bun       │     │Redis Cache  │
│Hono      │     │BullMQ Queue │
│Express   │     │Drizzle DB   │
│Lambda    │     │Resend Mail  │
│Workers   │     │OTel Trace   │
└──────────┘     └─────────────┘
```
