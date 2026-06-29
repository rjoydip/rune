import { RuneApp } from "@rune/core";
import { toCloudflareWorker } from "@rune/adapter-cloudflare-workers";
import { Module, Controller, Get, Post, Body } from "@rune/decorators";

class DataDto {
  value!: string;
}

@Controller("/")
class CloudflareHandler {
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

@Module({ controllers: [CloudflareHandler], providers: [], imports: [], exports: [] })
class AppModule {}

const app = new RuneApp();
app.registerModule(AppModule);

export default {
  fetch: toCloudflareWorker(app),
};
