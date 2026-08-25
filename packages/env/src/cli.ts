import { createEnv } from "@t3-oss/env-core";

import { cliFields, createEnvOptions, nodeEnvFields } from "./fragments";
import { loadRepoEnv } from "./load";

type CliEnv = ReturnType<typeof createCliEnv>;

function createCliEnv() {
  loadRepoEnv();
  return createEnv({
    server: {
      ...cliFields,
      ...nodeEnvFields,
    },
    ...createEnvOptions,
  });
}

let cached: CliEnv | null = null;

/**
 * Memoized CLI env (`WD_API_URL` + `WD_API_KEY`). Call from `getConfig()` /
 * `api()` so `--help` works without a key. Do not call at module top-level.
 */
export function loadCliEnv(): CliEnv {
  if (cached !== null) return cached;
  cached = createCliEnv();
  return cached;
}

/**
 * Lazy getters — `env.FOO` still validates on first property access, not on import.
 * Prefer `loadCliEnv()` at the CLI config boundary.
 */
export const env: CliEnv = {
  get WD_API_URL() {
    return loadCliEnv().WD_API_URL;
  },
  get WD_API_KEY() {
    return loadCliEnv().WD_API_KEY;
  },
  get NODE_ENV() {
    return loadCliEnv().NODE_ENV;
  },
};
