# Components — hand-owned atom registry

**What this is:** inventory + anatomy for `src/shared/ui/` (not `shadcn/`). Page chrome (`PageToolbar`, `PageFilterMenu`, `RoutePending`, `RouteError`) lives in `shared/layout/` — see § below. Domain composites (e.g. `EvidencePicker`) may appear in the registry with Status **domain** — they are not in `wd-ui-files.mjs`.  
**What this is not:** brand brief (`UI.md`), product IA (`docs/UX.md`), or Storybook.

Code SoT: `src/shared/ui/` · style guide: **`/ui`** (Foundations · Atoms) · gates: `pnpm ds:check` · manifest: `scripts/wd-ui-files.mjs` · new atoms: `node scripts/new-atom-checklist.mjs`.

**Definition of done for a new atom:** registry row here · `/ui` specimen · tokens via semantic classes · no I/O · second call site justified the extract · checklist passes.

---

## Registry

| Atom | Purpose | Use when | Do not use when | Alternative | Status | `/ui` | Tokens |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `ActiveTabBody` | Inactive → null; pending → `StackBodySkeleton`; else children | Stack / Detail tab gates (Case · Dossier · Jobs · Intake) | React `<Activity>` for heavy canvases | `SuspenseTabBody` inside | canonical | yes | — |
| `SuspenseTabBody` | Suspense + `StackBodySkeleton` | Inside `ActiveTabBody` for lazy tab data | Full-page pending | `RoutePending` | canonical | yes | — |
| `ArtifactPreview` | Presentational artifact chrome | Showing named mime body | Fetching artifacts | — | canonical | no | — |
| `CodeBlock` | Shiki highlighted code | Logs / JSON dumps | Editable fields | `JsonView` for trees | canonical | no | — |
| `ClickableIdChip` | Preview `IdChip` (eye glyph) | Click-to-preview evidence ids | Plain / copy chips | `IdChip` | canonical | yes | — |
| `ComposerShell` | Muted bordered composer surface | Add/edit dossier forms | Callouts / dashed rows | — | canonical | yes | muted |
| `ConfidenceSelect` | Confidence Select — CONTROL chrome (same density as FieldSelect) | Graph / Accept confidence | Display-only chips | `ConfidenceBadge` | canonical | yes | — |
| `control-chrome` | Shared dense field + menu tokens (`h-8` / `text-xs` / `rounded-md`) | SearchField · Select · Combobox | Freestyle control heights | — | canonical | no | — |
| `CopyControl` | Copy-to-clipboard control | Standalone copy affordance | Inside opaque ids | `IdChip copyable` | unused | indirect | — |
| `DestructiveConfirmDialog` | Type-to-confirm destroy | Irreversible deletes | Soft cancels | AlertDialog | canonical | no | destructive |
| `DetailEmpty` | Select-none Detail empty — quiet, no dashed frame | No queue selection | Loading / blank slate | `InlineLoading` · `EmptyState` | canonical | yes | muted |
| `DetailFooter` | Bottom CTA bar for Detail | Accept / Cancel / Harvest · Enrich | Identity / meta | `DetailHeader` | canonical | yes | — |
| `DetailHeader` | Detail identity: title · subject · meta · IdChip · status · note | Jobs/Intake custom crumb+tabs; Inbox uses custom decide band + `DetailFooter` CTAs | Page headers · CTAs; Inbox → `InboxDecideHeader`; Intake → `EvidenceDetailHeader`; Jobs → inline header in `job-detail.tsx` | `DetailFooter` | canonical | yes | — |
| `DetailStatusChip` | Secondary outcome / tag pill — shared `CHIP_SIZE_CLASS` with VocabBadge (IdChip height/radius; sans `text-label-meta`) | From cache · unattached · live · agent | Semantic status/kind/confidence | `StatusBadge` · `KindBadge` | canonical | yes | — |
| `ConfidenceBadge` | Confidence chip | Graph confidence display | Job/proposal status | `StatusBadge` | canonical | yes | `--confidence-*` |
| `StatusBadge` | Status chip | Job / proposal / retract / identifier | Confidence | `ConfidenceBadge` | canonical | yes | `--status-*` |
| `TaskStatusBadge` | Task status chip (reuses `--status-*` tones) | Task board / compact tabs | Job status | `StatusBadge` | canonical | no | `--status-*` |
| `TaskPriorityBadge` | Task priority chip (reuses `--status-*` tones) | Task board / compact tabs | Confidence | `StatusBadge` | canonical | no | `--status-*` |
| `KindBadge` | Kind chip (+ entity kind icon for person/org/infra) | Entity / evidence / identifier kind | Status / confidence | — | canonical | yes | `--kind-*` |
| `ClaimClassBadge` | Claim-class chip | Claims / disprove | Entity kinds | `KindBadge` | canonical | yes | `--kind-*` |
| `PatchOpBadge` | Patch op chip | Inbox patch ops | Job status | — | canonical | yes | `--status-*` |
| `EmptyState` | blank-slate / no-results / cleared — quiet chrome (no built-in dashed frame) | Queue or blank slate; dossier panel parents may add dashed border | Select-none Detail | `DetailEmpty` | canonical | yes | — |
| `EntityNode` | xyflow entity card (kind border + optional ⋯ menu) | Graph canvases (ego + case overview) | Non-graph lists | `EntityMention` | canonical | no | `--kind-*` |
| `PredicateEdge` | xyflow floating bezier + predicate label | Graph canvases | Tables / lists | — | canonical | no | `--confidence-*` |
| `GraphFlowShell` | Hydration gate + `ReactFlowProvider` | Graph canvases | Owning empty-state / “Loading…” copy | `GraphCanvasSkeleton` | canonical | no | — |
| `GraphCanvasSkeleton` | Graph hydration bones | Default `GraphFlowShell` pending | Text “Loading graph…” | — | canonical | yes | — |
| `GraphFlowCanvas` | Controlled xyflow sync + dots Background + fit-view | Ego + case overview canvases | Custom physics / layout | domain layout helpers | canonical | no | — |
| `EntityMention` | Entity name (optional dossier link) | Inline entity refs (dossier connection list) | Row-click tables / Entities Connections chips (nested `<a>` fights row nav) | static name / chip text | canonical | yes | — |
| `EditableSuggestCell` | Commit-on-pick suggest cell (uncontrolled selection — avoids snap-back to the stale saved value) | Inline table freeform+suggest | Forms | `EditableTextCell` · `FieldCombobox` | canonical | no | — |
| `EvidencePicker` | Dense multi-select Case Evidence (chips + Add) | Dossier composers | Job cite display | `EvidenceCiteChips` | **domain** (`dossier/components/evidence-picker.tsx` — not `shared/ui`) | no | — |
| `EvidenceCiteChips` | Read-only Job/proposal cite chips | Inbox decide band | Multi-select | `EvidencePicker` | **domain** (same file) | no | — |
| `ExternalUrl` | External link + icon | Evidence / preview URLs | Internal router links | `Link` | canonical | yes | — |
| `FetchErrorAlert` | Load-failure banner | Route / region fetch fail | Field validation | `FormInlineError` | canonical | yes | destructive |
| `FieldSelect` | Dense string Select — CONTROL chrome | Cap / playbook / kind pickers | Native `<select>` · enum-specific atoms | `ConfidenceSelect` · `FieldCombobox` | canonical | yes | — |
| `FieldCombobox` | Filterable string Combobox — CONTROL chrome; optional `group` → section headings | Long / searchable option lists (edge phrases) | Tiny closed enums | `FieldSelect` · `EntityCombobox` | canonical | no | — |
| `FormInlineError` | Field / form inline error | Mutation / validation errors | Load failures | `FetchErrorAlert` | canonical | yes | destructive |
| `FormInlineWarning` | Field / form inline warning | Soft confirm / evidence hints | Hard errors | `FormInlineError` | canonical | yes | warning |
| `FormSection` | Settings fieldset card (`ACCENT_CARD_SURFACE`) | Auth/settings forms · Cases cards reuse the same surface | Queue composers | `ComposerShell` | canonical | no | — |
| `IdChip` | Opaque id/hash mono chip (whole-chip copy when `copyable`; `full` skips truncate) | UUIDs / hashes | Human labels | `MiddleTruncate` · `CopyControl` | canonical | yes | chip |
| `InlineLoading` | Spinner + label region wait | In-flight Detail / panel | Full-page pending | `RoutePending` | canonical | yes | — |
| `JsonView` | Collapsible JSON tree | Structured artifacts | Syntax-highlighted dumps | `CodeBlock` | canonical | no | — |
| `LocalDateTime` | Short local datetime (`dateOnly` → calendar day) | Absolute times · task due dates | Relative “3m ago” | `RelativeTime` | canonical | no | — |
| `MetaRow` / `MetaGrid` | Key/value detail rows | Evidence / artifact meta | Form fields | `FormSection` | canonical | no | meta |
| `MiddleTruncate` | Head…tail truncate | Inside chips | General text | CSS truncate | internal | indirect | — |
| `QueueDayGroup` | Day-bucketed queue section | Chronological queues | Flat lists | — | canonical | no | — |
| `QueueFilterBar` | Search + facets + reset | Split Queue filters | Page-level filters only | `PageFilterMenu` (`shared/layout/`) | canonical | no | — |
| `QueueHeader` | Queue column title + count | Split Queue | Page titles | — | canonical | yes | — |
| `QueueShell` | Queue scrollport — sticky header + ScrollArea; body flex-fills so EmptyState can center | Jobs / Inbox / Intake Queue | Nested scroll + outer header | `SplitView` · `ScrollArea` | canonical | no | — |
| `QueueRow` (+ Title/Meta) | Queue hit-target row | Homogeneous work lists | Card stacks | — | canonical | yes | — |
| `RecentActivity` | Dashboard Activity — header + case filter + ScrollArea feed (lives in vertical resizable panel) | Dashboard Activity panel | Page-level dump / paste | `ScrollArea` · `ResizablePanelGroup` | **domain** (`dashboard/components/recent-activity.tsx`) | no | — |
| `RelativeTime` | Relative + tooltip absolute | Queue/activity times | Exact wall clock alone | `LocalDateTime` | canonical | yes | — |
| `RichTextEditor` | Plate Markdown editor (marks · headings · lists) | Dossier Summary / Notes · Edit dialog prose | Claim/identifier note fields · Plate JSON persistence | `Textarea` · `RichTextViewer` | canonical | yes | — |
| `RichTextViewer` | Read-only Plate Markdown render | Future Proof / manuscript preview | Editable prose | `RichTextEditor` | canonical | no | — |
| `RowActionsMenu` | Hover-reveal row actions | Dossier row menus | Page toolbars | DropdownMenu | canonical | yes | — |
| `SearchField` | Named search input — CONTROL chrome | Filters / toolbars | Debounced fetch inside atom | — | canonical | yes | — |
| `SectionHeaderBar` | Title + count + trailing | Sections / day groups | Page headers | `Page` header | canonical | no | — |
| `SectionLabel` | Small meta section label (normal case) | Field / meta captions · dossier section titles | Page titles | — | canonical | yes | meta |
| `QueueSkeleton` | Queue-row skeleton | Queue data-slot / RoutePending queue | Full page chrome · stack tabs | — | canonical | yes | — |
| `StackBodySkeleton` | Stack / tab data-slot bones | Case · Dossier · Dashboard · Settings Suspense | Full page / “Loading…” copy | `QueueSkeleton` | canonical | yes | — |
| `DossierBodySkeleton` | Alias of `StackBodySkeleton` | Legacy import | Prefer `StackBodySkeleton` | — | deprecated | yes | — |
| `SplitView` | Queue \| Detail split | Console surfaces | Stacked pages | — | canonical | yes | — |
| `StatusDot` | Lifecycle color dot | Live job rows | Full status label | `StatusBadge` | canonical | yes | `--status-*` |
| `TabCount` | Count pill on tabs / last crumb | Tab labels · `PageHeader count=` | Queue headers · `/ N entities` copy | `QueueHeader` count | canonical | no | — |
| `TimelineSpine` / `TimelineDot` | Vertical timeline rail | Events / questions | Flat lists | — | canonical | yes | — |
| `Timestamp` / `WithTooltip` | Instant + tooltip wrapper | Time surfaces / dense hits | Bare titles | — | canonical | yes | — |
| `CapabilityLabel` | Cap id → catalog title | Jobs / Inbox / Intake / Dashboard | Raw ids in UI | — | canonical | no | — |
| `DataTable` (+ kit) | TanStack table shell (dense: `text-xs` · `th` h-8 · `td` py-1 · row h-10). `table-fixed` + `<colgroup>` from each column’s `size` — set `size` on every column ([`UI.md`](UI.md) Table columns) | Entity / identifier tables (Entities: `entity-table.columns.tsx` + `hooks/use-entity-table.ts`; Identifiers: `identifiers-table.columns.tsx` + `hooks/use-identifiers-table.ts`; shared evidence popover: `dossier/components/identifier-evidence-cell.tsx`). Bulk-add preview is a raw `Table` + `PREVIEW_COLUMNS` colgroup, not this kit. | Queue lists · Cases card grid · Task board | `QueueRow` | canonical | **no** | — |
| `EditableTextCell` | Commit-on-blur text cell | Inline table edit | Forms | `Input` | canonical | no | — |
| `EditableSelectCell` | Commit-on-pick select cell | Inline table enum edit | Forms | `Select` | canonical | no | — |
| `DataTableAddRow` / `TableComposerInput` | Dashed append-row create chrome | Entity / identifier tables | Page composers · Cases New Case dialog | `ComposerShell` | canonical | no | — |
| `vocab/*` | Exhaustive label+tone maps | All enum display | Schemas package | — | canonical | via badges | domain |

### Page chrome (`shared/layout/` — not in `wd-ui-files.mjs`)

| Piece | Purpose | Use when | Do not use when | Alternative |
| --- | --- | --- | --- | --- |
| `PageHeader` / `AppBreadcrumbs` | Sticky inset bar; trail is identity (`page-trail.ts`); `count=` + `countOn=` = `TabCount` | Every inset page | Second AppShell header; Detail slash-paths; `/ N entities` copy | Detail headers keep their own crumbs |
| `PageToolbar` | leading/center/trailing strip under `PageHeader` | Page / queue toolbars | Detail headers | `DetailHeader` |
| `PageFilterMenu` / `PageFilterChip` | Filter popover + chips | Queue / table toolbars | Search alone | `SearchField` |
| `RoutePending` | Shared `pendingComponent` (`queue` \| `stack`); trail still paints | Router pending on Queue/table pages | Stack shell-first pages | `InlineLoading` · `QueueSkeleton` · `StackBodySkeleton` |
| `RouteError` | Shared `errorComponent` | Route error boundary | Inline field errors | `FetchErrorAlert` |

---

## Vocabulary layer

Canonical unions: [`packages/schemas/src/vocab.ts`](../../../packages/schemas/src/vocab.ts) · patch: [`patch.ts`](../../../packages/schemas/src/patch.ts).

**Label ownership:** display labels live in `apps/web/src/shared/ui/vocab/`. `packages/schemas` stays free of UI. CLI emits raw enums.

| Union | Display | Notes |
| --- | --- | --- |
| `ConfidenceTier` | `ConfidenceBadge` + `CONFIDENCE_*` | No `probable` |
| `JobStatus` / `ProposalStatus` / `RetractKind` / `IdentifierStatus` | `StatusBadge` / `StatusDot` | Shared `DisplayStatus` |
| `TaskStatus` / `TaskPriority` | `TaskStatusBadge` / `TaskPriorityBadge` | Tone-map onto existing `--status-*` |
| `EntityKind` / `EvidenceKind` / `IdentifierType` / `ClaimClass` | `KindBadge` / `ClaimClassBadge` | Schema-typed only; entity kinds include icon in badge |
| `EdgePredicate` | `predicateLabel` / `edgePhraseOptions` (+ `group`); `preferredEdgePhrase` / `clampEdgePhrase` | Exhaustive Record; inverses = display only (`inverseLabel`); Combobox groups from schema `EDGE_PREDICATE_GROUPS` |
| `PatchOp` | `PatchOpBadge` + `PATCH_RESOURCE_META` | Domain tones |
| Capability id | `CapabilityLabel` / `capabilityLabel` | Catalog title |

Fictional tokens (`probable`, `active`/`dormant`/`merged`, vault kinds, `--severity-*`) purged from types + CSS.

---

## Lifecycle contract (aligned)

| Rule | Implementation |
| --- | --- |
| Static shell never skeleton | `RoutePending` = `Page` + `PageHeader` + region `QueueSkeleton` (queue) or omit pending on thin stack loaders |
| Detail fetch wait | `InlineLoading` (Jobs) — never `DetailEmpty` |
| Stack tab / panel first load | `ActiveTabBody` (+ `SuspenseTabBody`) → `StackBodySkeleton` — never “Loading…” copy; conditional unmount (not React `<Activity>`) for heavy canvases |
| Dashboard live data | `useLiveEvents` on Dashboard for jobs + proposals + tasks |
| Mutation errors | Prefer `FormInlineError` **or** toast — not both (Entities Connections popover: inline; success may still toast) |
| Load failures | `FetchErrorAlert` (+ `meta.silentError` when inline) |
| Empties | `EmptyState` / `DetailEmpty` — not raw shadcn `Empty` in domains |

---

## Enforcement

`scripts/ds-ban-check.mjs` enforces:

- Bidirectional `wd-ui-files.mjs` ↔ `shared/ui` (excl. `shadcn/` and `__tests__/`)
- Required `/ui` fixture atoms
- Freestyle palette across all `src/`
- Opaque-id `.slice` across all domains
- Fictional vocab literals
- `COMPONENTS.md` present

Stop hook (`.cursor/hooks/stop-gate.mjs`) lint-checks files changed this turn and runs `ds:ban` when web UI paths are dirty; pre-push owns the full typecheck.

New atoms: `node scripts/new-atom-checklist.mjs <Name> <file>`.
