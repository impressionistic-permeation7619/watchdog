import { boolean, pgTable, text, uuid } from "drizzle-orm/pg-core";

import { timestamps } from "./_helpers";

/** Case — work scope. Each Entity belongs to exactly one Case. */
export const cases = pgTable("cases", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  /**
   * When false (default), Caps with `egress: "third_party"` refuse to run.
   * Enable to allow AI/paid API Caps to send Case data off-box.
   */
  allowThirdPartyEgress: boolean("allow_third_party_egress")
    .notNull()
    .default(false),
  ...timestamps,
});
