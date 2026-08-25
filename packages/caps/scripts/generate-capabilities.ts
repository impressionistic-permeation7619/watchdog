/**
 * Write packages/caps/capabilities.gen.json from live CAPABILITIES.
 * Do not hand-edit the generated file — re-run `pnpm generate:caps`.
 *
 * Hygiene: Cap `credentials` names should appear in `KNOWN_CREDENTIALS`
 * so Settings shows a Connect row (except Cap-only required secrets that
 * are intentional — still prefer known slots).
 */
import { writeFileSync } from "node:fs";
import path from "node:path";

import { toCapDescriptor } from "@watchdog/cap-sdk";

import { listKnownCredentials } from "../src/known-credentials.ts";
import { CAPABILITIES } from "../src/registry.ts";

const here = import.meta.dirname;
const outPath = path.join(here, "..", "capabilities.gen.json");

const known = new Set(listKnownCredentials().map((k) => k.name));
const missingSlots = new Set<string>();
for (const cap of CAPABILITIES) {
  for (const spec of cap.credentials ?? []) {
    if ("anyOf" in spec) {
      for (const name of spec.anyOf) {
        if (!known.has(name)) missingSlots.add(`${cap.id}:${name}`);
      }
    } else if (!known.has(spec.name)) {
      missingSlots.add(`${cap.id}:${spec.name}`);
    }
  }
}
if (missingSlots.size > 0) {
  console.error(
    `generate:caps hygiene — Cap credential(s) missing from KNOWN_CREDENTIALS:\n  ${[...missingSlots].join("\n  ")}`
  );
  process.exit(1);
}

const descriptors = CAPABILITIES.map((c) => toCapDescriptor(c));
writeFileSync(outPath, `${JSON.stringify(descriptors, null, 2)}\n`, "utf-8");
console.log(`wrote ${descriptors.length} CapDescriptor(s) → ${outPath}`);
