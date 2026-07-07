import { describe, it, expect } from "bun:test";
import { RuneApp } from "@rune/core";
import { toH3 } from "@rune/adapter-h3";
import { toWebHandler } from "h3";
import { Module, Controller, Get, Post, Body } from "@rune/decorators";

class DataDto {
  value!: string;
}

@Controller("/")
class H3Handler {
  @Get("/hello")
  sayHello() {
    return { message: "Hello from h3!" };
  }

  @Body(DataDto)
  @Post("/data")
  postData(body: DataDto) {
    return { received: body.value };
  }
}

@Module({ controllers: [H3Handler], providers: [], imports: [], exports: [] })
class AppModule {}

const app = new RuneApp();
app.registerModule(AppModule);
const h3App = toH3(app);
const handler = toWebHandler(h3App);

describe("try-h3", () => {
  it("responds to GET /hello", async () => {
    const res = await handler(new Request("http://localhost/hello"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ message: "Hello from h3!" });
  });

  it("responds to POST /data with body", async () => {
    const res = await handler(
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
    const res = await handler(new Request("http://localhost/unknown"));
    expect(res.status).toBe(404);
  });
});
