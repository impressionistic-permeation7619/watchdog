import { z } from "zod";

import { nonEmptyTrimmed, uuidSchema } from "@watchdog/schemas";

export const mediaOembedInput = z.object({
  url: nonEmptyTrimmed.describe("Media URL"),
  entityId: uuidSchema.optional(),
});
