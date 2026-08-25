<!-- intent-skills:start -->

## Skill Loading

Before editing files for a substantial task:

- Run `pnpm dlx @tanstack/intent@latest list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `pnpm dlx @tanstack/intent@latest load <package>#<skill>` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.

<!-- intent-skills:end -->

# Watchdog web (`@watchdog/web`)

> Scope: `apps/web` (inherits root [AGENTS.md](../../AGENTS.md) unless noted)

TanStack Start UI for Watchdog. Web UI contracts live in [`docs/`](docs/README.md). Platform doctrine / architecture / UX: [`docs/`](../../docs/README.md). When UI contracts disagree with root AGENTS, **`apps/web/docs/` wins**; platform nouns → **`docs/`**.

## Commands

| Task | Command |
| --- | --- |
| Dev | `pnpm dev:web` |
| Typecheck | `pnpm --filter @watchdog/web typecheck` |
| DS bans | `pnpm --filter @watchdog/web ds:check` |
| Unit tests | `pnpm test:unit` (packages + worker; web libs are **not** in this project) |
| Component tests | `pnpm test:component` (`apps/web/src/**/__tests__/**`, including `*.test.ts`) |
| E2E | `pnpm test:e2e` |
| Generate routes | `pnpm generate-routes` |
| Build | `pnpm build` |

## Boundaries

| Do | Don’t |
| --- | --- |
| Split = Queue + Detail (`SplitView`) | Console / Tape / Panel / Pane / Rail / Strip as surfaces |
| Query cache SoT — `ensureQueryData` / `useSuspenseQuery` / named invalidation | Loader→`useState` forks; QueryClient singleton |
| Reuse domain `hooks/*` workspace hooks (`use-jobs-workspace`, `use-task-workspace`, `use-inbox-workspace`, `use-intake-actions`, …) | Duplicate Queue/Detail mutation machines in components |
| Read web `docs/` + platform `docs/` before inventing | Reinvent from `_legacy-v2` without reading it as reference |
| Caps/agents → Proposal → Inbox Accept | Land Cap/agent output as `confirmed` Graph |
| Process logs via `@watchdog/log` + `src/start.ts` middleware | `withEvlog` on handlers; secrets / Evidence bodies in log fields; treat NDJSON as Graph audit |

## Gotchas

- Env: repo-root `.env` via Vite `envDir: "../../"`; schema in [`@watchdog/env`](../../packages/env/AGENTS.md). Cap secrets = vault, not env.
- Solo signup: `BETTER_AUTH_ALLOW_SIGNUP=1` → `/login` → set back to `0`.
- Prefer [`docs/GOTCHAS.md`](docs/GOTCHAS.md) for Router/Query/SSE/hydration traps.
- **Jobs:** queue grouping uses `playbookRunStatus` + recipe length (`lib/status.ts`); waiting chrome is the next recipe step, not Job `blocked`. Playbook seeds include ip/email/hash/handle (`lib/playbook-seed-view.ts`).
- **Tasks:** DnD math in `lib/task-board-dnd.ts`. Cross-column drop changes status; within-column drop calls `reorderTasks` (`position`). `use-task-workspace` owns `handleCommitDrop`.
- Evlog: `src/start.ts` owns request + function middleware; dynamic-import drain init inside `.server()` only (never top-level `evlog/fs`). Drain dir = `apps/web/.evlog/logs/` (not `apps/.evlog`). Identify in `createApiContext` only. `orpcForActor` injects ALS `log`. Capture failures with `log.error(err)` or `log.setLevel("warn")` + serializable fields — never `log.set({ error: someError })` (`Error` JSON-stringifies to `{}`).
- CSRF: keep `createCsrfMiddleware({ filter: serverFn })` in `requestMiddleware` after evlog (`[evlogRequestMiddleware, csrfMiddleware]` — logger outermost). ServerFn paths skip the `/api/**` request logger; CSRF 403s on `/_serverFn` still emit a warn (`auth.reason: "csrf"`). Custom `start.ts` disables Start’s auto-install.
- ServerFn auth is global: `functionMiddleware: [evlogFunctionMiddleware, requireAuth]` (logger outermost so `UnauthorizedError` still emits). Do not re-add per-fn `.middleware([requireAuth])`. No per-fn opt-out — public endpoints = HTTP `routes/api/*`, never an unauthenticated ServerFn. Expected denials (`UnauthorizedError` from `requireSession`) log `level: "warn"` + `auth: { denied, reason: "no_session" }`; unexpected throws use `log.error`.
- Auth layers stay separate: BA UI / `_protected` = UX redirect; Start `requireAuth` = data gate (throw `UnauthorizedError`); `/api/auth` = cookies.

## See also / External References

| Need | File |
| --- | --- |
| Web docs | [`docs/README.md`](docs/README.md) |
| Platform docs | [`docs/README.md`](../../docs/README.md) |
| Product / UX / Caps | [`PRODUCT`](../../docs/PRODUCT.md) · [`UX`](../../docs/UX.md) · [`CAPS`](../../docs/CAPS.md) · [`TYPES`](../../docs/TYPES.md) |
| UI / Domains / Data | [`UI`](docs/UI.md) · [`DOMAINS`](docs/DOMAINS.md) (§ `hooks/` + `lib/`, Page ownership, Map) · [`DATA`](docs/DATA.md) |
| Architecture | [`docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md) · process logging |
| Log package | [`packages/log/AGENTS.md`](../../packages/log/AGENTS.md) |
