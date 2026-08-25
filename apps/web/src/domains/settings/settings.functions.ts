import { createServerFn } from "@tanstack/react-start";

import {
  listCredentialSlots,
  removeCredentialSlot,
  upsertCredentialSlot,
} from "@/domains/settings/settings.server";
import {
  deleteCredentialInputSchema,
  putCredentialInputSchema,
  type CredentialSlot,
} from "@/domains/settings/types";

export { type CredentialSlot } from "@/domains/settings/types";

export const listCredentialsFn = createServerFn({ method: "GET" }).handler(
  async ({ context }): Promise<CredentialSlot[]> =>
    listCredentialSlots(context.session.user.id)
);

export const putCredentialFn = createServerFn({ method: "POST" })
  .validator(putCredentialInputSchema)
  .handler(
    async ({ data, context }): Promise<CredentialSlot> =>
      upsertCredentialSlot({
        userId: context.session.user.id,
        ...data,
      })
  );

export const deleteCredentialFn = createServerFn({ method: "POST" })
  .validator(deleteCredentialInputSchema)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await removeCredentialSlot(context.session.user.id, data.name);
    return { ok: true };
  });
