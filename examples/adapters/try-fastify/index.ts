import { RuneApp } from "@rune/core";
import { toFastify } from "@rune/adapter-fastify";
import Fastify from "fastify";
import { Module, Controller, Get, Post, Body } from "@rune/decorators";

class DataDto {
  value!: string;
}

@Controller("/")
class FastifyHandler {
  @Get("/hello")
  sayHello() {
    return { message: "Hello from Fastify!" };
  }

  @Body(DataDto)
  @Post("/data")
  postData(body: DataDto) {
    return { received: body.value };
  }
}

@Module({ controllers: [FastifyHandler], providers: [], imports: [], exports: [] })
class AppModule {}

const app = new RuneApp();
app.registerModule(AppModule);

const fastify = Fastify();
toFastify(app, fastify);

fastify.listen({ port: 3000 }, (err) => {
  if (err) throw err;
  console.log("Fastify adapter running on port 3000");
});
