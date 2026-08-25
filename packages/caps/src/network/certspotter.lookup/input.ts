import { z } from "zod";

import { nonEmptyTrimmed, uuidSchema } from "@watchdog/schemas";

export const certspotterLookupInput = z.object({
  host: nonEmptyTrimmed.describe("Domain"),
  entityId: uuidSchema.optional(),
});
