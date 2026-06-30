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

const NAME_COL = 34;

function discoverPackages(): { name: string; mainPath: string | null }[] {
  const results: { name: string; mainPath: string | null }[] = [];
  const categories = readdirSync(PACKAGES_DIR);

  for (const category of categories) {
    const categoryPath = join(PACKAGES_DIR, category);
    if (!statSync(categoryPath).isDirectory()) continue;

    const pkgDirs = readdirSync(categoryPath);
    for (const pkgDir of pkgDirs) {
      const pkgJsonPath = join(categoryPath, pkgDir, "package.json");
      if (!existsSync(pkgJsonPath)) continue;

      const pkgJson = JSON.parse(readFileSync(pkgJsonPath, "utf-8"));
      const name = pkgJson.name;
      if (!name) continue;

      const mainField = pkgJson.main || pkgJson.exports?.["."]?.import || null;
      const mainPath = mainField ? join(categoryPath, pkgDir, mainField) : null;

      results.push({ name, mainPath });
    }
  }

  results.sort((a, b) => a.name.localeCompare(b.name));
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

  const hdr = hasDiff
    ? `${padRight("Package", NAME_COL)}  Thresh  Raw        Gzip       Brotli     Δ Raw          Δ Gzip         Δ Brotli`
    : `${padRight("Package", NAME_COL)}  Thresh  Raw        Gzip       Brotli`;
  lines.push(ANSI.dim + hdr + ANSI.reset);

  for (const s of sizes) {
    const threshold = (baseline && s.name in baseline) ? ((baseline[s.name].threshold ?? DEFAULT_THRESHOLD).toString() + "%") : "—";
    const threshStr = padRight(threshold, 7);
    const rawStr = s.raw !== null ? padRight(formatBytes(s.raw), 10) : padRight("—", 10);
    const gzipStr = s.gzip !== null ? padRight(formatBytes(s.gzip), 10) : padRight("—", 10);
    const brotliStr = s.brotli !== null ? padRight(formatBytes(s.brotli), 10) : padRight("—", 10);

    let line = `  ${padRight(s.name, NAME_COL)}  ${threshStr}${rawStr}${gzipStr}${brotliStr}`;

    if (hasDiff && baseline && s.name in baseline) {
      const b = baseline[s.name];
      const threshold = b.threshold ?? DEFAULT_THRESHOLD;
      for (const key of ["raw", "gzip", "brotli"] as const) {
        const cur = s[key];
        const base = b[key];
        const pct = getPct(cur, base);
        const color = ansiColor(pct, threshold);
        const diff = formatDiff(cur, base) + " " + formatPct(pct);
        line += `${color}${padRight(diff, 14)}${ANSI.reset}`;
      }
    } else if (hasDiff && s.raw !== null) {
      line += `${ANSI.green}${padRight("new", 10)}${ANSI.reset}${ANSI.green}${padRight("new", 10)}${ANSI.reset}${ANSI.green}${padRight("new", 10)}${ANSI.reset}`;
    } else if (hasDiff) {
      line += `${padRight("—", 10)}${padRight("—", 10)}${padRight("—", 10)}`;
    }

    lines.push(line);
  }

  return lines.join("\n") + "\n";
}

function generateMarkdown(sizes: PackageSize[], baseline: BaselineMap | null): string {
  let md = "## Bundle Sizes\n\n";
  const hasDiff = baseline !== null && Object.keys(baseline).length > 0;

  if (hasDiff) {
    md += "| Package | Threshold | Raw | Gzip | Brotli | Δ Raw | Δ Gzip | Δ Brotli |\n";
    md += "|---|---|---|---|---|---|---|---|\n";

    for (const s of sizes) {
      const rawStr = s.raw !== null ? formatBytes(s.raw) : "—";
      const gzipStr = s.gzip !== null ? formatBytes(s.gzip) : "—";
      const brotliStr = s.brotli !== null ? formatBytes(s.brotli) : "—";

      if (baseline && s.name in baseline) {
        const b = baseline[s.name];
        const threshold = b.threshold ?? DEFAULT_THRESHOLD;
        const rawPct = getPct(s.raw, b.raw);
        const gzipPct = getPct(s.gzip, b.gzip);
        const brotliPct = getPct(s.brotli, b.brotli);
        const rawDiff = formatDiff(s.raw, b.raw) + " (" + formatPct(rawPct) + ") " + getIndicator(rawPct, threshold);
        const gzipDiff = formatDiff(s.gzip, b.gzip) + " (" + formatPct(gzipPct) + ") " + getIndicator(gzipPct, threshold);
        const brotliDiff = formatDiff(s.brotli, b.brotli) + " (" + formatPct(brotliPct) + ") " + getIndicator(brotliPct, threshold);
        md += `| ${s.name} | ±${threshold}% | ${rawStr} | ${gzipStr} | ${brotliStr} | ${rawDiff} | ${gzipDiff} | ${brotliDiff} |\n`;
      } else if (s.raw !== null) {
        md += `| ${s.name} | — | ${rawStr} | ${gzipStr} | ${brotliStr} | new 🆕 | new 🆕 | new 🆕 |\n`;
      } else {
        md += `| ${s.name} | — | ${rawStr} | ${gzipStr} | ${brotliStr} | — | — | — |\n`;
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

  md += "\n---\n_Generated by `scripts/bundle-size.ts` at " + new Date().toISOString() + "_\n";
  return md;
}

function generateDocsMarkdown(sizes: PackageSize[], baseline: BaselineMap | null): string {
  let md = "# Bundle Sizes\n\n";
  md += "_Last updated: " + new Date().toISOString() + "_\n\n";

  const hasDiff = baseline !== null && Object.keys(baseline).length > 0;

  if (hasDiff) {
    md += "| Package | Threshold | Raw | Gzip | Brotli | Δ Raw | Δ Gzip | Δ Brotli |\n";
    md += "|---|---|---|---|---|---|---|---|\n";

    for (const s of sizes) {
      const rawStr = s.raw !== null ? formatBytes(s.raw) : "—";
      const gzipStr = s.gzip !== null ? formatBytes(s.gzip) : "—";
      const brotliStr = s.brotli !== null ? formatBytes(s.brotli) : "—";

      if (baseline && s.name in baseline) {
        const b = baseline[s.name];
        const threshold = b.threshold ?? DEFAULT_THRESHOLD;
        const rawPct = getPct(s.raw, b.raw);
        const gzipPct = getPct(s.gzip, b.gzip);
        const brotliPct = getPct(s.brotli, b.brotli);
        const rawDiff = formatDiff(s.raw, b.raw) + " (" + formatPct(rawPct) + ") " + getIndicator(rawPct, threshold);
        const gzipDiff = formatDiff(s.gzip, b.gzip) + " (" + formatPct(gzipPct) + ") " + getIndicator(gzipPct, threshold);
        const brotliDiff = formatDiff(s.brotli, b.brotli) + " (" + formatPct(brotliPct) + ") " + getIndicator(brotliPct, threshold);
        md += `| ${s.name} | ±${threshold}% | ${rawStr} | ${gzipStr} | ${brotliStr} | ${rawDiff} | ${gzipDiff} | ${brotliDiff} |\n`;
      } else if (s.raw !== null) {
        md += `| ${s.name} | — | ${rawStr} | ${gzipStr} | ${brotliStr} | new 🆕 | new 🆕 | new 🆕 |\n`;
      } else {
        md += `| ${s.name} | — | ${rawStr} | ${gzipStr} | ${brotliStr} | — | — | — |\n`;
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

  md += "\n---\n";
  return md;
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

function main(): void {
  const args = process.argv.slice(2);
  const jsonFlag = args.includes("--json");
  const markdownFlag = args.includes("--markdown");
  const saveFlag = args.includes("--save");
  const baselineIdx = args.indexOf("--baseline");
  const baselineFile = baselineIdx !== -1 ? args[baselineIdx + 1] : null;

  if (baselineIdx !== -1 && !baselineFile) {
    console.error("error: --baseline requires a file path");
    process.exit(1);
  }

  const discovered = discoverPackages();
  const sizes = measurePackages(discovered);

  if (saveFlag) {
    const oldBaseline = loadBaseline(DEFAULT_BASELINE);
    saveBaseline(DEFAULT_BASELINE, sizes);
    const docsDir = resolve(ROOT, "docs");
    if (!existsSync(docsDir)) mkdirSync(docsDir, { recursive: true });
    const docContent = generateDocsMarkdown(
      sizes,
      Object.keys(oldBaseline).length > 0 ? oldBaseline : null,
    );
    writeFileSync(DOCS_BUNDLE_SIZE, docContent);

    if (!markdownFlag && !jsonFlag) {
      const count = sizes.filter((s) => s.raw !== null).length;
      console.error(`saved ${count} package sizes`);
      console.error(`updated ${DOCS_BUNDLE_SIZE}`);
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
