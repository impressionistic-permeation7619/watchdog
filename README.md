# Watchdog

**OSINT case platform for small teams.** Keep one Case Graph of Claims and Evidence you can defend, while collection stays fast.

[![ci](https://github.com/kzndotsh/watchdog/actions/workflows/ci.yml/badge.svg)](https://github.com/kzndotsh/watchdog/actions/workflows/ci.yml)

```
Collect  →  Decide (Inbox)  →  Graph under human custody  →  Export case package
```

Automated collection never touches the graph directly. Capabilities ("Caps") produce Evidence and a **Proposal**; a human accepts or rejects it in the Inbox. Postgres is the source of truth — the markdown export is a projection you can regenerate at any time.

---

## Why it works this way

| Principle | In practice |
| --- | --- |
| Machines propose, humans decide | Caps and agents emit Proposals; only Inbox Accept (or a manual Dossier edit) writes the graph |
| Every claim carries provenance | Claims link to the Evidence and Job that produced them |
| Confidence is explicit | Accept tiers are `unverified` → `possible` → `confirmed`; nothing is confirmed by a machine |
| Escape hatches are audited | An agent can force a graph write, but it lands at `unverified` and is recorded in `graph_writes` |
| Secrets stay out of jobs | Cap credentials live in an encrypted vault, fetched at runtime via `ctx.getCredential` |

---

## Quick start

**Requirements:** Docker, Node ≥ 22, pnpm 11. [Nix](https://nixos.org/download) is optional but gives you the exact toolchain.

```bash
git clone https://github.com/kzndotsh/watchdog.git
cd watchdog

nix develop                 # optional — pinned node, pnpm, docker CLI, OSINT tools
cp env.example .env         # then set BETTER_AUTH_SECRET and WD_MASTER_VAULT_KEY

just up && just minio-init  # Postgres 16 + MinIO
pnpm install
pnpm db:migrate
pnpm dev:web                # http://127.0.0.1:3000
```

Generate the two required secrets with `openssl rand -base64 32`.

**Create the first account.** Signup is closed by default. Set `BETTER_AUTH_ALLOW_SIGNUP=1` in `.env`, restart, register at `/auth/sign-up`, then set it back to `0`.

**Run Cap jobs.** The web app enqueues jobs, but a worker has to execute them:

```bash
pnpm dev:worker
```

Services bind to loopback only: web on `:3000`, Postgres on `:5432`, MinIO on `:9100` with its console on `:9101`.

---

## Capabilities

63 Caps ship today. Each one is a folder under `packages/caps/src/` named for its id (`network/dns.lookup/`), with a `run` that collects and a pure `interpret` that maps the report to Proposal operations.

| Category | Count | Examples |
| --- | --- | --- |
| `network` | 25 | DNS, WHOIS/RDAP, certificate transparency, TLS audit, Shodan, urlscan |
| `threat` | 17 | VirusTotal, AbuseIPDB, GreyNoise, URLhaus, OTX, Safe Browsing |
| `identity` | 6 | GitHub, Keybase, Gravatar, PGP, email reputation |
| `breach` | 4 | HIBP, Dehashed, Snusbase, Hudson Rock |
| `archive` | 4 | Wayback lookup and fetch, Common Crawl, save-page |
| `evidence` | 4 | Deterministic harvest, AI extraction, file and `.eml` analysis |
| `web` | 3 | URL unshortening and page enrichment |

Regenerate the catalog with `pnpm generate:caps`. Playbooks chain Caps into a single seeded run (`host-footprint`, `host-posture`, and others).

---

## Architecture

TypeScript monorepo, pnpm workspaces.

```
apps/web      TanStack Start UI + oRPC handlers (RPC for the app, OpenAPI for agents)
apps/worker   pg-boss consumer that executes Cap jobs
packages/*    @watchdog/{env,schemas,policy,db,core,api,caps,cap-sdk,tools,ai,log,client,cli,test-kit}
```

Dependencies flow one way: `schemas` and `env` sit at the bottom, `caps` never imports `db`, `api` never imports `db` directly, and only `core` touches repositories. The full import matrix is in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

**Data path.** `enqueueCapJob` pushes onto the `watchdog.cap-jobs` queue → the worker runs the Cap → artifacts land in S3 and a Proposal lands in the Inbox → Accept applies patch operations to the graph in one transaction → the worker syncs a markdown shadow of the case.

**Stack:** TanStack Start · Drizzle ORM · Postgres 16 · pg-boss · Better Auth · oRPC · Zod · MinIO/S3 · Tailwind 4 + shadcn/ui.

---

## Agents and CLI

The API is agent-first. Everything the UI can do is reachable over OpenAPI at `/api/v1`, authenticated with an `x-api-key` header.

```bash
wd cases create --name "Example"
wd jobs start -c <caseId> --cap network.dns.lookup -i '{"host":"example.com"}'
wd jobs playbook -c <caseId> --id host-footprint --host example.com
wd proposals list -c <caseId>
wd export zip -c <caseId>
```

Output is compact JSON by default, `--table` renders human tables, and list responses carry a `help` array of suggested next commands. Configure with `WD_API_URL` and `WD_API_KEY`.

- Interactive spec: `http://127.0.0.1:3000/api/v1/`
- Machine spec: `GET /api/v1/spec.json`
- Typed SDK: `@watchdog/client` via `createWatchdogClient({ baseUrl, apiKey })`

Agents default to proposing. A direct graph write requires an explicit override, lands at `unverified`, and is audited.

---

## Commands

| Task | Command |
| --- | --- |
| Dev servers | `pnpm dev:web` · `pnpm dev:worker` |
| Database | `pnpm db:migrate` · `pnpm db:generate` · `pnpm db:studio` |
| Containers | `just up` · `just down` · `just minio-init` |
| Reset case data (keeps auth + vault) | `just wipe` |
| Lint / format | `pnpm check` · `pnpm fix` |
| Types | `pnpm typecheck` |
| Tests | `pnpm test` · `pnpm test:component` · `pnpm test:integration` · `pnpm test:e2e` |
| Codegen | `pnpm generate:caps` · `pnpm generate:client` |

Integration and end-to-end tests need the dedicated databases: `just test-db`.

---

## Documentation

| Start here | For |
| --- | --- |
| [`docs/PRODUCT.md`](docs/PRODUCT.md) | Intent, personas, what the project refuses to build |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Packages, import rules, jobs, oRPC, logging |
| [`docs/CAPS.md`](docs/CAPS.md) | Cap naming, method vocabulary, ship gates |
| [`docs/TYPES.md`](docs/TYPES.md) | Shared Zod schemas and vocabulary |
| [`docs/UX.md`](docs/UX.md) | Information architecture and investigator flows |
| [`apps/web/docs/`](apps/web/docs/README.md) | UI, design system, domains, data fetching |
| [`AGENTS.md`](AGENTS.md) | Conventions for AI agents working in this repo |
| [`ROADMAP.md`](ROADMAP.md) | Honest maturity table and what's next |

---

## Status

The solo-investigator loop works end to end: authenticate, create a case, dump evidence, run Caps, accept proposals, export the package. Playbooks are linear, MCP is not built yet, and corpus/scrape import is deliberately out of scope for now. [`ROADMAP.md`](ROADMAP.md) tracks this surface by surface without rounding up.

Investigation vault content — corpus, graph notes, mirrors — lives in a separate private repository and never enters this one.
