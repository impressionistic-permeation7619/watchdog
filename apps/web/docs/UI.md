# UI — design system

**What this is:** how we _build_ the interface — tokens, atoms, layout chrome, naming of UI parts, engineering gates.  
**What this is not:** product IA, user flows, copy, or experience debt — that is [`docs/UX.md`](../../../docs/UX.md).

Code SoT: `src/styles.css` + `src/shared/ui/` (hand-owned) + `src/shared/ui/shadcn/` (registry). Style guide / library: **`/ui`** (Foundations · Atoms) — not Storybook.

## Delivery

Greenfield Foundations/atoms on `/ui` **before** inventing chrome inside live product pages. `shared/ui` = presentational only (**no I/O**). Domains wire data via hooks/serverFns. Extract named generics at the **second** call site.

| Gate                      | Command                                      |
| ------------------------- | -------------------------------------------- |
| Typecheck + DS bans       | `pnpm --filter @watchdog/web ds:check`       |
| Hand-owned atom checklist | `scripts/wd-ui-files.mjs`                    |
| After `shadcn add`        | `pnpm --filter @watchdog/web shadcn:nocheck` |

## Chrome lexicon (UI parts)

Name the **layout kind**, then the **parts**. These are component/layout words — not product feature names.

| Kind | Parts | Layout atom |
| --- | --- | --- |
| **split** | **Queue** (list) + **Detail** (selection) | `SplitView`, `density="split"` |
| **stack** | **Section** × N | — |
| **table** | data table | Entities / Identifiers; bulk-add preview |
| **form** | **FormSection** × N | — |
| **card grid** | searchable cards (+ dashed create CTA) | Cases — `ACCENT_CARD_SURFACE` |
| **board** | status columns + cards (kanban) | `/tasks` + Dossier Tasks tab — domain-owned (`TaskBoard`) |
| **mixed (dashboard)** | Stat cards + section panels + resizable Activity (`ScrollArea`) | `/` Dashboard — domain-owned (`MetricsSection`, `dashboard-panels`, `RecentActivity` in vertical `ResizablePanelGroup`) |

| Part | Code |
| --- | --- |
| **Page** | `<Page>`, `PageHeader` (trail / `AppBreadcrumbs`), `PageToolbar` |
| **Queue** | `QueueRow`, `QueueHeader`, `QueueFilterBar`, `{Domain}QueueList` |
| **Detail** | `{Domain}Detail`, `DetailHeader`, `DetailFooter`, `DetailEmpty` |
| **Section** | `DossierSection`, `FormSection`, … |
| **Drawer** / **Dialog** | overlay primitives + domain wrappers |
| **Toolbar** | `PageToolbar`, `{Domain}QueueToolbar` |

**Bar** only in compounds (`QueueFilterBar`, `SectionHeaderBar`).

**Banned as UI surface names:** Console · Workbench · Tape · Panel · Pane · Rail · Strip.  
Vendor exception: `react-resizable-panels` / `data-slot="resizable-panel*"`.

```
SplitView → Queue | Detail
Never: *Console *Workbench *Panel *Pane *Rail *Strip *Tape
```

```
┌─ Page ───────────────────────────────┐
│ PageHeader / PageToolbar             │
├──────────────┬───────────────────────┤
│ Queue        │ Detail                │
│  QueueHeader │  DetailHeader / Jobs+Intake crumb+tabs │
│  QueueRow…   │  body                 │
│              │  DetailFooter (CTAs)  │
└──────────────┴───────────────────────┘
```

## Design system

- Primitives: shadcn (Base UI / `base-nova`) in `src/shared/ui/shadcn/` (registry / `@ts-nocheck`)
- Hand-owned atoms: `src/shared/ui/` (`QueueRow`, `SplitView`, data-table kit, …)
- Page chrome: `shared/layout/{app-shell,app-sidebar,app-breadcrumbs,page,page-trail,use-page-trail,page-toolbar,page-filter-menu,route-pending,route-error,case-switcher,theme-toggle}`
- Prefer `@/shared/ui/*` (owned) / `@/shared/ui/shadcn/*` (primitives) over raw HTML
- Theme: OKLCH cool neutrals (~250) + **steel-cyan** accent (~220) + **amber** signal (~75); **no violet brand**
- Font (Fontsource, self-hosted — not Vercel `geist` / Next `next/font`):
  - Sans: **Geist Variable** → `--font-sans` via `@fontsource-variable/geist/wght.css`
  - Mono: **Geist Mono Variable** → `--font-mono` via `@fontsource-variable/geist-mono/wght.css`
  - Family names must match the package `@font-face` strings exactly (`"Geist Variable"` / `"Geist Mono Variable"`).
  - Radius ladder (only three + exceptions):
    - **`--radius: 0.5rem`** = medium base (**8px**) — default via `rounded-md`
    - `rounded-sm` (4px) — checkbox / tiny inset
    - `rounded-md` (8px) — controls, chips, dense panels
    - `rounded-lg` (12px) — cards, dialogs, menus, larger surfaces
    - Exceptions: `rounded-full` · `rounded-none` · `rounded-[inherit]`
    - Ban `rounded-xl` / `2xl` / `3xl` / `4xl` and arbitrary `rounded-[min(…)]` / `calc(var(--radius)±Npx)`
- Mode: **Operate** (consistency over surprise)
- Theme toggle: `.dark` / `.light` on `<html>`; Sonner follows that class
- Root: `TooltipProvider delay={500}` + `Toaster` (dense hit targets: `WithTooltip` + `wrapSpan`)
- Tooltip chrome: elevated dark tip (`--wd-neutral-800` / `--wd-neutral-50` + light ring) via `TooltipContent` — sits above dark page bg; `Timestamp` / `WithTooltip` / sidebar share it
- shadcn folder excluded from typecheck; hand-owned `shared/ui` typechecked by default
- Base UI: `Button` + `render={<Link … />}` → **`nativeButton={false}`**
- **no-I/O litmus:** `shared/ui` never fetches, mutates, or routes. Domains own I/O.
- Homogeneous work lists → `divide-y` Queue rows (not Card-per-row stacks). Cases are a small set of containers — card grid is OK (`ACCENT_CARD_SURFACE`).
- Never name a UI component `Entity` — that word means graph subject; use `QueueRow` / `DossierEditDialog` / domain-prefixed names.

## Table columns

`DataTable` is `table-layout: fixed` + `width: 100%` + a `<colgroup>` from TanStack `column.size` (percent of the sum). CSS leftover space goes to columns with no width, or is spread across all columns when widths don’t fill the table — do not pin some `th`/`td` with `w-*` and leave others open.

| Do | Don’t |
| --- | --- |
| Set `size` (and `minSize` on enums) on every column | Rely on TanStack’s default 150 — equal leftover, no hierarchy |
| Size enums to the longest label + cell chrome (~140 for Status / “In Progress” / “unverified”) | `w-24` on a select cell |
| Give leftover to the fluid text column via a larger `size` (Title / Value / Name) | Unconstrained first/last column |
| `min-w-0 overflow-hidden` on cells; truncate in the cell | Let `min-width: auto` fight the colgroup |
| Raw preview tables: same `<colgroup>` percentages that sum to 100% | Widths only on `<th>` |

Surfaces: Entities (`entity-table.columns.tsx`), Identifiers (`identifiers-table.columns.tsx` + dossier `identifiers-section.cells.tsx`), bulk-add preview (`PREVIEW_COLUMNS` in the dialog). Queues / boards / ColumnMapper grids are not tables.

## Color tokens

Bind to **semantic** tokens only. `--wd-*` ramps define those semantics.

| Job | Prefer |
| --- | --- |
| Page | `background` / `foreground` |
| Elevated | `card` |
| Overlay | `popover` |
| App nav chrome | `sidebar-*` (don’t invent a third panel palette) |
| Action | `primary` |
| Hover/selected | `accent` |
| Helper | `muted` / `muted-foreground` |
| Danger | `destructive` |
| Resting stroke | `border` / `input` (quiet mix — same as field Select chrome) |
| Triage selection | `signal` |
| OK | `success` |
| Caution | `warning` |

Domain meaning: `--confidence-*` / `--status-*` / `--severity-*` / `--kind-*` only. Never freestyle `text-green-600` / `text-amber-400` for those meanings. Badges are **meaning-named** (`ConfidenceBadge`), never color-named (`variant="purple"`).

Contrast fix: adjust OKLCH **L only** — keep hue/chroma stable.

## Refuse list (AI slop)

No nested cards, colored side-tab accents, glow/halo, gradient text, icon-tile feature grids, bounce/elastic easing, decorative glass, mono-as-decoration, cream/violet brand defaults.

## Type roles

`text-heading-page|dossier|section`, `text-label` / `text-label-sm` / `text-label-meta` / `text-label-meta-sm`, `text-label-mono` / `text-label-mono-sm` (Geist Mono via `--font-mono`), `text-copy` / `text-copy-sm`, `text-chip` (uppercase chips only). Ban new `text-[10px]` / `text-[11px]` outside `styles.css`. Mono = IDs/hashes/paths/capability ids. Register new roles in `lib/utils.ts` for twMerge.

## Page shell

- `<Page>`: `px-3 pb-3 pt-0 gap-4`; `density="split"` | `"default"`
- `<PageHeader>`: sole inset top chrome; always rendered; always mounts the route + Active-Case **trail** (`AppBreadcrumbs`). Optional **`actions=`**, **`current=`** last-crumb override, **`count=`** + **`countOn=`** (`TabCount` on the last crumb; hide at 0 and when the trail has already left that crumb — pending previous page must not keep its pill), **`below=`** line tabs. Do not pass identity titles or explainer `description=` copy (404 pages may use `description=` for the missing slug). Layout chrome lives in `shared/layout/` (not a COMPONENTS atom). Do not add a second AppShell header.
- Theme toggle lives in sidebar user menu
- Measurements: PageHeader trail row `h-10` (+ optional `below` line tabs `h-8`); Queue row `px-3 py-1.5` / title `text-xs`; DetailHeader `px-4 py-3` (title `text-sm`; status top-right); Jobs + Intake Details use crumb path + Captured/Ran MetaRow + tabs-in-header (Jobs: playbook spine in Log; Intake header = `EvidenceDetailHeader`); **stack pages** (Dossier + Case overview) use PageHeader `below=` line tabs (text + `TabCount`; no tab icons); Inbox Detail uses decide-band header (`inbox-decide-header.tsx`) + patch body (`inbox-patch-body.tsx`) + `DetailFooter` Accept/Reject; DetailFooter `px-4 py-2` (CTAs); SplitView default list **`34%`** (min `22%` / max `55%`)
- **Split-view ownership:** route owns `<Page density="split">`; domain owns `PageHeader`, queue toolbar, and `SplitView` regions. Domain must not wrap a second `<Page>`.
- **Table/board ownership:** domain owns `<Page>` + `PageHeader` (Entities, Tasks).
- **Stack ownership:** domain owns full `<Page>` shell (Dossier, Case overview, Cases list). **Dashboard** also owns the shell but uses `density="split"` + vertical resizable overview ↔ Activity. Settings is the exception — route owns `<Page>` + `PageHeader`; domain owns `SettingsShell` body only.
- Panel empties (`emptyPresentation="panel"`) pass dashed-frame classes into `EmptyState`; Overview inline empties stay muted text.
- **Shared graph chrome:** `shared/ui/graph/` hosts `GraphFlowShell` / `GraphFlowCanvas` (sync + Background + fit-view) plus `EntityNode` / `PredicateEdge` / floating-edge math / kind+confidence stroke helpers. Ego 1-hop layout stays in `dossier/.../ego-graph/`; case-wide force layout lives in `cases/.../case-graph/`.
- **Trail = identity:** last crumb is the current page (`aria-current="page"`); ancestors are links. A Case crumb is a folder icon + `{name}` (no `Case:` prefix; `aria-label` still `Case {name}`). When Case is the first crumb it links to Overview (`/cases/$activeSlug`). On Overview the last crumb is folder + name; ancestor `Cases` → `/cases`. Work surfaces are `{folder} {name} / Inbox` (etc.). Dossier is `{folder} {name} / Entities / {name}` — last crumb = `KindBadge` + `EditableTextCell` via `current=` (same rename commit). No Active Case → omit the Case crumb. Do not lift Inbox/Jobs/Intake Detail `?proposalId=` / `?jobId=` / `?evidenceId=` slash-paths into PageHeader. Matcher: `shared/layout/page-trail.ts` (pure). Hook: `use-page-trail.ts` (`useQuery(casesContextQuery())`, not suspense; optional `entityBySlugQuery` on dossier). **Edit** still opens `DossierEditDialog` for name / kind / summary / notes. Case rename stays on Overview settings (`CaseSettingsForm`) — name blur-save regenerates slug and replace-navigates `/cases/{slug}`. Notes + Tasks tabs use `density="split"` so the body fills.
- **`SectionLabel`:** normal case (`text-label-meta`); do not force uppercase — `text-chip` stays for uppercase chips only.

## Form library

**Stack:** `@tanstack/react-form` only. Do not add `react-hook-form`.

| Use TanStack Form | Leave as local state |
| --- | --- |
| Composer / dialog with discrete Save/Submit | Single-value commit-on-blur/Enter (`EditableTextCell` / `EditableSelectCell` — incl. dossier last-crumb rename) |
| 2+ fields, or a cross-field rule (e.g. confirmed↔evidence, `related_to`↔notes) | Blur-autosave Markdown prose (`SummarySection` / `NotesSection` via `RichTextEditor`); Case rename/description/egress (`CaseSettingsForm` — field drafts + mutation) |
|  | `SearchField` / queue filter facets (live filter, no submit) |
|  | `DestructiveConfirmDialog` type-to-confirm gate |

**Conventions**

- Wire client validators to the same domain Zod schemas used on ServerFns when shapes align (Zod v4 Standard Schema — no `@tanstack/zod-form-adapter`).
- Server/mutation failures: `catch` → `FormInlineError` / toast via plain `useState` — not TanStack Form’s error map / `isSubmitSuccessful`.
- One self-contained `useForm` per composer; do not split one form across children via context. Create vs edit = two `useForm` instances (share config with `formOptions` if needed).
- Shared claim create/edit: `dossier/lib/claim-form.ts` (`claimFormOptions`, `claimEvidenceIdsValidator`) → one `ClaimComposer` in `claims-section.tsx`.
- Inbox Accept/Reject: `useInboxDetailForms` (`inbox/hooks/use-inbox-detail-forms.ts`) — two `useForm` instances; do not split across children. Accept composer values: `AcceptFormValues` in `inbox/types.ts` (imported by hooks + Detail — not defined under `components/`).
- Confirmed↔evidence gate + copy: `dossier/lib/confirmed-evidence.ts` (also Inbox + connection dialog).
- Every field: `onBlur={field.handleBlur}`; validators return `string | undefined`; gate onChange/onBlur errors with `isTouched`; use `form.Subscribe` with narrow selectors; `evidenceIds` is a plain `string[]` field (not `mode="array"`).
- Split-view queue URL SoT: `resolveQueueSelection` (`shared/lib/queue-selection.ts`) + render-time `<Navigate replace>` when URL ≠ resolved selection (Inbox / Intake / Jobs) — not a sync `useEffect` that calls the parent navigate callback. Jobs may pass `holdMissingUrlId` so a just-started (or filter-hidden) job id is not Navigate-clobbered.

## Multi-mode UI (Detail / composers)

Prefer **mode composition** over nested ternaries when a surface has mutually exclusive layouts (pending vs decided, accept vs reject, add vs edit). Chip-level `{cond ? <X/> : null}` is fine.

| Pattern | Use when | Example |
| --- | --- | --- |
| Early `return` / mode child components | Whole branch differs | `PendingDecideBand` / `DecidedDecideBand` |
| Pure `build*View()` in `lib/` | Several flags drive chrome | `decide-header-view.ts`, `job-detail-view.ts`, Cap/playbook seed views |
| One discriminant for exclusive actions | Parallel busy flags drift | Intake `pending: { kind; evidenceId }` — not four ID booleans |
| Exhaustive `switch` + `never` | Discriminated unions | `ArtifactPreviewBody`, vocab, status edges |
| `ActiveTabBody` + `TabsContent` | Stack / Detail tabs | Case · Dossier · Jobs · Intake — **conditional unmount** (not React `<Activity>`) for heavy canvases |

Reference: Inbox decide band (`inbox-decide-header.tsx` + `lib/decide-header-view.ts`). Official React guidance: [Conditional Rendering](https://react.dev/learn/conditional-rendering), [Choosing the State Structure](https://react.dev/learn/choosing-the-state-structure).

## Hand-owned atoms (highlights)

`ActiveTabBody` / `SuspenseTabBody`, `SectionLabel`, `SectionHeaderBar`, `FormSection`, `MetaRow` / `MetaGrid` (Detail/drawer key-value — not form helpers, not queue titles), `shared/ui/vocab` badges, `IdChip` + `MiddleTruncate` (opaque ids/hashes; `ds:ban` blocks `.slice(0,N)`), `EntityMention` (linked entity name — not inside row-click tables), `RelativeTime`, `Timestamp`, `StatusDot`, `SearchField`, `DestructiveConfirmDialog`, `EntityCombobox` / `FieldCombobox` / `FieldSelect` / `ConfidenceSelect` (options in; no I/O; Combobox may set `group` for headings), `FormInlineError` / `ComposerShell`, Queue + Detail + `QueueShell` + `SplitView` + `ArtifactPreview`, `DetailFooter` / `DetailStatusChip`, `DataTable` kit (+ editable cells / append composer), graph kit (`GraphFlowShell` / `GraphFlowCanvas` / `EntityNode` / `PredicateEdge`), `RichTextEditor` / `RichTextViewer` (Markdown string SoT — dossier Summary/Notes), `InlineLoading`, `Spinner`, `FetchErrorAlert`, `Empty` / `EmptyState`, skeletons. Page chrome (`PageToolbar` / `PageFilterMenu` / `RoutePending` / `RouteError`) lives in `shared/layout/`. Style guide: **`/ui`**. New atoms: `pnpm --filter @watchdog/web ds:atom -- <Name> <file>`.

Domain evidence pickers: `dossier/components/evidence-picker.tsx` (`EvidencePicker`, `EvidenceCiteChips`) — dossier composers + Inbox Accept; not `shared/ui`. **Third-party CSS:** `@xyflow/react` stylesheet lives in `src/styles.css` (`@import "@xyflow/react/dist/style.css" layer(base)`). Do not import it from TS/TSX — Vite fails that path on dynamically loaded dossier modules.

### Component job matrices

| Need | Use |
| --- | --- |
| Dense job lifecycle in a row | `StatusDot` (`pulse` only when `running` + opted in) |
| Scannable text status | `StatusBadge` |
| Confidence / kind / review | domain badges — ≤1–2 per row cluster |
| Opaque id / hash / path | `IdChip` (not Badge) |
| Inline entity name (+ optional dossier link) | `EntityMention` |
| Long searchable enum (edge phrases) | `FieldCombobox` (optional `group` → section headings) |
| Tiny closed string enum | `FieldSelect` |
| Detail key/value | `MetaRow` / `MetaGrid` |
| Glued sibling actions | `ButtonGroup` (pagination, step) |
| 2–3 exclusive view modes | `ToggleGroup` (not boolean `Switch`; not `Tabs` when the trigger owns no panel — e.g. Jobs Cap/Playbook run mode, whose form sits in the queue toolbar) |
| Unrelated CTAs / dialog footer | `flex` + `gap` — don’t ButtonGroup everything |
| Adorned field (icon, eye, kbd) | `InputGroup` |
| Toolbar filter search | `SearchField` — not InputGroup |
| Button icons / Spinner in Button | `data-icon="inline-start\|inline-end"` |

Button sizes: PageHeader / toolbar → `sm` (or default); Queue row / dense icon actions → `xs`.

## Loading & hydration (implementation)

| Situation | Show |
| --- | --- |
| &lt;~400ms | Nothing (no flash) |
| Known layout, first load | Region skeleton in the **data slot** |
| Loader seeded `ready=true` | Skip skeleton |
| Refetch / SSE update | Keep prior rows; don’t blank the region |
| Button / mutation wait | Button `loading` / `InlineLoading` / `Spinner` — not page skeleton |
| No data | Empty / `DetailEmpty` — never Skeleton |

**Static shell (never skeleton):** Page, PageHeader, toolbar, filter chrome, tab strip, split frames. Only queue rows / detail body / table body.

**Stack pages** (Case Overview, Dossier, Cases list): thin loader (`ensureQueryData` identity/context only + `void prefetchQuery` for lists); omit `pendingComponent` when the await is fast; shell paints first; data slot = `StackBodySkeleton` / section Suspense. No “Loading…” copy in the slot. **Dashboard** uses `Page density="split"` + vertical `ResizablePanelGroup` (overview ↔ Activity); Activity body = `ScrollArea`. Settings: route owns shell; body Suspense as needed.

**Split-view Queue pages** (Inbox, Jobs, Intake): `pendingComponent: RoutePending` (`variant="queue"`) OK; await the primary queue list; `prefetchQuery` secondary lists; wrap Active bodies in Suspense + `QueueSkeleton` when secondary data can lag. Domain owns `PageHeader` + toolbars.

**Table / board pages** (Entities, Tasks): domain owns `<Page>`; `RoutePending` OK on Entities; Tasks uses board skeleton in `tasks-page.tsx`.

Skeleton a11y: bones `aria-hidden`; region `aria-busy` + one `aria-live="polite"`; respect `prefers-reduced-motion`; no fake “Loading…” text in bones.

Router: `defaultPendingMs=400`, `defaultPendingMinMs=500`.

Hydration: suppress relative time / session name when needed; no nested `<button>` (`WithTooltip` `wrapSpan`; copyable `IdChip` beside `CollapsibleTrigger`, not inside); `SplitView` static flex pre-hydration.

## Motion (Operate)

- High-frequency paths (Queue select, Detail swap): instant or ≤100ms **color-only** (`--duration-fast`)
- Panels/dialogs: ≤100–180ms (`--duration-panel`); no page-mount fades, stagger, blur entrances, or AnimatePresence on Queue/Detail
- Selection = amber wash/bar — not pulse
- Button press `scale(0.97)` OK; no bounce/elastic
- Infinite pulse: skeletons (gated by reduced-motion) or StatusDot `running` only — not live badges generally

## UI PR checklist

1. [ ] Semantic tokens / existing primitives — refuse list above
2. [ ] Shell not replaced by skeleton; loading matrix followed
3. [ ] Loading / empty / error / success share footprint in the data region
4. [ ] Chrome lexicon above — no banned surface nouns
5. [ ] `shared/ui` remains no-I/O
6. [ ] Opaque ids via `IdChip` / `formatOpaqueId` (no `.slice`)
7. [ ] Right control for the job (ButtonGroup / ToggleGroup / SearchField / badges)
8. [ ] `pnpm --filter @watchdog/web ds:check` passes
9. [ ] New hand-owned atom? Update `wd-ui-files.mjs` + `COMPONENTS.md` (under `shared/ui/`, not `shadcn/` or `__tests__/`)
