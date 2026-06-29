import { RuneApp } from "@rune/core";
import { toElysia } from "@rune/adapter-elysia";
import { Module, Controller, Get, Post, Body } from "@rune/decorators";

class DataDto {
  value!: string;
}

@Controller("/")
class ElysiaHandler {
  @Get("/hello")
  sayHello() {
    return { message: "Hello from Elysia!" };
  }

  @Body(DataDto)
  @Post("/data")
  postData(body: DataDto) {
    return { received: body.value };
  }
}

@Module({ controllers: [ElysiaHandler], providers: [], imports: [], exports: [] })
class AppModule {}

const app = new RuneApp();
app.registerModule(AppModule);

const elysia = toElysia(app);
elysia.listen(3000);
console.log("Elysia adapter running on port 3000");
