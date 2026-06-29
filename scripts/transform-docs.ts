import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");
const DOCS_DIR = join(REPO_ROOT, "docs");

const TITLES: Record<string, string> = {
  "getting-started": "Getting Started",
  architecture: "Architecture",
  "core-concepts": "Core Concepts",
  configuration: "Configuration",
  decorators: "Decorators",
  di: "Dependency Injection",
  validation: "Validation",
  middleware: "Middleware",
  "guards-interceptors": "Guards & Interceptors",
  events: "Events",
  openapi: "OpenAPI",
  "error-handling": "Error Handling",
  "runtime-adapters": "Runtime Adapters",
  adapters: "Adapters",
  "adapter-development": "Adapter Development",
  cli: "CLI",
  testing: "Testing",
  migration: "Migration Guide",
  performance: "Performance",
  "bundle-size": "Bundle Sizes",
};

const DESCRIPTIONS: Record<string, string> = {
  "getting-started": "Install, setup, and create your first Rune application",
  architecture: "How the Rune request pipeline works",
  "core-concepts": "App, Context, Middleware, and Modules explained",
  configuration: "Environment-based configuration with ConfigLoader",
  decorators: "Using @Controller, @Get, @Post, @Body, and other decorators",
  di: "Dependency injection container, scopes, and providers",
  validation: "DTO validation with class-validator and ValidationPipe",
  middleware: "Custom middleware patterns and the middleware pipeline",
  "guards-interceptors": "Authentication guards and interceptor pipelines",
  events: "Event-driven architecture with the EventBus",
  openapi: "Auto-generating OpenAPI 3.0 specs from decorators",
  "error-handling": "Error middleware, custom errors, and exception handling",
  "runtime-adapters": "Deploying to Node, Bun, Deno, Cloudflare Workers, and more",
  adapters: "Cache, Queue, Database, Mail, and other infrastructure adapters",
  "adapter-development": "Writing custom adapters for Rune infrastructure",
  cli: "Using the create-rune CLI tool to scaffold projects",
  testing: "Unit testing controllers, middleware, and services",
  migration: "Migrating from Express, NestJS, and other frameworks",
  performance: "Benchmarks, optimization tips, and performance tuning",
  "bundle-size": "Raw, gzip, and brotli sizes for every package",
};

const SIDEBAR_ORDER: Record<string, number> = {
  "getting-started": 1,
  architecture: 2,
  "core-concepts": 3,
  configuration: 4,
  decorators: 1,
  di: 2,
  validation: 3,
  middleware: 4,
  "guards-interceptors": 5,
  events: 6,
  openapi: 7,
  "error-handling": 8,
  "runtime-adapters": 1,
  adapters: 2,
  "adapter-development": 3,
  cli: 1,
  testing: 2,
  migration: 3,
  performance: 4,
  "bundle-size": 5,
};

const LINK_MAP: Record<string, string> = {};
const ALL_FILES = [...Object.keys(TITLES), "index"];
for (const file of ALL_FILES) {
  if (file === "index") {
    LINK_MAP["./index.md"] = "/";
  } else {
    LINK_MAP[`./${file}.md`] = `/${file}/`;
  }
}
LINK_MAP["./contributing.md"] = "#";

function rewriteLinks(content: string): string {
  return content.replace(/\[([^\]]+)\]\(\.\/([\w-]+)\.md\)/g, (_match, text, file) => {
    const target = LINK_MAP[`./${file}.md`];
    if (target) return `[${text}](${target})`;
    console.warn(`  ⚠  No mapping for ./${file}.md`);
    return _match;
  });
}

function hasFrontmatter(content: string): boolean {
  return content.startsWith("---");
}

function transformFile(base: string) {
  const filePath = join(DOCS_DIR, `${base}.md`);
  const title = TITLES[base];
  const description = DESCRIPTIONS[base];
  const order = SIDEBAR_ORDER[base];

  let content = readFileSync(filePath, "utf-8");

  if (hasFrontmatter(content)) {
    const end = content.indexOf("---", 3);
    if (end !== -1) {
      content = content.slice(end + 3);
    }
  }

  content = content.replace(/^# .+\n/, "");

  content = rewriteLinks(content);

  const frontmatter = `---
title: ${title}
description: ${description}
sidebar:
  order: ${order}
---
${content.trimStart()}
`;

  writeFileSync(filePath, frontmatter);
}

export function transformDocs(): void {
  const indexPath = join(DOCS_DIR, "index.md");
  let indexContent = readFileSync(indexPath, "utf-8");
  if (hasFrontmatter(indexContent)) {
    const end = indexContent.indexOf("---", 3);
    if (end !== -1) {
      indexContent = indexContent.slice(end + 3);
    }
  }
  const indexFrontmatter = `---
title: Rune Documentation
description: A batteries-included, web-standard, runtime-agnostic backend framework
template: splash
hero:
  title: Rune
  tagline: A batteries-included, web-standard, runtime-agnostic backend framework
  actions:
    - text: Get Started
      link: /getting-started/
      icon: right-arrow
      variant: primary
    - text: View on GitHub
      link: https://github.com/rjoydip/rune
      icon: external
---
${rewriteLinks(indexContent)}
`;
  writeFileSync(indexPath, indexFrontmatter);

  for (const base of Object.keys(TITLES)) {
    transformFile(base);
  }
}

if (import.meta.main) {
  transformDocs();
  console.log("  ✓ index.md");
  for (const base of Object.keys(TITLES)) {
    console.log(`  ✓ ${base}.md`);
  }
  console.log("\nDone! All docs updated in-place.");
}
