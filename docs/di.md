---
title: Dependency Injection
description: Dependency injection container, scopes, and providers
sidebar:
  order: 2
---

## Container

The DI container resolves dependencies automatically via constructor injection.

```ts
import { Container, Scope } from "@rune/container";

const container = new Container();

// Register a class
container.register({
  token: UserService,
  useClass: UserService,
  scope: Scope.Singleton,
});

// Register a value
container.register({
  token: "CONFIG",
  useValue: { port: 3000 },
  scope: Scope.Singleton,
});

// Register a factory
container.register({
  token: "DB",
  useFactory: (c) => new Database(c.resolve("CONFIG")),
  scope: Scope.Singleton,
});

// Resolve
const service = container.resolve(UserService);
```

## Scopes

### Singleton

One instance for the entire application lifecycle.

```ts
@Injectable("singleton")
class DatabaseService { ... }
```

### Transient

A new instance every time it's resolved.

```ts
@Injectable("transient")
class ValueObject { ... }
```

### Request

A new instance per HTTP request (created automatically).

```ts
@Injectable("request")
class RequestContext { ... }
```

## Auto-Wiring

Constructors are inspected via `design:paramtypes` metadata (requires `emitDecoratorMetadata: true` in tsconfig).

```ts
@Injectable("singleton")
class UserService {
  constructor(
    private db: DatabaseService, // Auto-resolved
    private logger: LoggerService, // Auto-resolved
  ) {}
}
```

## Creating Scoped Containers

```ts
const requestScope = container.createScope();
const controller = requestScope.resolve(MyController);
```
