# @rune/middleware

Built-in middleware for the Rune framework. Each middleware is a standalone function that returns a `Middleware` compatible with `RuneApp.use()`.

## Installation

```bash
bun add @rune/middleware
```

## Middleware Reference

### Authentication

| Middleware            | Description                 |
| --------------------- | --------------------------- |
| `basicAuth(options)`  | HTTP Basic Authentication   |
| `bearerAuth(options)` | Bearer Token Authentication |

**basicAuth:**

```ts
import { basicAuth } from "@rune/middleware";

app.use(
  basicAuth({
    username: "admin",
    password: "secret",
    realm: "Secure Area",
    onAuthSuccess: (ctx, username) => {
      ctx.state.set("user", username);
    },
  }),
);
```

**bearerAuth:**

```ts
import { bearerAuth } from "@rune/middleware";

app.use(bearerAuth({ token: "my-secret-token" }));
app.use(bearerAuth({ token: ["token1", "token2"] }));
```

### Security

| Middleware                | Description                                         |
| ------------------------- | --------------------------------------------------- |
| `cors(options?)`          | Cross-Origin Resource Sharing headers               |
| `secureHeaders(options?)` | Security headers (CSP, HSTS, X-Frame-Options, etc.) |

**cors:**

```ts
import { cors } from "@rune/middleware";

app.use(cors()); // Allow all origins
app.use(cors({ origin: "https://example.com", credentials: true }));
app.use(
  cors({
    origin: (origin, ctx) => (origin.endsWith(".example.com") ? origin : null),
  }),
);
```

**secureHeaders:**

```ts
import { secureHeaders } from "@rune/middleware";

app.use(secureHeaders()); // Defaults: HSTS, X-Content-Type-Options, etc.
app.use(
  secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://trusted.cdn.com"],
    },
    removePoweredBy: false,
  }),
);
```

### Utility

| Middleware                          | Description                            |
| ----------------------------------- | -------------------------------------- |
| `requestId(options?)`               | Generates/injects X-Request-Id header  |
| `logger(options?)`                  | Request logging with colorized output  |
| `etag(options?)`                    | ETag header support with 304 responses |
| `compress(options?)`                | Response compression (gzip/deflate)    |
| `timeout(duration, errorResponse?)` | Request timeout protection             |
| `poweredBy(options?)`               | X-Powered-By header                    |
| `prettyJson(options?)`              | Pretty-print JSON with query parameter |
| `trimTrailingSlash(options?)`       | Redirect trailing slash URLs           |
| `appendTrailingSlash(options?)`     | Append trailing slash to URLs          |

**requestId:**

```ts
import { requestId } from "@rune/middleware";

app.use(requestId()); // Uses X-Request-Id header, generates UUID
app.use(requestId({ headerName: "X-Trace-Id" }));
// Access via: ctx.state.get("requestId")
```

**logger:**

```ts
import { logger } from "@rune/middleware";

app.use(logger()); // Color-coded status codes
app.use(logger({ skip: (ctx) => ctx.request.url.includes("health") }));
```

**etag:**

```ts
import { etag } from "@rune/middleware";

app.use(etag()); // SHA-1 based, supports If-None-Match
app.use(etag({ weak: true }));
```

**compress:**

```ts
import { compress } from "@rune/middleware";

app.use(compress()); // Gzip for responses > 1KB
app.use(compress({ threshold: 512, encoding: "gzip" }));
```

**timeout:**

```ts
import { timeout } from "@rune/middleware";

app.use(timeout(5000)); // 5 second timeout, returns 504 on timeout
app.use(timeout(5000, new Response("Custom timeout", { status: 504 })));
```

**poweredBy:**

```ts
import { poweredBy } from "@rune/middleware";

app.use(poweredBy()); // X-Powered-By: Rune
app.use(poweredBy({ serverName: "MyApp" }));
```

**prettyJson:**

```ts
import { prettyJson } from "@rune/middleware";

app.use(prettyJson()); // Pretty-print with ?pretty query param
app.use(prettyJson({ space: 4, queryParam: "format" }));
```

**trailingSlash:**

```ts
import { trimTrailingSlash, appendTrailingSlash } from "@rune/middleware";

app.use(trimTrailingSlash()); // /foo/ -> /foo (301 redirect on 404)
app.use(trimTrailingSlash({ alwaysRedirect: true })); // Always redirect
app.use(appendTrailingSlash()); // /foo -> /foo/ (301 redirect on 404)
app.use(
  appendTrailingSlash({
    alwaysRedirect: true,
    skip: (path) => path.includes("."),
  }),
);
```

## Usage with RuneApp

```ts
import { createApp } from "@rune/core";
import { cors, logger, requestId, compress } from "@rune/middleware";

const app = createApp();

app.use(requestId());
app.use(logger());
app.use(cors({ origin: "*" }));
app.use(compress({ threshold: 512 }));

app.router.add("GET", "/", () => {
  return new Response(JSON.stringify({ hello: "world" }), {
    headers: { "content-type": "application/json" },
  });
});

export default app;
```

## API

Each middleware function takes an optional options object and returns a `Middleware`:

```ts
type Middleware = (context: Context, next: NextFunction) => Promise<Response | void>;
```

Middleware executes in registration order using an onion-shaped pipeline. Call `await next()` to pass control to the next middleware in the chain.

## Performance

Approximate throughput (measured with `bun run perf:middleware`, 100k iterations):

| Middleware          | ops/sec | ms/op |
| ------------------- | ------- | ----- |
| `bearerAuth`        | 239,000 | 0.004 |
| `cors`              | 201,000 | 0.005 |
| `requestId`         | 199,000 | 0.005 |
| `basicAuth`         | 168,000 | 0.006 |
| `trimTrailingSlash` | 120,000 | 0.008 |
| `poweredBy`         | 86,000  | 0.012 |
| `etag`              | 54,000  | 0.019 |
| `compress`          | 1,400   | 0.714 |

## Tests

```bash
bun test packages/infrastructure/middleware/tests/
# or from root:
bun run test
```

All 36 unit tests cover happy paths, edge cases (empty/missing tokens, malformed headers), and error responses (401, 403, 404, 504, 304).
