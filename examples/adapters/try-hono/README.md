# try-hono

Demonstrates running a Rune app through Hono using `@rune/adapter-hono`.

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

- `@rune/adapter-hono`
- `@rune/core`
- `@rune/decorators`
- `hono`
- `@hono/node-server`
- `zod`
