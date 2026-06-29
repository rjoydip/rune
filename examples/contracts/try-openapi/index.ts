import { RuneApp } from "@rune/core";
import { OpenAPIScanner, getSwaggerHTML } from "@rune/openapi";
import { Module, Controller, Get, Post, Body } from "@rune/decorators";

class CreateUserDto {
  name!: string;
  email!: string;
}

@Controller("/users")
class UserController {
  @Get("/:id")
  getUser() {
    return { id: "1", name: "Alice" };
  }

  @Body(CreateUserDto)
  @Post("/")
  createUser(_body: CreateUserDto) {
    return { success: true };
  }
}

@Module({ controllers: [UserController], providers: [], imports: [], exports: [] })
class AppModule {}

const app = new RuneApp();
app.registerModule(AppModule);

const scanner = new OpenAPIScanner("My API", "1.0.0");
const spec = scanner.scan(AppModule);

console.log(JSON.stringify(spec, null, 2));
console.log(getSwaggerHTML());
