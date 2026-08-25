import { z } from "zod";

import { httpUrlSchema, uuidSchema } from "@watchdog/schemas";

export const networkUrlEnrichInput = z.object({
  url: httpUrlSchema.describe("URL to enrich"),
  sourceEvidenceId: uuidSchema.optional(),
  entityId: uuidSchema.optional(),
});
