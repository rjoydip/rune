import { RuneApp } from "@rune/core";
import { serveBun } from "@rune/adapter-bun";
import { Module, Controller, Get, Post, Body, Param } from "@rune/decorators";

class EchoDto {
  text!: string;
}

@Controller("/")
class BunHandler {
  @Get("/hello")
  sayHello() {
    return { message: "Hello from Bun!" };
  }

  @Param()
  @Get("/user/:id")
  getUser(id: string) {
    return { id, name: "Bun User" };
  }

  @Body(EchoDto)
  @Post("/echo")
  echo(body: EchoDto) {
    return { echoed: body.text };
  }
}

@Module({ controllers: [BunHandler], providers: [], imports: [], exports: [] })
class AppModule {}

const app = new RuneApp();
app.registerModule(AppModule);

serveBun(app, 3000);
console.log("Bun adapter running on port 3000");
