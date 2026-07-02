---
title: CLI
description: Using the create-rune CLI tool to scaffold projects
sidebar:
  order: 1
---

## create-rune

Scaffold a new Rune project:

```bash
bunx create-rune my-api
```

Creates:

```
my-api/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   └── controllers/
│       └── app.controller.ts
├── tsconfig.json
└── package.json
```

## Available Commands

```bash
# Run TypeScript directly
bun src/main.ts

# Watch mode
bun --watch src/main.ts

# Build all packages
bun run build

# Run tests
bun run test

# Run tests with coverage
bun run test:coverage

# Type check
bun run typecheck

# Lint
bunx oxlint .

# Format
bunx oxfmt .
```

## Project Generation (Planned)

```bash
rune generate module <name>
rune generate controller <name>
rune generate service <name>
rune generate dto <name>
```
