import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";

const execAsync = promisify(exec);

interface RouteResult {
  route: string;
  opsPerSec: number;
}

interface BenchmarkOutput {
  framework: string;
  routes: RouteResult[];
}

const benchmarks = [
  { name: "Rune", cmd: "bun run rune.ts" },
  { name: "Hono", cmd: "bun run hono.ts" },
  { name: "Elysia", cmd: "bun run elysia.ts" },
  { name: "Fastify", cmd: "bun run fastify.ts" },
  { name: "Node.js HTTP", cmd: "bun run node.ts" },
  { name: "Koa", cmd: "bun run koa.ts" },
  { name: "Express", cmd: "bun run express.ts" },
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

function formatCombinedTable(allResults: BenchmarkOutput[]): string {
  const header = `| Framework | ${ROUTE_NAMES.map((r) => ` ${r} `).join("|")}|`;
  const divider = `|${[" ----------- ", ...ROUTE_NAMES.map(() => "----------- ")].join("|")}|`;

  const sorted = [...allResults].sort((a, b) => {
    const aVal = a.routes.find((r) => r.route === "GET /hello")?.opsPerSec ?? 0;
    const bVal = b.routes.find((r) => r.route === "GET /hello")?.opsPerSec ?? 0;
    return bVal - aVal;
  });

  const rows = sorted.map((result) => {
    const cells = [result.framework];
    for (const routeName of ROUTE_NAMES) {
      const found = result.routes.find((r) => r.route === routeName);
      cells.push(found ? `${found.opsPerSec.toLocaleString()} ops/sec` : "N/A");
    }
    return `| **${result.framework}** | ${cells.slice(1).join(" | ")} |`;
  });

  return [header, divider, ...rows].join("\n");
}

function updateBenchmarksDoc(table: string) {
  const candidates = ["../docs/benchmarks.md", "../README.md", "../benchmarks/README.md"];
  const docPath = candidates.find((p) => fs.existsSync(p));
  if (!docPath) {
    console.error("benchmarks doc not found, skipping update");
    return;
  }
  const content = fs.readFileSync(docPath, "utf8");

  const startMarker = "<!-- bench-framework:start -->";
  const endMarker = "<!-- bench-framework:end -->";

  const startIdx = content.indexOf(startMarker);
  const endIdx = content.indexOf(endMarker);

  if (startIdx === -1 || endIdx === -1) {
    console.error("Could not find markers in benchmarks doc");
    return;
  }

  const concurrencyLine =
    "Results from `bun run bench` (GET: 50,000 iterations, POST: 25,000 iterations, concurrency: 20):";

  const replacement =
    `${startMarker}\n` + concurrencyLine + "\n\n" + table + "\n\n" + endMarker + "\n";

  const newContent =
    content.slice(0, startIdx) + replacement + content.slice(endIdx + endMarker.length + 1);

  fs.writeFileSync(docPath, newContent, "utf8");
  console.log(`\nUpdated ${docPath}`);
}

function printCombinedTable(allResults: BenchmarkOutput[]) {
  console.log("\n## Combined Results\n");
  console.log(`| Framework | ${ROUTE_NAMES.map((r) => ` ${r} `).join("|")}|`);
  console.log(`|${["---", ...ROUTE_NAMES.map(() => "---")].join("|")}|`);

  const sorted = [...allResults].sort((a, b) => {
    const aVal = a.routes.find((r) => r.route === "GET /hello")?.opsPerSec ?? 0;
    const bVal = b.routes.find((r) => r.route === "GET /hello")?.opsPerSec ?? 0;
    return bVal - aVal;
  });

  for (const result of sorted) {
    const cells = [result.framework];
    for (const routeName of ROUTE_NAMES) {
      const found = result.routes.find((r) => r.route === routeName);
      cells.push(found ? `${found.opsPerSec.toLocaleString()} ops/sec` : "N/A");
    }
    console.log(`| ${cells.join(" | ")} |`);
  }
}

async function main() {
  console.log("# Framework Benchmarks\n");

  const allResults: BenchmarkOutput[] = [];

  for (const b of benchmarks) {
    try {
      /* eslint-disable-next-line no-await-in-loop */
      const { stdout } = await execAsync(b.cmd, { cwd: process.cwd() });

      console.log(stdout);

      const routes = extractResults(stdout);
      allResults.push({ framework: b.name, routes });
    } catch (e: any) {
      console.error(`Failed: ${b.name} - ${e.message}`);
    }
    console.log();
    /* eslint-disable-next-line no-await-in-loop */
    await new Promise((r) => setTimeout(r, 1000));
  }

  printCombinedTable(allResults);

  const tableMd = formatCombinedTable(allResults);
  updateBenchmarksDoc(tableMd);
}

main();
