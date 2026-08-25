import { z } from "zod";

import { nonEmptyTrimmed, uuidSchema } from "@watchdog/schemas";

export const emailrepLookupInput = z.object({
  email: nonEmptyTrimmed.describe("Email"),
  entityId: uuidSchema.optional(),
});
