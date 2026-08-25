import { z } from "zod";

import { nonEmptyTrimmed, uuidSchema } from "@watchdog/schemas";

export const virusTotalLookupInput = z.object({
  query: nonEmptyTrimmed.describe("IP or domain"),
  entityId: uuidSchema.optional(),
});
