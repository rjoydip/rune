import { describe, it, expect, afterAll } from "bun:test";
import { RuneApp } from "@rune/core";
import { Module, Controller, Get, Post, Body, Param } from "@rune/decorators";

class EchoDto {
  text!: string;
}

@Controller("/")
class BunHandler {
  @Get("/hello")
  sayHello() {
    return { message: "Hello from Bun!" };
  }

  @Param()
  @Get("/user/:id")
  getUser(id: string) {
    return { id, name: "Bun User" };
  }

  @Body(EchoDto)
  @Post("/echo")
  echo(body: EchoDto) {
    return { echoed: body.text };
  }
}

@Module({ controllers: [BunHandler], providers: [], imports: [], exports: [] })
class AppModule {}

const app = new RuneApp();
app.registerModule(AppModule);

const server = Bun.serve({ port: 0, fetch: (req) => app.fetch(req) });
const baseUrl = `http://localhost:${server.port}`;

afterAll(() => {
  server.stop();
});

describe("try-bun", () => {
  it("responds to GET /hello", async () => {
    const res = await fetch(`${baseUrl}/hello`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ message: "Hello from Bun!" });
  });

  it("responds to GET /user/:id", async () => {
    const res = await fetch(`${baseUrl}/user/42`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: "42", name: "Bun User" });
  });

  it("responds to POST /echo with body", async () => {
    const res = await fetch(`${baseUrl}/echo`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: "hello-bun" }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ echoed: "hello-bun" });
  });

  it("returns 404 for unknown route", async () => {
    const res = await fetch(`${baseUrl}/unknown`);
    expect(res.status).toBe(404);
  });
});
