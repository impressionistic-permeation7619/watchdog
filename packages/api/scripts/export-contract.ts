/**
 * Export a minified oRPC contract (+ OpenAPI JSON) for @watchdog/client.
 * Run: pnpm --filter @watchdog/api export-contract
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { minifyContractRouter } from "@orpc/contract";

import { generateOpenAPISpec } from "../src/openapi.ts";
import { router } from "../src/router.ts";

const here = import.meta.dirname;
const outDir = path.join(here, "../../client/src/generated");

mkdirSync(outDir, { recursive: true });

const contract = minifyContractRouter(router);
writeFileSync(
  path.join(outDir, "contract.json"),
  `${JSON.stringify(contract, null, 2)}\n`
);

const spec = await generateOpenAPISpec("/api/v1");
writeFileSync(
  path.join(outDir, "openapi.json"),
  `${JSON.stringify(spec, null, 2)}\n`
);

console.log(`Wrote ${outDir}/contract.json`);
console.log(`Wrote ${outDir}/openapi.json`);
