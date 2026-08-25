import { z } from "zod";

import { nonEmptyTrimmed, uuidSchema } from "@watchdog/schemas";

export const dehashedLookupInput = z.object({
  query: nonEmptyTrimmed.describe(
    "Email, IP, domain, username, or freeform query"
  ),
  entityId: uuidSchema.optional(),
});
