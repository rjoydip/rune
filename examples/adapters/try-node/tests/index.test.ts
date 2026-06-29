import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { RuneApp } from "@rune/core";
import { createNodeServer } from "@rune/adapter-node";
import { Module, Controller, Get, Post, Body, Param } from "@rune/decorators";

class EchoDto {
  text!: string;
}

@Controller("/")
class NodeHandler {
  @Get("/hello")
  sayHello() {
    return { message: "Hello from Node!" };
  }

  @Param()
  @Get("/user/:id")
  getUser(id: string) {
    return { id, name: "Node User" };
  }

  @Body(EchoDto)
  @Post("/echo")
  echo(body: EchoDto) {
    return { echoed: body.text };
  }
}

@Module({ controllers: [NodeHandler], providers: [], imports: [], exports: [] })
class AppModule {}

const app = new RuneApp();
app.registerModule(AppModule);
const server = createNodeServer(app);

let baseUrl: string;

beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const addr = server.address();
  if (addr && typeof addr === "object") {
    baseUrl = `http://localhost:${addr.port}`;
  }
});

afterAll(() => {
  server.close();
});

describe("try-node", () => {
  it("responds to GET /hello", async () => {
    const res = await fetch(`${baseUrl}/hello`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ message: "Hello from Node!" });
  });

  it("responds to GET /user/:id", async () => {
    const res = await fetch(`${baseUrl}/user/42`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: "42", name: "Node User" });
  });

  it("responds to POST /echo with body", async () => {
    const res = await fetch(`${baseUrl}/echo`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: "hello-node" }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ echoed: "hello-node" });
  });

  it("returns 404 for unknown route", async () => {
    const res = await fetch(`${baseUrl}/unknown`);
    expect(res.status).toBe(404);
  });
});
