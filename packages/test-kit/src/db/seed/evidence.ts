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
  overrides?: Partial<NewEvidence>
): Promise<EvidenceRow> {
  const overridesResolved = overrides ?? {};
  const created = await evidenceRepo.create(exec, {
    caseId,
    entityId: overridesResolved.entityId ?? null,
    kind: overridesResolved.kind ?? "attestation",
    label: overridesResolved.label ?? "test evidence",
    notes: overridesResolved.notes ?? null,
    mime: overridesResolved.mime ?? "text/plain",
    uri: overridesResolved.uri ?? null,
    sha256: overridesResolved.sha256 ?? null,
    text: overridesResolved.text ?? "attestation body",
    sourceUrl: overridesResolved.sourceUrl ?? null,
    actorId: overridesResolved.actorId ?? TEST_ACTOR_ID,
  });
  if (!created) {
    throw new Error("seedEvidence failed");
  }
  return created;
}
