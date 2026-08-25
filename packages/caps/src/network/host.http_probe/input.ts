import { z } from "zod";

import { nonEmptyTrimmed, uuidSchema } from "@watchdog/schemas";

export const httpProbeInput = z.object({
  host: nonEmptyTrimmed.describe("Host"),
  entityId: uuidSchema.optional(),
});
