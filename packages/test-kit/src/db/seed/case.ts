import {
  casesRepo,
  type CaseRow,
  type DbExec,
  type NewCase,
} from "@watchdog/db";
import { slugifyName } from "@watchdog/schemas";

export async function seedCase(
  exec: DbExec,
  overrides: Partial<NewCase> = {}
): Promise<CaseRow> {
  const name = overrides.name ?? "Test Case";
  const base = slugifyName(name) || "test-case";
  const created = await casesRepo.create(exec, {
    name,
    slug:
      overrides.slug ??
      `${base}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    description: overrides.description ?? null,
  });
  if (!created) {
    throw new Error("seedCase failed");
  }
  return created;
}
