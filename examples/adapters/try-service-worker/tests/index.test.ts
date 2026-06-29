import { describe, it, expect, mock } from "bun:test";
import { RuneApp } from "@rune/core";
import { toServiceWorker } from "@rune/adapter-service-worker";
import { Module, Controller, Get, Post, Body } from "@rune/decorators";

class DataDto {
  value!: string;
}

@Controller("/")
class ServiceWorkerHandler {
  @Get("/hello")
  sayHello() {
    return { message: "Hello from Service Worker!" };
  }

  @Body(DataDto)
  @Post("/data")
  postData(body: DataDto) {
    return { received: body.value };
  }
}

@Module({ controllers: [ServiceWorkerHandler], providers: [], imports: [], exports: [] })
class AppModule {}

const app = new RuneApp();
app.registerModule(AppModule);
const handle = toServiceWorker(app);

async function handleRequest(req: Request): Promise<Response> {
  let result: Response | undefined;
  const event = {
    request: req,
    respondWith: mock((res: Response) => {
      result = res;
    }),
  } as unknown as FetchEvent;
  handle(event);
  return result!;
}

describe("try-service-worker", () => {
  it("responds to GET /hello", async () => {
    const res = await handleRequest(new Request("http://localhost/hello"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ message: "Hello from Service Worker!" });
  });

  it("responds to POST /data with body", async () => {
    const res = await handleRequest(
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
    const res = await handleRequest(new Request("http://localhost/unknown"));
    expect(res.status).toBe(404);
  });
});
