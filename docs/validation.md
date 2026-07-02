---
title: Validation
description: DTO validation with class-validator and ValidationPipe
sidebar:
  order: 3
---
## DTOs

Define validation rules using `class-validator` decorators on plain classes.

```ts
import { IsString, IsEmail, IsOptional, MinLength } from "class-validator";

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  bio?: string;
}
```

## Usage in Controllers

Pass the DTO class to `@Body()` to trigger automatic validation.

```ts
@Controller("/users")
export class UserController {
  @Post("/")
  create(@Body(CreateUserDto) dto: CreateUserDto) {
    // dto is already validated and transformed
    return { created: dto };
  }
}
```

## What Happens

1. `plainToInstance(CreateUserDto, body)` — converts raw JSON to class instance
2. `validate(instance)` — runs all class-validator decorators
3. If validation fails, throws `ValidationErrorBag` (caught by error handler)
4. On success, the validated DTO is passed to the controller

## Error Response

Validation errors return a 400 response:

```json
{
  "error": "Validation failed",
  "details": [
    {
      "property": "email",
      "constraints": {
        "isEmail": "email must be an email"
      }
    }
  ]
}
```

## Query Validation

```ts
@Get("/search")
search(@Query(SearchDto) query: SearchDto) {
  return { results: [...] };
}
```


