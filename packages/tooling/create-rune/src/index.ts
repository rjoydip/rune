import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const TEMPLATES: Record<string, string> = {
  "src/main.ts": `import { createApp } from "@rune/core";
import { AppModule } from "./app.module";

const app = createApp();
app.registerModule(AppModule);
app.init();

const port = parseInt(process.env.PORT ?? "3000");

if (typeof Bun !== "undefined") {
  Bun.serve({ port, fetch: (req) => app.fetch(req) });
} else {
  const { createServer } = await import("node:http");
  createServer(async (req, res) => {
    const url = \`http://\${req.headers.host}\${req.url}\`;
    const request = new Request(url, {
      method: req.method,
      headers: req.headers as Record<string, string>,
    });
    const response = await app.fetch(request);
    res.statusCode = response.status;
    response.headers.forEach((v, k) => res.setHeader(k, v));
    res.end(await response.text());
  }).listen(port, () => {
    console.log(\`Server listening on port \${port}\`);
  });
}`,
  "src/app.module.ts": `import { Module } from "@rune/decorators";
import { AppController } from "./controllers/app.controller";

@Module({
  controllers: [AppController],
  providers: [],
  imports: [],
  exports: [],
})
export class AppModule {}`,
  "src/controllers/app.controller.ts": `import { Controller, Get, Post, Body } from "@rune/decorators";

@Controller("/api")
export class AppController {
  @Get("/hello")
  hello() {
    return { message: "Hello from Rune!" };
  }

  @Post("/echo")
  echo(@Body() data: unknown) {
    return { received: data };
  }
}`,
  "tsconfig.json": `{
  "extends": "@rune/tsconfig/base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}`,
  "package.json": `{
  "name": "my-rune-app",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "build:prod": "bun build --entrypoints src/index.ts --outdir dist --minify --no-sourcemap --format esm",
    "start": "bun src/main.ts",
    "dev": "bun --watch src/main.ts"
  },
  "dependencies": {
    "@rune/core": "latest"
  }
}`,
};

async function main() {
  const args = process.argv.slice(2);
  const projectName = args[0] ?? "my-rune-app";
  const projectDir = join(process.cwd(), projectName);

  console.log(`Creating Rune project: ${projectName}`);

  await Promise.all(
    Object.entries(TEMPLATES).map(async (entry) => {
      const [filePath, content] = entry;
      const fullPath = join(projectDir, filePath);
      const lastSlash = fullPath.lastIndexOf("\\");
      const dirPath = fullPath.substring(0, lastSlash);
      await mkdir(dirPath, {
        recursive: true,
      });
      await writeFile(fullPath, content.trimStart());
      console.log(`  Created: ${filePath}`);
    }),
  );

  console.log(`\nDone! Run:\n  cd ${projectName}\n  bun install\n  bun run dev`);
}

if (process.env.NODE_ENV !== "test") {
  main().catch(console.error);
}

/**
 * Creates a new Rune project with starter files in the specified directory.
 * Reads the project name from CLI arguments and scaffolds template files
 * (src/main.ts, src/app.module.ts, src/controllers/app.controller.ts, tsconfig.json, package.json).
 *
 * @example
 * ```ts
 * // Run from CLI: npx create-rune my-project
 * main();
 * ```
 * @throws Will log the error to console and exit the process if file creation fails.
 */
export { main };
