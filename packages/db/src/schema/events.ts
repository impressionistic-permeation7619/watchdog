import { pgTable, text, uuid } from "drizzle-orm/pg-core";

import { timestamps } from "./_helpers";
import { entities } from "./entities";

/**
 * Event — dated happening on an Entity (fuzzy `when` OK as text).
 * Subject = parent entityId (no separate who).
 */
export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityId: uuid("entity_id")
    .notNull()
    .references(() => entities.id, { onDelete: "cascade" }),
  when: text("when").notNull(),
  what: text("what").notNull(),
  /** Optional prose place. */
  whereText: text("where"),
  ...timestamps,
});
