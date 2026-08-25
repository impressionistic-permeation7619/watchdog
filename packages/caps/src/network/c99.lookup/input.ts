import { z } from "zod";

import { nonEmptyTrimmed, uuidSchema } from "@watchdog/schemas";

export const c99LookupInput = z.object({
  host: nonEmptyTrimmed.describe("Domain"),
  entityId: uuidSchema.optional(),
  /** Instant scan — slower / more credit-heavy. Default false. */
  realtime: z.boolean().optional(),
});
