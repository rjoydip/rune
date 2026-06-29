import { describe, it, expect } from "bun:test";
import { RuneApp } from "@rune/core";
import { toHono } from "@rune/adapter-hono";
import { Module, Controller, Get, Post, Body } from "@rune/decorators";

class DataDto {
  value!: string;
}

@Controller("/")
class HonoHandler {
  @Get("/hello")
  sayHello() {
    return { message: "Hello from Hono!" };
  }

  @Body(DataDto)
  @Post("/data")
  postData(body: DataDto) {
    return { received: body.value };
  }
}

@Module({ controllers: [HonoHandler], providers: [], imports: [], exports: [] })
class AppModule {}

const app = new RuneApp();
app.registerModule(AppModule);
const hono = toHono(app);

describe("try-hono", () => {
  it("responds to GET /hello", async () => {
    const res = await hono.fetch(new Request("http://localhost/hello"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ message: "Hello from Hono!" });
  });

  it("responds to POST /data with body", async () => {
    const res = await hono.fetch(
      new Request("http://localhost/data", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ value: "test-data" }),
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: "test-data" });
  });

  it("returns 404 for unknown route", async () => {
    const res = await hono.fetch(new Request("http://localhost/unknown"));
    expect(res.status).toBe(404);
  });
});
