import { RuneApp } from "@rune/core";
import { toH3 } from "@rune/adapter-h3";
import { toNodeHandler } from "h3/node";
import { createServer } from "node:http";
import { Module, Controller, Get, Post, Body } from "@rune/decorators";

class DataDto {
  value!: string;
}

@Controller("/")
class H3Handler {
  @Get("/hello")
  sayHello() {
    return { message: "Hello from h3!" };
  }

  @Body(DataDto)
  @Post("/data")
  postData(body: DataDto) {
    return { received: body.value };
  }
}

@Module({ controllers: [H3Handler], providers: [], imports: [], exports: [] })
class AppModule {}

const app = new RuneApp();
app.registerModule(AppModule);

const h3App = toH3(app);
const server = createServer(toNodeHandler(h3App));

server.listen(0, () => {
  const addr = server.address();
  if (addr && typeof addr === "object") {
    console.log(`SERVER_READY:${addr.port}`);
  }
});

process.on("SIGTERM", () => server.close());
process.on("SIGINT", () => server.close());
