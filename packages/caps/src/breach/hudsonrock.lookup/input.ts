import { z } from "zod";

import { nonEmptyTrimmed, uuidSchema } from "@watchdog/schemas";

export const hudsonrockLookupInput = z.object({
  query: nonEmptyTrimmed.describe("Email, IP, or domain"),
  entityId: uuidSchema.optional(),
});
