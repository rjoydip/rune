# @rune/adapter-vercel

Bridges a `RuneApp` to Vercel Edge Functions.

## Usage

```ts
import { RuneApp } from "@rune/core";
import { toVercelEdge } from "@rune/adapter-vercel";
import { Get } from "@rune/decorators";

class Handler {
  @Get("/hello")
  hello() {
    return { message: "Hello from Vercel Edge!" };
  }
}

const app = new RuneApp();
app.registerModule(Handler);
export default toVercelEdge(app);
```

## API

| Function            | Description                                         |
| ------------------- | --------------------------------------------------- |
| `toVercelEdge(app)` | Wraps a `RuneApp` as a Vercel Edge Function handler |

## Dependencies

- `@rune/core`
