import { z } from "zod";

import { nonEmptyTrimmed, uuidSchema } from "@watchdog/schemas";

export const urlUnshortenInput = z.object({
  url: nonEmptyTrimmed.describe("URL"),
  entityId: uuidSchema.optional(),
});
