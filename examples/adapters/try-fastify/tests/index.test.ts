import { describe, it, expect } from "bun:test";
import { RuneApp } from "@rune/core";
import { toFastify } from "@rune/adapter-fastify";
import Fastify from "fastify";
import { Module, Controller, Get, Post, Body } from "@rune/decorators";

class DataDto {
  value!: string;
}

@Controller("/")
class FastifyHandler {
  @Get("/hello")
  sayHello() {
    return { message: "Hello from Fastify!" };
  }

  @Body(DataDto)
  @Post("/data")
  postData(body: DataDto) {
    return { received: body.value };
  }
}

@Module({ controllers: [FastifyHandler], providers: [], imports: [], exports: [] })
class AppModule {}

const app = new RuneApp();
app.registerModule(AppModule);
const fastify = Fastify();
toFastify(app, fastify);

await fastify.ready();

describe("try-fastify", () => {
  it("responds to GET /hello", async () => {
    const res = await fastify.inject({ method: "GET", url: "/hello" });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ message: "Hello from Fastify!" });
  });

  it("responds to POST /data with body", async () => {
    const res = await fastify.inject({
      method: "POST",
      url: "/data",
      headers: { "content-type": "application/json" },
      payload: JSON.stringify({ value: "test-data" }),
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ received: "test-data" });
  });

  it("returns 404 for unknown route", async () => {
    const res = await fastify.inject({ method: "GET", url: "/unknown" });
    expect(res.statusCode).toBe(404);
  });
});
