import { RuneApp } from "@rune/core";
import { toAwsLambda } from "@rune/adapter-aws-lambda";
import type { AwsLambdaEvent, AwsLambdaResult } from "@rune/adapter-aws-lambda";
import { Module, Controller, Get, Post, Body } from "@rune/decorators";

class DataDto {
  value!: string;
}

@Controller("/")
class AwsLambdaHandler {
  @Get("/hello")
  sayHello() {
    return { message: "Hello from AWS Lambda!" };
  }

  @Body(DataDto)
  @Post("/data")
  postData(body: DataDto) {
    return { received: body.value };
  }
}

@Module({ controllers: [AwsLambdaHandler], providers: [], imports: [], exports: [] })
class AppModule {}

const app = new RuneApp();
app.registerModule(AppModule);

const lambdaHandler = toAwsLambda(app);

export const handler = async (event: AwsLambdaEvent): Promise<AwsLambdaResult> => {
  return lambdaHandler(event);
};
