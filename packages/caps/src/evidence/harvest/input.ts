import { z } from "zod";

import { uuidSchema } from "@watchdog/schemas";

export const evidenceHarvestInput = z.object({
  evidenceId: uuidSchema.describe("Evidence id"),
  entityId: uuidSchema.optional(),
});
