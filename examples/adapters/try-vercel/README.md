# try-vercel

Demonstrates running a Rune app as a Vercel Edge Function using `@rune/adapter-vercel`.

## Usage

Deploy to Vercel as an Edge Function.

```ts
export default toVercelEdge(app);
// Vercel Edge Runtime -> RuneApp -> Response
```

## Endpoints

| Method | Path        | Description                       |
| ------ | ----------- | --------------------------------- |
| GET    | `/hello`    | Returns a greeting                |
| GET    | `/user/:id` | Returns user info with path param |
| POST   | `/echo`     | Echoes back a JSON body           |

## Dependencies

- `@rune/adapter-vercel`
- `@rune/core`
- `@rune/decorators`
- `zod`
