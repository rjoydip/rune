import { RuneApp } from "@rune/core";
import { createNodeServer } from "@rune/adapter-node";
import { Module, Controller, Get, Post, Body } from "@rune/decorators";

class DataDto {
  value!: string;
}

@Controller("/")
class NodeTsHandler {
  @Get("/hello")
  sayHello() {
    return { message: "Hello from Node.js + TypeScript!" };
  }

  @Body(DataDto)
  @Post("/data")
  postData(body: DataDto) {
    return { received: body.value };
  }
}

@Module({ controllers: [NodeTsHandler], providers: [], imports: [], exports: [] })
class AppModule {}

const app = new RuneApp();
app.registerModule(AppModule);

const server = createNodeServer(app);
server.listen(0, () => {
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  console.log(`SERVER_READY:${port}`);
});
