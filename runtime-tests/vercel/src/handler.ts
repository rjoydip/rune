import { RuneApp } from "@rune/core";
import { toVercelEdge } from "@rune/adapter-vercel";
import { Module, Controller, Get, Post, Body } from "@rune/decorators";

class DataDto {
  value!: string;
}

@Controller("/")
class VercelHandler {
  @Get("/hello")
  sayHello() {
    return { message: "Hello from Vercel!" };
  }

  @Body(DataDto)
  @Post("/data")
  postData(body: DataDto) {
    return { received: body.value };
  }
}

@Module({ controllers: [VercelHandler], providers: [], imports: [], exports: [] })
class AppModule {}

const app = new RuneApp();
app.registerModule(AppModule);

export default toVercelEdge(app);
