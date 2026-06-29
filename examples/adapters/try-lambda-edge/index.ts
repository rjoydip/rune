import { RuneApp } from "@rune/core";
import { toAPIGatewayHandler } from "@rune/adapter-lambda-edge";
import type { APIGatewayEvent, APIGatewayResult } from "@rune/adapter-lambda-edge";
import { Module, Controller, Get, Post, Body } from "@rune/decorators";

class DataDto {
  value!: string;
}

@Controller("/")
class LambdaHandler {
  @Get("/hello")
  sayHello() {
    return { message: "Hello from Lambda!" };
  }

  @Body(DataDto)
  @Post("/data")
  postData(body: DataDto) {
    return { received: body.value };
  }
}

@Module({ controllers: [LambdaHandler], providers: [], imports: [], exports: [] })
class AppModule {}

const app = new RuneApp();
app.registerModule(AppModule);

const lambdaHandler = toAPIGatewayHandler(app);

export const handler = async (event: APIGatewayEvent): Promise<APIGatewayResult> => {
  return lambdaHandler(event);
};
