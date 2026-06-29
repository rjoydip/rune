import { RuneApp } from "@rune/core";
import { serveDeno } from "@rune/adapter-deno";
import { Module, Controller, Get, Post, Body, Param } from "@rune/decorators";

class EchoDto {
  text!: string;
}

@Controller("/")
class DenoHandler {
  @Get("/hello")
  sayHello() {
    return { message: "Hello from Deno!" };
  }

  @Param()
  @Get("/user/:id")
  getUser(id: string) {
    return { id, name: "Deno User" };
  }

  @Body(EchoDto)
  @Post("/echo")
  echo(body: EchoDto) {
    return { echoed: body.text };
  }
}

@Module({ controllers: [DenoHandler], providers: [], imports: [], exports: [] })
class AppModule {}

const app = new RuneApp();
app.registerModule(AppModule);

serveDeno(app, { port: 3000 });
console.log("Deno adapter running on port 3000");
