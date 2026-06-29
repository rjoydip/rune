# @rune/validation

Request body validation pipeline using `class-validator` and `class-transformer`. Transforms plain objects into typed DTO class instances and validates them against decorator-based rules.

## Exports

| Name                 | Kind  |
| -------------------- | ----- |
| `ValidationPipe`     | Class |
| `ValidationErrorBag` | Class |

## Usage

```ts
import { ValidationPipe } from "@rune/validation";
import { IsString, MinLength } from "class-validator";

class CreateUserDto {
  @IsString()
  @MinLength(3)
  name!: string;
}

const pipe = new ValidationPipe();
const dto = await pipe.transform({ name: "Alice" }, CreateUserDto);
// dto is a validated CreateUserDto instance
```

## API

### ValidationPipe

| Method                       | Description                                     |
| ---------------------------- | ----------------------------------------------- |
| `transform(value, metatype)` | Transforms and validates value against metatype |

### ValidationErrorBag

Extends `Error` with an `errors` array of `ValidationError` from `class-validator`.

## Dependencies

- `class-validator` ^0.14.1
- `class-transformer` ^0.5.1
