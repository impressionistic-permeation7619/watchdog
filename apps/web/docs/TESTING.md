# Testing — `@watchdog/web`

**What this is:** what to run before merging web UI, and which flows the two Playwright specs already cover.  
**Not:** Cap/schema test details (platform index: [`docs/TESTING.md`](../../../docs/TESTING.md); methodology: [`docs/TESTING_STANDARDS.md`](../../../docs/TESTING_STANDARDS.md)).

## Required gates (web UI)

From repo root (`nix develop` on this machine):

```bash
pnpm --filter @watchdog/web typecheck   # app tsc (excludes shared/ui/shadcn)
pnpm --filter @watchdog/web ds:check    # typecheck + ds:ban greps
```

| Check | Covers |
| --- | --- |
| `typecheck` | App + hand-owned `shared/ui/**` (excludes `shadcn/` + `use-mobile`) |
| `ds:check` | `typecheck` + design-system ban greps |
| `ds:ban` | SectionLabel SoT, freestyle palette in domains, opaque-id `.slice`, WD manifest (`shared/ui` excl. `shadcn/` + `__tests__/`) |

Dirty UI paths also trip `.cursor/hooks/ds-ban-stop.mjs` — fix `ds:ban` before ending the turn.

## Automated (web)

```bash
pnpm test:unit            # packages + worker only (web is not in this project)
pnpm test:component       # all `apps/web/src/**/__tests__/**` (lib `*.test.ts` + `*.component.test.tsx`)
pnpm test:e2e             # Day-0 core loop + custody defense (needs `just test-db`, MinIO, web+worker)
```

Playwright covers: sign-up → New Case → paste dump → Harvest → Inbox Accept → identifier visible; confirmed-without-evidence and invalid-identifier Accept chips.

Lib tests pin Jobs queue/detail/run-input/status, Dossier confirmed-evidence + claim form, Inbox filters/evidence/decide-header + Accept disable (`InboxPatchBody`), Intake filters/evidence, Tasks due-date + form, connection table writes (`unverified` / `related_to` notes), identifier commit (handle-without-platform), paste error aliases, dashboard selectors, case overview activity, jump-nav, queue-selection, `slugifyName`, and display helpers (`formatOpaqueId` / `group-by-day`). Component: Accept gate copy, bulk-add preview, Inbox Accept disable. Remaining smoke below is layout, live Query/SSE, vault Settings, and chrome that has no lib contract.

Examples: `shared/layout/__tests__/page-trail.test.ts`, `domains/jobs/lib/__tests__/jobs-views.test.ts`, `domains/inbox/lib/__tests__/inbox-patch-body.component.test.tsx`, `lib/__tests__/orpc-null-if-not-found.test.ts`.

## Backend / Caps (packages)

Greenfield Cap, core, policy, schema, and tools tests are Vitest. Put suites in a sibling `__tests__/` dir (not next to the source file). Root `pnpm test` is unit+property only.

```
packages/caps/src/evidence/harvest/__tests__/harvest.test.ts
packages/caps/src/network/dns.lookup/__tests__/interpret.test.ts
packages/caps/src/network/dns.lookup/__tests__/run.test.ts
packages/tools/src/html/__tests__/to-text.test.ts
packages/policy/src/__tests__/patch-gates.test.ts
packages/core/src/jobs/__tests__/load-cap-report.test.ts
packages/core/src/graph/__tests__/parse-agent-patch.test.ts
packages/schemas/src/__tests__/platforms.test.ts
```

Web does **not** re-test Cap handlers. If a mutation is wrong, fix/test `@watchdog/core` / `@watchdog/policy` (or Cap), then smoke the page.

## What's intentionally absent

| Kind | Status |
| --- | --- |
| Visual regression | Not set up |
| Extra Playwright flows | Capped at 2 — see [`docs/TESTING_STANDARDS.md`](../../../docs/TESTING_STANDARDS.md) |

## Manual smoke (split pages)

With `just up`, migrated DB, `pnpm dev:web` (+ worker for Jobs):

1. **Jobs** — pick Case → CapMatch paste / empty-default Cap select + filters → start a Cap → row appears without page flicker / remount; Detail shows log/output (detail fetch, not list payload); Cap-shaped inputs; interpret fail = amber badge. Missing vault key → Run disabled (tooltip names the slot); `wd jobs start` refuses before queue. Cancel mid-run → `cancelled` within ~2s. Hard-kill + restart worker → stale `running` Jobs fail via `reconcileStaleJobs` (message mentions worker restart).
2. **Inbox** — first paint pending-only (clear filters for history); accept/reject a Proposal (single TX) → queue updates; confirmed without evidence blocked; agent-sourced rows show **agent** badge (no override badge). Same Identifier `type+value` on another Entity → warn Alert (Accept still works). Cap junk Identifier op (e.g. bad email) → Invalid value chip + Accept disabled. 2b. **CLI agents (optional)** — `wd proposals create` lands Inbox; `wd graph write` mutates Graph at unverified; child writes need `--user-override` (needs API key).
3. **Intake** — paste/file dump → Hide → Filters → Hidden → Restore → URL Enrich shows Output on the same row → attach Entity on Detail if dumped unattached → Harvest / Extract (AI) (egress + credential) sets processed. Optional: `wd evidence hide|restore|download|process|enrich`.
4. **Dossier** — open entity → trail folder + `{name} / Entities / {name}` (kind badge + editable last crumb); click Case → Overview; click Entities → table; PageHeader line tabs. Overview Summary + Notes tab use `RichTextEditor` (Markdown string SoT, blur-autosave); **Edit** opens `DossierEditDialog` (name / kind / summary / notes — same Plate fields); Notes tab fills the page (`density="split"`). Edit a section → Query invalidation + live `entity_changed` keep counts/lists sane (incl. case-wide identifiers/edges caches); identifier/claim confirmed needs `EvidencePicker`; create+link Evidence is one TX. **Identifiers** — **Bulk add** (ghost, next to Add): paste → Continue → left/right column match (type from header/values) → editable preview → import; Entity is locked to the current subject (Entity column ignored). Handle without platform is blocked. Bad email / phone / url / domain / ip / pgp rejected in Add identifier (and inline edit / bulk). **Evidence** — File / Paste / URL dump with Entity locked (dropzone + dialogs); rows also appear in Intake; row click → preview Drawer (Process / Enrich / Hide stay on Intake). **Questions** — textarea composer; click text or row menu to edit (resolved can edit note); check or menu to resolve; reopen from resolved menu. **Connections** — Add/Edit dialog (grouped phrase picker + peer + confidence/evidence; peer change clamps via `clampEdgePhrase`); list edit/remove; canvas is read-only (edge click → edit; peer node → peer dossier).
5. **Cases / Case Overview** — Manage Cases: **Open** sets Active + Overview; Select sets Active only; New Case dialog; export; **Delete** type-to-confirm (card ⋯ or Overview) cascades the Case. Overview trail `Cases / {folder} {name}` (click `Cases` → manage list; no `← Cases`). Rename on Overview settings regenerates slug and replace-navigates. Overview = stats / activity / settings (no line tabs). Stat tiles → `/entities`, `/identifiers`, `/graph`, `/intake`, `/jobs`, `/inbox`. UUID/`?tab=` bookmarks redirect. 5b. **Entities table Connections** — create org + infra → Connections **Add** → relationship defaults to `primary_domain` after peer pick; Save → chips refresh without opening dossier. Chip click → edit (prefilled); `+N` → browse list (not create). Row click still opens dossier (Add/chips are buttons). Table writes stay `unverified` / no evidence; `related_to` requires notes. 5c. **Identifiers table** — `/identifiers` (Case switcher) — SearchField + Type/Status/Confidence filters, inline edit, evidence link, in-place create (Entity picker + Value first); **Bulk add** (outline, next to Add identifier) two-stage paste → left/right match → editable preview → import (default Entity fills empty Entity cells; mapped name/slug miss shows **Not found** / **Ambiguous**; type from columns/values; `confirmed` → `unverified`); empty table keeps add-row; row click → Dossier Identifiers (interactive cells are buttons so they don’t steal the row). Handle without platform is blocked. 5d. **Graph** — `/graph` hosts case-wide preview canvas; node → dossier.
6. **Tasks** — `/tasks` kanban only: New task / lane quick-create; drag between status columns (status change only); edit dialog (title, priority, date-only due, entity); Dossier Tasks tab = entity-scoped board; Task is not a Graph write.
7. **Settings** — sidebar `?tab=` (Account / Security / API Keys / Credentials); Cap credentials list + Connect/Update dialog (vault).
8. **Dashboard** — `/` trail last crumb Dashboard; 3×2 stat cards; Inbox + Due panels (dashed empty when clear); Activity in a resizable bottom panel (`ScrollArea`) with case filter; Active Case switch re-scopes stats/lists (Activity stays cross-case unless filtered).
9. **Case switch** — change Active Case → lists re-scope (no stale other-Case rows).
10. **Cmd+K / hotkeys** — Mod+K (or sidebar Search…) opens palette; idle Jump to; type entity name → Enter → dossier; `?` → Shortcuts sheet; Mod+B still toggles sidebar.
11. **PageHeader trail** — Work page shows folder + `{name} / Inbox` (etc.); dossier folder + `{name} / Entities / {name}`; click Case → Overview; click Entities → table. Entities / Identifiers / Tasks last crumb shows `TabCount` (hidden at 0); leave the page and the pill drops with the title. No Active Case → Case crumb omitted. No explainer suffix in the bar.

`/ui` gallery: Foundations + Atoms specimens (required atom coverage for `ds:check`). No Patterns / split-quartet fixtures.

## When you change chrome

- Touch `shared/ui` hand-owned atom → keep it out of `shadcn/`; update `wd-ui-files.mjs` + a `COMPONENTS.md` row, then `ds:check`. Suites under `shared/ui/__tests__/` are **not** atoms — do not list them in the manifest.
- After `shadcn add` → files land in `shared/ui/shadcn/`; run `pnpm shadcn:nocheck`.
- Rename lexicon words → update [`UI.md`](UI.md) / [`docs/UX.md`](../../../docs/UX.md) if product meaning changed; run typecheck.
