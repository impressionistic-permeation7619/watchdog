/**
 * Export a minified oRPC contract (+ OpenAPI JSON) for @watchdog/client.
 * Run: pnpm --filter @watchdog/api export-contract
 */
import path from "node:path";

import { exportContract } from "../src/export-contract.ts";

const here = import.meta.dirname;
const outDir = path.join(here, "../../client/src/generated");
await exportContract(outDir);
console.log(`Wrote ${outDir}/contract.json`);
console.log(`Wrote ${outDir}/openapi.json`);
