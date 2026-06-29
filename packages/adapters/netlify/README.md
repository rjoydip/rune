# @rune/adapter-netlify

Bridges a `RuneApp` to Netlify Edge Functions and Netlify Functions.

## Usage

### Edge Functions

```ts
import { RuneApp } from "@rune/core";
import { toNetlifyEdge } from "@rune/adapter-netlify";
import { Get } from "@rune/decorators";

class Handler {
  @Get("/hello")
  hello() {
    return { message: "Hello from Netlify Edge!" };
  }
}

const app = new RuneApp();
app.registerModule(Handler);
export default toNetlifyEdge(app);
```

### Functions

```ts
import { RuneApp } from "@rune/core";
import { toNetlifyFunction } from "@rune/adapter-netlify";
import { Get } from "@rune/decorators";

class Handler {
  @Get("/hello")
  hello() {
    return { message: "Hello from Netlify Functions!" };
  }
}

const app = new RuneApp();
app.registerModule(Handler);
export const handler = toNetlifyFunction(app);
```

## API

| Function                 | Description                                          |
| ------------------------ | ---------------------------------------------------- |
| `toNetlifyEdge(app)`     | Wraps a `RuneApp` as a Netlify Edge Function handler |
| `toNetlifyFunction(app)` | Wraps a `RuneApp` as a Netlify Function handler      |

## Dependencies

- `@rune/core`
