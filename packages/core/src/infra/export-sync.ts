/**
 * export-sync.ts — File system sync for the live Export shadow workspace.
 *
 * Writes rendered entity markdown + evidence files to:
 *   <WD_EXPORT_DIR>/<case-slug>/{persons,infras,orgs}/<entity-slug>.md
 *   <WD_EXPORT_DIR>/<case-slug>/evidence/<id-prefix>--<label>.ext
 */

import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import nodePath from "node:path";

import { env } from "@watchdog/env/server";

import { readArtifactBytes } from "./blob";
import { renderCaseExport, renderEntityMarkdown } from "./export";
import { logProcess, logSwallowed } from "./process-log";

function exportRoot(): string {
  return (
    env.WD_EXPORT_DIR ??
    nodePath.join(new URL("../../../../export", import.meta.url).pathname)
  );
}

async function write(
  path: string,
  content: string | Uint8Array
): Promise<void> {
  await mkdir(nodePath.dirname(path), { recursive: true });
  await writeFile(path, content);
}

function safeFilename(label: string): string {
  return (
    label
      // oxlint-disable-next-line eslint/no-control-regex -- intentionally strips filesystem-illegal control chars
      .replaceAll(/[<>:"/\\|?*\u0000-\u001F]/g, "_")
      .replaceAll(/\s+/g, "-")
      .slice(0, 80)
  );
}

function evidenceExt(mime: string | null, label: string | null): string {
  // Try label extension first
  if (label !== null) {
    const ext = nodePath.extname(label);
    if (ext) return ext;
  }
  if (mime === null) return ".bin";
  const map: Record<string, string> = {
    "application/json": ".json",
    "text/plain": ".txt",
    "text/html": ".html",
    "text/markdown": ".md",
    "application/pdf": ".pdf",
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/gif": ".gif",
    "image/webp": ".webp",
  };
  const base = mime.split(";")[0]?.trim() ?? "";
  return map[base] ?? ".bin";
}

/**
 * Write (or overwrite) a single entity's markdown file.
 */
export async function writeEntityExport(entityId: string): Promise<void> {
  const exported = await renderEntityMarkdown(entityId);
  if (!exported) return;

  const kindDir = `${exported.kind}s`;
  const path = nodePath.join(
    exportRoot(),
    exported.caseSlug,
    kindDir,
    `${exported.entitySlug}.md`
  );

  await write(path, exported.markdown);
}

/**
 * Write all entities + evidence for a Case to the export directory.
 */
export async function writeCaseExport(caseId: string): Promise<void> {
  const { files: mdFiles, evidenceRows } = await renderCaseExport(caseId);
  if (mdFiles.size === 0) return;

  // Extract case slug from CASE.md
  const caseMd = mdFiles.get("CASE.md") ?? "";
  const match = /^slug: (.+)$/m.exec(caseMd);
  const caseSlug = match?.[1]?.trim();
  if (caseSlug === undefined || caseSlug === "") return;

  const root = nodePath.join(exportRoot(), caseSlug);

  // Write markdown files — independent per-file, fetched/written concurrently.
  await Promise.all(
    [...mdFiles].map(async ([relPath, content]) =>
      write(nodePath.join(root, relPath), content)
    )
  );

  // Write evidence files
  const evidenceDir = nodePath.join(root, "evidence");
  await mkdir(evidenceDir, { recursive: true });

  let evidenceIncluded = 0;
  let evidenceSkipped = 0;

  await Promise.all(
    evidenceRows.map(async (ev) => {
      const prefix = ev.id.slice(0, 8);
      const labelBase = safeFilename(
        ev.label ?? ev.sourceUrl ?? ev.id.slice(0, 8)
      );

      if (ev.uri !== null) {
        // File/url_archive — fetch bytes from MinIO
        try {
          const bytes = await readArtifactBytes(ev.uri);
          const ext = evidenceExt(ev.mime, ev.label);
          const filename = `${prefix}--${labelBase}${ext}`;
          await write(nodePath.join(evidenceDir, filename), bytes);
          evidenceIncluded += 1;
        } catch (error) {
          evidenceSkipped += 1;
          logSwallowed("export-sync.evidence_skip", error, {
            caseId,
            evidenceId: ev.id,
          });
        }
      } else if (
        ev.text !== null &&
        ev.text !== "" &&
        ev.kind !== "attestation"
      ) {
        // Text evidence (non-attestation) — write inline
        const filename = `${prefix}--${labelBase}.txt`;
        await write(nodePath.join(evidenceDir, filename), ev.text);
        evidenceIncluded += 1;
      }
      // attestation text-only items are written to evidence/attestations.md via mdFiles
    })
  );

  if (evidenceSkipped > 0) {
    logProcess("export-sync", "evidence blob skips during case export", {
      caseId,
      evidenceIncluded,
      evidenceSkipped,
    });
  }
}

/** Per-case dirty-flag coalesce — at most one in-flight writeCaseExport. */
const exportInFlight = new Map<string, Promise<void>>();
const exportDirty = new Set<string>();

/**
 * Schedule a Case export write. Concurrent calls for the same case coalesce
 * into one in-flight write, then at most one follow-up if more events arrived.
 * `writeExport` is injectable so unit tests can assert coalesce without MinIO.
 */
export async function scheduleCaseExport(
  caseId: string,
  writeExport: (id: string) => Promise<void> = writeCaseExport
): Promise<void> {
  exportDirty.add(caseId);
  const existing = exportInFlight.get(caseId);
  if (existing !== undefined) {
    return existing;
  }

  const run = (async () => {
    try {
      while (exportDirty.has(caseId)) {
        exportDirty.delete(caseId);
        try {
          // oxlint-disable-next-line no-await-in-loop -- coalesce loop: each pass must finish before re-checking the dirty flag for another
          await writeExport(caseId);
        } catch (error) {
          logSwallowed("export-sync.write", error, { caseId });
        }
      }
    } finally {
      exportInFlight.delete(caseId);
    }
  })();

  exportInFlight.set(caseId, run);
  return run;
}

function exportDirForSlug(slug: string): string | null {
  const root = nodePath.resolve(exportRoot());
  const dir = nodePath.resolve(root, slug);
  if (dir === root || !dir.startsWith(`${root}${nodePath.sep}`)) {
    return null;
  }
  return dir;
}

/** Best-effort: drop the live Export shadow dir for a deleted Case. */
export async function removeCaseExportDir(slug: string): Promise<void> {
  const dir = exportDirForSlug(slug);
  if (dir === null) return;
  await rm(dir, { recursive: true, force: true });
}

/** Best-effort: move the Export shadow dir when a Case slug changes. */
export async function renameCaseExportDir(
  fromSlug: string,
  toSlug: string
): Promise<void> {
  if (fromSlug === toSlug) return;
  const from = exportDirForSlug(fromSlug);
  const to = exportDirForSlug(toSlug);
  if (from === null || to === null) return;
  await rm(to, { recursive: true, force: true });
  try {
    await rename(from, to);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return;
    }
    throw error;
  }
}
