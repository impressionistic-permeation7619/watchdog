import { z } from "zod";

import { nonEmptyTrimmed, uuidSchema } from "@watchdog/schemas";

export const feodoLookupInput = z.object({
  ip: nonEmptyTrimmed.describe("IPv4 or IPv6"),
  entityId: uuidSchema.optional(),
});
