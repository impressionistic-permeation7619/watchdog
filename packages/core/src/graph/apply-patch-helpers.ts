import {
  requireEnum as requireEnumPolicy,
  requireString as requireStringPolicy,
} from "@watchdog/policy";
import type { JsonValue } from "@watchdog/schemas";

import { DomainError } from "../infra/domain-error";

export function asDomainInvalid<T>(fn: () => T): T {
  try {
    return fn();
  } catch (error) {
    throw new DomainError(
      "invalid",
      error instanceof Error ? error.message : "invalid"
    );
  }
}

export function requireString(
  data: Record<string, JsonValue>,
  key: string
): string {
  return asDomainInvalid(() => requireStringPolicy(data, key));
}

export function requireEnum<T extends string>(
  value: string,
  allowed: readonly T[],
  label: string
): T {
  return asDomainInvalid(() => requireEnumPolicy(value, allowed, label));
}
