import { z } from "zod";

import { nonEmptyTrimmed, uuidSchema } from "@watchdog/schemas";

export const dnsLookupInput = z.object({
  host: nonEmptyTrimmed.describe("Host"),
  entityId: uuidSchema.optional(),
});
