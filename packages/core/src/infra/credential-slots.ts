import { listKnownCredentials } from "@watchdog/caps";

import {
  listCredentialMeta,
  putCredential,
  type CredentialMeta,
} from "./vault";

/** Metadata slot for Settings / credentials API — never plaintext. */
export interface CredentialSlot {
  name: string;
  label: string;
  description: string;
  configured: boolean;
  updatedAt: string | null;
}

function slotFromMeta(meta: CredentialMeta): CredentialSlot {
  const known = listKnownCredentials().find((k) => k.name === meta.name);
  return {
    name: meta.name,
    label: known?.label ?? meta.label ?? meta.name,
    description: known?.description ?? "Custom credential",
    configured: true,
    updatedAt: meta.updatedAt,
  };
}

/** Known Cap slots + any custom stored names for a user. */
export async function listCredentialSlots(
  userId: string
): Promise<CredentialSlot[]> {
  const known = listKnownCredentials();
  const stored = await listCredentialMeta(userId);
  const byName = new Map(stored.map((s) => [s.name, s]));

  const slots: CredentialSlot[] = known.map((k) => {
    const row = byName.get(k.name);
    return {
      name: k.name,
      label: k.label,
      description: k.description,
      configured: row !== undefined,
      updatedAt: row?.updatedAt ?? null,
    };
  });

  for (const row of stored) {
    if (known.some((k) => k.name === row.name)) continue;
    slots.push(slotFromMeta(row));
  }

  return slots;
}

type PutCredentialSlotInput = {
  userId: string;
  name: string;
  secret: string;
  label?: string | null;
};

/** Create/replace secret and return the configured slot (no full re-list). */
export async function putCredentialSlot(
  input: PutCredentialSlotInput
): Promise<CredentialSlot> {
  const meta = await putCredential(input);
  return slotFromMeta(meta);
}
