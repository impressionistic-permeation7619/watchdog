# Cap SDK (`@watchdog/cap-sdk`)

> Scope: `packages/cap-sdk` (inherits root [AGENTS.md](../../AGENTS.md) unless noted)

SPI for Caps: `defineCapability`, CapContext, interpret types. No Graph / DB / network helpers.

## Commands

| Task       | Command                                     |
| ---------- | ------------------------------------------- |
| Typecheck  | `pnpm --filter @watchdog/cap-sdk typecheck` |
| Unit tests | `pnpm test:unit`                            |

## Boundaries

| Do | Don’t |
| --- | --- |
| Keep types + `defineCapability` pure | Import `@watchdog/db`, `core`, or apps |
| Document `timeoutMs` / credential hooks on the Cap | Put secrets in `Job.input` |

## Gotchas

- `handoff?: (report) => JobHandoff | undefined` is pure; core persists bags on Job success (including cache hits). Independent of `produces`.
- `CapIoKind` includes `hash` (playbook seed / bind). Fail-closed Identifier filtering lives in caps `interpret-identifier-batches`; this package does not implement it.

## See also / External References

| Need                | File                                           |
| ------------------- | ---------------------------------------------- |
| Cap implementations | [`packages/caps/AGENTS.md`](../caps/AGENTS.md) |
