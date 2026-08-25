# Log package (`@watchdog/log`)

> Scope: `packages/log` (inherits root AGENTS.md)

Process logging via evlog (NDJSON + stdout). Not Graph / Job / Accept custody.

## Commands

| Task       | Command                                 |
| ---------- | --------------------------------------- |
| Typecheck  | `pnpm --filter @watchdog/log typecheck` |
| Unit tests | `pnpm test:unit`                        |

## Do / Don't

| Do | Don't |
| --- | --- |
| Init once per process (`initWatchdogLogger`) | Put secrets, Evidence bodies, or Bearer/`x-api-key` plaintext in fields |
| Use ALS (`peekRequestLogger` / `runWithRequestLogger`) under Start middleware | Depend from `packages/cli` or `packages/client` (stdout is the agent contract) |
| Shape Cap Job events with `jobWideEventFields` from `JobRunOutcome` | Treat evlog as Graph audit (`graph_writes` / Accept / `Job.logs` stay SoT) |
| Redact via `initWatchdogLogger` presets | Call `createFsDrain().flush()` (no flush API; awaits per event) |
| Capture failures with `log.error(err)` (serializes + `level: "error"`) | `log.set({ error: someError })` — `Error` JSON-stringifies to `{}` |
| Expected auth/CSRF denials: `setLevel("warn")` + `auth: { denied, reason }` | Treat `UnauthorizedError` / CSRF 403 as `level: "error"` (noise / false alerts) |

## See also

| Need | File |
| --- | --- |
| Platform wiring | [`docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md) (Process logging) |
| Web Start middleware | [`apps/web/AGENTS.md`](../../apps/web/AGENTS.md) |
| Worker Cap Job emit | [`apps/worker/AGENTS.md`](../../apps/worker/AGENTS.md) |
