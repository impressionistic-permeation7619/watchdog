import { z } from "zod";

import { nonEmptyTrimmed, uuidSchema } from "@watchdog/schemas";

export const cymruMhrLookupInput = z.object({
  hash: nonEmptyTrimmed.describe("MD5, SHA-1, or SHA-256 hex hash"),
  entityId: uuidSchema.optional(),
});
