# Verification throughput and technical-debt backlog R01

Status: durable planning backlog; not an implementation handoff

Prepared: 2026-08-06

Audit baseline: `925efd0b9880f69c00c91966c10c92ce95c2578c`

## Purpose and authority

This document records the user-approved findings and recommendations from the
repository-wide development-throughput review. It is the durable pickup point for
a new specifier. It does not change externally visible product behavior, alter an
active feature contract, authorize removal of verification evidence, or notify a
coder.

Before handing any backlog item to a coder, the specifier must:

1. re-read `swarmforge/constitution.prompt`, the recursively referenced project
   rules, `swarmforge/roles/specifier.prompt`, and
   `docs/swarmforge-active-scope.md` from current `master`;
2. confirm that the measurements below still describe the current repository;
3. turn one bounded backlog item into deterministic behavior and acceptance
   criteria, updating Gherkin only when the item changes a feature contract;
4. conserve every applicable unit, property, browser-observation, acceptance, and
   checkpoint evidence leaf, or document an exact replacement mapping; and
5. obtain the user's explicit approval before committing or sending the normal
   file-based coder handoff.

This backlog is subordinate to later user-approved specifications and to the
active-scope lineage rules. A future implementation may refine the proposed
mechanism, but it must satisfy the outcomes and conservation constraints recorded
here.

## Delivery progress

- VTD-001 completed the normal coder, refactorer, and architect chain and merged at
  `45731650a2a5044da04dd7f0d3b94b6dde34b36f`.
- VTD-002 completed the normal coder, refactorer, and architect chain and merged at
  `68c8f6369f024fae55bec19ec37011ad786dbfd9`.
- VTD-013 completed the normal coder, refactorer, and architect chain and merged at
  `c18f305bdba76a280a5bcf24efbbc744cef1950e`.
- VTD-003 completed the normal coder, refactorer, and architect chain and merged at
  `7aaab0458cb2cd793bc10a28e4ec58a9db3d4ccc`.
- The `project_management` VTD-004 slice completed the normal coder, refactorer,
  and architect chain and merged at
  `acfdf39d8d562c321ab8a168f276fb55ad024acf`.
- The `durable_project_repository` presentation slice completed the normal coder,
  refactorer, and architect chain and merged at
  `82e704bdc88eb7394624d907336ef0e6d08b828b`.
- The `event-library` review-presentation slice completed the normal coder,
  refactorer, and architect chain and merged at
  `b54e02866f9e0c76b6fa95873ea2b6f459da3aa5`.
- The remaining `capture` and `schemas` VTD-004 pack slices and VTD-005 through
  VTD-012 remain queued and inactive.

## Executive assessment

The repository's main development bottleneck is not the raw number of tests. It is
the interaction of:

- imprecise changed-path ownership that selects unrelated dependant packs;
- a small number of long browser-observation batches;
- oversized production and browser-fixture composition roots;
- ad hoc browser readiness and polling;
- incomplete, worktree-local, and environment-mixed timing history; and
- a throughput estimator that understates indivisible critical-path work.

The inexpensive leaves should be preserved. In the accepted timing ledger used by
the audit, median unit duration was about 34 ms, property duration about 80 ms, and
acceptance parse and generation duration about 21–22 ms. The dominant costs were
browser targets measured in tens or hundreds of seconds and changed-path fan-out.

## Evidence snapshot

The audit combined raw receipts available in the root, coder, refactorer, and
architect worktrees. This was necessary because the normal report reads only the
current worktree's `tmp/verification-receipts` directory.

- 39 receipts were eligible for the timing model.
- 144 receipts were rejected: 103 incomplete task results, 32 runtime mismatches,
  and 9 old receipt versions.
- Eligible receipts contained 20,434 passed task results.
- Build median was about 6.4 seconds.
- Browser target samples were sparse for several recently split targets.
- Observation concurrency was normally 2, with at least one accepted receipt at
  observation concurrency 1.

These figures are diagnostic, not a canonical benchmark. Backlog items VTD-001
and VTD-002 must make them trustworthy before tighter budgets depend on them.

### Planner projection versus critical-path estimate

The existing reporter estimates a parallel stage as the sum of task durations
divided by worker count. A task is indivisible in the real bounded-worker runner,
so that calculation is optimistic when a stage contains one long task or is
imbalanced. Replaying the accepted task medians through the runner's scheduling
shape produced:

| Scope | Existing projection | Critical-path estimate |
|---|---:|---:|
| `layered_schema` exact pack | 142.1 s | 217.1 s |
| `schemas` exact pack | 75.8 s | 145.9 s |
| `flow_graph` exact pack | 36.5 s | 67.0 s |
| Representative Flow UI change | 16.1 s | 26.2 s |
| Representative shell change | 510.8 s | 544.3 s |

The corrected Flow UI estimate is consistent with an observed approximately
27-second receipt. Until VTD-001 lands, quote both modeled and observed values and
do not present the optimistic reporter projection as wall time.

### Changed-path fan-out opportunity

The following estimates show the current representative selection and the
conservative owner-pack-only ceiling if a genuinely local UI or controller path
can be proved non-propagating. Semantic models, storage formats, shared runtime
contracts, and migrations must continue to select their declared dependants.

| Owner pack | Current selection | Owner exact-pack ceiling | Potential local-path reduction |
|---|---:|---:|---:|
| `project_management` | 403.9 s / 10 packs | 36.8 s | about 91% |
| `durable_project_repository` | 342.6 s / 6 packs | 90.1 s | about 74% |
| `capture` | 204.5 s / 10 packs | 54.7 s | about 73% |
| `schemas` | 187.5 s / 6 packs | 145.9 s | about 22% before target partitioning |
| `event-library` | 85.0 s / 7 packs | 12.7 s | about 85% |

The future specifier must validate each boundary against actual consumers rather
than treating these percentages as permission to isolate an entire pack.

### Browser topology findings

- The 46 logical `schemas` side-panel observations already execute as one
  compatible browser-observation task. `capture` has one five-target batch and
  `defects` one nine-target batch. Creating one Chrome launch per logical target
  would be a regression.
- `schemas`, `capture`, `defects`, and `event-library` each also run a small shared
  browser-pack smoke adapter. Its median cost was about 3.6–3.7 seconds.
- The four layered canonical-editor targets execute in one browser session, but
  their combined batch median was about 203 seconds.
- Individual layered target medians were approximately 92 seconds for canonical,
  46 seconds for rules, 44 seconds for the general editor, and 19 seconds for
  policy.
- `FLOW_GRAPH_EXAMPLES_TARGET` had three eligible samples, a median near 10.8
  seconds, and p90 near 24.3 seconds against a 12.891-second limit. The outlier
  appeared under a broader loaded run and must be characterized rather than hidden
  by widening the budget.

### Structural debt findings

- `src/side-panel.ts` is about 493 KB and 6,536 lines, with 113 import declarations,
  257 top-level functions, and roughly 300 event-listener registrations.
- `test/side-panel-component-layout-runtime-test.mjs` is about 1.03 MB and 7,777
  lines, with 76 mutable top-level observation variables and roughly 124 embedded
  runtime or script definitions. It is shared across schema, capture, and defect
  evidence.
- `test/support/layered-schema-workflows.mjs` is about 443 KB and encodes very long
  browser programs as JavaScript strings.
- The inspected layered browser files contain 137 `setTimeout` references,
  combining legitimate protocol deadlines with fixed pauses and repeated polling.
- `verification/packs.json` is about 184 KB and 2,261 lines;
  `scripts/verification-packs.mjs` is 1,318 lines; and
  `test/verification-process-contract-test.mjs` is 2,840 lines.
- Flow is the only pack that currently declares its acceptance handler isolated.
  Other handler isolation must be audited from actual step consumers rather than
  inferred from pack ownership.
- `test/support/branding-workflow-targets.mjs` and
  `test/support/layered-schema-parity-runtime.mjs` are tracked but have no importer
  or registry reference. Because undeclared `test/support/` paths fall through
  shell ownership, a change to either currently selects every runnable pack.

## Invariants for every backlog item

1. No item may be completed by deleting active tests, features, observations,
   handlers, mutation evidence, or product capabilities.
2. Exact-pack and terminal verification must retain all applicable assertion
   leaves exactly once. Moving a leaf requires an explicit before/after mapping.
3. Inner-loop selection may be narrower only when ownership, behavior, and
   evidence declarations prove that unrelated dependants cannot observe the
   change.
4. Shared kernel changes such as Chrome lifecycle, artifact identity, planner
   semantics, or acceptance runtime may remain deliberately broad.
5. Browser process batching and changed-path targeting are separate concerns. A
   source program may stay batched in terminal verification while a local change
   selects only the logical targets that cover its boundary.
6. A performance budget may become tighter after representative samples. It may
   not be widened merely to make a regression green.
7. Product refactors must preserve public behavior, durable bytes, migration,
   Undo, accessibility, and active feature authority unless the user separately
   approves a behavior change.
8. The final terminal checkpoint remains role- and task-scoped under the current
   active-scope rules. This backlog does not authorize broad regression runs by a
   specifier.

## Backlog index

Sizes are relative implementation slices for planning, not delivery promises.
Large items must be split into independently reviewable descendants.

| Id | Priority | Size | Outcome | Principal dependency |
|---|---|---|---|---|
| VTD-001 | P0 | M | Correct critical-path estimates | None |
| VTD-002 | P0 | M | Canonical, environment-aware timing ledger | None |
| VTD-003 | P1 | M | Representative budgets for every pack | VTD-001, VTD-002 |
| VTD-004 | P1 | L, one pack per slice | Precise high-fan-out impact boundaries | VTD-001 |
| VTD-005 | P1 | M | Layered editor target partitioning | VTD-001, VTD-007 preferred |
| VTD-006 | P1/P2 | L, domain slices | Modular side-panel browser program | VTD-007 preferred |
| VTD-007 | P1 | M | Shared readiness and phase timing | None |
| VTD-008 | P2 | XL, controller slices | Decomposed production side-panel root | VTD-004 |
| VTD-009 | P1 | S–M | Exact shell/helper ownership | None |
| VTD-010 | P3 | S per pack | Fewer redundant Chrome launches | VTD-006 preferred |
| VTD-011 | P2 | M | Measured terminal shard balance | VTD-001, VTD-002 |
| VTD-012 | P2 | L, module slices | Modular registry and planner | VTD-004, VTD-005 |
| VTD-013 | P1 | S–M | Stable Flow examples timing | VTD-002, VTD-007 |

## Backlog

### VTD-001 — Correct throughput critical-path estimation

Priority: P0

Problem:

`parallelMilliseconds` divides total duration by concurrency. The actual runner
starts indivisible tasks on bounded workers in array order, so one 203-second task
cannot become 101.5 seconds merely because observation concurrency is two. Focused
task compositions without an exact task receipt also fall back to the overall
browser-observation stage median even when per-target timings exist.

Required outcome:

- Estimate bounded stages with the same scheduling semantics as
  `executeAcceptancePlan`.
- An empty stage costs zero; one task costs its complete estimated duration.
- Multiple tasks are assigned to workers deterministically in execution order and
  the stage estimate is the longest worker load.
- An exact task receipt is preferred when available.
- A browser-observation task without an exact receipt derives its estimate from
  its logical targets plus measured or explicitly modeled session overhead; it
  must not silently use a few-second generic stage median for a known 92-second
  target.
- Reports identify whether a row uses exact task samples, composed target samples,
  or bootstrap fallback.

Acceptance criteria:

- A process-contract fixture containing one 200-second observation task and
  concurrency two reports 200 seconds, not 100 seconds.
- An uneven `[200, 40, 40]` observation fixture reports the deterministic bounded
  worker critical path.
- A previously unseen single-target task uses the target timing fixture.
- Existing Flow representative timing continues to satisfy its 35-second budget
  using the corrected estimate.
- Performance-budget tests demonstrate that a row which only passed because of
  arithmetic division now fails.

Dependencies: none.

Expected effect: trustworthy prioritization and guardrails; no direct runtime
reduction.

Handover notes: implementation belongs primarily in
`scripts/report-verification-throughput.mjs` and its process-contract tests. Do not
change runner scheduling in this item.

### VTD-002 — Create a canonical timing ledger and environment classes

Priority: P0

Problem:

Receipts are worktree-local, accepted samples with different build identities and
observation concurrency are pooled, and rejected crash or legacy receipts dominate
the directories. A local report can therefore miss a regression visible elsewhere
or mix focused and loaded measurements into one p90.

Required outcome:

- Define one repository-level accepted-receipt index or reproducible aggregation
  command that includes all explicitly supplied worktree/CI receipt sources.
- Preserve raw receipt immutability and artifact/toolchain identity checks.
- Partition timing statistics by an explicit environment class including runtime,
  platform, normal versus loaded execution, concurrency, and observation
  concurrency.
- Show accepted, rejected, and rejection-reason counts without allowing rejected
  receipts into timing statistics.
- Archive or garbage-collect rejected/incomplete local receipts through a safe,
  explicit operation; never silently delete evidence.
- Require a configurable minimum independent sample count, recommended five,
  before a target or pack becomes non-provisional.
- Make the report's receipt scope and environment class visible in machine-readable
  and human output.

Acceptance criteria:

- Fixtures from two worktrees aggregate deterministically when both are supplied.
- Focused and loaded samples do not share one percentile unless the caller
  explicitly requests that comparison.
- Runtime-mismatched and incomplete receipts remain counted but ineligible.
- A three-sample target is reported provisional.
- The Flow examples loaded outlier is visible in the appropriate environment
  class rather than disappearing from a worktree-local report.

Dependencies: VTD-001 is preferred but not required for receipt ingestion.

Expected effect: prevents false confidence and repeated manual receipt archaeology;
no guaranteed direct runtime reduction.

### VTD-003 — Replace permissive bootstrap budgets with representative budgets

Priority: P1

Problem:

The default exact-pack limit is 1,200 seconds, default changed-path fan-out is all
20 packs, and default browser-target p90 is 120 seconds. Only a small subset of
packs has a representative changed-path duration budget. Most layered budgets are
provisional and permit approximately two-times regression.

Required outcome:

- Add an exact owned `representativeChangedPath` for every runnable pack.
- Prefer a common, locally scoped change rather than a directory prefix or the
  first source entry.
- Add pack-specific changed-path duration and fan-out budgets after VTD-001 and
  VTD-002 provide comparable samples.
- Promote target budgets from provisional only after the minimum sample count.
- Use a normal tolerance near 1.2 unless measured variance justifies another
  documented value.
- Retain a separate conservative class for genuinely global infrastructure.

Acceptance criteria:

- Throughput reporting contains a deliberate representative path for every pack.
- No pack silently relies on fan-out 20 as its permanent success criterion.
- A fixture proves a representative-path regression fails with the selected pack
  identities and critical-path diagnostic.
- Layered targets no longer retain tolerance 2 solely because measurements were
  missing.

Dependencies: VTD-001 and VTD-002.

Expected effect: prevents renewed fan-out and target-duration regressions.

### VTD-004 — Add precise impact boundaries to high-fan-out packs

Priority: P1

Candidate packs:

- `project_management`
- `durable_project_repository`
- `capture`
- `schemas`
- `event-library`

Problem:

These packs have no source impact boundaries. A changed source path therefore
selects the owner and broad dependant closure, even when the change is confined to
an established UI projection.

Required outcome:

- Inventory each source path as core/semantic, application/controller,
  persistence/migration, or browser presentation.
- Declare non-propagating boundaries only for paths whose public outputs cannot be
  consumed by dependant packs.
- Keep semantic, durable, migration, public facade, and shared-contract paths
  propagating.
- Map each boundary to exact unit, property, feature, handler, browser-target, and
  checkpoint evidence.
- Validate whether pack-owned acceptance handlers can be declared isolated; do
  not copy Flow's declaration without checking cross-pack step use.
- Add process-contract coverage for every source path and every dependant-retaining
  exception.

Candidate first slices:

- project assignment-routing and project-library UI modules;
- durable-project repository UI projection;
- capture event-feed, inspector, session-control, and workflow-focus UI modules;
- schema guided-authoring, validation-presentation, and builder UI modules; and
- event-library push-review and editor presentation modules.

Acceptance criteria:

- Every owned source path belongs to exactly one declared boundary.
- Representative UI changes select only the owner and their exact evidence.
- Representative model/storage changes retain all declared dependants.
- Renames and deletes use the historical registry safely.
- Terminal-full planning still executes every conserved leaf exactly once.

Dependencies: VTD-001 for credible time reporting; boundary work may proceed pack
by pack.

Expected effect:

For proven local paths, conservative reductions range from about 22% for schemas
before target partitioning to about 85–91% for event-library and project-management
examples. Treat the audit table as an opportunity bound, not as an acceptance
target for semantic changes.

### VTD-005 — Split the layered canonical-editor impact boundary by behavior

Priority: P1

Problem:

Every canonical-editor source path currently schedules the canonical, policy,
rules, and general editor targets together. The boundary avoids downstream packs
but still costs about 217 seconds because the combined editor browser task has a
median near 203 seconds.

Required outcome:

- Replace the single `canonical_schema_editor` source boundary with focused
  sub-boundaries for canonical document/editor integration, rule authoring,
  focused policy, and general presentation where evidence permits.
- Associate each browser observation with only the source boundaries it covers.
- Preserve a combined boundary for shared editor primitives that genuinely affect
  all four targets.
- Choose a real editor file as the layered pack's representative changed path.
- Preserve one-session batching for exact-pack and terminal execution when that is
  still faster; changed-path selection must be able to request only the relevant
  logical targets.

Acceptance criteria:

- A rule-only source change does not schedule canonical or policy targets unless a
  declared shared dependency requires them.
- A policy-only change selects the policy target and its exact feature/handler
  evidence.
- Shared editor primitive changes retain the complete editor batch.
- Core canonical model and composition changes retain downstream propagation.
- Exact and terminal plans retain all eight layered logical targets exactly once.

Dependencies: VTD-001 and preferably VTD-007.

Expected effect: a typical focused editor change should fall from about 217
seconds toward roughly 25–100 seconds depending on the target, approximately
50–85% faster. New measurements, not the current flawed fallback, set the final
budget.

### VTD-006 — Modularize the shared side-panel browser program without losing batching

Priority: P1 for maintainability; P2 for runtime

Problem:

`test/side-panel-component-layout-runtime-test.mjs` is a one-megabyte cross-domain
program shared by dozens of schema, capture, and defect observations. It creates a
large review surface, mutable global state, poor failure locality, and frequent
merge-conflict risk. Its logical observations are already process-batched, so
simply launching them separately would increase startup cost.

Required outcome:

- Extract a small browser-session kernel and declarative target registry.
- Move schema, capture, defect, shell-containment, and other domain fixtures into
  focused modules with explicit setup, observation, and cleanup interfaces.
- Load only the modules required by the selected logical targets.
- Preserve compatible multi-target execution in one Chrome process for exact and
  terminal plans.
- Eliminate mutable cross-target globals or reset them explicitly at target
  boundaries.
- Emit target-specific phase and failure diagnostics.

Acceptance criteria:

- Existing observation identifiers and assertion leaves have a complete
  before/after mapping.
- `schemas` still uses one compatible side-panel observation process in its exact
  plan, as do the existing capture and defect batches.
- A focused target does not initialize unrelated domain fixtures.
- Running targets in a different compatible order cannot change their result.
- Failure output identifies target, phase, readiness condition, and last observed
  state.

Dependencies: VTD-007 provides the preferred readiness API.

Expected effect: substantially lower change and diagnosis cost; runtime improvement
depends on how much unrelated fixture initialization can be avoided.

### VTD-007 — Standardize browser readiness, polling, and phase timing

Priority: P1

Problem:

Browser programs use many local `pause`, `wait`, and retry loops with inconsistent
deadlines. Fixed delays make fast machines wait unnecessarily and loaded machines
flake without explaining the last unmet condition. Long injected strings make
syntax and stack diagnostics worse.

Required outcome:

- Provide a shared predicate-based readiness helper with a monotonic deadline.
- Require target id, phase name, predicate description, poll interval, and a
  bounded diagnostic snapshot provider.
- Support a stability interval when a condition must remain true, not merely appear
  once.
- Distinguish protocol/process deadlines from product-state readiness.
- Record setup, navigation, fixture, interaction, persistence, assertion, and
  cleanup phase timings where applicable.
- Replace large injected expression strings with importable browser-side fixture
  modules or another syntax-checked mechanism where practical.
- Retain explicit fixed delays only when elapsed time or animation is itself under
  test, with a reason adjacent to the delay.

Acceptance criteria:

- A timed-out readiness check reports target, phase, predicate, elapsed time, and
  last state.
- A state that settles quickly does not wait for a fixed worst-case delay.
- A transiently true state can be required to remain stable.
- Layered schema, Flow, and side-panel shared fixtures use the same API.
- Browser lifecycle termination and Chrome-debug-port deadlines remain bounded and
  independently tested.

Dependencies: none; adopt incrementally.

Expected effect: lower flake/retry time and faster diagnosis. Phase measurements
also identify whether fixture construction, navigation, persistence, or assertions
dominate each slow target.

### VTD-008 — Decompose the production side-panel composition root

Priority: P2, incremental

Problem:

`src/side-panel.ts` coordinates most product domains in one 6,536-line module.
This raises cognitive load and makes source ownership, runtime isolation, and
precise verification boundaries harder to prove.

Required outcome:

- Keep a small application bootstrap that creates shared platform services and
  mounts feature controllers.
- Extract feature controllers with explicit mount, render/update, event binding,
  and dispose contracts.
- Make controller dependencies explicit rather than importing broad domain
  surfaces through the composition root.
- Align controllers with the impact boundaries from VTD-004.
- Move code without changing product behavior or durable data first; behavior
  changes require a separate approved specification.

Candidate extraction order:

1. utility shell, command palette, and hotkeys;
2. observation target and live-session controls;
3. event library and defect reporting;
4. schema and specification authoring; and
5. durable project and Flow workspace coordination.

Acceptance criteria:

- Extracted controllers can be mounted and disposed independently in focused unit
  tests.
- Event listeners and subscriptions have one documented owner and are removed on
  disposal.
- The bootstrap no longer contains domain editing logic.
- Existing active browser and acceptance leaves remain conserved.
- Changed-path planning selects the controller's proven pack boundary rather than
  broad shell or downstream scope.

Dependencies: VTD-004 should establish ownership vocabulary first. VTD-006 can
provide focused browser fixtures during extraction.

Expected effect: lower implementation and review time, fewer conflicts, and
smaller blast radius. Do not claim a direct wall-time reduction until measured.

### VTD-009 — Tighten shell and verification-helper ownership

Priority: P1

Problem:

The shell pack owns broad `test/support/`, scripts, documentation, acceptance, and
platform paths. Shared harness and headless-Chrome changes correctly consume nearly
every pack, but an undeclared focused helper can fall through to shell and select
all runnable packs. Two tracked helpers currently appear unused and undeclared.

Required outcome:

- Classify every tracked `test/support/*.mjs` file as a declared verification
  helper with exact consumers, a directly owned executable leaf, or dead code.
- Integrate or remove the two unreferenced helpers only after confirming no active
  contract or pending lineage requires them.
- Split genuinely global browser lifecycle and harness kernels from focused target
  fixtures.
- Keep all-pack selection for changes to the true shared kernel.
- Add a registry contract that rejects an undeclared support helper rather than
  silently assigning it broad shell fan-out.
- Review broad shell production paths such as active-page integration for stable
  presentation versus platform/runtime boundaries.

Acceptance criteria:

- Every tracked support helper has at least one declared consumer or explicit
  executable ownership.
- A new undeclared helper fails registry validation.
- Changing a layered-only helper selects `layered_schema`; changing
  `headless-chrome.mjs` retains all declared consumers.
- Dead helper removal, if approved, updates all inventories and proves that it
  supplied no active evidence leaf.

Dependencies: VTD-004 patterns are useful but not required.

Expected effect: prevents accidental all-pack runs for focused test-fixture edits.

### VTD-010 — Consolidate duplicate browser smoke launches where evidence permits

Priority: P3

Problem:

Several packs run both a small shared-harness smoke adapter and one already-batched
observation process. The smoke adapter adds approximately 3.6–3.7 seconds per
exact pack and another browser lifecycle boundary.

Required outcome:

- Identify the unique evidence leaves supplied by each smoke adapter.
- If those leaves can execute in an existing compatible observation process,
  attach them explicitly and remove only the redundant launch.
- Retain the separate adapter when it verifies a distinct installed integration or
  failure mode that cannot share the observation environment.

Acceptance criteria:

- Before/after plans show identical evidence leaves and one fewer launch for each
  consolidated pack.
- Failure identity remains attributable to the original smoke behavior.
- Exact and terminal execution do not duplicate the moved leaf.
- No observation batch becomes state-coupled or order-dependent.

Dependencies: VTD-006 may make consolidation simpler.

Expected effect: about 3.6–3.7 seconds per affected exact pack. This is a small
absolute optimization and must not precede larger fan-out work.

### VTD-011 — Balance terminal CI using measured critical-path weights

Priority: P2

Problem:

The current four-lane assignment uses bootstrap pack weights rather than accepted
critical-path measurements. The existing report considered approximately
`88/200/130/115` seconds balanced under a 1.75 max-to-average threshold. Corrected
critical-path estimates were approximately `160/245/171/124` seconds; the slowest
lane is nearly twice the fastest.

Required outcome:

- Derive shard weights from the same corrected timing model as VTD-001, with a
  documented bootstrap fallback.
- Account for indivisible long observation batches rather than only pack leaf
  counts.
- Preserve deterministic assignment for the same registry and timing snapshot.
- Rebalance before tightening the maximum-to-average threshold toward 1.25–1.35.
- Keep one lane-local build in each isolated CI runner unless infrastructure is
  explicitly changed and artifact identity remains safe.

Acceptance criteria:

- A synthetic heavy indivisible pack is not placed as though its logical target
  count can be divided freely.
- The measured current pack set satisfies the newly chosen balance threshold after
  assignment.
- Repeated planning with the same inputs produces identical lanes.
- Every terminal pack and evidence leaf appears in exactly one lane.

Dependencies: VTD-001 and VTD-002.

Expected effect: reduce terminal wall time toward the average lane without
weakening coverage.

### VTD-012 — Modularize verification registry and planner infrastructure

Priority: P2

Problem:

The central registry, planner implementation, process-contract test, Babashka test
inventory, and long package scripts are conflict-prone and difficult to review as
single files. This makes safe ownership changes slower and increases the chance of
manual inventory drift.

Required outcome:

- Define colocated or per-pack manifest fragments and compile them deterministically
  into the canonical `verification/packs.json` consumed by existing tools.
- Retain one canonical generated registry for historical Git planning.
- Split planner code into registry validation, ownership/impact resolution,
  dependency expansion, task construction/batching, historical change planning,
  execution, and performance modeling modules.
- Split process-contract tests along those behavioral boundaries.
- Replace duplicated manual JavaScript test command lists with structured test
  manifests where doing so preserves direct focused commands and the one-build
  terminal flow.
- Make generated versus hand-authored files explicit and validate regeneration
  cleanliness.

Acceptance criteria:

- Compiling manifests twice produces byte-identical canonical registry output.
- Historical registry loading continues to plan renames and deletes safely.
- Duplicate ownership, missing leaves, unknown consumers, and conflicting impact
  boundaries still fail deterministically.
- Existing focused CLI forms and terminal sharding retain their behavior.
- A pack-local change normally edits one manifest and focused tests rather than a
  184-KB shared file.

Dependencies: perform after VTD-004 and VTD-005 stabilize the desired manifest
shape; VTD-001 may extract performance modeling earlier.

Expected effect: lower technical debt, conflict rate, and review time; runtime
effect is secondary.

### VTD-013 — Characterize and stabilize the Flow examples timing regression

Priority: P1, bounded

Problem:

`FLOW_GRAPH_EXAMPLES_TARGET` has a roughly 10.8-second median but a 24.3-second p90
in the combined ledger, exceeding its 12.891-second budget. The sample count is
only three, and the slow result occurred in a broader loaded environment. The Flow
controls target remained near 31 seconds, and a representative Flow UI change
remained about 27 seconds, so a broad Flow-suite rewrite is not justified.

Required outcome:

- Collect at least five focused and five normally loaded samples with phase timing.
- Determine whether the slow phase is browser startup, fixture setup, readiness,
  example compilation, rendering, persistence, or cleanup.
- Fix load-sensitive synchronization or unnecessary work if present.
- Keep the current budget until evidence supports a tighter or differently classed
  value; do not widen it to 24 seconds merely to accept the outlier.
- Retain the current focused Flow impact boundaries and 35-second representative
  changed-path guardrail.

Acceptance criteria:

- Reports show focused and loaded distributions separately.
- Every sample includes target phase timings and environment identity.
- The target meets its approved environment-class budget with the minimum sample
  count, or the specifier records a concrete external blocker before proposing a
  budget revision.
- Flow controls, authoring, legacy, and examples assertion leaves remain unchanged.

Dependencies: VTD-002 and VTD-007.

Expected effect: remove a current source of loaded-run flake without reopening the
already improved Flow selection work.

## Recommended sequence

### Phase A — Establish measurement truth

1. VTD-001 — critical-path estimator
2. VTD-002 — canonical ledger and environment classes
3. VTD-013 — Flow examples characterization
4. VTD-003 — representative budgets

Exit condition: the repository can produce one reproducible report whose wall-time
projection is validated against observed receipts and whose provisional status is
explicit.

### Phase B — Reduce inner-loop fan-out

1. VTD-004 — impact boundaries, one pack at a time
2. VTD-005 — layered editor sub-boundaries
3. VTD-009 — helper and shell ownership

Suggested pack order: project management, event library, capture, durable
repository, schemas, then layered editor. This reaches large percentage wins early
while leaving the most complicated schema evidence mapping until the boundary
pattern is proven.

Exit condition: representative presentational changes select only proven evidence,
while semantic changes retain downstream closure.

### Phase C — Reduce browser-fixture debt and flake

1. VTD-007 — readiness and phase timing
2. VTD-006 — modular side-panel browser program
3. VTD-010 — redundant smoke launch consolidation

Exit condition: terminal batching is retained, focused targets initialize only
their fixtures, and timeout diagnostics name the unmet state.

### Phase D — Reduce product-code coupling

1. VTD-008 — incremental side-panel controller extraction

Exit condition: the composition root mounts explicit controllers and no longer
owns domain editing behavior.

### Phase E — Reduce terminal and infrastructure debt

1. VTD-011 — measured shard balancing
2. VTD-012 — registry/planner modularization

Exit condition: terminal lanes meet the chosen balance threshold and pack-local
maintenance no longer requires editing several monolithic infrastructure files.

## New-specifier pickup checklist

1. Confirm current `master` and compare it with audit baseline `925efd0b`.
2. Read the current active-scope document and identify any later verification or
   Flow/schema authority.
3. Run the locked toolchain checker once.
4. Inspect `git status`; preserve unrelated user changes.
5. Regenerate the throughput report from the currently authoritative receipt
   sources without editing raw receipts.
6. Recalculate at least the audit comparison table using indivisible bounded-task
   scheduling until VTD-001 is complete.
7. Select exactly one backlog id. Do not hand the entire program to one coder as an
   unbounded task.
8. Write its deterministic contract and evidence-conservation table.
9. Use task-scoped tests only during specification work; do not run mutation.
10. Ask the user for explicit approval before committing and sending the coder
    handoff.

## Handover summary

Start with VTD-001. The repository currently contains enough instrumentation to
expose the principal costs, but its plan-duration arithmetic can understate them by
roughly 40–90 seconds for the largest packs. Correct measurement is the dependency
for credible budgets, shard weights, and benefit reports.

After measurement truth, the fastest direct development-time wins are precise
impact boundaries and layered editor target partitioning. Preserve terminal
coverage and browser batching. The schema side-panel program already batches its
46 logical observations into one process; its needed refactor is modular source and
target-specific initialization, not 46 independent Chrome launches.

The Flow editor is no longer the leading general bottleneck for a simple UI change:
its representative path is about 27 seconds and remains under the 35-second
guardrail. The isolated Flow examples p90 regression still needs VTD-013. The
largest remaining product-code debt is the `src/side-panel.ts` composition root,
and the largest browser-fixture debt is the shared one-megabyte side-panel runtime
program.

No implementation commit or verification evidence is attached to this backlog.
The next specifier must create a bounded specification and obtain user approval
before normal SwarmForge handoff.
