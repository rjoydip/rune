# @rune/container

Lightweight dependency injection container supporting singleton, transient, and request scopes.

## Exports

| Name           | Kind      |
| -------------- | --------- |
| `Container`    | Class     |
| `Scope`        | Enum      |
| `IContainer`   | Interface |
| `Registration` | Interface |
| `Token`        | Type      |

## Usage

```ts
import { Container, Scope } from "@rune/container";

const container = new Container();
container.register({
  token: "Config",
  useValue: { port: 3000 },
});
container.register({
  token: DatabaseService,
  useClass: DatabaseService,
  scope: Scope.Singleton,
});
const db = container.resolve(DatabaseService);
```

## Scopes

| Scope       | Behavior                                             |
| ----------- | ---------------------------------------------------- |
| `Singleton` | Single instance shared across all resolves           |
| `Transient` | New instance created on every resolve                |
| `Request`   | Instance scoped to a `resolve` call with context map |

## API

| Method                     | Description                       |
| -------------------------- | --------------------------------- |
| `register(registration)`   | Registers a token with a provider |
| `resolve(token, context?)` | Resolves an instance by token     |
| `createScope()`            | Creates a child scope container   |
| `has(token)`               | Checks if a token is registered   |

## Dependencies

None.
