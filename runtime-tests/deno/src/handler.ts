import { RuneApp } from "@rune/core";
import { Module, Controller, Get, Post, Body } from "@rune/decorators";

class DataDto {
  value!: string;
}

@Controller("/")
class DenoHandler {
  @Get("/hello")
  sayHello() {
    return { message: "Hello from Deno!" };
  }

  @Body(DataDto)
  @Post("/data")
  postData(body: DataDto) {
    return { received: body.value };
  }
}

@Module({ controllers: [DenoHandler], providers: [], imports: [], exports: [] })
class AppModule {}

const app = new RuneApp();
app.registerModule(AppModule);

// Mimics the handler logic from serveDeno without calling Deno.serve()
export default async (request: Request): Promise<Response> => {
  try {
    return await app.fetch(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
};
