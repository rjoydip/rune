import { readdirSync, readFileSync, existsSync, writeFileSync, statSync, mkdirSync } from "fs";
import { join, resolve } from "path";
import { gzipSync } from "bun";
import { brotliCompressSync } from "zlib";

interface PackageSize {
  name: string;
  raw: number | null;
  gzip: number | null;
  brotli: number | null;
}

const DEFAULT_THRESHOLD = 5;

interface BaselineRecord {
  raw: number;
  gzip: number;
  brotli: number;
  threshold?: number;
}

type BaselineMap = Record<string, BaselineRecord>;

const ROOT = resolve(import.meta.dir, "..");
const PACKAGES_DIR = join(ROOT, "packages");
const DEFAULT_BASELINE = join(ROOT, ".rune", "sizes.json");
const DOCS_BUNDLE_SIZE = join(ROOT, "docs", "bundle-size.md");

const ANSI = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
};

const INDICATORS = { green: "🟢", yellow: "🟡", red: "🔴" };

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function padRight(s: string, len: number): string {
  return s + " ".repeat(Math.max(0, len - s.length));
}

function getPct(current: number | null, baseline: number | null | undefined): number | null {
  if (current === null || baseline == null || baseline === 0) return null;
  return ((current - baseline) / baseline) * 100;
}

function getIndicator(pct: number | null, threshold: number = DEFAULT_THRESHOLD): string {
  if (pct === null) return "";
  if (pct > threshold) return INDICATORS.red;
  if (pct < -threshold) return INDICATORS.green;
  return INDICATORS.yellow;
}

function ansiColor(pct: number | null, threshold: number = DEFAULT_THRESHOLD): string {
  if (pct === null) return ANSI.reset;
  if (pct > threshold) return ANSI.red;
  if (pct < -threshold) return ANSI.green;
  return ANSI.yellow;
}

function rawStatus(current: number | null, baseline: number | null | undefined): string {
  if (current === null || baseline == null) return "";
  if (current > baseline) return INDICATORS.red;
  if (current < baseline) return INDICATORS.green;
  return "—";
}

function ansiRawStatus(current: number | null, baseline: number | null | undefined): string {
  if (current === null || baseline == null) return ANSI.reset;
  if (current > baseline) return ANSI.red;
  if (current < baseline) return ANSI.green;
  return ANSI.yellow;
}

function hasChanges(s: PackageSize, baseline: BaselineMap | null): boolean {
  if (!baseline || !(s.name in baseline)) return s.raw !== null;
  const b = baseline[s.name];
  return s.raw !== b.raw || s.gzip !== b.gzip || s.brotli !== b.brotli;
}

function anyChanges(sizes: PackageSize[], baseline: BaselineMap | null): boolean {
  return sizes.some((s) => hasChanges(s, baseline));
}

const NAME_COL = 34;

const SKIP_DIRS = new Set(["node_modules", "dist", "coverage", ".turbo", ".nx"]);

function discoverPackages(dir: string = PACKAGES_DIR): { name: string; mainPath: string | null }[] {
  const results: { name: string; mainPath: string | null }[] = [];
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const entryPath = join(dir, entry);
    if (!statSync(entryPath).isDirectory()) continue;
    if (SKIP_DIRS.has(entry)) continue;

    const pkgJsonPath = join(entryPath, "package.json");
    if (existsSync(pkgJsonPath)) {
      const pkgJson = JSON.parse(readFileSync(pkgJsonPath, "utf-8"));
      const name = pkgJson.name;
      if (name) {
        const mainField = pkgJson.main || pkgJson.exports?.["."]?.import || null;
        const mainPath = mainField ? join(entryPath, mainField) : null;
        results.push({ name, mainPath });
      }
    }

    results.push(...discoverPackages(entryPath));
  }

  return results;
}

function measurePackages(pkgs: { name: string; mainPath: string | null }[]): PackageSize[] {
  return pkgs.map(({ name, mainPath }) => {
    if (!mainPath || !existsSync(mainPath)) {
      return { name, raw: null, gzip: null, brotli: null };
    }
    const content = readFileSync(mainPath);
    return {
      name,
      raw: content.length,
      gzip: gzipSync(content).length,
      brotli: brotliCompressSync(content).length,
    };
  });
}

function loadBaseline(filePath: string): BaselineMap {
  if (!existsSync(filePath)) return {};
  return JSON.parse(readFileSync(filePath, "utf-8"));
}

function saveBaseline(filePath: string, sizes: PackageSize[]): void {
  const oldBaseline = loadBaseline(filePath);
  const baseline: BaselineMap = {};
  for (const s of sizes) {
    if (s.raw !== null && s.gzip !== null && s.brotli !== null) {
      const old = oldBaseline[s.name];
      baseline[s.name] = {
        raw: s.raw,
        gzip: s.gzip,
        brotli: s.brotli,
        threshold: old?.threshold ?? DEFAULT_THRESHOLD,
      };
    }
  }
  writeFileSync(filePath, JSON.stringify(baseline, null, 2) + "\n");
}

function formatPct(pct: number | null): string {
  if (pct === null) return "—";
  return (pct >= 0 ? "+" : "") + pct.toFixed(1) + "%";
}

function formatDiff(current: number | null, baseline: number | null | undefined): string {
  if (current === null || baseline == null) return "—";
  const diff = current - baseline;
  if (Math.abs(diff) < 1) return "0 B";
  const sign = diff >= 0 ? "+" : "";
  return `${sign}${formatBytes(diff)}`;
}

function generateTerminal(sizes: PackageSize[], baseline: BaselineMap | null): string {
  const lines: string[] = [];
  const hasDiff = baseline !== null && Object.keys(baseline).length > 0;

  lines.push(`${ANSI.bold}📦 Bundle Sizes${ANSI.reset}\n`);

  if (hasDiff) {
    const hdr = `${padRight("Package", NAME_COL)}  Baseline    Raw        Gzip       Brotli     Status`;
    lines.push(ANSI.dim + hdr + ANSI.reset);

    for (const s of sizes) {
      const rawStr = s.raw !== null ? padRight(formatBytes(s.raw), 10) : padRight("—", 10);
      const gzipStr = s.gzip !== null ? padRight(formatBytes(s.gzip), 10) : padRight("—", 10);
      const brotliStr = s.brotli !== null ? padRight(formatBytes(s.brotli), 10) : padRight("—", 10);

      if (baseline && s.name in baseline) {
        const b = baseline[s.name];
        const baseRawStr = padRight(formatBytes(b.raw), 10);
        const statusColor = ansiRawStatus(s.raw, b.raw);
        const rawStatusEmoji = rawStatus(s.raw, b.raw);
        lines.push(
          `  ${padRight(s.name, NAME_COL)}  ${baseRawStr}${rawStr}${gzipStr}${brotliStr}${statusColor}${padRight(rawStatusEmoji, 4)}${ANSI.reset}`,
        );
      } else if (s.raw !== null) {
        lines.push(
          `  ${padRight(s.name, NAME_COL)}  ${padRight("—", 10)}${rawStr}${gzipStr}${brotliStr}${padRight("🆕", 4)}`,
        );
      } else {
        lines.push(
          `  ${padRight(s.name, NAME_COL)}  ${padRight("—", 10)}${padRight("—", 10)}${padRight("—", 10)}${padRight("—", 10)}${padRight("—", 4)}`,
        );
      }
    }

    if (anyChanges(sizes, baseline)) {
      lines.push("");
      lines.push(`${ANSI.bold}📊 Size Changes${ANSI.reset}\n`);
      const diffHdr = `${padRight("Package", NAME_COL)}  Δ Raw          Δ Gzip         Δ Brotli`;
      lines.push(ANSI.dim + diffHdr + ANSI.reset);

      for (const s of sizes.filter((p) => hasChanges(p, baseline))) {
        if (baseline && s.name in baseline) {
          const b = baseline[s.name];
          const threshold = b.threshold ?? DEFAULT_THRESHOLD;
          let line = `  ${padRight(s.name, NAME_COL)}  `;
          for (const key of ["raw", "gzip", "brotli"] as const) {
            const cur = s[key];
            const base = b[key];
            const pct = getPct(cur, base);
            const color = ansiColor(pct, threshold);
            const diff = formatDiff(cur, base) + " " + formatPct(pct);
            line += `${color}${padRight(diff, 14)}${ANSI.reset}`;
          }
          lines.push(line);
        } else if (s.raw !== null) {
          lines.push(
            `  ${padRight(s.name, NAME_COL)}  ${ANSI.green}${padRight("new", 14)}${ANSI.reset}${ANSI.green}${padRight("new", 14)}${ANSI.reset}${ANSI.green}${padRight("new", 14)}${ANSI.reset}`,
          );
        } else {
          lines.push(
            `  ${padRight(s.name, NAME_COL)}  ${padRight("—", 14)}${padRight("—", 14)}${padRight("—", 14)}`,
          );
        }
      }
    }
  } else {
    const hdr = `${padRight("Package", NAME_COL)}  Raw        Gzip       Brotli`;
    lines.push(ANSI.dim + hdr + ANSI.reset);

    for (const s of sizes) {
      const rawStr = s.raw !== null ? padRight(formatBytes(s.raw), 10) : padRight("—", 10);
      const gzipStr = s.gzip !== null ? padRight(formatBytes(s.gzip), 10) : padRight("—", 10);
      const brotliStr = s.brotli !== null ? padRight(formatBytes(s.brotli), 10) : padRight("—", 10);
      lines.push(`  ${padRight(s.name, NAME_COL)}  ${rawStr}${gzipStr}${brotliStr}`);
    }
  }

  return lines.join("\n") + "\n";
}

interface TableOpts {
  heading: string;
  sizeChangesHeading: string;
  footer: string;
  includeLastUpdated?: boolean;
}

function generateTable(
  sizes: PackageSize[],
  baseline: BaselineMap | null,
  opts: TableOpts,
): string {
  const hasDiff = baseline !== null && Object.keys(baseline).length > 0;
  let md = opts.heading + "\n\n";
  if (opts.includeLastUpdated) md += "_Last updated: " + new Date().toISOString() + "_\n\n";

  if (hasDiff) {
    md += "| Package | Baseline | Raw | Gzip | Brotli | Status |\n";
    md += "|---|---|---|---|---|---|\n";

    for (const s of sizes) {
      const rawStr = s.raw !== null ? formatBytes(s.raw) : "—";
      const gzipStr = s.gzip !== null ? formatBytes(s.gzip) : "—";
      const brotliStr = s.brotli !== null ? formatBytes(s.brotli) : "—";

      if (baseline && s.name in baseline) {
        const b = baseline[s.name];
        const status = rawStatus(s.raw, b.raw);
        md += `| ${s.name} | ${formatBytes(b.raw)} | ${rawStr} | ${gzipStr} | ${brotliStr} | ${status} |\n`;
      } else if (s.raw !== null) {
        md += `| ${s.name} | — | ${rawStr} | ${gzipStr} | ${brotliStr} | 🆕 |\n`;
      } else {
        md += `| ${s.name} | — | ${rawStr} | ${gzipStr} | ${brotliStr} | — |\n`;
      }
    }

    if (anyChanges(sizes, baseline)) {
      md += "\n" + opts.sizeChangesHeading + "\n\n";
      md += "| Package | Δ Raw | Δ Gzip | Δ Brotli |\n";
      md += "|---|---|---|---|\n";

      for (const s of sizes.filter((p) => hasChanges(p, baseline))) {
        if (baseline && s.name in baseline) {
          const b = baseline[s.name];
          const threshold = b.threshold ?? DEFAULT_THRESHOLD;
          const rawPct = getPct(s.raw, b.raw);
          const gzipPct = getPct(s.gzip, b.gzip);
          const brotliPct = getPct(s.brotli, b.brotli);
          md += `| ${s.name} | ${formatDiff(s.raw, b.raw)} (${formatPct(rawPct)}) ${getIndicator(rawPct, threshold)} | ${formatDiff(s.gzip, b.gzip)} (${formatPct(gzipPct)}) ${getIndicator(gzipPct, threshold)} | ${formatDiff(s.brotli, b.brotli)} (${formatPct(brotliPct)}) ${getIndicator(brotliPct, threshold)} |\n`;
        } else if (s.raw !== null) {
          md += `| ${s.name} | new 🆕 | new 🆕 | new 🆕 |\n`;
        } else {
          md += `| ${s.name} | — | — | — |\n`;
        }
      }
    }
  } else {
    md += "| Package | Raw | Gzip | Brotli |\n";
    md += "|---|---|---|---|\n";

    for (const s of sizes) {
      const rawStr = s.raw !== null ? formatBytes(s.raw) : "—";
      const gzipStr = s.gzip !== null ? formatBytes(s.gzip) : "—";
      const brotliStr = s.brotli !== null ? formatBytes(s.brotli) : "—";
      md += `| ${s.name} | ${rawStr} | ${gzipStr} | ${brotliStr} |\n`;
    }
  }

  md += opts.footer;
  return md;
}

function generateMarkdown(sizes: PackageSize[], baseline: BaselineMap | null): string {
  return generateTable(sizes, baseline, {
    heading: "## Bundle Sizes",
    sizeChangesHeading: "### 📊 Size Changes",
    footer: "\n---\n_Generated by `scripts/bundle-size.ts` at " + new Date().toISOString() + "_\n",
  });
}

function generateDocsMarkdown(sizes: PackageSize[], baseline: BaselineMap | null): string {
  return generateTable(sizes, baseline, {
    heading: "# Bundle Sizes",
    includeLastUpdated: true,
    sizeChangesHeading: "### Size Changes",
    footer: "\n---\n",
  });
}

function generateJSON(sizes: PackageSize[], baseline: BaselineMap | null): string {
  const result: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    packages: sizes.map((s) => ({
      name: s.name,
      raw: s.raw,
      gzip: s.gzip,
      brotli: s.brotli,
      ...(baseline && s.name in baseline
        ? {
            rawDiff: s.raw !== null ? s.raw - baseline[s.name].raw : null,
            gzipDiff: s.gzip !== null ? s.gzip - baseline[s.name].gzip : null,
            brotliDiff: s.brotli !== null ? s.brotli - baseline[s.name].brotli : null,
          }
        : {}),
    })),
  };
  return JSON.stringify(result, null, 2);
}

function updateBundleSizeDocs(sizes: PackageSize[], baselineFile: string | null): void {
  const baseline = baselineFile
    ? loadBaseline(baselineFile)
    : existsSync(DEFAULT_BASELINE)
      ? loadBaseline(DEFAULT_BASELINE)
      : null;
  const docContent = generateDocsMarkdown(sizes, baseline);

  if (!existsSync(DOCS_BUNDLE_SIZE)) {
    console.error(`docs/bundle-size.md not found at ${DOCS_BUNDLE_SIZE}`);
    process.exit(1);
  }

  const currentContent = readFileSync(DOCS_BUNDLE_SIZE, "utf-8");
  const pattern = /<!-- bundle-size:start -->[\s\S]*?<!-- bundle-size:end -->/g;
  const replacement = `<!-- bundle-size:start -->\n${docContent.trim()}\n<!-- bundle-size:end -->`;
  const updated = currentContent.replace(pattern, replacement);

  if (updated === currentContent) {
    console.error("Markers <!-- bundle-size:start/end --> not found in docs/bundle-size.md");
    process.exit(1);
  }

  writeFileSync(DOCS_BUNDLE_SIZE, updated);
  console.error(`updated ${DOCS_BUNDLE_SIZE}`);
}

function main(): void {
  const args = process.argv.slice(2);
  const jsonFlag = args.includes("--json");
  const markdownFlag = args.includes("--markdown");
  const saveFlag = args.includes("--save");
  const updateDocsFlag = args.includes("--update-docs");
  const baselineIdx = args.indexOf("--baseline");
  const baselineFile = baselineIdx !== -1 ? args[baselineIdx + 1] : null;

  if (baselineIdx !== -1 && !baselineFile) {
    console.error("error: --baseline requires a file path");
    process.exit(1);
  }

  const discovered = discoverPackages();
  const sizes = measurePackages(discovered);

  if (updateDocsFlag) {
    if (saveFlag || jsonFlag || markdownFlag) {
      console.warn("warning: --update-docs combined with other flags; those flags are ignored");
    }
    updateBundleSizeDocs(sizes, baselineFile);
    return;
  }

  if (saveFlag) {
    mkdirSync(resolve(DEFAULT_BASELINE, ".."), { recursive: true });
    saveBaseline(DEFAULT_BASELINE, sizes);
    updateBundleSizeDocs(sizes, baselineFile);

    if (!markdownFlag && !jsonFlag) {
      const count = sizes.filter((s) => s.raw !== null).length;
      console.error(`saved ${count} package sizes`);
    }
  }

  const baseline = baselineFile
    ? loadBaseline(baselineFile)
    : existsSync(DEFAULT_BASELINE)
      ? loadBaseline(DEFAULT_BASELINE)
      : null;

  if (jsonFlag) {
    console.log(generateJSON(sizes, baseline));
  } else if (markdownFlag) {
    console.log(generateMarkdown(sizes, baseline));
  } else {
    console.log(generateTerminal(sizes, baseline));
  }
}

main();
