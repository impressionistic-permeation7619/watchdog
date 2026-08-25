import { timestamp } from "drizzle-orm/pg-core";

export function timestamptz(name: string) {
  return timestamp(name, { withTimezone: true });
}

export const createdAt = timestamptz("created_at").notNull().defaultNow();

/** App-layer auto-touch on UPDATE (not a DB trigger). */
const updatedAt = timestamptz("updated_at")
  .notNull()
  .defaultNow()
  .$onUpdateFn(() => new Date());

export const timestamps = {
  createdAt,
  updatedAt,
};
