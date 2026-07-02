---
title: Getting Started
description: Install, setup, and create your first Rune application
sidebar:
  order: 1
---

## Prerequisites

- [Bun](https://bun.sh) >= 1.2
- [Node.js](https://nodejs.org) >= 18 (for non-Bun runtimes)

```bash
curl -fsSL https://bun.sh/install | bash
```

## Installation

```bash
bunx create-rune my-app
cd my-app
bun install
bun run dev
```

## Manual Setup

```bash
mkdir my-app && cd my-app
bun init -y
bun add @rune/core @rune/decorators
```

## Your First App

### 1. Create a Controller

```ts
// src/controllers/hello.controller.ts
import { Controller, Get } from "@rune/decorators";

@Controller("/")
export class HelloController {
  @Get("/")
  hello() {
    return { message: "Hello, Rune!" };
  }
}
```

### 2. Create a Module

```ts
// src/app.module.ts
import { Module } from "@rune/decorators";
import { HelloController } from "./controllers/hello.controller";

@Module({
  controllers: [HelloController],
  providers: [],
  imports: [],
  exports: [],
})
export class AppModule {}
```

### 3. Bootstrap

```ts
// src/main.ts
import { createApp } from "@rune/core";
import { AppModule } from "./app.module";

const app = createApp();
app.registerModule(AppModule);
app.init();

Bun.serve({
  port: 3000,
  fetch: (req) => app.fetch(req),
});

console.log("Server running on http://localhost:3000");
```

### 4. Run

```bash
bun src/main.ts
# or with watch mode
bun --watch src/main.ts
```

## Next Steps

- Learn about [Decorators](/decorators/)
- Add [Validation](/validation/)
- Generate [OpenAPI docs](/openapi/)
- Deploy with [Runtime Adapters](/runtime-adapters/)
