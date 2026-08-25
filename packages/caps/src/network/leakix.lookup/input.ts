import { z } from "zod";

import { nonEmptyTrimmed, uuidSchema } from "@watchdog/schemas";

export const leakixLookupInput = z.object({
  query: nonEmptyTrimmed.describe("IP or host"),
  entityId: uuidSchema.optional(),
});
