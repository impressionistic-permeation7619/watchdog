import { z } from "zod";

import { nonEmptyTrimmed, optionalTrimmedSchema } from "@watchdog/schemas";

export type { CredentialSlot } from "@watchdog/core";

export const putCredentialInputSchema = z.object({
  name: nonEmptyTrimmed,
  secret: nonEmptyTrimmed,
  label: optionalTrimmedSchema,
});
export type PutCredentialInput = z.output<typeof putCredentialInputSchema>;

export const deleteCredentialInputSchema = z.object({
  name: nonEmptyTrimmed,
});
export type DeleteCredentialInput = z.output<
  typeof deleteCredentialInputSchema
>;
