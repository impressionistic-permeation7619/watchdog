import { z } from "zod";

import { httpUrlSchema, uuidSchema } from "@watchdog/schemas";

export const urlscanSubmitInput = z.object({
  url: httpUrlSchema.describe("URL to scan"),
  entityId: uuidSchema.optional(),
  /** OPSEC: default unlisted — public scans can leak investigation interest. */
  visibility: z.enum(["public", "unlisted", "private"]).optional(),
});
