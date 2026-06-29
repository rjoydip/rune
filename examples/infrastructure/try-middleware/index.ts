import { createApp } from "@rune/core";
import {
  requestId,
  logger,
  cors,
  secureHeaders,
  poweredBy,
  prettyJson,
  timeout,
  compress,
} from "@rune/middleware";

const app = createApp();

app.use(requestId());
app.use(logger());
app.use(cors({ origin: "*" }));
app.use(secureHeaders({ removePoweredBy: false }));
app.use(poweredBy({ serverName: "Rune Middleware Demo" }));
app.use(compress({ threshold: 512 }));
app.use(timeout(10000));
app.use(prettyJson());

app.router.add("GET", "/", () => {
  return new Response(JSON.stringify({ message: "Hello from Rune Middleware!" }), {
    headers: { "content-type": "application/json" },
  });
});

app.router.add("GET", "/data", () => {
  return new Response(JSON.stringify({ users: ["Alice", "Bob", "Charlie"] }), {
    headers: { "content-type": "application/json" },
  });
});

app.router.add("POST", "/echo", async (req: Request) => {
  const body = await req.json();
  return new Response(JSON.stringify({ echoed: body }), {
    headers: { "content-type": "application/json" },
  });
});

app.router.add("GET", "/large", () => {
  return new Response(JSON.stringify({ data: "x".repeat(5000) }), {
    headers: { "content-type": "application/json" },
  });
});

export default app;
