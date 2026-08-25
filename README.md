# Watchdog

OSINT case platform — Postgres Case Graph, Evidence, Caps, Inbox Accept loop.

Investigation vault (corpus, graph notes, mirrors) lives in the separate **inplainsight** repo.

| Need | Path |
| --- | --- |
| Agent instructions | [`AGENTS.md`](AGENTS.md) |
| Platform docs | [`docs/README.md`](docs/README.md) |
| Web UI docs | [`apps/web/docs/README.md`](apps/web/docs/README.md) |
| Run locally | `nix develop` → `just up` → `pnpm install` → `pnpm db:migrate` → `pnpm dev:web` |

```bash
nix develop
cp env.example .env
just up && just minio-init
pnpm install
pnpm db:migrate
pnpm dev:web
```
