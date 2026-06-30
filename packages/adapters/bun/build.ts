import { buildPackage } from "../../../scripts/build-package";

await buildPackage({
  entrypoints: ["src/index.ts"],
  outdir: "dist",
  root: "src",
  sourcemap: process.argv.includes("--sourcemap") ? "external" : undefined,
  minify: process.argv.includes("--minify"),
});
