import { z } from "zod";

import { nonEmptyTrimmed, uuidSchema } from "@watchdog/schemas";

export const hashlookupLookupInput = z.object({
  hash: nonEmptyTrimmed.describe("MD5, SHA-1, SHA-256, or SHA-512 hex hash"),
  entityId: uuidSchema.optional(),
});
