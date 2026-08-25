import { z } from "zod";

import { nonEmptyTrimmed, uuidSchema } from "@watchdog/schemas";

export const pageEnrichInput = z.object({
  url: nonEmptyTrimmed.describe("URL"),
  entityId: uuidSchema.optional(),
});
