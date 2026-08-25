import {
  entitiesRepo,
  type DbExec,
  type EntityRow,
  type NewEntity,
} from "@watchdog/db";
import { slugifyName } from "@watchdog/schemas";

import { testId } from "../../fixtures/ids.ts";

export async function seedEntity(
  exec: DbExec,
  caseId: string,
  overrides: Partial<NewEntity> = {}
): Promise<EntityRow> {
  const name = overrides.name ?? "Test Entity";
  const created = await entitiesRepo.create(exec, {
    id: overrides.id ?? testId(10),
    caseId,
    kind: overrides.kind ?? "person",
    name,
    slug: overrides.slug ?? (slugifyName(name) || "test-entity"),
    summary: overrides.summary,
    notes: overrides.notes,
  });
  if (!created) {
    throw new Error("seedEntity failed");
  }
  return created;
}
