import { z } from "zod";

import { nonEmptyTrimmed, uuidSchema } from "@watchdog/schemas";

export const archiveUrlSubmitInput = z.object({
  url: nonEmptyTrimmed.describe("URL to archive"),
  entityId: uuidSchema.optional(),
});
