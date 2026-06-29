# try-bun

Demonstrates running a Rune app on Bun's native HTTP server using `@rune/adapter-bun`.

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

- `@rune/adapter-bun`
- `@rune/core`
- `@rune/decorators`
- `zod`
