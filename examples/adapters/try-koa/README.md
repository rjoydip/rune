# try-koa

Demonstrates running a Rune app as Koa middleware using `@rune/adapter-koa`.

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

- `@rune/adapter-koa`
- `@rune/core`
- `@rune/decorators`
- `koa`
- `koa-bodyparser`
- `zod`
