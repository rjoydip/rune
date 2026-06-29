import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import catppuccin from "@catppuccin/starlight";
import { transformDocs } from "../../scripts/transform-docs.ts";

transformDocs();

export default defineConfig({
  site: "https://rune-docs.pages.dev",
  integrations: [
    starlight({
      title: "Rune",
      description: "A batteries-included, web-standard, runtime-agnostic backend framework",
      plugins: [
        catppuccin({
          dark: { flavor: "macchiato", accent: "blue" },
          light: { flavor: "latte", accent: "blue" },
        }),
      ],
      social: [{ icon: "github", label: "GitHub", href: "https://github.com/rjoydip/rune" }],
      sidebar: [
        {
          label: "Getting Started",
          items: [
            { label: "Overview", link: "/" },
            { label: "Getting Started", link: "/getting-started/" },
            { label: "Architecture", link: "/architecture/" },
            { label: "Core Concepts", link: "/core-concepts/" },
            { label: "Configuration", link: "/configuration/" },
          ],
        },
        {
          label: "Features",
          items: [
            { label: "Decorators", link: "/decorators/" },
            { label: "Dependency Injection", link: "/di/" },
            { label: "Validation", link: "/validation/" },
            { label: "Middleware", link: "/middleware/" },
            { label: "Guards & Interceptors", link: "/guards-interceptors/" },
            { label: "Events", link: "/events/" },
            { label: "OpenAPI", link: "/openapi/" },
            { label: "Error Handling", link: "/error-handling/" },
          ],
        },
        {
          label: "Deployment",
          items: [
            { label: "Runtime Adapters", link: "/runtime-adapters/" },
            { label: "Adapters", link: "/adapters/" },
            { label: "Adapter Development", link: "/adapter-development/" },
          ],
        },
        {
          label: "Reference",
          items: [
            { label: "CLI", link: "/cli/" },
            { label: "Testing", link: "/testing/" },
            { label: "Migration Guide", link: "/migration/" },
            { label: "Performance", link: "/performance/" },
            { label: "Benchmarks", link: "/benchmarks/" },
            { label: "Bundle Sizes", link: "/bundle-size/" },
          ],
        },
      ],
    }),
  ],
});
