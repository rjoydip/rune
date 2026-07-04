import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";

const execAsync = promisify(exec);

interface RouteResult {
  route: string;
  opsPerSec: number;
}

const runtimeAdapters = [
  { name: "Bun", cmd: "bun run adapter-bun.ts" },
  { name: "Node.js", cmd: "bun run adapter-node.ts" },
];

const frameworkAdapters = [
  { name: "Elysia", cmd: "bun run adapter-elysia.ts" },
  { name: "Hono", cmd: "bun run adapter-hono.ts" },
  { name: "Express", cmd: "bun run adapter-express.ts" },
  { name: "Koa", cmd: "bun run adapter-koa.ts" },
  { name: "Fastify", cmd: "bun run adapter-fastify.ts" },
];

const ROUTE_NAMES = ["GET /hello", "GET /user/:id", "GET /search", "POST /echo"];

function extractResults(stdout: string): RouteResult[] {
  const routes: RouteResult[] = [];
  const lines = stdout.split("\n");
  let inTable = false;
  for (const line of lines) {
    if (line.startsWith("| Route |")) {
      inTable = true;
      continue;
    }
    if (inTable && line.startsWith("|")) {
      const parts = line
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean);
      if (parts.length >= 3) {
        const route = parts[0];
        const opsPerSec = parseFloat(parts[1].replace(/,/g, ""));
        if (!isNaN(opsPerSec)) {
          routes.push({ route, opsPerSec });
        }
      }
    }
  }
  return routes;
}

function formatTable(allResults: { adapter: string; routes: RouteResult[] }[]): string {
  const header = `| Adapter | ${ROUTE_NAMES.map((r) => ` ${r} `).join("|")}|`;
  const divider = `|${[" --- ", ...ROUTE_NAMES.map(() => "--- ")].join("|")}|`;

  const sorted = [...allResults].sort((a, b) => {
    const aVal = a.routes.find((r) => r.route === "GET /hello")?.opsPerSec ?? 0;
    const bVal = b.routes.find((r) => r.route === "GET /hello")?.opsPerSec ?? 0;
    return bVal - aVal;
  });

  const rows = sorted.map((result) => {
    const cells = [result.adapter];
    for (const routeName of ROUTE_NAMES) {
      const found = result.routes.find((r) => r.route === routeName);
      cells.push(found ? `${found.opsPerSec.toLocaleString()} ops/sec` : "N/A");
    }
    return `| **${result.adapter}** | ${cells.slice(1).join(" | ")} |`;
  });

  return [header, divider, ...rows].join("\n");
}

async function runGroup(
  label: string,
  adapters: { name: string; cmd: string }[],
  results: { adapter: string; routes: RouteResult[] }[],
) {
  console.log(`\n## ${label}\n`);
  for (const a of adapters) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const { stdout } = await execAsync(a.cmd, { cwd: process.cwd() });
      console.log(stdout);

      // eslint-disable-next-line no-await-in-loop
      const routes = extractResults(stdout);
      results.push({ adapter: a.name, routes });
    } catch (e: any) {
      console.error(`Failed: ${a.name} - ${e.message}`);
    }
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, 1000));
  }
}

async function main() {
  console.log("# Rune Adapter Benchmarks\n");

  const allResults: { adapter: string; routes: RouteResult[] }[] = [];

  await runGroup("Runtime Adapters", runtimeAdapters, allResults);
  await runGroup("Framework Adapters", frameworkAdapters, allResults);

  console.log("\n## Combined Results\n");
  console.log(formatTable(allResults));

  // Optionally update README.md if it exists (standalone run)
  const readmePath = "README.md";
  if (fs.existsSync(readmePath)) {
    const content = fs.readFileSync(readmePath, "utf8");

    const startMarker = "## Adapter Benchmarks";
    const endMarker = "## Benchmark Configuration";

    const runtimeTable = formatTable(
      allResults.filter((r) => runtimeAdapters.some((a) => a.name === r.adapter)),
    );
    const frameworkTable = formatTable(
      allResults.filter((r) => frameworkAdapters.some((a) => a.name === r.adapter)),
    );

    const replacement =
      `${startMarker}\n` +
      "\n" +
      "HTTP throughput comparison of Rune running on different runtime and framework adapters.\n" +
      "\n" +
      "### Runtime Adapters\n" +
      "\n" +
      "Results from `bun run bench:adapters` (GET: 50,000 iterations, POST: 25,000 iterations, concurrency: 100):\n" +
      "\n" +
      runtimeTable +
      "\n" +
      "\n" +
      "### Framework Adapters\n" +
      "\n" +
      "Rune wrapped inside another framework via its adapter.\n" +
      "\n" +
      frameworkTable +
      "\n" +
      "\n" +
      "> Measured on the same machine under identical load. Results may vary by environment.\n" +
      "\n";

    const startIdx = content.indexOf(startMarker);
    const endIdx = content.indexOf(endMarker);

    if (startIdx !== -1 && endIdx !== -1) {
      const newContent = content.slice(0, startIdx) + replacement + content.slice(endIdx);
      fs.writeFileSync(readmePath, newContent, "utf8");
      console.log(`\nUpdated ${readmePath}`);
    } else {
      console.log("Could not find markers in README.md - table not written");
    }
  }
}

main();
