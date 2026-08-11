# SwarmForge active scope

This document is the compact authority and routing manifest for current
SwarmForge work. Read it before data-layer specification work and before making
handoff lineage decisions. After selecting a task, read only its named feature,
program, and verification entries.

The former 4,353-line scope is preserved in
`docs/swarmforge-active-scope-history-2026-08-11.md`. It is historical evidence,
not current authority, and must not be loaded during ordinary role startup or
used to reactivate completed, rejected, or archived work.

## Current program state

The current integrated VTD-008 implementation baseline is
`ad002047a321d58976c0d8cd5c56dde46a1389d0`.

| Program | Current state | Next authority |
|---|---|---|
| Feature-development throughput course adjustment | Approved at `2b093eec4f` | `docs/feature-development-throughput-course-adjustment-R01.md` controls the next bounded pre-approval scorecard and work order. |
| VTD-008 side-panel composition-root decomposition | Active incremental program, paused after three completed slices | The installed Hotkeys, Command Palette, and workspace-tabs slices are complete. No later controller slice is active. |
| VTD-010 duplicate browser-smoke consolidation | Open incremental program | The Event Library slice is complete at `cc2c9a01`; remaining pack slices are inactive until separately approved. |
| VTD-011 terminal shard balancing | Queued and inactive | Requires a user-approved bounded specification slice. |
| VTD-012 registry and planner modularization | Queued and inactive | Requires a user-approved bounded specification slice. |
| VTD-017 bounded isolated browser parallelism | Proposed and inactive | Course-adjusted follow-up after VTD-011 and before VTD-016; requires separate user approval and proceeds only while final-gate time remains material. |
| Product recovery lineages | Open | Resume in the order listed under **Open product recovery queue**, unless later user direction changes it. |

VTD-008 remains active as a program. Completion of the installed Hotkeys, Command
Palette, and workspace-tabs controllers completes three slices only, not VTD-008.
The completed workspace-tabs slice covers only the existing controller lifecycle
in `src/workspace-tabs-ui.ts`. It does not extract the broader utility registry or
shell DOM adapter, change workspace-navigation semantics, or activate
observation-target, live-session, or another Data Layer controller.

There is no active implementation handoff. Do not select another VTD-008
controller automatically. The next course action is the VTD-015 pre-approval
baseline, target, effort, safety trade-off, success measure, and stop condition;
obtain explicit user approval before its specification commit or coder handoff.

## Feature-development throughput authority

The program's headline outcome is completed user-visible feature slices and their
elapsed time from approved specification to accepted integration. VTD completion,
pack count, task count, file size, and lines moved are diagnostic only. A VTD slice
records an expected payoff and must be checked against later applicable feature
deliveries.

Safety remains non-negotiable. Use focused checks while a candidate is changing.
The settled final candidate runs all 20 packs with properties and the package
check. If that run fails, record and repair the exact cause, prove the repair with
focused evidence, and rerun all 20 packs on the changed candidate. Do not use the
full suite as an edit loop, and do not accept a successful full result for a tree
that later changes.

The approved final-gate speed work uses one coordinator and one deduplicated plan,
not 20 competing pack runners. It first balances existing workers through VTD-011,
then VTD-017 may add bounded browser workers only for tasks with proved profile,
port, writable-data, evidence, process-lifecycle, and cleanup isolation. A parallel
failure remains a recorded failure and cannot be retried at lower concurrency to
turn it green.

The approved enabling order after the completed workspace-tabs slice is VTD-015,
the bounded VTD-012 first slice, VTD-011, the conditional bounded VTD-017 slice,
then VTD-016 and one modest real-feature payback check. VTD-011 and VTD-017 move
ahead of VTD-016 because their final-gate savings apply to VTD-016 and nearly all
later work; VTD-016 mainly accelerates later Shell and VTD-008 changes. Each slice
must show its expected elapsed-time benefit on the next applicable slice or stop
automatic continuation for another bottleneck review.

Every enabling slice requires two visible user reviews: a pre-approval baseline,
target, expected effort, safety trade-off, and stop condition; then a settled
plain-language scorecard with actual elapsed-time breakdown, comparable timing,
full gates, invalidated passes, failures, repairs, reruns, preserved evidence,
confidence limits, and a continue/adjust/stop recommendation. Do not approve or
hand off the next enabling slice until the user reviews that scorecard and
explicitly chooses the course. A provisional benefit measured on the next slice
must close before recommending anything beyond that next slice.

The approved course adjustment controls backlog selection and measurement. Each
bounded slice still requires its own explicit user approval. It does not silently
change another role's prompt, handoff validation, verification selection, or
active evidence leaf.

## Authority order

Apply current authority in this order:

1. `swarmforge/constitution.prompt` and its articles;
2. later explicit user direction;
3. this active-scope manifest;
4. the active feature contracts and task program named here;
5. executable verification ownership in `verification/packs.json` and
   architecture ownership in `architecture/data-layer-boundaries.json`;
6. task-scoped Git verification notes and handoffs whose lineage is valid.

A later user-approved feature or correction supersedes earlier wording only for
the behavior it names. A rejected implementation rejects that candidate, not its
approved specification. Completed handoffs, role worktrees, recovery refs,
historical commits, walkthroughs, and the historical scope snapshot are not
authority unless a new user-approved specification explicitly activates them.

## Active product contracts

The following feature files are current externally visible behavior authority.
Their runtime partner is separate technology evidence, not a second product
behavior definition.

### Flow and documentation

- `features/data-layer-directional-flow-specification-graph.feature`
- `features/data-layer-directional-flow-specification-graph-runtime.feature`
- `features/data-layer-flow-table-documentation-export.feature`
- `features/data-layer-flow-table-documentation-export-runtime.feature`
- `features/data-layer-project-documentation-workspace.feature`
- `features/data-layer-project-documentation-workspace-runtime.feature`
- `features/data-layer-live-flow-guided-testing.feature`
- `features/data-layer-live-flow-guided-testing-runtime.feature`
- `features/data-layer-property-set-and-flow-section-separation.feature`
- `features/data-layer-property-set-and-flow-section-separation-runtime.feature`

### Canonical and layered schema

- `features/data-layer-canonical-shared-profile-schema-authoring.feature`
- `features/data-layer-canonical-shared-profile-schema-authoring-runtime.feature`
- `features/data-layer-layered-schema-constraints.feature`
- `features/data-layer-layered-schema-constraints-runtime.feature`
- `features/specification-studio-selective-profile-inheritance.feature`
- `features/specification-studio-selective-profile-inheritance-runtime.feature`
- `features/data-layer-page-group-structural-authoring.feature`

### Project context and durability

- `features/data-layer-project-library-and-active-context.feature`
- `features/data-layer-project-library-and-active-context-runtime.feature`
- `features/data-layer-project-portability-and-upgrade.feature`
- `features/data-layer-project-portability-and-upgrade-runtime.feature`
- `features/specification-studio-assignment-owned-routing.feature`
- `features/specification-studio-assignment-owned-routing-runtime.feature`
- `features/data-layer-project-event-transport-settings.feature`
- `features/data-layer-project-event-transport-settings-runtime.feature`
- `features/data-layer-project-assurance-severity.feature`
- `features/data-layer-project-assurance-severity-runtime.feature`
- `features/data-layer-side-panel-schema-relationship-tree.feature`
- `features/data-layer-side-panel-schema-relationship-tree-runtime.feature`
- `features/data-layer-durable-project-repository.feature`
- `features/data-layer-durable-project-repository-runtime.feature`

### Specification Studio presentation

- `features/specification-studio-choice-controls.feature`
- `features/specification-studio-choice-controls-runtime.feature`
- `features/specification-studio-technical-analyst-guidance.feature`
- `features/specification-studio-technical-analyst-guidance-runtime.feature`

Do not delete or unregister an active contract while this manifest, its program,
or verification registry still refers to it.

## Active program documents

Read only the program documents relevant to the selected task.

| Area | Current program authority |
|---|---|
| Canonical authoring and layered schema | `docs/data-layer-canonical-schema-authoring-correction-program-R01.md` |
| Canvas-first Flow workspace | `docs/data-layer-canvas-first-flow-workspace-program-R02.md` |
| Earlier Flow rationale not superseded by R02 | `docs/data-layer-canvas-first-flow-authoring-correction-program-R01.md` |
| Selected-Flow table documentation | `docs/data-layer-flow-table-documentation-export-program-R01.md` |
| Project Documentation workspace | `docs/data-layer-project-documentation-workspace-program-R01.md` |
| Operator-guided Live Flow testing | `docs/data-layer-live-flow-guided-testing-program-R01.md` |
| Project library, context, and portability | `docs/data-layer-project-management-program-R01.md` |
| Project event transport | `docs/data-layer-project-event-transport-settings-program-R01.md` |
| Project assurance severity | `docs/data-layer-project-assurance-severity-program-R01.md` |
| Side-panel schema relationship tree | `docs/data-layer-side-panel-schema-relationship-tree-program-R01.md` |
| Durable project repository | `docs/data-layer-durable-project-repository-program-R01.md` |
| Choice controls | `docs/specification-studio-choice-controls-program-R01.md` |
| Property Sets and Flow Sections | `docs/data-layer-property-set-flow-section-separation-program-R01.md` |
| Page Group structural authoring | `docs/data-layer-page-group-structural-authoring-correction-program-R01.md` |
| Technical-analyst exact copy | `docs/specification-studio-technical-analyst-copy-R01.md` |
| Generated branding | `docs/twatility-branding-merge-handover-R02.md` and `assets/brand/ARTWORK.md` |
| Verification throughput | `docs/verification-throughput-technical-debt-backlog-R01.md` |
| Feature-development throughput course adjustment | `docs/feature-development-throughput-course-adjustment-R01.md` |

## Live precedence summary

The feature contracts contain the deterministic details. These compact rules
resolve cross-program precedence and prevent older programs from being
accidentally reactivated.

### Schema and inheritance

- Every applied Shared Profile recipe is a fixed allowlist of stable property
  identities. Concepts and branches aid selection and provenance; they are not
  live subscriptions. Parent additions require explicit inclusion.
- Existing selected properties continue to receive compatible parent definition
  and rule changes where no local facet exists. Ordinary sparse local facets are
  valid overrides; genuinely incompatible structure, invariants, dependencies,
  or same-precedence rules require a decision.
- Each fresh selective-inheritance workspace starts collapsed. Starting point is
  `Start empty` or `Everything`; legacy choose-concepts or choose-properties
  recipes reopen as `Start empty` without changing their fixed membership.
- Canonical Table, Tree, focused property editing, compiler, validator, JSON
  Schema, inheritance, reload, and Undo share one property model. Concept is an
  optional property annotation and never propagates through the property tree.
- Typed literals, recursive homogeneous Array Items, optional rule conditions,
  flat All/Any conditions, Value operators, Pattern testing, and complete
  property-facet conflict routing follow the latest scenarios in the canonical
  and layered-schema contracts. Earlier narrower rule or conflict wording is
  superseded where those scenarios differ.
- Project Documentation owns operator-facing specification output. Page and
  contributor workspaces retain authoring and provenance, not competing document
  generators.

### Property Sets, Sections, and Flow

- Project-level Property Sets replace the schema-composition meaning formerly
  assigned to Page Groups. A Page owns ordered Property Set applications, and
  applicability belongs to each application.
- Flow Sections are presentation containers only. Section placement, movement,
  resizing, renaming, and removal never change schema, applicability,
  provenance, validation, Assignment targets, or relationship meaning.
- The canvas-first R02 workspace supersedes permanent entity catalogs, raw
  geometry forms, fixed zoom, stacked lanes, and permanently allocated Outline.
  The bounded canvas, Add palette, contextual actions, camera, Details, and
  on-demand Outline are current authority.
- The ordinary Flow canvas consumes the complete route rectangle beneath its
  compact toolbar; Focus Canvas consumes the complete viewport behind overlay
  controls. Required controls are immediately visible and fully contained at
  360px without horizontal toolbar discovery.
- Camera, selection, open surfaces, and navigation visibility are project-scoped
  UI state only. Pan and zoom never move canonical graph items or create project
  history.
- Flow remains documentary. Guided Live Flow testing links observations to Page
  and Event occurrence expectations through the ordinary validation and defect
  surfaces; it does not claim automatic Flow execution.

### Project, assurance, and durability

- Project management authority is limited to the project library, active
  context, Studio routing, named top-level entity collections, guarded removal,
  portability, and singleton migration. It does not reactivate archived release
  or project-foundation programs.
- Event transport settings are project-owned and portable. They govern
  observation and default push routing without reactivating archived Live,
  replay, release, or sequence programs.
- The side-panel Schema tree is relationship-derived. Repeated canonical
  references are projections, not tags or new schema ownership.
- Missing, incomplete, ambiguous, unusable, uncovered, or stale Fixture,
  Assignment, and Coverage states are warnings. Only canonical-schema,
  effective-schema, and submitted-data validation failures block operations.
- IndexedDB is the durable project repository. Ordinary Draft saves use opaque
  concurrency tokens; page Undo/Redo remains in memory; intentional Publish alone
  creates immutable production revisions.
- Supported loads admit journal-free Drafts with no `changes` member. Migration
  preserves stable identities and current publications, verifies durable
  read-back, and does not create a production revision.
- Undo and Redo serialize through the durable save queue. Reload settlement waits
  for history persistence and newly queued feed work, while a latched failed save
  blocks history without consuming an entry or changing durable state.

### Documentation, controls, and branding

- Documentation Sets and structured themes are project-owned and portable.
  Preview, rich copy, plain-text fallback, and Excel use one immutable refreshed
  snapshot, including concept filtering, ordering, headings, Site Profile
  sections, matrix rows, and validated logo data.
- Studio checkboxes represent membership, inclusion, acknowledgement,
  confirmation, and staged choices. Switches are reserved for standalone binary
  settings whose effect applies immediately; `Only defined fields` is the
  representative switch.
- The generated R02 assets registered in `assets/brand/ARTWORK.md` supersede R01
  visual-preservation statements. The split Studio masthead, corrected
  `TWAtility Belt` wordmark, packaged side-panel derivative, transparent icons,
  and common analyst pose base are current visual authority.
- Technical-analyst timing, interaction, accessibility, and exact comic copy are
  governed by the active guidance contracts and exact copy catalogue. Guidance
  never covers content, steals focus, or changes project, revision, or Undo state.

## Open product recovery queue

The following product implementation lineages remain open in this order:

1. `project-documentation-workspace`;
2. `durable-project-repository`;
3. `flow-canvas-topology-examples`.

Project-assurance severity remains active contract authority. Starting or
resuming any product recovery item requires current user selection and a new
approved specifier handoff. A later specification does not close an earlier open
lineage, and a rejected candidate does not satisfy it.

When reconstructing these tasks, start from current `master`. Reuse older task
commits only as patch references; do not merge or cherry-pick stale implementation
lineages wholesale. Preserve every current parent file outside the task-owned
implementation and evidence paths.

## Scope and lineage invariants

- Before accepting or rejecting a handoff, compare its commit with current
  `master` and read this file from the newest user-approved specification commit
  in the received lineage.
- A stale role-worktree copy cannot deactivate a later user-approved contract.
- A rejected implementation candidate does not deactivate its specification,
  correction program, verification pack, or later handoff.
- A task-local note cannot overrule a later user-approved specification commit.
- Removing an inherited file is an affirmative task change and requires current
  specification authority; it is not lineage cleanup.
- Never remove an active contract or production capability merely to exclude
  rejected ancestry. Port task-owned changes onto a clean current parent.
- Reject a candidate that deletes an active contract while this manifest, its
  program, or `verification/packs.json` still names it.
- Every Git handoff carries its exact base. Verification evidence may be
  forwarded only while the candidate tree remains unchanged.

## Review batching

For each active candidate, Refactorer and Architect complete a whole-delta audit
before returning implementation work. Findings are returned as one consolidated
inventory. If an exception prevents later checks, the report names the interrupted
phase and every unexecuted downstream phase; unexecuted work is never implied to
have passed. A known-red bounded pre-gate is returned without spending the exact
pack or package command.

## Verification-maintenance ratchet

The user approved this policy on 2026-08-11 for remaining VTD work. When an
approved change exposes a brittle verification check and the product behavior is
sound, repair that attributable check at the same task boundary while preserving
its meaningful invariant.

- Replace exact source-name, magic-text, frozen whole-task-inventory, and
  post-baseline digest assumptions with behavioral or structural coverage, or
  with accounting derived from the canonical registry plus explicit approved
  additions.
- Centralize duplicated verification-task accounting when an active slice
  encounters it. The approved task inventory is the strongest immediate
  candidate; other cleanup remains just-in-time.
- Do not add compatibility shims solely to satisfy source-shape checks, weaken
  runtime evidence, delete active assertions, change unrelated packs, or turn an
  incident repair into repository-wide cleanup.
- Keep each repair subject to VTD-014 incident causality and the active slice's
  exact verification boundary. This policy does not activate another VTD item or
  controller slice.

## Task-scoped verification

Use only the exact task pack selected below plus the package command. Do not infer
additional checkpoints from the full dependency graph. The canonical registry
still decides changed-path ownership, required consumers, target batching, and
historical rename/delete handling.

| Task area | Exact focused runner selection |
|---|---|
| Canvas-first Flow workspace | `--pack flow_graph --pack layered_schema` |
| Project Documentation | `--pack flow_export` |
| Guided Live Flow testing | `--pack live_flow_testing` |
| Canonical and layered schema | `--pack layered_schema` |
| Project management and portability | `--pack project_management` |
| Project event transport | `--pack project_event_transport` |
| Schema relationship tree | `--pack schema_relationship_tree` |
| Durable project repository | `--pack durable_project_repository` |
| Property Sets and Flow Sections | `--pack property_set_flow_sections` |
| Project assurance severity | `--pack project_assurance_severity` |
| Choice controls, analyst guidance, and generated branding | `--pack branding_polish` |

Run the selected packs with:

```sh
node scripts/run-focused-acceptance.mjs <exact-pack-selectors>
node scripts/package.mjs
```

Property tests require the explicit `--property` option. A committed handoff
checkpoint also requires `--changed-since <base>` and uses the two-step evidence
flow:

```sh
node scripts/run-focused-acceptance.mjs <exact-pack-selectors> --property \
  --changed-since <base> --prepare-evidence <task>
node scripts/verification-evidence.mjs record <printed-pending-file>
```

Do not run the terminal suite, broad regression, unrelated packs, or Gherkin
mutation unless the user explicitly authorizes that work. The package command
consumes the already validated `dist` tree and does not widen task scope.

For a new VTD-008 or VTD-010 slice, changed-path preflight and the new bounded
specification determine the exact pack set. Do not reuse a completed slice's
one-time broad delivery checkpoint as permanent fan-out authority.

## Verification throughput completion ledger

Detailed contracts, measurements, evidence-conservation tables, and future work
remain in `docs/verification-throughput-technical-debt-backlog-R01.md`. This table
is status only.

| Delivery | Integrated commit | Status |
|---|---|---|
| VTD-001 corrected critical-path estimation | `45731650a2` | Complete |
| VTD-002 canonical timing ledger | `68c8f6369f` | Complete |
| VTD-013 Flow-examples characterization | `c18f305bdb` | Complete |
| VTD-003 explicit pack and target calibration | `7aaab0458c` | Complete |
| VTD-004 project-management presentation | `acfdf39d8d` | Complete |
| VTD-004 durable-repository presentation | `82e704bdc8` | Complete |
| VTD-004 Event Library presentation | `b54e02866f` | Complete |
| VTD-004 Capture presentation | `1105e3e8b6` | Complete |
| VTD-004 Schemas presentation | `daaac105c1` | Complete |
| VTD-005 Layered editor target routing | `caad024a53` | Complete |
| VTD-009 helper and Shell ownership | `60458b958c` | Complete |
| VTD-007 browser readiness and timing | `95c79a42d6` | Complete |
| VTD-006 modular side-panel browser program | `51ef49a2f9` | Complete |
| VTD-014 unreliable-test repair gate | `4e18da3e60` | Complete; later approved closure corrections are integrated in `9808acce74` |
| VTD-010 Event Library launch consolidation | `cc2c9a01b6` | Complete slice; program remains open |
| VTD-008 installed Hotkeys controller | `9808acce74` | Complete slice; VTD-008 remains active |
| VTD-008 installed Command Palette controller | `5ec9ff34f7` | Complete slice; VTD-008 remains active |

## Historical boundaries

- The archived data-layer R01/R02/R04 and deferred Flow snapshot is anchored at
  `d346e89a4c98376b2e85ec48963c2b07af6fe3c0`. It is reference material, not
  acceptance authority.
- The R01 branding reports and `docs/twatility-branding-evidence/` are historical
  evidence. They cannot overrule active feature contracts,
  `assets/brand/ARTWORK.md`, or the R02 branding handover.
- Unmerged experiments and workspace-local walkthroughs are non-authoritative.
- The historical active-scope snapshot preserves the former narrative for audit
  and archaeology only. If it conflicts with this file or later user direction,
  this file and the later direction win.
