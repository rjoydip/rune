# try-elysia

Demonstrates running a Rune app through Elysia using `@rune/adapter-elysia`.

## Usage

```bash
bun run index.ts
```

## Endpoints

| Method | Path        | Description                       |
| ------ | ----------- | --------------------------------- |
| GET    | `/hello`    | Returns a greeting                |
| GET    | `/user/:id` | Returns user info with path param |
| POST   | `/echo`     | Echoes back a JSON body           |

## Dependencies

- `@rune/adapter-elysia`
- `@rune/core`
- `@rune/decorators`
- `elysia`
- `zod`
