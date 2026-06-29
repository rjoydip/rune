import { RuneApp } from "@rune/core";
import { Module, Controller, Get, Post, Body, Param, Query } from "@rune/decorators";

class EchoDto {
  text!: string;
}

@Controller("/")
class BenchmarkController {
  @Get("/hello")
  hello() {
    return { message: "hello" };
  }

  @Param()
  @Get("/user/:id")
  userById(id: string) {
    return { id };
  }

  @Query()
  @Get("/search")
  search(limit?: string, offset?: string) {
    return { limit, offset };
  }

  @Body(EchoDto)
  @Post("/echo")
  echo(body: EchoDto) {
    return { echoed: body.text };
  }
}

@Module({ controllers: [BenchmarkController], providers: [], imports: [], exports: [] })
class BenchmarkModule {}

export function createApp() {
  const app = new RuneApp();
  app.registerModule(BenchmarkModule);
  return app;
}
