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
  overrides?: Partial<NewEntity>
): Promise<EntityRow> {
  const overridesResolved = overrides ?? {};
  const name = overridesResolved.name ?? "Test Entity";
  const created = await entitiesRepo.create(exec, {
    id: overridesResolved.id ?? testId(10),
    caseId,
    kind: overridesResolved.kind ?? "person",
    name,
    slug: overridesResolved.slug ?? (slugifyName(name) || "test-entity"),
    summary: overridesResolved.summary,
    notes: overridesResolved.notes,
  });
  if (!created) {
    throw new Error("seedEntity failed");
  }
  return created;
}
