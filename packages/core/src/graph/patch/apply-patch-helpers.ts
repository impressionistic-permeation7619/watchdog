import {
  requireEnum as requireEnumPolicy,
  requireString as requireStringPolicy,
} from "@watchdog/policy";
import type { JsonValue } from "@watchdog/schemas";

import { DomainError, errorMessage } from "../../infra/domain-error";

export function asDomainInvalid<T>(fn: () => T): T {
  try {
    return fn();
  } catch (error) {
    throw new DomainError("invalid", errorMessage(error, "invalid"));
  }
}

export function requireDomainString(
  data: Record<string, JsonValue>,
  key: string
): string {
  return asDomainInvalid(() => requireStringPolicy(data, key));
}

export function requireDomainEnum<T extends string>(
  value: string,
  allowed: readonly T[],
  label: string
): T {
  return asDomainInvalid(() => requireEnumPolicy(value, allowed, label));
}
