import { resolve } from "node:path";
import type { BunPlugin } from "bun";
import { isolatedDeclarationSync } from "oxc-transform";

function slash(p: string): string {
  return p.replace(/\\/g, "/");
}

export function getDtsPlugin(): BunPlugin {
  const wroteTrack = new Set<string>();
  return {
    name: "oxc-transform-dts",
    setup(builder) {
      const root = builder.config.root;
      const outdir = builder.config.outdir;
      if (!root || !outdir) {
        return;
      }
      const rootAbs = slash(resolve(process.cwd(), root));
      const outAbs = slash(resolve(process.cwd(), outdir));
      builder.onStart(() => wroteTrack.clear());
      builder.onLoad({ filter: /\.ts$/ }, async (args) => {
        const p = slash(args.path);
        if (p.startsWith(rootAbs) && !wroteTrack.has(args.path)) {
          wroteTrack.add(args.path);
          const source = await Bun.file(args.path).text();
          const { code } = isolatedDeclarationSync(args.path, source);
          const outFile = p.replace(rootAbs, outAbs).replace(/\.ts$/, ".d.ts");
          await Bun.write(outFile, code);
        }
        return undefined;
      });
    },
  };
}
