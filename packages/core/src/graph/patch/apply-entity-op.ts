import { entitiesRepo, type DbTx } from "@watchdog/db";
import { ENTITY_KINDS, type PatchOp } from "@watchdog/schemas";

import { DomainError } from "../../infra/domain-error";
import { requireEnum, requireString } from "./apply-patch-helpers";

export async function applyEntityOp(
  tx: DbTx,
  caseId: string,
  op: PatchOp
): Promise<void> {
  if (op.op === "create" || op.op === "upsert") {
    const kind = requireEnum(
      requireString(op.data, "kind"),
      ENTITY_KINDS,
      "entity kind"
    );
    const name = requireString(op.data, "name");
    const slug = requireString(op.data, "slug");
    const summary =
      typeof op.data.summary === "string" ? op.data.summary : null;
    const notes = typeof op.data.notes === "string" ? op.data.notes : null;

    if (op.op === "upsert") {
      const existing = await entitiesRepo.getByCaseSlug(tx, caseId, slug);
      if (existing) {
        await entitiesRepo.update(tx, existing.id, {
          kind,
          name,
          summary,
          notes,
        });
        return;
      }
    }
    await entitiesRepo.create(tx, {
      id: op.id,
      caseId,
      kind,
      name,
      slug,
      summary,
      notes,
    });
    return;
  }
  if (op.op === "update") {
    const patch: {
      summary?: string;
      notes?: string;
      name?: string;
    } = {};
    if (typeof op.data.summary === "string") patch.summary = op.data.summary;
    if (typeof op.data.notes === "string") patch.notes = op.data.notes;
    if (typeof op.data.name === "string") patch.name = op.data.name;
    await entitiesRepo.update(tx, op.id, patch);
    return;
  }
  throw new DomainError(
    "invalid",
    `entity does not support op: ${JSON.stringify(op.op)}`
  );
}
