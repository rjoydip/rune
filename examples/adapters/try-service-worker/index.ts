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

self.addEventListener("fetch", handle);
