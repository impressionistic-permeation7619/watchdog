import { z } from "zod";

import { nonEmptyTrimmed, uuidSchema } from "@watchdog/schemas";

export const pgpLookupInput = z.object({
  query: nonEmptyTrimmed.describe("Email, fingerprint, or key id"),
  entityId: uuidSchema.optional(),
});
