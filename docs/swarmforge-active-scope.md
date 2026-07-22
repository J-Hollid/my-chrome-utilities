# SwarmForge active data-layer scope

## Current authority

The active specification cycles are the interactive directional Flow graph review,
focused canonical authoring and layered effective-schema, selected-Flow
documentation export, project-management, and durable-project repository checkpoints. Their contracts are:

- `features/data-layer-directional-flow-specification-graph.feature`
- `features/data-layer-directional-flow-specification-graph-runtime.feature`
- `features/data-layer-flow-table-documentation-export.feature`
- `features/data-layer-flow-table-documentation-export-runtime.feature`
- `features/data-layer-canonical-shared-profile-schema-authoring.feature`
- `features/data-layer-canonical-shared-profile-schema-authoring-runtime.feature`
- `features/data-layer-layered-schema-constraints.feature`
- `features/data-layer-layered-schema-constraints-runtime.feature`
- `features/data-layer-project-library-and-active-context.feature`
- `features/data-layer-project-library-and-active-context-runtime.feature`
- `features/data-layer-project-portability-and-upgrade.feature`
- `features/data-layer-project-portability-and-upgrade-runtime.feature`
- `features/data-layer-durable-project-repository.feature`
- `features/data-layer-durable-project-repository-runtime.feature`

The correction program for the four schema contracts is
`docs/data-layer-canonical-schema-authoring-correction-program-R01.md`.
The correction program for the Flow graph contracts is
`docs/data-layer-canvas-first-flow-authoring-correction-program-R01.md`.
The program for selected-Flow table documentation is
`docs/data-layer-flow-table-documentation-export-program-R01.md`.
The program for project library, active context, and portability is
`docs/data-layer-project-management-program-R01.md`.
The correction program for durable project storage, page-scoped Undo/Redo, and
intentional publication revisions is
`docs/data-layer-durable-project-repository-program-R01.md`.

The user-approved canonical-authoring and layered-schema cycles are later authority
than the earlier graph-only scope reduction. They supersede that reduction only for
behavior named by the four schema contracts above. Agents must not discard, reject,
or classify these cycles as inactive because of the earlier reduction.

The project-management contracts are likewise later user-approved authority only
for the named project library, active context, Studio routing, top-level project-
entity collection lifecycle, portability, and singleton migration behavior. They
do not reactivate the archived project-foundation or release specifications.

## Scope and lineage processing invariant

Current `master` is the integration baseline for every new reconstruction. Role
worktrees are transient review state and may contain an older copy of this file.
Before any scope or ancestry decision, an agent must inspect this file from current
`master` and from the received handoff commit. A stale role-branch copy cannot
deactivate a later user-approved specification.

Rejected production implementations do not deactivate their specifications. Clean
lineage means porting only task-owned implementation changes onto current `master`;
it does not mean deleting unrelated files already present in that parent. A deleted
feature, program, pack registration, or production capability is itself a material
change and requires explicit current authority. A candidate that deletes an active
contract while retaining references to it in this file is internally invalid and
must be rejected before refactoring or architectural merge.

The following recent user-approved checkpoints are simultaneously active:

- `18996ab128` — one canonical schema editor;
- `a901f3c8be` — project library and active context;
- `18cb5a0cb1` — Flow canvas topology and schema-derived examples; and
- `01b3d50a3d` — project entity overview lifecycle.

## Bounded checkpoint feedback batching

For every active scoped candidate, Refactorer and Architect must batch findings
before returning implementation work to Coder. Refactorer performs one whole-delta
audit and reports every production, evidence, static, build, and focused-model
finding in a single inventory. Architect then performs the applicable downstream
audit and returns one consolidated blocker report for that candidate.

When the exact task pack runs, Architect reports every false evidence leaf emitted
by that run. If an exception prevents later phases from executing, the report must
name the interrupted phase, mark each downstream phase as unexecuted, and statically
audit those downstream boundaries where possible. Unexecuted work is never implied
to have passed. A known-red bounded pre-gate is returned without spending the exact
pack or package command.

This batching rule does not widen checkpoint scope or authorize broad regression,
acceptance-matrix, mutation, or unrelated package runs. Coder receives one combined
correction batch, uses targeted checks while implementing it, and returns one
descendant for the next review cycle.

The 2026-07-20 notice claiming project management was outside approved scope and
the inactive-project clauses in task 687 and task 688 were based on stale role
branches. They are superseded and must not be used. Flow candidate `b9531aa65a` is
not eligible for integration because it deletes the active project-management
program and all four active project-management feature contracts while this file
continues to name them.

## Current delivery and recovery queue

Project library, active context, and the project-entity overview lifecycle landed
together through the architect-approved `project-library-active-context` terminal
candidate and were merged to `master` at `faa1aa3a`. That merge, including its real
`project_management` pack and lifecycle evidence, is the required recovery baseline.

The following task lineages remain open and must now be recovered in this order:

1. `single-schema-editor-parity`; then
2. `durable-project-repository`; then
3. `flow-canvas-topology-examples`.

The rejected schema candidate `143cc9d337` and Flow candidate `b8432d27e7` are not
eligible because each introduced a vacuous `project_management` pack. Later coder
commits `2db9335d` and `b4d143a4` contain useful task-owned revisions, but their
lineage predates `faa1aa3a` and must not be merged, rebased, or cherry-picked as a
whole. Use them only as patch references while reconstructing each task from current
`master`. The reconstruction must retain every project-management and project-entity
source file, test, acceptance handler, browser adapter, architecture registration,
and non-vacuous pack entry now on `master`.

Recover schema parity first, run only the `layered_schema` checkpoint and package
command, and carry it through refactorer and architect to a terminal merge. Recover
the durable repository from that new merged baseline, run only the
`durable_project_repository` checkpoint and package command, and carry it through
the same terminal process. Recover Flow only from the resulting durable merged
baseline, run only the `flow_graph` checkpoint and package command, and carry it
through the same terminal process. A later specification does not replace or
deactivate an earlier task. Rejected candidates do not satisfy or close a task
lineage, and unrelated implementation branches must not be merged wholesale.

The Flow checkpoint is canvas-first. Searchable Page Group, Page, and Event catalogs,
lane selection and ordering, Page-frame insertion, Event placement, connection
ports, pointer and keyboard relationship drawing, inline relationship editing, and
the synchronized outline belong to the main workspace and remain operable with the
Inspector closed. The Inspector is optional contextual detail and owns no exclusive
documentary graph command. Earlier form-first clauses are superseded.

Only ordered Page Group references define named lanes; the empty Flow has no lanes
and there are no Context, Shipping, Payment, Merge, or other fixed fallbacks. Named
lanes are top-to-bottom horizontal bands in which Pages retain free left-to-right
and vertical branch coordinates. A Page may occupy any selected eligible membership
lane or a transient before-lanes or after-lanes edge region. Free placement clears
only the frame's placement-group reference: ordered Page Group memberships,
inheritance, and effective schema remain unchanged. Empty edge targets do not render
as permanent lane-sized groups; compact free frames sandwich the named bands only
where content exists. The Page frame itself is the Page context and may exist
without any Event. Context-setting and interaction Events use one direct Page-
contained occurrence model; role and trigger are explanatory metadata, not a
validation selector. Event occurrences retain free, including side-by-side,
coordinates inside an expanding Page frame and cannot leave that frame.

Page frames and Event occurrences both expose connection ports. Page-to-Page,
Page-to-Event, Event-to-Page, and Event-to-Event relationships persist typed stable
endpoints and their connected ports. Source-right to target-left infers
expected_next, source-top to target-bottom infers alternative, and source-bottom to
target-top infers merge.
Alternative branches and merges are included in the first canvas release; Parallel
is not a separate kind, relationship labels are optional, and every other port
pairing is invalid.
Selecting an edge exposes a Delete relationship button in its inline popover while
the Inspector is closed. The button removes only that stable relationship, marks
documentation from the changed topology stale, and offers one page-scoped Undo that
restores the same identity, ports, kind, optional label, and metadata. Labelled
buttons use the label and human endpoint names; unlabelled buttons use human
endpoint names.
An Event node's JSON example is read-only and derived from its canonical effective
occurrence schema, configured examples, and provenance; it is never a stored payload
copy. Complete, Incomplete, Invalid, and Blocked states distinguish example
readiness and deep-link exact repairs without claiming Flow execution. Graph records
persist stable Page Group, Page, Event, occurrence, relationship, and endpoint
references without a Page-context binding model.

The Flow remains documentary: pointer and keyboard positioning, topology,
optionality, conditions, and multiplicity communicate expected behavior while
per-Event payload validation remains independent and journey expectations remain
manual. Existing applicability and assignment rules resolve production Page context
from observation evidence and the observed Event; Flow role or trigger metadata does
not replace that resolver. Any retained executable-step authoring is an explicitly
separate Advanced function and does not duplicate or replace documentary graph
authoring.

The selected-Flow documentation checkpoint derives a Flow value map and Data capture
matrix from ordered graph contexts and canonical effective schemas. It reuses the
side-panel specification-table configuration and supports spreadsheet clipboard,
rich Confluence/Jira clipboard, and an offline four-sheet `.xlsx` workbook. Export
ordering and Step labels are documentary presentation only. Incomplete Draft exports
require explicit confirmation and retain Blocked or Incomplete cells, diagnostics,
and a Draft — incomplete label.

The project-management checkpoint adds a top-level Projects side-panel tab and a
production project library that may contain multiple complete projects while zero
or one stable project identity is active. Create, metadata edit, switch, Studio
routing, import, and export are project functions rather than Schema functions.
Every project-bound surface subscribes to the same active identity, pending writes
block switching, and per-project navigation prevents cross-project entity lookup.
Specification Studio opens from a project at Project overview; schema actions may
deep-link inside the owning project but do not own the workspace.

Every top-level Studio collection overview owns its type-specific Add action and
human-named Open and Remove row actions. The covered collections are Shared
Profiles, Page Groups, Pages, Events, Applicability, Flows, Fixtures, Schemas, and
Assignments. Add opens a guided project-scoped creation page in the main workspace;
Open uses the entity's dedicated workspace; Remove performs named dependency impact
review and never silently cascades. Guided empty states expose the same Add route.
The contextual Inspector contains no generic Add entity form, entity-kind selector,
or exclusive removal action. Schemas use the canonical schema model with Draft
status rather than restoring a parallel lightweight Schema-draft editor. Flow Page
instances and Event occurrences remain created within the canvas, not as top-level
collections.

The global Saved Schema Library remains usable without active project context.
Adoption safely activates the chosen project and creates one project-owned Draft
with source lineage. Versioned project export contains the complete persisted Draft
graph while excluding permissions, Live data, caches, UI state, and Undo history.
Import is staged and atomic, supports Import as new project only, remaps all project-
owned identities and internal references, preserves external lineage, and leaves the
new project inactive until explicitly opened. Existing singleton project storage
migrates once without identity or data loss.

The durable-project repository checkpoint replaces canonical project, saved-schema,
Flow graph, fixture, release, and active-project Web Storage documents with one
versioned IndexedDB repository. Because operators may create numerous projects and
large schema collections, the packaged extension requires both `storage` and
`unlimitedStorage`. Those permissions do not excuse silent failure: quota, abort,
corruption, and unavailable-repository failures remain truthful and recoverable.
Mounting is read-only unless a verified migration is required and never
unconditionally rewrites the project library.

Draft saves use opaque base tokens for stale-write protection and update only the
affected records. Tokens are not operator-facing revisions. Undo and Redo use
forward and inverse patches held only in the open project page's memory and are
accepted as lost on close, reload, or project replacement. No command, patch,
snapshot, history, or checkpoint record persists. A bulk edit remains one atomic
page-scoped Undo action. Only an intentional Publish creates the next immutable
project revision.

Legacy equal-generation divergence blocks for explicit source selection. Successful
migration verifies durable read-back, retains a checksummed recovery backup, omits
legacy Undo and Redo from active records, and only then removes migrated document
keys from Web Storage. Project library browsing uses compact metadata and loads only
the selected project route.

The canonical authoring checkpoint replaces the current lightweight requirements
grid, structured draft, path-constraint overlay, and any additional Shared Profile
or composed-schema panel form as competing editable schema models. The side panel
retains one established compact Schema editor and one grouped Schema list for saved schemas,
Shared Profiles, Page Groups, Pages, Events, Flow instances, and occurrences. A
Shared Profile is a contributor role, not a second schema type or editor. The side
panel keeps its pre-existing panel-oriented renderer; Builder and standalone
entity workspaces reproduce its complete capabilities in their wider renderer.
All surfaces use the same canonical model, property-scoped commands, and results,
including structural nested authoring, typed properties, conditional presence,
allowed values, rich rules, documentation, examples, nested All/Any/Not predicate
building, opaque Draft-token comparison, and synchronized Tree and Table views. Existing
profile data migrates atomically without loss. Command-scoped patches, base Draft
tokens, and subscriptions prevent stale whole-profile overwrites.
Canonical property search is transient UI state shared across contributor editors;
typing, caret edits, input-method composition, and clearing retain focus in the same
connected control and perform no canonical command or persistence write at desktop
or 360px widths.

Inheritance is native canonical data: stable contributor references identify
parents, sparse local facets hold overrides, and effective values and provenance are
derived in the regular panel editor, standalone workspace, compiler, and validator.
The standalone workspace must have functional parity with the pre-existing panel
editor while using its wider multi-row layout. Parity must not be implemented by
hiding the established side-panel controls and mounting the standalone/project
editor inside the side-panel form. Selecting a schema role never mounts a second
panel editor; `Reset to parents` deletes local facets rather than copying a parent
or composed snapshot.

The layered schema checkpoint uses that same property and rule model for Shared
Profile, Event, Page Group, Page, Flow Page-instance, and Event-occurrence
contributions. Contributor kind changes contextual applicability and provenance,
not authoring capabilities. Page and Event branches compose for a contained Event
occurrence; incompatible parallel rules block until explicitly resolved. The
checkpoint supports automatic applicability, manual assignment, or explicit
Documentation-only activation and includes only the effective-schema developer
export for a selected context.

A Page owns one ordered general-to-specific list of Page Group memberships. Group
member views derive from that list. Applicable groups compile in relative order, but
order cannot legalize unsafe weakening or resolve overlapping applicability. The
Page editor provides searchable add, accessible reorder, removal, provenance, and
impact review. A Flow Page frame may use any selected lane in that membership list;
its placement group is separate from membership order and lane order. Reordering
membership never moves a frame, and removing an in-use membership blocks until the
frame is moved to another eligible lane or removed.

Opening a Page or Page Group from its overview goes directly to a full
main-workspace configuration with an `Effective schema at <name>` table; the
Inspector is only an optional summary and link. The wide table keeps every
effective property visible and exposes common facets inline, with complete complex
builders expanding beneath a row. Rows distinguish inherited, local, effective,
shadowed, conflicting, and provenance values. At 360px the same model uses compact
rows and stacked detail with one vertical scroll owner and no horizontal page
scroll.

`Override here` stores only the locally changed property facets. A Page-local facet
wins an ordinary difference on that same facet after its ordered Page Group stack
and produces a non-blocking warning with shadowed-parent provenance. `Reset to
parents` deletes that sparse local contribution and recompiles from the live parent
stack; local-only properties use `Remove local property`. Adding a Page Group always
persists the Draft membership change. Uncovered illegal differences and inherited
invariants block effective-schema readiness, validation, and developer export with
direct repairs, but do not roll back the membership or hide the configuration.

The cycle requires named integration with the existing assignment resolver and
per-Event validator plus Flow selection restoration. These requirements are not a
general Assignment or resolver redesign. Top-level Fixture and Assignment overview
creation, opening, and guarded removal are active only as project-entity lifecycle;
fixture execution and resolver semantics are not. Project-wide batch documentation
export, coverage, preflight, release assurance, Live, temporal Flow execution, and
cross-surface concurrency beyond canonical Draft concurrency and durable repository
subscriptions are not active work. The minimal intentional Publish boundary above
exists only to create immutable project revisions; it does not activate the archived
preflight, review, release-gate, Live, or publication-assurance programs. Agent
role-playing without source knowledge and facilitated Windows usability are not
acceptance gates. A future slice requires product-owner review, a new approved
specification cycle, and a new file-based SwarmForge handoff.

## Archived material

Detailed full-site R01, correction R02/R04, and later Flow specifications were
removed from the active tree on 2026-07-19. Their anchor commit is an ancestor of
`master`, so it remains available in a normal full clone:

- Anchor commit: `d346e89a4c98376b2e85ec48963c2b07af6fe3c0`
- Local convenience branch: `archive/data-layer-r02-r04-specifications-2026-07-19`

That snapshot contains all 60 behavior/runtime feature files from the completed
specification work. The scope reduction retained the two graph contracts and
removed the other 58: 28 full-site R01 files, 22 correction R02/R04 files, and eight
deferred Flow-slice files, together containing 545 scenarios. The four schema
contracts now listed as current authority were added or revised by later approved
cycles; they do not reactivate the archived files. The archive also contains 11
detailed program/assessment documents and 111 schema-editor or side-panel
walkthrough artifacts. These are reference material, not acceptance authority.

The following compact manifest is a names-only, non-authoritative history locator.
Each listed stem denotes both `data-layer-<stem>.feature` and
`data-layer-<stem>-runtime.feature`; it does not reactivate or restate any archived
behavioral claim.

- R01: `atomic-project-release`, `bulk-requirement-authoring`,
  `documentation-export`, `durable-authoring-drafts`, `named-applicability`,
  `page-event-catalog`, `project-fixtures-preflight`, `project-interchange`,
  `requirement-profile-composition`, `retail-trade-decisive-workflow`,
  `specification-project-foundation`, `specification-workspace-navigation`,
  `temporal-flow-authoring`, `truthful-assignment-lifecycle`.
- R02/R04: `canonical-project-schema-drafts`,
  `contextual-specification-editors`, `effective-requirement-coverage-correction`,
  `effective-schema-compilation`, `greenfield-retail-trade-production-release`,
  `production-fixture-execution`, `specification-builder-operator-usability`,
  `staged-multiformat-bulk-authoring`, `temporal-flow-execution-correction`,
  `truthful-preflight-release-correction`, `unified-specification-evaluation`.
- Deferred Flow: `flow-cross-surface-integration`, `flow-documentation-export`,
  `flow-effective-schema-assignment`, `flow-specification-terminal-workflow`.

Recovery examples:

```sh
git show d346e89a4c98376b2e85ec48963c2b07af6fe3c0:docs/full-site-data-layer-specification-correction-program-R04.md
git worktree add --detach /tmp/data-layer-specification-archive d346e89a4c98376b2e85ec48963c2b07af6fe3c0
```

Unmerged experiments are preserved under local-only branches and must not be
merged wholesale. They will not appear in a fresh clone unless deliberately
published or otherwise exported:

- `archive/r02-page-resolver-wip-2026-07-19`
- `archive/r02-refactorer-recovery-8e9-2026-07-19`
- `archive/r02-refactorer-recovery-2026-07-19`

Completed production, unit, and property-test improvements remain on `master` as
the installed-product baseline. Their presence does not activate the archived
program. Workspace-local untracked walkthrough files are likewise non-authoritative.

## Verification boundary

Use the task-specific verification pack. Do not estimate or execute any checkpoint
from every command reached through the schema or shell dependency graph. The Flow
graph checkpoint sequence is exactly:

```sh
node scripts/run-focused-acceptance.mjs --pack flow_graph
node scripts/package.mjs
```

The selected-Flow documentation checkpoint sequence is exactly:

```sh
node scripts/run-focused-acceptance.mjs --pack flow_export
node scripts/package.mjs
```

The `flow_export` pack may register shared build dependencies from `flow_graph`, but
must contain the selected-Flow export features and their production clipboard and
workbook evidence without invoking archived project-wide documentation suites.

The layered effective-schema checkpoint sequence is exactly:

```sh
node scripts/run-focused-acceptance.mjs --pack layered_schema
node scripts/package.mjs
```

The project-management checkpoint sequence is exactly:

```sh
node scripts/run-focused-acceptance.mjs --pack project_management
node scripts/package.mjs
```

The durable-project repository checkpoint sequence is exactly:

```sh
node scripts/run-focused-acceptance.mjs --pack durable_project_repository
node scripts/package.mjs
```

The `durable_project_repository` pack must register both durable-repository
contracts and focused installed evidence for IndexedDB persistence, verified legacy
migration, required `storage` and `unlimitedStorage` permissions, record-scoped
Draft transactions, stale-write handling, page-scoped Undo/Redo, truthful repository
failures, and the intentional publication boundary. It depends on
`project_management` so revised portability and active-context contracts execute
through their existing focused pack rather than being duplicated.

The `project_management` pack must register all four project-management contracts
and focused production evidence for the project repository, side-panel Projects
tab, Specification Studio router, all nine entity collection lifecycle routes,
dependency-guarded removal, versioned serializer, import remapper, and legacy
singleton migration. It may declare canonical schema dependencies in the pack
registry but must not invoke archived project-foundation, release, or full-site
acceptance suites.

The `layered_schema` pack must register all four canonical-authoring and layered-
schema feature contracts and their focused production evidence. Adding the new
contracts does not authorize extra checkpoint commands.

Each pack command performs its registered type/build, focused unit tests, installed
browser adapter, Gherkin generation, and focused runtime acceptance. Pack dependencies
must be declared in the registry rather than invoked as extra commands. The package
command consumes that already-built `dist`; `npm run package` is not part of any
checkpoint sequence because it rebuilds.

For local diagnosis, `npm run typecheck`, `npm run build`,
`node test/data-layer-flow-graph-test.mjs`, and
`node test/data-layer-flow-graph-persistence-test.mjs` are optional developer
alternatives, not additional checkpoint steps. `schemas`, `shell`, full browser
matrices, full acceptance, and full regression are not checkpoint gates. They and
archived feature packs require explicit direction.
