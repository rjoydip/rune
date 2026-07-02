import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const BENCHMARKS_DIR = import.meta.dir;
const DOCS_PATH = path.resolve(BENCHMARKS_DIR, "../docs/benchmarks.md");

const RUNNER_SCRIPTS = [
  { cmd: "bun run runner.ts", marker: "bench-framework" },
  { cmd: "bun run adapter-runner.ts", marker: "bench-adapter" },
];

function extractTable(stdout: string): string {
  const lines = stdout.split("\n");
  const combinedIdx = lines.findIndex((l) => l.trim() === "## Combined Results");
  if (combinedIdx === -1) return "";

  let tableStart = combinedIdx + 1;
  while (tableStart < lines.length && !lines[tableStart].trim().startsWith("|")) {
    tableStart++;
  }
  if (tableStart >= lines.length) return "";

  let tableEnd = tableStart;
  while (tableEnd < lines.length && lines[tableEnd].trim().startsWith("|")) {
    tableEnd++;
  }

  return lines.slice(tableStart, tableEnd).join("\n");
}

function main() {
  if (!fs.existsSync(DOCS_PATH)) {
    console.error(`docs/benchmarks.md not found at ${DOCS_PATH}`);
    process.exit(1);
  }

  let content = fs.readFileSync(DOCS_PATH, "utf-8");

  for (const { cmd, marker } of RUNNER_SCRIPTS) {
    console.log(`Running: ${cmd}`);
    const stdout = execSync(cmd, { cwd: BENCHMARKS_DIR }).toString();
    const table = extractTable(stdout);

    if (!table) {
      console.warn(`No combined results table found for ${cmd}`);
      continue;
    }

    const pattern = new RegExp(`<!-- ${marker}:start -->[\\s\\S]*?<!-- ${marker}:end -->`, "g");
    const replacement = `<!-- ${marker}:start -->\n${table}\n<!-- ${marker}:end -->`;
    const newContent = content.replace(pattern, replacement);

    if (newContent === content) {
      console.warn(`Marker not found in docs: ${marker}`);
      continue;
    }

    content = newContent;
    console.log(`  Updated marker: ${marker}`);
  }

  fs.writeFileSync(DOCS_PATH, content);
  console.log(`\nUpdated ${DOCS_PATH}`);
}

main();
