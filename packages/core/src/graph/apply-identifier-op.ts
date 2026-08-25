import {
  evidenceLinksRepo,
  identifiersRepo,
  type DbTx,
} from "@watchdog/db";
import {
  IDENTIFIER_STATUSES,
  IDENTIFIER_TYPES,
  validateIdentifierWrite,
  type ConfidenceTier,
  type IdentifierStatus,
  type PatchOp,
} from "@watchdog/schemas";

import { DomainError } from "../infra/domain-error";
import { assertEntityInCase } from "./guards";
import { requireEnum, requireString } from "./apply-patch-helpers";

export async function applyIdentifierOp(
  tx: DbTx,
  caseId: string,
  op: PatchOp,
  confidence: ConfidenceTier | undefined,
  evidenceIds: string[]
): Promise<void> {
  if (op.op !== "create" && op.op !== "upsert") {
    throw new DomainError("invalid", "identifier supports create/upsert");
  }
  const entityId = requireString(op.data, "entityId");
  await assertEntityInCase(caseId, entityId, tx);
  const type = requireEnum(
    requireString(op.data, "type"),
    IDENTIFIER_TYPES,
    "identifier type"
  );
  const written = validateIdentifierWrite({
    type,
    value: requireString(op.data, "value"),
    platform:
      typeof op.data.platform === "string" ? op.data.platform : "",
  });
  if (!written.ok) {
    throw new DomainError("invalid", written.message);
  }
  const { value, platform } = written;
  const status =
    typeof op.data.status === "string"
      ? requireEnum(
          op.data.status,
          IDENTIFIER_STATUSES,
          "identifier status"
        )
      : ("unknown" satisfies IdentifierStatus);
  const notes = typeof op.data.notes === "string" ? op.data.notes : null;
  if (!confidence) {
    throw new DomainError("invalid", "confidence required for identifier");
  }

  if (op.op === "upsert") {
    const existing = await identifiersRepo.findByNaturalKey(tx, {
      entityId,
      type,
      platform,
      value,
    });
    if (existing) {
      await identifiersRepo.update(tx, existing.id, {
        confidence,
        status,
        notes,
      });
      await evidenceLinksRepo.linkIdentifier(tx, existing.id, evidenceIds);
      return;
    }
  }
  await identifiersRepo.create(tx, {
    id: op.id,
    entityId,
    type,
    platform,
    value,
    confidence,
    status,
    notes,
  });
  await evidenceLinksRepo.linkIdentifier(tx, op.id, evidenceIds);
}
