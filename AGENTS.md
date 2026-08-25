# AGENTS.md — Watchdog

Dual-concern monorepo: **investigation vault** (`graph/` · `data/`) + **Watchdog platform** (Postgres + TypeScript under `apps/` · `packages/`).

Frozen: `_legacy-v1/` · `_legacy-v2/` — do not extend. Mid-build docs under `_legacy-v2/docs-v2/` are reference only.

When this file and the [greenfield blueprint](.cursor/plans/all-ts_greenfield_blueprint_44cd45df.plan.md) disagree on product nouns → **blueprint wins**. When platform/UI contracts disagree → **[`docs/`](docs/README.md)** + **[`apps/web/docs/`](apps/web/docs/README.md)** win.

## Quick reference

| Task | Command |
| --- | --- |
| Toolchain | `nix develop` |
| Postgres + MinIO | `just up` · `just minio-init` |
| Wipe case data | `just wipe` · `just wipe yes` (keeps auth+vault) |
| Install / migrate | `pnpm install` · `pnpm db:migrate` |
| Dev | `pnpm dev:web` · `pnpm dev:worker` |
| Lint / fix | `pnpm check` · `pnpm fix` |
| Typecheck / test | `pnpm typecheck` · `pnpm test` · `pnpm test:component` · `pnpm test:integration` · `pnpm test:e2e` |
| Web DS | `pnpm --filter @watchdog/web ds:check` |
| Caps / client regen | `pnpm generate:caps` · `pnpm generate:client` |
| AGENTS gate | `pnpm check:agents` · `pnpm check:agents:strict` |
| Vault lint | `just lint` |

Solo signup: `BETTER_AUTH_ALLOW_SIGNUP=1` → `/auth/sign-up` → set `0`. Package manager: **pnpm** only.

## Sub-AGENTS directory

Read the relevant `AGENTS.md` **before touching that tree**: `apps/web`, `apps/worker`, `packages/{db,core,api,caps,cap-sdk,env,cli,client,policy,schemas,ai,tools,log,test-kit}`.

## Where to Look

| Task | Primary path |
| --- | --- |
| Product / architecture / UX / types | `docs/` |
| UI / DS / domains / Query | `apps/web/docs/` |
| Product nouns / Cap loop | Greenfield blueprint · `docs/PRODUCT.md` |
| Caps / playbooks | [`docs/CAPS.md`](docs/CAPS.md) · [`packages/caps/AGENTS.md`](packages/caps/AGENTS.md) |
| Run the app | `README.md` |
| Vault entities / vocab | `graph/` · `templates/VOCABULARY.md` |
| Investigation depth | [`.agents/tradecraft.md`](.agents/tradecraft.md) |

## Boundaries (platform)

| Do | Don’t |
| --- | --- |
| Postgres = Case Graph SoT; Export is a projection | Hand-edit Export as a second SoT |
| Intake → Evidence; Caps `interpret` → Proposal → Inbox Accept | Caps/machines write Graph or set `confirmed` |
| Agents/CLI default: propose; graph write needs `userOverride` → Graph @ `unverified` + `graph_writes` | Silent machine Graph writes; mid-build verbs (<!-- check:agents allow-banned --> promote / Scratch / Door A / Candidate theater) |
| Secrets via vault / `ctx.getCredential` | Cap secrets in env or `Job.input` |
| Chrome: Queue + Detail | Console / Tape / Panel / Pane / Rail / Strip |
| Process logs via `@watchdog/log` (evlog NDJSON) | Secrets/Evidence body in logs; treat evlog as Graph audit (`Job.logs` / `graph_writes` / Accept stay SoT) |
| Extend greenfield packages/apps | Extend `_legacy-*` |

**Ingress:** Intake→Evidence · Jobs→artifacts+Proposal · Inbox Accept→Graph · Dossier=human Graph edit.

## Investigation (compressed)

Never claim without evidence. Zero assumptions. Cite everything. Disclose uncertainty. Adversarial-test identity links.

Platform Accept tiers: **`unverified` / `possible` / `confirmed`**. Cap/agent output stays unverified until human Accept.

**Depth** (breach caveats, linking rules, LE referral, vault entity rules): [`.agents/tradecraft.md`](.agents/tradecraft.md) — read when assessing identity / breach / LE.

## External References

| Need | File |
| --- | --- |
| Greenfield blueprint | [`.cursor/plans/all-ts_greenfield_blueprint_44cd45df.plan.md`](.cursor/plans/all-ts_greenfield_blueprint_44cd45df.plan.md) |
| Platform docs | [`docs/README.md`](docs/README.md) |
| Web docs | [`apps/web/docs/README.md`](apps/web/docs/README.md) |
| Tradecraft | [`.agents/tradecraft.md`](.agents/tradecraft.md) |
| Roadmap | [`ROADMAP.md`](ROADMAP.md) |
| Human README | [`README.md`](README.md) |
