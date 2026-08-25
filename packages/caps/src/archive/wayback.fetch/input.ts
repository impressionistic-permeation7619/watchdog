import { z } from "zod";

import { nonEmptyTrimmed, uuidSchema } from "@watchdog/schemas";

export const waybackFetchInput = z.object({
  url: nonEmptyTrimmed.describe("URL"),
  /** CDX timestamp; when omitted, Cap resolves closest 200 via CDX. */
  timestamp: z.string().trim().min(1).optional(),
  entityId: uuidSchema.optional(),
});
