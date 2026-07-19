# SwarmForge active data-layer scope

## Current authority

The active specification cycles are the interactive directional Flow graph review
checkpoint and the focused canonical authoring and layered effective-schema
checkpoint. Their contracts are:

- `features/data-layer-directional-flow-specification-graph.feature`
- `features/data-layer-directional-flow-specification-graph-runtime.feature`
- `features/data-layer-canonical-shared-profile-schema-authoring.feature`
- `features/data-layer-canonical-shared-profile-schema-authoring-runtime.feature`
- `features/data-layer-layered-schema-constraints.feature`
- `features/data-layer-layered-schema-constraints-runtime.feature`

The correction program for the four schema contracts is
`docs/data-layer-canonical-schema-authoring-correction-program-R01.md`.

The user-approved canonical-authoring and layered-schema cycles are later authority
than the earlier graph-only scope reduction. They supersede that reduction only for
behavior named by the four schema contracts above. Agents must not discard, reject,
or classify these cycles as inactive because of the earlier reduction.

The checkpoint covers human Page and Event selectors, context-setting and
interaction occurrences, expected-next/alternative/parallel/merge relationships,
pointer and keyboard positioning, synchronized outline editing, stable references,
persistence/reload, primary main-workspace ownership of the graph and outline,
selection-driven contextual Inspector editing, Page Group-defined lanes, Page-owned
context-event bindings, Event-owned reusable schemas for interaction and context
events, and the explicit boundary that payload validation is independent while
journey expectations remain manual. Occurrences inside grouped Page frames persist
stable Page Group, Page, context-binding, and Event references rather than hardcoded
lane names or editable global Event roles. Event occurrences cannot move across Page
or Page Group containment boundaries. Generic Page entry frames may instead be placed
in an explicit ungrouped region outside the named Flow lanes; they persist Page and
context-binding references without inventing Page Group membership. Any retained
executable-step authoring is an explicitly separate Advanced function and does not
duplicate or replace documentary graph authoring.

The canonical authoring checkpoint replaces the current lightweight requirements
grid, structured draft, and path-constraint overlay as competing editable schema
models. Shared Profiles own one canonical revisioned property tree. Builder and side
panel use the same complete editor core, including structural nested authoring,
typed properties, conditional presence, allowed values, rich rules, documentation,
examples, nested All/Any/Not predicate building, revision comparison, and
synchronized Tree and Table views. Existing
profile data migrates atomically without loss. Command-scoped patches, base
revisions, and subscriptions prevent stale whole-profile overwrites.

The layered schema checkpoint uses that same property and rule model for Shared
Profile, Event, Page Group, Page, Flow Page-instance, and Event-occurrence
contributions. Contributor kind changes contextual applicability and provenance,
not authoring capabilities. Page and Event branches compose for a contained Event
occurrence; incompatible parallel rules block until explicitly resolved. The
checkpoint supports automatic applicability, manual assignment, or explicit
Documentation-only activation and includes only the effective-schema developer
export for a selected context.

The cycle requires named integration with the existing assignment resolver and
per-Event validator plus Flow selection restoration. These requirements are not a
general Assignment or resolver redesign. Project-wide documentation export,
fixtures, coverage, preflight, release, Live, temporal Flow execution, and
cross-surface concurrency beyond the canonical schema editor are not active work.
Agent role-playing without source knowledge and facilitated Windows usability are
not acceptance gates. A future slice requires product-owner review, a new approved
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

Use the task-specific verification pack. Do not estimate or execute either checkpoint
from every command reached through the schema or shell dependency graph. The Flow
graph checkpoint sequence is exactly:

```sh
node scripts/run-focused-acceptance.mjs --pack flow_graph
node scripts/package.mjs
```

The layered effective-schema checkpoint sequence is exactly:

```sh
node scripts/run-focused-acceptance.mjs --pack layered_schema
node scripts/package.mjs
```

The `layered_schema` pack must register all four canonical-authoring and layered-
schema feature contracts and their focused production evidence. Adding the new
contracts does not authorize extra checkpoint commands.

Each pack command performs its registered type/build, focused unit tests, installed
browser adapter, Gherkin generation, and focused runtime acceptance. Pack dependencies
must be declared in the registry rather than invoked as extra commands. The package
command consumes that already-built `dist`; `npm run package` is not part of either
sequence because it rebuilds.

For local diagnosis, `npm run typecheck`, `npm run build`,
`node test/data-layer-flow-graph-test.mjs`, and
`node test/data-layer-flow-graph-persistence-test.mjs` are optional developer
alternatives, not additional checkpoint steps. `schemas`, `shell`, full browser
matrices, full acceptance, and full regression are not checkpoint gates. They and
archived feature packs require explicit direction.
