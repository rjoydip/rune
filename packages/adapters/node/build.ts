import { buildPackage } from "../../../scripts/build-package.js";

await buildPackage({
  entrypoints: ["src/index.ts"],
  outdir: "dist",
  root: "src",
  target: "node",
  sourcemap: process.argv.includes("--sourcemap") ? "external" : undefined,
  minify: process.argv.includes("--minify"),
});
