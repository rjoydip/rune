import { measure, printResults } from "./measure";

function parseQuery(url: string) {
  const [_, qs] = url.split("?");
  if (!qs) return {};
  const params: Record<string, string> = {};
  for (const pair of qs.split("&")) {
    const [k, v] = pair.split("=");
    params[decodeURIComponent(k)] = decodeURIComponent(v ?? "");
  }
  return params;
}

async function main() {
  const url = "/search?limit=10&offset=0&tags=typescript,benchmark&q=performance";

  const results = [];
  results.push(
    await measure(
      "query-param parse",
      async () => {
        parseQuery(url);
      },
      100_000,
    ),
  );

  printResults(results);
  process.exit(0);
}

main();
