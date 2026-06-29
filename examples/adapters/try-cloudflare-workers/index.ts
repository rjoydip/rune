import { RuneApp } from "@rune/core";
import { toCloudflareWorker } from "@rune/adapter-cloudflare-workers";
import type { CloudflareWorkerEnv } from "@rune/adapter-cloudflare-workers";
import type { ExecutionContext } from "@cloudflare/workers-types";
import { Module, Controller, Get, Post, Body } from "@rune/decorators";

class DataDto {
  value!: string;
}

@Controller("/")
class WorkerHandler {
  @Get("/hello")
  sayHello() {
    return { message: "Hello from Cloudflare Workers!" };
  }

  @Body(DataDto)
  @Post("/data")
  postData(body: DataDto) {
    return { received: body.value };
  }
}

@Module({ controllers: [WorkerHandler], providers: [], imports: [], exports: [] })
class AppModule {}

const app = new RuneApp();
app.registerModule(AppModule);

const handle = toCloudflareWorker(app);

export default {
  async fetch(
    request: Request,
    env: CloudflareWorkerEnv,
    ctx: ExecutionContext,
  ): Promise<Response> {
    return handle(request, env, ctx);
  },
};
