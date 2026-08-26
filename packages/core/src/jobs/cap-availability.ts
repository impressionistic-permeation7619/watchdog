import type { z } from "zod";

import {
  checkCapabilityAvailability,
  toCapDescriptor,
  type AvailabilityError,
  type AvailabilityResult,
  type CapabilityDef,
} from "@watchdog/caps";
import { casesRepo, db } from "@watchdog/db";

import { DomainError } from "../infra/domain-error";
import { hasCredential } from "../infra/vault";

function credentialNames(
  specs: NonNullable<ReturnType<typeof toCapDescriptor>["credentials"]>
): string[] {
  const names: string[] = [];
  for (const spec of specs) {
    if ("anyOf" in spec) {
      names.push(...spec.anyOf);
      continue;
    }
    names.push(spec.name);
  }
  return names;
}

export function formatCapAvailabilityError(
  err: AvailabilityError,
  capabilityId: string
): string {
  switch (err.kind) {
    case "egress_blocked": {
      return `Case does not permit third-party egress — enable it in Case settings or use a local model before running ${err.capabilityId}`;
    }
    case "missing_credential": {
      return err.names.length === 1
        ? `Missing credential ${err.names[0]} — set it in Settings before running ${capabilityId}`
        : `Missing credential — set one of ${err.names.join(" | ")} in Settings before running ${capabilityId}`;
    }
    default: {
      const _exhaustive: never = err;
      return _exhaustive;
    }
  }
}

export async function evaluateCapAvailability(input: {
  actorId: string;
  caseId: string;
  cap: CapabilityDef<z.ZodType>;
}): Promise<{
  allowThirdPartyEgress: boolean;
  result: AvailabilityResult;
}> {
  const desc = toCapDescriptor(input.cap);
  const specs = desc.credentials ?? [];
  const names = credentialNames(specs);
  const present = new Set<string>();
  await Promise.all(
    names.map(async (name) => {
      if (await hasCredential(input.actorId, name)) present.add(name);
    })
  );

  const caseRow = await casesRepo.getById(db, input.caseId);
  const allowThirdPartyEgress = caseRow?.allowThirdPartyEgress ?? false;

  return {
    allowThirdPartyEgress,
    result: checkCapabilityAvailability(
      {
        credentials: specs,
        egress: desc.egress ?? "none",
        flags: desc.flags ?? [],
      },
      {
        hasCredential: (name) => present.has(name),
        allowThirdPartyEgress,
        thirdPartyCapabilityId: input.cap.id,
      }
    ),
  };
}

/** Fail closed before enqueue — same predicate as playbooks / worker preflight. */
export async function assertCapAvailability(input: {
  actorId: string;
  caseId: string;
  cap: CapabilityDef<z.ZodType>;
}): Promise<void> {
  const { result } = await evaluateCapAvailability(input);
  if (result.ok) return;
  throw new DomainError(
    "forbidden",
    formatCapAvailabilityError(result, input.cap.id)
  );
}
