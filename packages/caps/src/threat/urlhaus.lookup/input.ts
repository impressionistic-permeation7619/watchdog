import { z } from "zod";

import { nonEmptyTrimmed, uuidSchema } from "@watchdog/schemas";

export const urlhausLookupInput = z.object({
  query: nonEmptyTrimmed.describe("URL, host, or file hash (MD5/SHA256)"),
  entityId: uuidSchema.optional(),
});
