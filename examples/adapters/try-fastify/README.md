# try-fastify

Demonstrates running a Rune app through Fastify using `@rune/adapter-fastify`.

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

- `@rune/adapter-fastify`
- `@rune/core`
- `@rune/decorators`
- `fastify`
- `zod`
