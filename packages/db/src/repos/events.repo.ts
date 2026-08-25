import { and, asc, eq } from "drizzle-orm";

import type { DbExec } from "../exec";
import { entities } from "../schema/entities";
import { events } from "../schema/events";

export const eventColumns = {
  id: events.id,
  entityId: events.entityId,
  when: events.when,
  what: events.what,
  whereText: events.whereText,
} as const;

export type EventRow = {
  [K in keyof typeof eventColumns]: (typeof events.$inferSelect)[K &
    keyof typeof events.$inferSelect];
};

export type NewEvent = Pick<
  typeof events.$inferInsert,
  "entityId" | "when" | "what" | "whereText"
> &
  Partial<Pick<typeof events.$inferInsert, "id">>;

export type EventPatch = Pick<
  typeof events.$inferInsert,
  "when" | "what" | "whereText"
>;

export const eventsRepo = {
  async listForEntity(exec: DbExec, entityId: string): Promise<EventRow[]> {
    return exec
      .select(eventColumns)
      .from(events)
      .where(eq(events.entityId, entityId))
      .orderBy(asc(events.when));
  },

  async getInCase(
    exec: DbExec,
    caseId: string,
    eventId: string
  ): Promise<EventRow | null> {
    const [row] = await exec
      .select(eventColumns)
      .from(events)
      .innerJoin(entities, eq(events.entityId, entities.id))
      .where(and(eq(events.id, eventId), eq(entities.caseId, caseId)))
      .limit(1);
    return row ?? null;
  },

  async create(exec: DbExec, values: NewEvent): Promise<EventRow | null> {
    const [created] = await exec
      .insert(events)
      .values(values)
      .returning(eventColumns);
    return created ?? null;
  },

  async update(
    exec: DbExec,
    eventId: string,
    patch: EventPatch
  ): Promise<EventRow | null> {
    const [updated] = await exec
      .update(events)
      .set(patch)
      .where(eq(events.id, eventId))
      .returning(eventColumns);
    return updated ?? null;
  },

  async delete(exec: DbExec, eventId: string): Promise<EventRow | null> {
    const [deleted] = await exec
      .delete(events)
      .where(eq(events.id, eventId))
      .returning(eventColumns);
    return deleted ?? null;
  },
};
