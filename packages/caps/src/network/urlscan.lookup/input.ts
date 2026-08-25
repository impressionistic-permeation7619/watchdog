import { z } from "zod";

import { nonEmptyTrimmed, uuidSchema } from "@watchdog/schemas";

export const urlscanLookupInput = z.object({
  host: nonEmptyTrimmed.describe("Domain"),
  entityId: uuidSchema.optional(),
});
