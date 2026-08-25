import { db, entitiesRepo, type EntityRow } from "@watchdog/db";
import type { EntityKind } from "@watchdog/schemas";

import { DomainError } from "../infra/domain-error";
import { notifyEntityChanged } from "../infra/events";
import { assertCaseExists } from "./guards";
import { seedDefaultQuestions } from "./questions";

export interface EntityRecord {
  id: string;
  caseId: string;
  kind: EntityKind;
  name: string;
  slug: string;
  summary: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEntityInput {
  caseId: string;
  kind: EntityKind;
  name: string;
  slug: string;
}

export interface UpdateEntityFieldsInput {
  caseId: string;
  entityId: string;
  kind?: EntityKind;
  name?: string;
  summary?: string;
  notes?: string;
}

function toRecord(row: EntityRow): EntityRecord {
  return {
    id: row.id,
    caseId: row.caseId,
    kind: row.kind,
    name: row.name,
    slug: row.slug,
    summary: row.summary ?? null,
    notes: row.notes ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listEntitiesForCase(
  caseId: string
): Promise<EntityRecord[]> {
  const rows = await entitiesRepo.listForCase(db, caseId);
  return rows.map(toRecord);
}

export async function getEntityByCaseSlug(
  caseId: string,
  slug: string
): Promise<EntityRecord | null> {
  const row = await entitiesRepo.getByCaseSlug(db, caseId, slug);
  return row ? toRecord(row) : null;
}

export async function createEntity(
  input: CreateEntityInput
): Promise<EntityRecord> {
  await assertCaseExists(input.caseId);

  const existing = await entitiesRepo.getByCaseSlug(
    db,
    input.caseId,
    input.slug
  );
  if (existing) {
    throw new DomainError(
      "conflict",
      `Slug "${input.slug}" already exists in this Case`
    );
  }

  const created = await db.transaction(async (tx) => {
    const row = await entitiesRepo.create(tx, {
      caseId: input.caseId,
      kind: input.kind,
      name: input.name,
      slug: input.slug,
    });
    if (!row) throw new DomainError("invalid", "Failed to create Entity");
    await seedDefaultQuestions(tx, row);
    return row;
  });
  notifyEntityChanged(input.caseId);
  return toRecord(created);
}

export async function updateEntityFields(
  input: UpdateEntityFieldsInput
): Promise<EntityRecord> {
  const existing = await entitiesRepo.getInCase(
    db,
    input.caseId,
    input.entityId
  );
  if (!existing) throw new DomainError("not_found", "Entity not found");

  const updated = await entitiesRepo.update(db, input.entityId, {
    ...(input.kind === undefined ? {} : { kind: input.kind }),
    ...(input.name === undefined ? {} : { name: input.name }),
    ...(input.summary === undefined
      ? {}
      : { summary: input.summary || null }),
    ...(input.notes === undefined ? {} : { notes: input.notes || null }),
  });
  if (!updated) throw new DomainError("invalid", "Failed to update Entity");
  notifyEntityChanged(input.caseId);
  return toRecord(updated);
}
