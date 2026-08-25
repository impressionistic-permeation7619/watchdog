import { eventsRepo, db, type EventRow } from "@watchdog/db";

import { DomainError } from "../infra/domain-error";
import { notifyEntityChanged } from "../infra/events";
import { assertEntityInCase } from "./guards";

export interface EventRecord {
  id: string;
  entityId: string;
  when: string;
  what: string;
  where: string | null;
}

export interface CreateEventInput {
  caseId: string;
  entityId: string;
  when: string;
  what: string;
  where?: string;
}

export interface UpdateEventInput {
  caseId: string;
  eventId: string;
  when: string;
  what: string;
  where?: string;
}

function toRecord(row: EventRow): EventRecord {
  return {
    id: row.id,
    entityId: row.entityId,
    when: row.when,
    what: row.what,
    where: row.whereText,
  };
}

export async function listEventsForEntity(
  caseId: string,
  entityId: string
): Promise<EventRecord[]> {
  await assertEntityInCase(caseId, entityId, db);
  const rows = await eventsRepo.listForEntity(db, entityId);
  return rows.map(toRecord);
}

export async function createEvent(
  input: CreateEventInput
): Promise<EventRecord> {
  await assertEntityInCase(input.caseId, input.entityId, db);
  const row = await eventsRepo.create(db, {
    entityId: input.entityId,
    when: input.when,
    what: input.what,
    whereText: input.where ?? null,
  });
  if (!row) throw new DomainError("invalid", "Failed to create Event");
  notifyEntityChanged(input.caseId);
  return toRecord(row);
}

export async function updateEvent(
  input: UpdateEventInput
): Promise<EventRecord> {
  const existing = await eventsRepo.getInCase(db, input.caseId, input.eventId);
  if (!existing) {
    throw new DomainError("not_found", "Event not found in this Case");
  }

  const row = await eventsRepo.update(db, input.eventId, {
    when: input.when,
    what: input.what,
    whereText: input.where ?? null,
  });
  if (!row) throw new DomainError("invalid", "Failed to update Event");
  notifyEntityChanged(input.caseId);
  return toRecord(row);
}

export async function deleteEvent(
  caseId: string,
  eventId: string
): Promise<void> {
  const existing = await eventsRepo.getInCase(db, caseId, eventId);
  if (!existing) {
    throw new DomainError("not_found", "Event not found in this Case");
  }

  const deleted = await eventsRepo.delete(db, eventId);
  if (!deleted) throw new DomainError("invalid", "Failed to delete Event");
  notifyEntityChanged(caseId);
}
