import { z } from "zod";

import { nonEmptyTrimmed, uuidSchema } from "@watchdog/schemas";

export const snusbaseLookupInput = z.object({
  query: nonEmptyTrimmed.describe("Email, IP, domain, or username"),
  entityId: uuidSchema.optional(),
});
