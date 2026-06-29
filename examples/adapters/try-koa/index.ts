import { RuneApp } from "@rune/core";
import { toKoaMiddleware } from "@rune/adapter-koa";
import Koa from "koa";
import { Module, Controller, Get, Post, Body } from "@rune/decorators";
import bodyParser from "koa-bodyparser";

class DataDto {
  value!: string;
}

@Controller("/")
class KoaHandler {
  @Get("/hello")
  sayHello() {
    return { message: "Hello from Koa!" };
  }

  @Body(DataDto)
  @Post("/data")
  postData(body: DataDto) {
    return { received: body.value };
  }
}

@Module({ controllers: [KoaHandler], providers: [], imports: [], exports: [] })
class AppModule {}

const app = new RuneApp();
app.registerModule(AppModule);

const koaApp = new Koa();
koaApp.use(bodyParser());
koaApp.use(toKoaMiddleware(app));

koaApp.listen(3000, () => {
  console.log("Koa adapter running on port 3000");
});
