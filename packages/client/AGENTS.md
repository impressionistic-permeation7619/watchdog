# Client package (`@watchdog/client`)

> Scope: `packages/client` (inherits root AGENTS.md)

Typed HTTP SDK for `/api/v1` (generated OpenAPI + `createWatchdogClient`). Used by CLI and agents.

## Commands

| Task         | Command                                    |
| ------------ | ------------------------------------------ |
| Typecheck    | `pnpm --filter @watchdog/client typecheck` |
| Regen client | `pnpm generate:client`                     |
| Unit tests   | `pnpm test:unit`                           |

## Rules

- Runtime must not import handlers from `@watchdog/api` — `import type { AppRouter }` only for casting.
- After API route/input changes: `pnpm generate:client` (commit `src/generated/*`).
- Prefer this client over hand-rolled `fetch`.
- Tests cover `createWatchdogClient` (base URL slash-strip + `x-api-key`). Do not unit-test `src/generated/`.
- Case Export zip/md are **not** on the oRPC contract — CLI uses authenticated file `fetch` + `x-api-key` (see `packages/cli`).
