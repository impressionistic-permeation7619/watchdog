import { db, evidenceRepo, jobsRepo } from "@watchdog/db";
import {
  ENRICHED_MD_ARTIFACT,
  evidenceSnapshotSchema,
  URL_ENRICH_CAPABILITY_ID,
  type EvidenceSnapshot,
} from "@watchdog/schemas";

import { readArtifactBytes } from "../infra/blob";
import { DomainError } from "../infra/domain-error";

export const MAX_SNAPSHOT_CHARS = 80_000;

const TEXTISH_MIME =
  /^(text\/|application\/(json|xml|javascript|x-www-form-urlencoded))/i;

function truncate(text: string, max = MAX_SNAPSHOT_CHARS): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n\n…[truncated ${text.length - max} chars]`;
}

async function loadTextFromEvidence(row: {
  text: string | null;
  uri: string | null;
  mime: string | null;
  kind: string;
}): Promise<string> {
  if (row.text !== null && row.text.trim() !== "") {
    return row.text;
  }
  if (row.uri === null) {
    if (row.kind === "other" || row.kind === "attestation") {
      return "";
    }
    return "";
  }
  const mime = row.mime ?? "";
  if (mime && !TEXTISH_MIME.test(mime) && !mime.includes("charset")) {
    // Non-text binary — Day-0: no OCR/PDF extract
    return "";
  }
  try {
    const bytes = await readArtifactBytes(row.uri);
    // Skip obvious binary (NUL in first 512)
    const head = bytes.slice(0, 512);
    if (head.includes(0)) return "";
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  } catch {
    return "";
  }
}

/**
 * URL dumps are metadata-only until Enrich. Process should harvest the Job
 * Output (enriched.md), not the bare URL string on the Evidence row.
 */
async function loadEnrichOutputText(input: {
  caseId: string;
  evidenceId: string;
}): Promise<string | null> {
  const recent = await jobsRepo.listSucceededForCapability(
    db,
    input.caseId,
    URL_ENRICH_CAPABILITY_ID,
    40
  );

  for (const job of recent) {
    const sourceId =
      typeof job.input === "object" && job.input !== null
        ? (job.input as { sourceEvidenceId?: string }).sourceEvidenceId
        : undefined;
    const linked =
      sourceId === input.evidenceId ||
      (job.evidenceIds?.includes(input.evidenceId) ?? false);
    if (!linked) continue;
    const arts = job.output ?? [];
    const enriched =
      arts.find((a) => a.name === ENRICHED_MD_ARTIFACT) ??
      arts.find((a) => a.name === "live.md") ??
      arts.find((a) => a.name === "wayback.md");
    if (enriched === undefined) continue;
    try {
      // oxlint-disable-next-line no-await-in-loop -- sequential by design: try jobs most-recent-first, stop at first usable text
      const bytes = await readArtifactBytes(enriched.uri);
      const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
      if (text.trim()) return text;
    } catch {
      // try older job
    }
  }
  return null;
}

export async function packEvidenceSnapshot(input: {
  caseId: string;
  evidenceId: string;
  entityId?: string;
}): Promise<EvidenceSnapshot> {
  const row = await evidenceRepo.getActiveInCase(
    db,
    input.caseId,
    input.evidenceId
  );

  if (!row) {
    throw new DomainError(
      "not_found",
      `Evidence not found: ${input.evidenceId}`
    );
  }

  let rawText = await loadTextFromEvidence(row);
  const looksLikeUrlOnly =
    row.uri === null &&
    Boolean(rawText.trim()) &&
    /^https?:\/\/\S+$/i.test(rawText.trim());
  if (!rawText.trim() || looksLikeUrlOnly) {
    const fromEnrich = await loadEnrichOutputText({
      caseId: input.caseId,
      evidenceId: row.id,
    });
    if (fromEnrich !== null && fromEnrich.trim() !== "") {
      rawText = fromEnrich;
    }
  }

  const entityId = input.entityId ?? row.entityId ?? undefined;

  return evidenceSnapshotSchema.parse({
    evidenceId: row.id,
    caseId: row.caseId,
    ...(entityId !== undefined && entityId !== "" ? { entityId } : {}),
    kind: row.kind,
    ...(row.label !== null && row.label !== "" ? { label: row.label } : {}),
    text: truncate(rawText),
    ...(row.mime !== null && row.mime !== "" ? { mime: row.mime } : {}),
    sha256: row.sha256,
    uri: row.uri,
    packedAt: new Date().toISOString(),
    packerVersion: 1,
  });
}

export function snapshotToArtifactBytes(
  snapshot: EvidenceSnapshot
): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(snapshot, null, 2));
}
