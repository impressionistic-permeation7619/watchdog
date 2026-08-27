import { beforeEach, describe, expect, it } from "vitest";

import {
  DomainError,
  createCase,
  deleteCase,
  getCaseById,
  updateCase,
} from "@watchdog/core";
import { db, entitiesRepo } from "@watchdog/db";
import { testId } from "@watchdog/test-kit";
import { resetTestDb, seedCase, seedEntity } from "@watchdog/test-kit/db";

describe("createCase", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("rejects a duplicate slug", async () => {
    await createCase({ name: "Alpha", slug: "alpha-dup" });
    await expect(
      createCase({ name: "Beta", slug: "alpha-dup" })
    ).rejects.toSatisfy(
      (error: unknown) => DomainError.is(error) && error.code === "conflict"
    );
  });
});

describe("updateCase", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("rejects a rename whose slug is taken", async () => {
    await seedCase(db, { name: "First Case", slug: "first-case" });
    const second = await seedCase(db, {
      name: "Second Case",
      slug: "second-case",
    });
    await expect(
      updateCase({ id: second.id, name: "First Case" })
    ).rejects.toSatisfy(
      (error: unknown) => DomainError.is(error) && error.code === "conflict"
    );
  });
});

describe("deleteCase", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("removes the case and cascaded graph rows", async () => {
    const cased = await seedCase(db);
    const entity = await seedEntity(db, cased.id, { id: testId(20) });
    await deleteCase(cased.id);
    expect(await getCaseById(cased.id)).toBeNull();
    expect(await entitiesRepo.getById(db, entity.id)).toBeNull();
  });
});
