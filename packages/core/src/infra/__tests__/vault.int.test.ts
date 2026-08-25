import { beforeEach, describe, expect, it } from "vitest";

import {
  DomainError,
  VaultError,
  deleteCredential,
  getCredential,
  hasCredential,
  listCredentialMeta,
  listCredentialSlots,
  putCredential,
  putCredentialSlot,
} from "@watchdog/core";
import { credentialsRepo, db } from "@watchdog/db";
import { TEST_ACTOR_ID } from "@watchdog/test-kit";
import { resetTestDb } from "@watchdog/test-kit/db";

const OTHER_USER = "other-actor";

describe("vault", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("round-trips a secret and never lists plaintext", async () => {
    await putCredential({
      userId: TEST_ACTOR_ID,
      name: "WHOIS_API_KEY",
      secret: "super-secret",
    });

    expect(await getCredential(TEST_ACTOR_ID, "WHOIS_API_KEY")).toBe(
      "super-secret"
    );
    expect(await hasCredential(TEST_ACTOR_ID, "WHOIS_API_KEY")).toBe(true);

    const meta = await listCredentialMeta(TEST_ACTOR_ID);
    expect(JSON.stringify(meta)).not.toContain("super-secret");
    expect(meta.some((row) => row.name === "WHOIS_API_KEY")).toBe(true);
  });

  it("rejects a bad name and an empty secret", async () => {
    await expect(
      putCredential({
        userId: TEST_ACTOR_ID,
        name: "not-screaming",
        secret: "x",
      })
    ).rejects.toSatisfy(
      (error: unknown) => DomainError.is(error) && error.code === "invalid"
    );

    await expect(
      putCredential({
        userId: TEST_ACTOR_ID,
        name: "WHOIS_API_KEY",
        secret: "   ",
      })
    ).rejects.toSatisfy(
      (error: unknown) => DomainError.is(error) && error.code === "invalid"
    );
  });

  it("updates ciphertext for the same name", async () => {
    await putCredential({
      userId: TEST_ACTOR_ID,
      name: "WHOIS_API_KEY",
      secret: "first",
    });
    await putCredential({
      userId: TEST_ACTOR_ID,
      name: "WHOIS_API_KEY",
      secret: "second",
    });
    expect(await getCredential(TEST_ACTOR_ID, "WHOIS_API_KEY")).toBe("second");
  });

  it("does not open another user's secret", async () => {
    await putCredential({
      userId: TEST_ACTOR_ID,
      name: "WHOIS_API_KEY",
      secret: "owner-only",
    });
    await expect(getCredential(OTHER_USER, "WHOIS_API_KEY")).rejects.toSatisfy(
      (error: unknown) => DomainError.is(error) && error.code === "not_found"
    );
  });

  it("throws VaultError on a corrupt blob", async () => {
    await putCredential({
      userId: TEST_ACTOR_ID,
      name: "WHOIS_API_KEY",
      secret: "ok",
    });
    const id = await credentialsRepo.getIdByName(
      db,
      TEST_ACTOR_ID,
      "WHOIS_API_KEY"
    );
    if (id === null) throw new Error("expected credential");
    await credentialsRepo.update(db, id, {
      ciphertext: Buffer.from("too-short"),
      label: null,
      updatedAt: new Date(),
    });
    await expect(getCredential(TEST_ACTOR_ID, "WHOIS_API_KEY")).rejects.toThrow(
      VaultError
    );
  });

  it("marks a known slot configured after putCredentialSlot", async () => {
    const before = await listCredentialSlots(TEST_ACTOR_ID);
    expect(before.find((s) => s.name === "WHOIS_API_KEY")?.configured).toBe(
      false
    );

    const slot = await putCredentialSlot({
      userId: TEST_ACTOR_ID,
      name: "WHOIS_API_KEY",
      secret: "slot-secret",
    });
    expect(slot.configured).toBe(true);
    expect(JSON.stringify(slot)).not.toContain("slot-secret");

    expect(await deleteCredential(TEST_ACTOR_ID, "WHOIS_API_KEY")).toBe(true);
  });
});
