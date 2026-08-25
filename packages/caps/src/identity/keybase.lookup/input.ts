import { z } from "zod";

import { nonEmptyTrimmed, uuidSchema } from "@watchdog/schemas";

export const keybaseLookupInput = z.object({
  query: nonEmptyTrimmed.describe("Keybase username or domain"),
  entityId: uuidSchema.optional(),
});
