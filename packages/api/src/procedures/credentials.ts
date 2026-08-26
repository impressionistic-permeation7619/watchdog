import { ORPCError } from "@orpc/server";
import { z } from "zod";

import {
  deleteCredential,
  listCredentialSlots,
  putCredentialSlot,
} from "@watchdog/core";

import { withDomainError } from "../map-domain-error";
import { authed } from "../os";
import { credentialSlotSchema } from "../schemas";

export const list = authed
  .route({
    method: "GET",
    path: "/credentials",
    summary: "List credential slots (never plaintext)",
    tags: ["credentials"],
  })
  .output(z.array(credentialSlotSchema))
  .handler(
    withDomainError(async ({ context }) =>
      listCredentialSlots(context.actor.userId)
    )
  );

export const put = authed
  .route({
    method: "PUT",
    path: "/credentials/{name}",
    summary: "Create or replace a credential secret",
    tags: ["credentials"],
  })
  .input(
    z.object({
      name: z.string().min(1),
      secret: z.string().min(1),
      label: z.string().optional(),
    })
  )
  .output(credentialSlotSchema)
  .handler(
    withDomainError(async ({ input, context }) =>
      putCredentialSlot({
        userId: context.actor.userId,
        name: input.name,
        secret: input.secret,
        label: input.label,
      })
    )
  );

export const remove = authed
  .route({
    method: "DELETE",
    path: "/credentials/{name}",
    summary: "Delete a credential by name",
    tags: ["credentials"],
  })
  .input(z.object({ name: z.string().min(1) }))
  .output(z.object({ ok: z.literal(true) }))
  .handler(
    withDomainError(async ({ input, context }) => {
      const ok = await deleteCredential(context.actor.userId, input.name);
      if (!ok) {
        throw new ORPCError("NOT_FOUND", { message: "Credential not found" });
      }
      return { ok: true as const };
    })
  );
