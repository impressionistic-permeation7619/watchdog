import { z } from "zod";

import { nonEmptyTrimmed, uuidSchema } from "@watchdog/schemas";

export const honeydbLookupInput = z.object({
  ip: nonEmptyTrimmed.describe("IPv4 or IPv6"),
  entityId: uuidSchema.optional(),
});
