import { z } from "zod";

import { nonEmptyTrimmed, uuidSchema } from "@watchdog/schemas";

export const ctLookupInput = z.object({
  host: nonEmptyTrimmed.describe("Host"),
  entityId: uuidSchema.optional(),
  /** Max CRT rows to retain (default 50). */
  limit: z.number().int().min(1).max(200).optional(),
});
