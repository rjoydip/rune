import { rmSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { getDtsPlugin } from "./dts-plugin";

interface BuildPackageOptions {
  entrypoints: string[];
  outdir: string;
  root: string;
  minify?: boolean;
  target?: "bun" | "node";
  external?: string[];
  sourcemap?: "external" | "inline" | "linked";
}

export async function buildPackage(options: BuildPackageOptions) {
  const outdir = resolve(options.outdir);
  rmSync(outdir, { recursive: true, force: true });
  mkdirSync(outdir, { recursive: true });

  const result = await Bun.build({
    entrypoints: options.entrypoints,
    outdir: options.outdir,
    root: options.root,
    minify: options.minify ?? false,
    target: options.target ?? "bun",
    external: options.external,
    sourcemap: options.sourcemap,
    plugins: [getDtsPlugin()],
  });

  if (!result.success) {
    for (const log of result.logs) {
      console.error(log);
    }
    process.exit(1);
  }
}
