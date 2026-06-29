# @rune/adapter-node

Bridges a `RuneApp` to Node.js native `http` and `https` modules.

## Usage

```ts
import http from "http";
import { RuneApp } from "@rune/core";
import { createNodeServer } from "@rune/adapter-node";
import { Get } from "@rune/decorators";

class Handler {
  @Get("/hello")
  hello() {
    return { message: "Hello from Node!" };
  }
}

const app = new RuneApp();
app.registerModule(Handler);
const server = createNodeServer(app);
server.listen(3000, () => console.log("Listening on port 3000"));
```

For HTTPS:

```ts
import https from "https";
import { readFileSync } from "fs";
import { createNodeHttpsServer } from "@rune/adapter-node";

const options = {
  key: readFileSync("key.pem"),
  cert: readFileSync("cert.pem"),
};

const server = createNodeHttpsServer(app, options);
server.listen(3000);
```

## API

| Function                               | Description                                          |
| -------------------------------------- | ---------------------------------------------------- |
| `createNodeServer(app, options?)`      | Creates an `http.Server` that forwards to `RuneApp`  |
| `createNodeHttpsServer(app, options?)` | Creates an `https.Server` that forwards to `RuneApp` |

## Dependencies

- `@rune/core`
