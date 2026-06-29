import { createApp, Context } from "@rune/core";

const app = createApp();

app.use(async (ctx: Context, next) => {
  console.log(`${ctx.request.method} ${ctx.request.url}`);
  await next();
});

app.router.add("GET", "/hello", () => {
  return new Response(JSON.stringify({ message: "Hello from Rune!" }), {
    headers: { "content-type": "application/json" },
  });
});

app.router.add("POST", "/echo", async (request) => {
  const body = await request.text();
  return new Response(body, {
    status: 201,
    headers: { "content-type": "text/plain" },
  });
});

export default app;
