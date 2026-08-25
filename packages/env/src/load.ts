import path from "node:path";

import { config as loadEnv } from "dotenv";

let loaded = false;

/**
 * Load repo-root `.env` once via an absolute path (safe with spaces).
 * `packages/env/src` → three levels up to the monorepo root.
 */
export function loadRepoEnv(): void {
  if (loaded) return;
  loaded = true;
  loadEnv({
    path: path.join(import.meta.dirname, "../../../.env"),
    quiet: true,
  });
}
