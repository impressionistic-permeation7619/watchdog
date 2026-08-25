import { z } from "zod";

import { uuidSchema } from "@watchdog/schemas";

export const emlAnalyzeInput = z.object({
  evidenceId: uuidSchema.describe("Evidence id"),
  entityId: uuidSchema.optional(),
});
