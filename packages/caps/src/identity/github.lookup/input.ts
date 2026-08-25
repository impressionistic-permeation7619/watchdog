import { z } from "zod";

import { nonEmptyTrimmed, uuidSchema } from "@watchdog/schemas";

export const githubLookupInput = z.object({
  handle: nonEmptyTrimmed.describe("GitHub handle"),
  entityId: uuidSchema.optional(),
});
