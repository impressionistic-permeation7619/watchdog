# Policy package (`@watchdog/policy`)

> Scope: `packages/policy` (inherits root AGENTS.md)

Pure Graph write custody (`assertPatchGates` / Accept rules). No DB, Caps, or I/O.

## Commands

| Task       | Command                                    |
| ---------- | ------------------------------------------ |
| Typecheck  | `pnpm --filter @watchdog/policy typecheck` |
| Unit tests | `pnpm test:unit`                           |

## Rules

- Depend on `@watchdog/schemas` only.
- Never import `db`, `core`, `caps`, `api`, or `apps/*`.
- Pure functions; callers in `core` own persistence.
