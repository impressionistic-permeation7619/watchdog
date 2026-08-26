import "@tanstack/react-start/server-only";
import {
  deleteCredential,
  listCredentialSlots,
  putCredentialSlot,
  type CredentialSlot,
} from "@watchdog/core";

export type { CredentialSlot };

export { listCredentialSlots };

export async function upsertCredentialSlot(input: {
  userId: string;
  name: string;
  secret: string;
  label?: string;
}): Promise<CredentialSlot> {
  return putCredentialSlot(input);
}

export async function removeCredentialSlot(
  userId: string,
  name: string
): Promise<void> {
  await deleteCredential(userId, name);
}
