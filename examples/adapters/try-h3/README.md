# try-h3

Demonstrates running a Rune app through h3 using `@rune/adapter-h3`.

## Usage

```bash
bun run index.ts
```

## Endpoints

| Method | Path     | Description             |
| ------ | -------- | ----------------------- |
| GET    | `/hello` | Returns a greeting      |
| POST   | `/data`  | Echoes back a JSON body |

## Dependencies

- `@rune/adapter-h3`
- `@rune/core`
- `@rune/decorators`
- `h3`
