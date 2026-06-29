import { RuneApp } from "@rune/core";
import { toExpress } from "@rune/adapter-express";
import express from "express";
import { Module, Controller, Get, Post, Body } from "@rune/decorators";

class DataDto {
  value!: string;
}

@Controller("/")
class ExpressHandler {
  @Get("/hello")
  sayHello() {
    return { message: "Hello from Express!" };
  }

  @Body(DataDto)
  @Post("/data")
  postData(body: DataDto) {
    return { received: body.value };
  }
}

@Module({ controllers: [ExpressHandler], providers: [], imports: [], exports: [] })
class AppModule {}

const app = new RuneApp();
app.registerModule(AppModule);

const expressApp = express();
expressApp.use(express.json());

toExpress(app, expressApp);

expressApp.listen(3000, () => {
  console.log("Express adapter running on port 3000");
});
