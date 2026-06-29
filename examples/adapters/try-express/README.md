# try-express

Demonstrates running a Rune app through Express using `@rune/adapter-express`.

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

- `@rune/adapter-express`
- `@rune/core`
- `@rune/decorators`
- `express`
- `zod`
