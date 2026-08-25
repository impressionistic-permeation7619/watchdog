import {
  evidenceRepo,
  type DbExec,
  type EvidenceRow,
  type NewEvidence,
} from "@watchdog/db";

import { TEST_ACTOR_ID } from "../../fixtures/ids.ts";

export async function seedEvidence(
  exec: DbExec,
  caseId: string,
  overrides: Partial<NewEvidence> = {}
): Promise<EvidenceRow> {
  const created = await evidenceRepo.create(exec, {
    caseId,
    entityId: overrides.entityId ?? null,
    kind: overrides.kind ?? "attestation",
    label: overrides.label ?? "test evidence",
    notes: overrides.notes ?? null,
    mime: overrides.mime ?? "text/plain",
    uri: overrides.uri ?? null,
    sha256: overrides.sha256 ?? null,
    text: overrides.text ?? "attestation body",
    sourceUrl: overrides.sourceUrl ?? null,
    actorId: overrides.actorId ?? TEST_ACTOR_ID,
  });
  if (!created) {
    throw new Error("seedEvidence failed");
  }
  return created;
}
