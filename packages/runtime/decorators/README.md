# @rune/decorators

The declarative API layer. Provides decorators for defining controllers, routes, parameter injection, guards, interceptors, modules, and injectable providers. All metadata is stored via `reflect-metadata`.

## Exports

### Class Decorators

| Decorator              | Description                                                    |
| ---------------------- | -------------------------------------------------------------- |
| `@Controller(prefix?)` | Marks a class as a controller with optional route prefix       |
| `@Module(metadata)`    | Defines a module with controllers, providers, imports, exports |
| `@Injectable(scope?)`  | Marks a class as injectable (default: singleton)               |

### Route Decorators

| Decorator        | Description          |
| ---------------- | -------------------- |
| `@Get(path?)`    | GET route handler    |
| `@Post(path?)`   | POST route handler   |
| `@Put(path?)`    | PUT route handler    |
| `@Delete(path?)` | DELETE route handler |
| `@Patch(path?)`  | PATCH route handler  |

### Parameter Decorators

| Decorator      | Description                                            |
| -------------- | ------------------------------------------------------ |
| `@Body(dto?)`  | Injects request body, optionally validates against DTO |
| `@Param(dto?)` | Injects a URL path parameter                           |
| `@Query(dto?)` | Injects query string parameters                        |
| `@Headers`     | Injects request headers                                |
| `@Req`         | Injects the full Context                               |

### Guard/Interceptor Decorators

| Decorator                          | Description                                    |
| ---------------------------------- | ---------------------------------------------- |
| `@UseGuard(...guards)`             | Attaches guards at class or method level       |
| `@UseInterceptor(...interceptors)` | Attaches interceptors at class or method level |

## Usage

```ts
import { Controller, Get, Post, Body, Param, Module, Injectable } from "@rune/decorators";

@Injectable()
class UserService {
  getUser(id: string) {
    return { id, name: "Alice" };
  }
}

@Controller("/users")
class UserController {
  constructor(private userService: UserService) {}

  @Get("/:id")
  getUser(@Param() id: string) {
    return this.userService.getUser(id);
  }

  @Post()
  createUser(@Body() body: { name: string }) {
    return { created: body.name };
  }
}

@Module({
  controllers: [UserController],
  providers: [UserService],
})
class UserModule {}
```

## Dependencies

- `reflect-metadata` ^0.2.2
