import { z } from "zod";

import { nonEmptyTrimmed, uuidSchema } from "@watchdog/schemas";

export const waybackLookupInput = z.object({
  url: nonEmptyTrimmed.describe("URL"),
  entityId: uuidSchema.optional(),
  limit: z.number().int().positive().max(100).optional(),
});
