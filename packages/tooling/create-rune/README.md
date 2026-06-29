# @rune/create-rune

CLI scaffolding tool to create a new Rune project.

## Usage

```bash
npx @rune/create-rune my-app
cd my-app
bun install
bun start
```

## What it generates

```
my-app/
├── src/
│   ├── main.ts              # Entry point with Bun & Node.js detection
│   ├── app.module.ts        # Root module
│   └── controllers/
│       └── app.controller.ts # Sample controller
├── tsconfig.json
└── package.json
```

The scaffold includes a sample `@Get("/hello")` and `@Post("/echo")` endpoint.

## Dependencies

None (uses only Node.js built-in `fs/promises` and `path`).
