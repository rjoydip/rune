import { RuneApp } from "@rune/core";
import { toNetlifyEdge } from "@rune/adapter-netlify";
import { Module, Controller, Get, Post, Body } from "@rune/decorators";

class DataDto {
  value!: string;
}

@Controller("/")
class NetlifyHandler {
  @Get("/hello")
  sayHello() {
    return { message: "Hello from Netlify!" };
  }

  @Body(DataDto)
  @Post("/data")
  postData(body: DataDto) {
    return { received: body.value };
  }
}

@Module({ controllers: [NetlifyHandler], providers: [], imports: [], exports: [] })
class AppModule {}

const app = new RuneApp();
app.registerModule(AppModule);

export default toNetlifyEdge(app);
