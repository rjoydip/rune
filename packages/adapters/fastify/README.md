# @rune/adapter-fastify

Bridges a `RuneApp` to Fastify.

## Usage

```ts
import Fastify from "fastify";
import { RuneApp } from "@rune/core";
import { toFastify } from "@rune/adapter-fastify";
import { Get } from "@rune/decorators";

class Handler {
  @Get("/hello")
  hello() {
    return { message: "Hello from Fastify!" };
  }
}

const app = new RuneApp();
app.registerModule(Handler);
const fastify = Fastify();
toFastify(app, fastify);
fastify.listen({ port: 3000 });
```

## API

| Function                          | Description                                  |
| --------------------------------- | -------------------------------------------- |
| `toFastify(app, fastifyInstance)` | Wraps a `RuneApp` into a Fastify application |

## Dependencies

- `@rune/core`
- `fastify` ^4.28.0
