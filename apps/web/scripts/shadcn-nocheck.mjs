#!/usr/bin/env node
/**
 * Stamp @ts-nocheck on shadcn-generated sources under `src/shared/ui/shadcn/`.
 * Run after `pnpm dlx shadcn@latest add …`
 *
 * Hand-owned WD UI lives beside this folder in `src/shared/ui/` and stays
 * typechecked via the main web tsconfig (shadcn/ is excluded).
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.join(import.meta.dirname, "..");
const shadcnDir = path.join(root, "src/shared/ui/shadcn");
const vendorHooks = [path.join(root, "src/shared/hooks/use-mobile.ts")];

const MARKER = "// @ts-nocheck — shadcn vendor; excluded from project checks\n";

/** @param {string} file */
async function stampFile(file) {
  if (!/\.(tsx?|jsx?)$/.test(file)) return;
  let src = await readFile(file, "utf-8");
  if (src.startsWith("// @ts-nocheck")) return;
  src = src.replace(/^\uFEFF/, "").replace(/^\s+/, "");
  await writeFile(file, MARKER + src);
  console.log("stamped", path.relative(root, file).replaceAll("\\", "/"));
}

/** @param {string} dir */
async function walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  // Independent per-entry file I/O — safe to run concurrently.
  await Promise.all(
    entries.map(async (ent) => {
      const abs = path.join(dir, ent.name);
      return ent.isDirectory() ? walk(abs) : stampFile(abs);
    })
  );
}

await walk(shadcnDir);
await Promise.all(
  vendorHooks.map(async (file) => {
    try {
      await stampFile(file);
    } catch {
      // optional
    }
  })
);
