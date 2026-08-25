import { z } from "zod";

import { nonEmptyTrimmed, uuidSchema } from "@watchdog/schemas";

export const ipinfoLookupInput = z.object({
  ip: nonEmptyTrimmed.describe("IP address"),
  entityId: uuidSchema.optional(),
});
