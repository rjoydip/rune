# @rune/router

URL router wrapping `rou3` (fast radix-tree-based router). Supports standard HTTP methods with path parameter extraction.

## Exports

| Name              | Kind      |
| ----------------- | --------- |
| `Router`          | Class     |
| `HttpMethod`      | Type      |
| `RouteDefinition` | Interface |
| `RouteMatch`      | Interface |
| `RouteHandler`    | Type      |

## Usage

```ts
import { Router } from "@rune/router";

const router = new Router();
router.addRoute("GET", "/users/:id", async (req, params, ctx) => {
  return new Response(JSON.stringify({ id: params.id }), {
    headers: { "content-type": "application/json" },
  });
});

const match = router.match("GET", "/users/42");
// match.params => { id: "42" }
```

## API

| Method                            | Description                                      |
| --------------------------------- | ------------------------------------------------ |
| `addRoute(method, path, handler)` | Registers a single route                         |
| `addRoutes(definitions)`          | Registers multiple routes                        |
| `match(method, path)`             | Looks up a route; returns `RouteMatch` or `null` |

## Dependencies

- `rou3` ^0.5.0
