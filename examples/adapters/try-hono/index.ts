import { RuneApp } from "@rune/core";
import { toHono } from "@rune/adapter-hono";
import { serve } from "@hono/node-server";
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

serve({ fetch: hono.fetch, port: 3000 }, () => {
  console.log("Hono adapter running on port 3000");
});
