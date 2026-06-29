import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import * as http from "http";
import { RuneApp } from "@rune/core";
import { toKoaMiddleware } from "@rune/adapter-koa";
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import { Module, Controller, Get, Post, Body } from "@rune/decorators";

class DataDto {
  value!: string;
}

@Controller("/")
class KoaHandler {
  @Get("/hello")
  sayHello() {
    return { message: "Hello from Koa!" };
  }

  @Body(DataDto)
  @Post("/data")
  postData(body: DataDto) {
    return { received: body.value };
  }
}

@Module({ controllers: [KoaHandler], providers: [], imports: [], exports: [] })
class AppModule {}

const app = new RuneApp();
app.registerModule(AppModule);

const koaApp = new Koa();
koaApp.use(bodyParser());
koaApp.use(toKoaMiddleware(app));

let baseUrl: string;
let server: http.Server;

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    server = koaApp.listen(0, resolve);
  });
  const addr = server.address();
  if (addr && typeof addr === "object") {
    baseUrl = `http://localhost:${addr.port}`;
  }
});

afterAll(() => {
  server?.close();
});

describe("try-koa", () => {
  it("responds to GET /hello", async () => {
    const res = await fetch(`${baseUrl}/hello`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ message: "Hello from Koa!" });
  });

  it("responds to POST /data with body", async () => {
    const res = await fetch(`${baseUrl}/data`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ value: "test-data" }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: "test-data" });
  });

  it("returns 404 for unknown route", async () => {
    const res = await fetch(`${baseUrl}/unknown`);
    expect(res.status).toBe(404);
  });
});
