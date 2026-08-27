/**
 * Write packages/caps/capabilities.gen.json from live CAPABILITIES.
 * Do not hand-edit the generated file — re-run `pnpm generate:caps`.
 */
import path from "node:path";

import { writeCapabilitiesGenFile } from "../src/write-capabilities-gen.ts";

const here = import.meta.dirname;
const outPath = path.join(here, "..", "capabilities.gen.json");
const count = writeCapabilitiesGenFile(outPath);
console.log(`wrote ${count} CapDescriptor(s) → ${outPath}`);
