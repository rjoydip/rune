import { RuneApp } from "@rune/core";
import { toCloudflarePagesFunction } from "@rune/adapter-cloudflare-pages";
import { Module, Controller, Get, Post, Body } from "@rune/decorators";

class DataDto {
  value!: string;
}

@Controller("/")
class PagesHandler {
  @Get("/hello")
  sayHello() {
    return { message: "Hello from Cloudflare Pages!" };
  }

  @Body(DataDto)
  @Post("/data")
  postData(body: DataDto) {
    return { received: body.value };
  }
}

@Module({ controllers: [PagesHandler], providers: [], imports: [], exports: [] })
class AppModule {}

const app = new RuneApp();
app.registerModule(AppModule);

export const onRequest = toCloudflarePagesFunction(app);
