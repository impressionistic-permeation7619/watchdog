import { z } from "zod";

import { uuidSchema } from "@watchdog/schemas";

export const evidenceExtractAiInput = z.object({
  evidenceId: uuidSchema.describe("Evidence id"),
  entityId: uuidSchema.optional(),
  model: z.string().min(1).optional(),
});
