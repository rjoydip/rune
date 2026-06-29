import { describe, it, expect } from "bun:test";
import { RuneApp } from "@rune/core";
import { toElysia } from "@rune/adapter-elysia";
import { Module, Controller, Get, Post, Body } from "@rune/decorators";

class DataDto {
  value!: string;
}

@Controller("/")
class ElysiaHandler {
  @Get("/hello")
  sayHello() {
    return { message: "Hello from Elysia!" };
  }

  @Body(DataDto)
  @Post("/data")
  postData(body: DataDto) {
    return { received: body.value };
  }
}

@Module({ controllers: [ElysiaHandler], providers: [], imports: [], exports: [] })
class AppModule {}

const app = new RuneApp();
app.registerModule(AppModule);
const elysia = toElysia(app);

describe("try-elysia", () => {
  it("responds to GET /hello", async () => {
    const res = await elysia.fetch(new Request("http://localhost/hello"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ message: "Hello from Elysia!" });
  });

  it("responds to POST /data with body", async () => {
    const res = await elysia.fetch(
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
    const res = await elysia.fetch(new Request("http://localhost/unknown"));
    expect(res.status).toBe(404);
  });
});
