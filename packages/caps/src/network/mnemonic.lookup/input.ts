import { z } from "zod";

import { nonEmptyTrimmed, uuidSchema } from "@watchdog/schemas";

export const mnemonicLookupInput = z.object({
  query: nonEmptyTrimmed.describe("IP or domain"),
  entityId: uuidSchema.optional(),
});
