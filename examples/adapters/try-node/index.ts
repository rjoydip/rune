import { RuneApp } from "@rune/core";
import { createNodeServer } from "@rune/adapter-node";
import { Module, Controller, Get, Post, Body, Param } from "@rune/decorators";

class EchoDto {
  text!: string;
}

@Controller("/")
class NodeHandler {
  @Get("/hello")
  sayHello() {
    return { message: "Hello from Node!" };
  }

  @Param()
  @Get("/user/:id")
  getUser(id: string) {
    return { id, name: "Node User" };
  }

  @Body(EchoDto)
  @Post("/echo")
  echo(body: EchoDto) {
    return { echoed: body.text };
  }
}

@Module({ controllers: [NodeHandler], providers: [], imports: [], exports: [] })
class AppModule {}

const app = new RuneApp();
app.registerModule(AppModule);

const server = createNodeServer(app);
server.listen(3000, () => {
  console.log("Node adapter running on port 3000");
});
