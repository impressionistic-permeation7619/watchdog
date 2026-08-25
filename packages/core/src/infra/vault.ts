import {
  createCipheriv,
  createDecipheriv,
  hkdfSync,
  randomBytes,
} from "node:crypto";

import { credentialsRepo, db } from "@watchdog/db";
import { env } from "@watchdog/env/server";
import { trimmedOrNull } from "@watchdog/schemas";

import { DomainError } from "./domain-error";

const NONCE_LEN = 12;
const TAG_LEN = 16;
const KEY_LEN = 32;
const HKDF_INFO = Buffer.from("watchdog-vault-v1");
const MASTER_NORMALIZE_SALT = Buffer.from("watchdog-master-vault-normalize");
const MASTER_NORMALIZE_INFO = Buffer.from("watchdog-master-v1");

export class VaultError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VaultError";
  }
}

export interface CredentialMeta {
  id: string;
  name: string;
  label: string | null;
  updatedAt: string;
}

function masterKeyBytes(): Buffer {
  const raw = env.WD_MASTER_VAULT_KEY.trim();
  const b64 = Buffer.from(raw, "base64");
  if (b64.length === KEY_LEN) return b64;
  if (/^[0-9a-fA-F]+$/.test(raw) && raw.length === KEY_LEN * 2) {
    return Buffer.from(raw, "hex");
  }
  return Buffer.from(
    hkdfSync(
      "sha256",
      Buffer.from(raw, "utf-8"),
      MASTER_NORMALIZE_SALT,
      MASTER_NORMALIZE_INFO,
      KEY_LEN
    )
  );
}

function userKey(userId: string): Buffer {
  return Buffer.from(
    hkdfSync(
      "sha256",
      masterKeyBytes(),
      Buffer.from(userId, "utf-8"),
      HKDF_INFO,
      KEY_LEN
    )
  );
}

function seal(key: Buffer, plaintext: string): Buffer {
  const nonce = randomBytes(NONCE_LEN);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  const enc = Buffer.concat([
    cipher.update(Buffer.from(plaintext, "utf-8")),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([nonce, tag, enc]);
}

function open(key: Buffer, blob: Buffer): string {
  if (blob.length < NONCE_LEN + TAG_LEN + 1) {
    throw new VaultError("corrupt vault blob");
  }
  const nonce = blob.subarray(0, NONCE_LEN);
  const tag = blob.subarray(NONCE_LEN, NONCE_LEN + TAG_LEN);
  const ct = blob.subarray(NONCE_LEN + TAG_LEN);
  const decipher = createDecipheriv("aes-256-gcm", key, nonce);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(ct), decipher.final()]);
  return plain.toString("utf-8");
}

function toMeta(row: {
  id: string;
  name: string;
  label: string | null;
  updatedAt: Date;
}): CredentialMeta {
  return {
    id: row.id,
    name: row.name,
    label: row.label,
    updatedAt: row.updatedAt.toISOString(),
  };
}

const NAME_RE = /^[A-Z][A-Z0-9_]*$/;

export function assertCredentialName(name: string): string {
  const trimmed = name.trim();
  if (!NAME_RE.test(trimmed)) {
    throw new DomainError(
      "invalid",
      "Credential name must be SCREAMING_SNAKE (A-Z, 0-9, _)"
    );
  }
  return trimmed;
}

/** Metadata only — never returns plaintext. */
export async function listCredentialMeta(
  userId: string
): Promise<CredentialMeta[]> {
  const rows = await credentialsRepo.listMeta(db, userId);
  return rows.map(toMeta);
}

export async function hasCredential(
  userId: string,
  name: string
): Promise<boolean> {
  const n = assertCredentialName(name);
  const id = await credentialsRepo.getIdByName(db, userId, n);
  return id !== null;
}

export async function getCredential(
  userId: string,
  name: string
): Promise<string> {
  const n = assertCredentialName(name);
  const ciphertext = await credentialsRepo.getCiphertext(db, userId, n);
  if (!ciphertext) {
    throw new DomainError("not_found", `Credential ${n} is not configured`);
  }
  return open(userKey(userId), Buffer.from(ciphertext));
}

export async function putCredential(input: {
  userId: string;
  name: string;
  secret: string;
  label?: string | null;
}): Promise<CredentialMeta> {
  const name = assertCredentialName(input.name);
  const secret = input.secret.trim();
  if (!secret) {
    throw new DomainError("invalid", "Secret must be non-empty");
  }
  const blob = seal(userKey(input.userId), secret);
  const label = trimmedOrNull(input.label);
  const now = new Date();

  const existingId = await credentialsRepo.getIdByName(db, input.userId, name);

  if (existingId !== null) {
    const updated = await credentialsRepo.update(db, existingId, {
      ciphertext: blob,
      label,
      updatedAt: now,
    });
    if (!updated) throw new Error("Failed to update credential");
    return toMeta(updated);
  }

  const created = await credentialsRepo.create(db, {
    userId: input.userId,
    name,
    label,
    ciphertext: blob,
  });
  if (!created) throw new Error("Failed to create credential");
  return toMeta(created);
}

export async function deleteCredential(
  userId: string,
  name: string
): Promise<boolean> {
  const n = assertCredentialName(name);
  return credentialsRepo.deleteByName(db, userId, n);
}
