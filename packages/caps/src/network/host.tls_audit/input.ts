import { z } from "zod";

import { nonEmptyTrimmed, uuidSchema } from "@watchdog/schemas";

export const tlsAuditInput = z.object({
  host: nonEmptyTrimmed.describe("Host"),
  port: z.number().int().positive().optional().describe("Port"),
  entityId: uuidSchema.optional(),
});
