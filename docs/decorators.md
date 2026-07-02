---
title: Decorators
description: Using @Controller, @Get, @Post, @Body, and other decorators
sidebar:
  order: 1
---
## Controller

```ts
@Controller("/prefix")  // Class-level route prefix
@Controller()           // Default: "/"
```

## Route Methods

```ts
@Get("/path")     // GET request
@Post("/path")    // POST request
@Put("/path")     // PUT request
@Delete("/path")  // DELETE request
@Patch("/path")   // PATCH request
```

## Parameters

```ts
@Body()                   // Request body (auto-parsed JSON)
@Body(CreateUserDto)      // Body validated against DTO
@Param()                  // URL parameter (e.g., /users/:id)
@Query()                  // Query string parameter
@Headers()                // All request headers
@Req()                    // Full Context object
```

## Module

```ts
@Module({
  controllers: [UserController],
  providers: [UserService],
  imports: [DatabaseModule],
  exports: [UserService],
})
```

## Injectable

```ts
@Injectable("singleton")  // Default
@Injectable("transient")
@Injectable("request")
```

## Guards

```ts
@UseGuard(AuthGuard, AdminGuard)

// Class-level:
@UseGuard(AuthGuard)
@Controller("/admin")

// Method-level:
@Get("/secret")
@UseGuard(AdminGuard)
secretData() { ... }
```

## Interceptors

```ts
@UseInterceptor(LoggingInterceptor, CacheInterceptor)

@Controller("/users")
@UseInterceptor(LoggingInterceptor)
export class UserController {
  @Get("/")
  @UseInterceptor(CacheInterceptor)
  findAll() { ... }
}
```


