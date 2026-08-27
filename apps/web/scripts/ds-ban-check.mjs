#!/usr/bin/env node
/**
 * Design-system ban check.
 * Bidirectional shared/ui registry, fixture coverage, fictional vocab,
 * freestyle palette (full src), opaque-id .slice (all domains).
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.join(import.meta.dirname, "..");
const src = path.join(root, "src");

let failed = false;

function fail(msg) {
  console.error(`✗ ${msg}`);
  failed = true;
}

function ok(msg) {
  console.log(`✓ ${msg}`);
}

/**
 * @param {string} dir
 * @param {string[]} out
 * @returns {string[]}
 */
function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === "shadcn" || name === "node_modules") continue;
    const abs = path.join(dir, name);
    const st = statSync(abs);
    if (st.isDirectory()) walk(abs, out);
    else if (/\.(tsx|ts)$/.test(name)) out.push(abs);
  }
  return out;
}

/** @param {string} abs */
function rel(abs) {
  return path.relative(src, abs).replaceAll("\\", "/");
}

/** @param {string} abs */
function relFromRoot(abs) {
  return path.relative(root, abs).replaceAll("\\", "/");
}

// ── 1. Single SectionLabel SoT ───────────────────────────────────────────────
const sectionDefs = walk(path.join(src, "shared")).filter((f) => {
  const text = readFileSync(f, "utf-8");
  return (
    /export function SectionLabel\b/.test(text) ||
    /export const SectionLabel\b/.test(text)
  );
});
const allowedSection = "shared/ui/section-label.tsx";
for (const f of sectionDefs) {
  const r = rel(f);
  if (r !== allowedSection) {
    fail(`SectionLabel defined in ${r} — only ${allowedSection} may define it`);
  }
}
if (sectionDefs.some((f) => rel(f) === allowedSection)) {
  ok("SectionLabel SoT = shared/ui/section-label.tsx");
} else {
  fail("SectionLabel missing under shared/ui/section-label.tsx");
}

const layoutSl = path.join(src, "shared/layout/section-label.tsx");
if (existsSync(layoutSl)) {
  const text = readFileSync(layoutSl, "utf-8");
  if (/export function SectionLabel\b/.test(text)) {
    fail("shared/layout/section-label.tsx must re-export, not redefine");
  } else {
    ok("shared/layout/section-label.tsx is re-export only");
  }
}

// ── 2. Freestyle confidence / status greens & ambers (all of src/) ───────────
const COLOR_RE =
  /\b(?:text|bg|border)-(?:green|amber|emerald|yellow|lime|orange|red)-(?:\d{2,3})\b|\bdark:(?:text|bg|border)-(?:green|amber|emerald|yellow)-/;
const colorHits = [];
for (const f of walk(src)) {
  const r = rel(f);
  if (r.startsWith("shared/ui/shadcn/")) continue;
  const lines = readFileSync(f, "utf-8").split("\n");
  for (const [i, line] of lines.entries()) {
    if (line.trimStart().startsWith("//") || line.trimStart().startsWith("*"))
      continue;
    if (COLOR_RE.test(line)) {
      colorHits.push(`${r}:${i + 1}: ${line.trim()}`);
    }
  }
}
for (const hit of colorHits) {
  fail(`Freestyle Tailwind color (use domain tokens / badges): ${hit}`);
}
if (colorHits.length === 0) {
  ok("No freestyle green/amber/red palette colors in src/");
}

// ── 2b. domain-badge shim banned — import from vocab ─────────────────────────
const domainBadgeHits = [];
for (const f of walk(src)) {
  const r = rel(f);
  const text = readFileSync(f, "utf-8");
  if (/from\s+["']@\/shared\/ui\/domain-badge["']/.test(text)) {
    domainBadgeHits.push(r);
  }
}
for (const hit of domainBadgeHits) {
  fail(`Import @/shared/ui/domain-badge — use @/shared/ui/vocab: ${hit}`);
}
if (domainBadgeHits.length === 0) {
  ok("No domain-badge imports (vocab is SoT)");
}

// ── 2c. NativeSelect banned — use FieldSelect / Select ───────────────────────
const nativeSelectHits = [];
for (const f of walk(src)) {
  const r = rel(f);
  if (r.startsWith("shared/ui/shadcn/")) continue;
  const text = readFileSync(f, "utf-8");
  if (/from\s+["']@\/shared\/ui\/shadcn\/native-select["']/.test(text)) {
    nativeSelectHits.push(r);
  }
}
for (const hit of nativeSelectHits) {
  fail(
    `Import native-select — use FieldSelect / ConfidenceSelect / Select: ${hit}`
  );
}
if (nativeSelectHits.length === 0) {
  ok("No NativeSelect imports (FieldSelect / Select is SoT)");
}

// ── 3. Opaque id / sha256 display via .slice (all domains) ───────────────────
const ID_SLICE_RE =
  /\b(?:sha256|jobId|proposalId|entityId)\.slice\s*\(\s*0\s*,\s*\d+\s*\)|\.id\.slice\s*\(\s*0\s*,\s*\d+\s*\)|\bid\.slice\s*\(\s*0\s*,\s*\d+\s*\)/;

const sliceHits = [];
for (const f of walk(path.join(src, "domains"))) {
  const r = rel(f);
  const lines = readFileSync(f, "utf-8").split("\n");
  for (const [i, line] of lines.entries()) {
    if (line.trimStart().startsWith("//")) continue;
    if (
      /toISOString\(\)\.slice|capturedAt\.slice|processedAt\.slice|createdAt\.slice|when\.trim/.test(
        line
      )
    ) {
      continue;
    }
    if (ID_SLICE_RE.test(line)) {
      sliceHits.push(`${r}:${i + 1}: ${line.trim()}`);
    }
  }
}
for (const hit of sliceHits) {
  fail(`Opaque id/hash via .slice — use IdChip / formatOpaqueId: ${hit}`);
}
if (sliceHits.length === 0) {
  ok("No banned opaque-id .slice in domains/");
}

// ── 4. Fictional vocab literals ──────────────────────────────────────────────
const FICTION_RE =
  /confidence=["']probable["']|status=["'](?:active|dormant|merged)["']|--confidence-probable|--status-active\b|--status-dormant\b|--status-merged\b/;
const fictionHits = [];
for (const f of walk(src)) {
  const r = rel(f);
  if (r.startsWith("shared/ui/shadcn/")) continue;
  const lines = readFileSync(f, "utf-8").split("\n");
  for (const [i, line] of lines.entries()) {
    if (line.trimStart().startsWith("//")) continue;
    if (FICTION_RE.test(line)) {
      fictionHits.push(`${r}:${i + 1}: ${line.trim()}`);
    }
  }
}
for (const hit of fictionHits) {
  fail(`Fictional vocab / token (use schemas unions): ${hit}`);
}
if (fictionHits.length === 0) {
  ok("No probable/active/dormant/merged fiction literals");
}

// ── 5. Bidirectional WD UI manifest ──────────────────────────────────────────
/**
 * @param {unknown} value
 * @returns {value is { WD_UI_FILES: string[]; WD_UI_FIXTURE_REQUIRED: string[] }}
 */
function hasWdUiFiles(value) {
  return (
    typeof value === "object" &&
    value !== null &&
    "WD_UI_FILES" in value &&
    Array.isArray(value.WD_UI_FILES) &&
    value.WD_UI_FILES.every((f) => typeof f === "string") &&
    "WD_UI_FIXTURE_REQUIRED" in value &&
    Array.isArray(value.WD_UI_FIXTURE_REQUIRED)
  );
}

/** @type {unknown} */
const wdUiFilesModule = await import(
  pathToFileURL(path.join(root, "scripts/wd-ui-files.mjs")).href
);
if (!hasWdUiFiles(wdUiFilesModule)) {
  throw new TypeError(
    "scripts/wd-ui-files.mjs must export WD_UI_FILES + WD_UI_FIXTURE_REQUIRED"
  );
}
const { WD_UI_FILES, WD_UI_FIXTURE_REQUIRED } = wdUiFilesModule;

const manifestSet = new Set(WD_UI_FILES.map((f) => f.replaceAll("\\", "/")));
for (const f of WD_UI_FILES) {
  if (!existsSync(path.join(root, f))) fail(`WD UI missing: ${f}`);
}

const onDisk = walk(path.join(src, "shared/ui"))
  .map((abs) => relFromRoot(abs))
  .filter(
    (r) =>
      !r.includes("/shadcn/") &&
      !r.includes("/__tests__/") &&
      !r.endsWith(".lib.ts")
  );
for (const f of onDisk) {
  if (!manifestSet.has(f)) {
    fail(
      `Hand-owned UI file not in wd-ui-files.mjs (add + COMPONENTS.md row): ${f}`
    );
  }
}
ok(
  `WD UI bidirectional manifest (${WD_UI_FILES.length} listed, ${onDisk.length} on disk)`
);

// ── 6. /ui fixture coverage for required atoms ───────────────────────────────
const uiDir = path.join(src, "routes/_protected/ui");
if (existsSync(uiDir)) {
  const uiText = walk(uiDir)
    .map((f) => readFileSync(f, "utf-8"))
    .join("\n");
  for (const name of WD_UI_FIXTURE_REQUIRED) {
    if (!uiText.includes(name)) {
      fail(`/ui fixture missing required atom specimen: ${name}`);
    }
  }
  ok(`/ui fixture covers ${WD_UI_FIXTURE_REQUIRED.length} required atoms`);
} else {
  fail("Missing /ui fixture route dir: routes/_protected/ui/");
}

// ── 7. COMPONENTS.md registry present ────────────────────────────────────────
const componentsDoc = path.join(root, "docs/COMPONENTS.md");
if (existsSync(componentsDoc)) {
  ok("COMPONENTS.md registry present");
} else {
  fail("Missing apps/web/docs/COMPONENTS.md registry");
}

if (failed) {
  console.error("\nds-ban-check failed");
  process.exit(1);
}
console.log("\nds-ban-check passed");
