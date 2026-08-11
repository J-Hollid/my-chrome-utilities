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
- The `capture` local-presentation slice completed the normal coder, refactorer,
  and architect chain and merged at
  `1105e3e8b6d72f5ea29795fa6fb786406f2ee5fb`.
- The `schemas` local-presentation slice completed the normal coder, refactorer,
  and architect chain and merged at
  `daaac105c1dd8ecf6fee5a53550c5863d943e84d`.
- VTD-005 completed the normal coder, refactorer, and architect chain and merged at
  `caad024a5366ab6c1798d7e8a62aa50c7f1e6a31`.
- VTD-009 completed the normal coder, refactorer, and architect chain and merged at
  `60458b958ccfbb59238cc7a96c573ab207de5bcc`.
- VTD-007 completed the normal coder, refactorer, and architect chain and merged at
  `95c79a42d69078c3bca7018e528f3559a1a49668`.
- VTD-006 completed the normal coder, refactorer, and architect chain and merged at
  `51ef49a2f9e3b39fb564ddde1869c9b8b2c84a8d`.
- VTD-014 completed the normal coder, refactorer, and architect chain and merged at
  `4e18da3e601dde88abe0b85071ba7319f3b81d80`.
- The bounded VTD-010 Event Library slice completed its coder, refactorer, and
  architect sequence and was integrated into `master` at
  `cc2c9a01b6c2398a35cb03731eb1fd7c2934916c`.
- The bounded VTD-008 installed Hotkeys controller slice and its required
  shared-runner closure corrections are complete in integration baseline
  `9808acce7435343f7005f44cd5346c4395dbb6b5`.
- The bounded installed Command Palette controller slice completed the normal role
  chain and is integrated at `5ec9ff34f7a97f28ae887f553c31d8d6f7a788ed`.
- The installed workspace-tabs controller slice completed the normal role chain
  and integrated at `ad002047a321d58976c0d8cd5c56dde46a1389d0`. It is the last
  automatic VTD-008 slice before the approved feature-development throughput
  course order.
- Remaining VTD-008 controllers, remaining VTD-010 pack slices, and VTD-011 through
  VTD-012 remain inactive unless the course-adjusted order explicitly selects a
  bounded descendant.

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

## Remaining-VTD verification ratchet

The user approved this durable policy on 2026-08-11. The installed Command Palette
slice exposed four incident-bound causal repairs even though its product behavior
was sound. The brittle checks duplicated frozen task inventories, compared
post-baseline task digests without recognizing approved additions, or inspected
exact source names and text. Repeating source-shape compatibility workarounds would
preserve the coupling that VTD-008 is intended to remove.

For all remaining VTD work:

- When legitimate approved work exposes an attributable brittle check, replace
  that check within the active task rather than adding source-name, magic-text, or
  frozen-inventory compatibility behavior to production code.
- Preserve the meaningful invariant with behavioral runtime coverage, structural
  module or ownership coverage, or inventory accounting derived from the canonical
  registry and explicit approved additions.
- Centralize duplicated verification-task accounting when an active slice
  encounters it. The approved verification-task inventory is the strongest
  immediate candidate because it has already failed in multiple locations.
- Keep other cleanup just-in-time. Do not launch a repository-wide cleanup, touch
  unrelated packs, weaken runtime evidence, remove active assertions, or spend
  unrelated verification from one incident.
- Continue to use VTD-014 incident causality, failing-leaf repair loops, and the
  active slice's exact settled checkpoint. A ratchet repair permanently reduces
  verification coupling but does not activate another backlog item or controller
  slice.

## Feature-development throughput course adjustment

The user directed a course correction on 2026-08-11. The proposed detailed
authority is `docs/feature-development-throughput-course-adjustment-R01.md`.

The headline measure becomes completed user-visible feature slices and elapsed
time from specification approval to accepted integration. Task count, pack count,
lines moved, and modeled time remain diagnostic only. Behavior-preserving VTD
slices do not increment the feature count; their claimed payoff must be checked on
later applicable feature delivery.

The final safety promise remains all 20 packs with properties plus packaging on the
settled candidate. If that run fails, repair the exact cause with focused evidence
and rerun all 20 packs on the changed candidate. The course correction targets
avoidable successful runs on trees that later roles change, overly broad focused
packs, verification-process coupling, and slow final-gate implementation—not the
fresh post-repair full run.

Reliable parallel execution is part of the course correction. It means one
coordinator builds one candidate, creates one deduplicated plan, and assigns only
independent tasks to bounded isolated workers. It does not mean starting 20
competing pack runners. Every evidence leaf remains required in the combined
result, and tasks without proved writable-state and resource isolation remain
serial.

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
| VTD-011 | P1 | M | Measured terminal shard balance | VTD-001, VTD-002 |
| VTD-012 | P0 first slice, P2 remainder | L, module slices | Separate verification-process work, then modularize registry and planner | VTD-004, VTD-005 |
| VTD-013 | P1 | S–M | Stable Flow examples timing | VTD-002, VTD-007 |
| VTD-014 | P1 | M | Unreliable tests must be repaired, not retried away | VTD-002, VTD-007 |
| VTD-015 | P0 | M | Review changing candidates before one final-tree all-20 gate | VTD-014 |
| VTD-016 | P0 | M | Partition Shell product evidence for a faster inner loop | VTD-004, VTD-006 |
| VTD-017 | P1 | M, incremental | Bounded isolated parallel browser execution | VTD-001, VTD-002, VTD-007, VTD-011 |

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

Approved first slice (2026-08-10): extract only the installed Hotkeys controller
from `src/side-panel.ts`. The root currently owns Hotkeys storage creation, eight DOM
lookups, active keymap and pending-sequence state, editor construction, keymap file
operations, captured key dispatch, runtime-message focus, listener binding, render,
and initial focus. Command Palette, utility-shell, and Data Layer controller
extraction remain separate later slices.

The candidate exposes the installed controller through
`src/utilities/hotkeys/index.ts` with explicit mount, render, focus, and idempotent
dispose operations. The composition root injects registered commands, Hotkeys-owned
storage, command execution, shell key arbitration, DOM/file/URL adapters, runtime
message subscription, and page lifecycle. The controller imports no Command Palette
or Data Layer implementation and owns each of its listeners exactly once. Disposal
removes them, clears pending input, and supports a clean remount. The root retains
only construction, shell priority arbitration, mounting, late initial focus, and
disposal.

Every existing Hotkeys property, feature, handler, browser, storage, keymap, command,
focus, file, status, warning, and accessibility contract remains unchanged. One new
focused unit file proves injected dependencies, mount/dispose/remount, keyboard
arbitration, cleanup, and invalid-file conservation without constructing the full
side panel. The Hotkeys exact plan grows from 9 to 10 tasks, or 11 to 12 with
properties, solely for that regression.

The current global `src/side-panel.ts` changed-path plan selects 20 packs and 751
non-property tasks. A later controller-only change selects `hotkeys` and its sole
dependant `shell`; with the new unit regression this is 67 tasks and excludes the
other 18 packs, about a 91% planned-task reduction. This does not establish a new
wall-time budget. The extraction's one-time delivery remains all 20 runnable packs
plus `node scripts/package.mjs` because the candidate necessarily edits the global
composition root.

The user approved this installed Hotkeys controller slice on 2026-08-10. It
activates no other VTD-008 controller extraction.

Approved second slice (2026-08-11): complete only the installed Command Palette
controller lifecycle. The current controller in
`src/command-palette-ui.ts` already owns command filtering and selection, palette
rendering, focus capture and restoration, background inertness, and six event
bindings. It exposes `bind` and `show`, but repeated binding duplicates ownership
and no operation removes its listeners or settles an open dialog. The installed
side-panel composition root constructs the controller and binds it, while the
standalone utility lifecycle cannot return controller cleanup.

The candidate gives that controller explicit, idempotent `mount`, `render`,
`show`, `hide`, and `dispose` operations through the existing
`src/utilities/command-palette/index.ts` public entry. Registered commands,
command execution, the owned DOM elements, and document/focus behavior enter as
explicit dependencies. Mount owns the launcher click, side-panel Ctrl+K, filter
input and keydown, result click, and dialog Tab listener exactly once. Disposal
removes that listener set, closes an open palette, removes background inertness,
restores the captured focus when it remains available, clears transient selection
state, and supports one clean remount. The standalone Command Palette lifecycle
returns the same controller cleanup. The composition root retains only dependency
construction, command execution routing, controller mounting, and page-lifecycle
disposal; it owns no palette visibility, filtering, selection, rendering, focus,
or event-binding state.

This package does not extract the utility shell, workspace tabs, command registry,
Hotkeys, observation target, live-session controls, or another Data Layer domain.
Launcher and Ctrl+K opening, filtered results, Arrow/Home/End selection, Enter and
click execution, Escape closing, Tab containment, ARIA selection, background
inertness, and focus restoration remain unchanged. Command ids, ordering, command
messages, storage, browser entry points, manifest capabilities, layout,
accessibility, and durable data remain byte-for-byte or observably equivalent as
applicable.

The Command Palette pack receives complete VTD-004 classifications for its owned
source paths. Command-registry semantics in `src/commands.ts` continue to propagate
to all declared dependants. Palette model and installed-controller paths name
`shell` as their installed runtime consumer without propagating through Hotkeys,
which imports neither path. A later controller-only change therefore selects
exactly `command-palette` and `shell`; changes to `src/commands.ts`,
`src/side-panel.ts`, the utility registry, or shared platform adapters retain their
current broader impact.

One focused controller unit file proves explicit dependency use,
mount/dispose/remount idempotence, exact listener ownership, open-dialog cleanup,
focus and inertness cleanup, command execution cardinality, and inert input after
disposal without constructing the full side panel. The Command Palette exact plan
grows from 13 to 14 tasks, or 14 to 15 with properties. The future
controller-boundary plan grows from the current exact `command-palette` plus
`shell` plan of 70 to 71 tasks, or 72 to 73 with properties, solely for that unit
regression. Against the current 753-task non-property and 835-task property-enabled
global side-panel plans, the later 71-task and 73-task controller plans exclude
Hotkeys and the other 17 unrelated packs, about a 91% planned-task reduction. This
is not a wall-time budget.

Every existing Command Palette unit, property, feature, handler, browser adapter,
browser observation, and assertion leaf remains registered. The technology
contract adds the installed-controller lifecycle cases; no product-behavior feature
changes. Because the extraction edits `src/side-panel.ts` and the canonical pack
registry, its one-time delivery checkpoint runs all 20 runnable packs in canonical
order with properties, followed by `node scripts/package.mjs`. This approved slice
authorizes neither Gherkin mutation during specification nor another VTD-008 slice.

The installed Command Palette controller slice completed the coder, refactorer,
and architect chain and was integrated into `master` at
`5ec9ff34f7a97f28ae887f553c31d8d6f7a788ed`.

Approved third slice (2026-08-11; specification commit `022e8c4e32`): complete
only the installed workspace-tabs controller lifecycle. The existing controller in
`src/workspace-tabs-ui.ts` already owns the active workspace state, shell-owned
storage read and write, tab and panel rendering, focus movement, click routing,
and Home, End, ArrowLeft, and ArrowRight navigation. Its public `bind` operation
adds anonymous click and keydown listeners on every call, cannot remove them, and
does not own initial rendering. The side-panel composition root binds it and later
invokes a separate initial `show`.

The candidate gives the existing controller explicit, idempotent `mount`,
`render`, `show`, and `dispose` operations. Shell-owned scoped storage, the
workspace tab list and DOM query boundary, and page lifecycle enter as explicit
dependencies. Mount reads the valid persisted workspace or selects and persists
the canonical Data Layer fallback, owns one click, keydown, and page-lifecycle
listener set, and performs one initial render. `show` remains the single state
transition: it persists the selected workspace, updates `aria-selected`, roving tab index, and
peer-panel visibility, and focuses the selected tab only when requested. Disposal
removes every owned listener, leaves the persisted and rendered selection intact,
and supports one clean remount from persisted state. The composition root retains
only dependency construction, workspace-navigation command routing, and controller
mounting; controller disposal belongs to the injected page lifecycle. The root
owns no workspace selection state, storage read or write, button or panel
rendering, event binding, or page-lifecycle cleanup closure.

This package does not extract `src/utility-registry.ts`, the utility directory or
panel bindings in `src/platform/utility-shell-dom.ts`, Command Palette, Hotkeys,
the workspace-navigation model, observation target, live-session controls, or any
Data Layer controller. Default Data Layer selection, persisted restoration,
mouse activation, wraparound and endpoint keyboard navigation, focus, roving tab
index, ARIA selection, peer-panel visibility, navigation command routing, storage
key and namespace, layout, accessibility, manifest capabilities, browser entry
points, and durable bytes remain observably equivalent.

The existing `shell_local_presentation` impact boundary already classifies
`src/workspace-tabs-ui.ts` without dependant propagation. A later change confined
to that controller therefore continues to select exactly `shell`. Semantic changes
to `src/workspace-tabs.ts` continue to select `command-palette`, `hotkeys`, and
`shell`; direct changes to `src/side-panel.ts`, the utility registry, or shared
platform adapters retain their current broad impact.

One focused unit file is the only new evidence leaf. It proves injected dependency
use, valid and invalid persisted-state restoration, one initial render,
mount/dispose/remount idempotence, exact listener cleanup, navigation and focus,
one transition per input, inert user input after disposal, and structural
composition-root ownership without constructing the full side panel. Every
existing shell unit, property, feature, handler, browser adapter, observation, and
assertion leaf remains registered. Inventory accounting must be derived from the
canonical registry plus this one approved addition, not copied into another frozen
task list.

| Evidence boundary | Conserved baseline | Approved delta |
|---|---|---|
| Product workspace behavior | `features/side-panel-workspace-tabs.feature`, its handler coverage, `test/workspace-tabs-property-test.mjs`, and installed containment observations | None |
| Technology contract | Existing scenarios 001–018 in `features/modular-chrome-utility-architecture.feature` | Append stable scenarios 019–023; no mutation during specification |
| Focused controller unit | Eleven current shell unit files | Add one installed workspace-tabs controller unit file |
| Browser and runtime evidence | Five shell browser-adapter paths, two registered containment observations, and every current observation leaf | None |
| Canonical pack accounting | All current shell features, handlers, properties, adapters, checkpoints, and prerequisites | Register only the new unit leaf and derive totals from the registry plus that approved addition |

At the current baseline, the shell-only plan contains 58 non-property tasks and 59
property-enabled tasks; the focused unit makes those 59 and 60. The global
`src/side-panel.ts` plan currently contains 754 non-property tasks and 836
property-enabled tasks; the approved addition makes those 755 and 837. The later
59-task or 60-task controller boundary therefore excludes the other 19 runnable
packs and reduces planned tasks by about 92% or 93%, respectively. These are
planner snapshots, not wall-time budgets. Because the extraction necessarily
edits the global composition root and canonical pack registry, its one-time
delivery checkpoint remains all 20 runnable packs in canonical order with
properties, followed by `node scripts/package.mjs`.

The remaining-VTD verification ratchet applies. An incident-bound brittle check
exposed by legitimate work is repaired at this task boundary by preserving its
behavioral or structural invariant; it does not justify a production compatibility
shim, weakened evidence, unrelated-pack edits, active-assertion deletion, or a
repository-wide verification cleanup. The approved slice is in the role chain and
activates no later controller. Under the feature-development course adjustment it
is the final automatic VTD-008 slice and supplies a transition measurement rather
than a completed-feature count.

The slice completed the coder, refactorer, and architect chain and integrated at
`ad002047a321d58976c0d8cd5c56dde46a1389d0`. It activates no later VTD-008
controller.

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

Candidate first slice (2026-08-10): Event Library only. Its current exact plan
runs `test/browser-packs/event-library.mjs` as a standalone 320-pixel rendered
smoke process and runs `LIBRARY_DIRECT_TEMPLATE_PUSH_BROWSER_ADAPTER` through the
installed `test/browser-packs/side-panel-event-library.mjs` process. Recent
accepted receipts continue to place the standalone smoke near 3.6–3.7 seconds.

The smoke process uniquely checks installed Event Library isolation, editor
visibility and initial focus, revision version/history persistence, export count,
nonzero export bytes and feedback, 320-pixel containment, and visible-control
accessibility. The candidate moves those exact leaves to the distinct logical
target `EVENT_LIBRARY_RENDERED_SMOKE_TARGET` in the installed Event Library
process. That target and the unchanged direct-push target form the reusable
`event-library-side-panel` batch. They retain fresh target contexts, independent
results, focused selection, permutation equivalence, failure attribution, and
cleanup before the process shuts down once.

`test/browser-packs/event-library.mjs` remains registered only as a thin
`compatibility` launcher that delegates direct invocations to the installed smoke
target. Canonical exact and terminal plans do not schedule it, and it owns no
separate evidence leaf. Retaining its Event Library ownership keeps the candidate
within existing historical changed-path behavior; this slice does not delete the
path, change shared planner rules, or select Event Library dependants.

The exact Event Library plan therefore changes from 30 tasks with two browser
processes to 29 tasks with one two-target browser process. All nine unit files,
one property file, eight features, three isolated handlers, direct-push leaves,
budgets, calibration, ownership, dependencies, and production impact boundaries
remain unchanged. The user approved this Event Library slice on 2026-08-10. It
activates no other VTD-010 pack slice.

### VTD-011 — Balance terminal CI using measured critical-path weights

Priority: P1 under the feature-development course adjustment

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

Priority: P0 for the bounded verification-process separation; P2 for remaining
modularization

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

### VTD-014 — Repair every manifested flaky test instead of retrying it away

Priority: P1, bounded

Problem:

Any exact-checkpoint failure can currently be retried and later produce passing
evidence without retaining the fact that the same unchanged code failed first. This
includes runner timeouts, offscreen-control hit-test failures, Property Set settling
failures, readiness races, cleanup leaks, and any other assertion or infrastructure
failure that disappears on an unchanged retry. A real receipt from 2026-08-07 shows
one expensive form: the Capture batch waited the complete 600-second outer limit on
a dist-artifact lock before any logical target reported. The same process weakness
can hide a five-second assertion flake just as easily. Passing on retry must identify
unreliable verification, not erase it.

The process also starts checks in sandboxes already known to lack capabilities such as
local socket binding, waits for the predictable restriction failure, and only then
requests the access needed for the rerun. That is not useful diagnosis and must not be
treated as test unreliability. Known execution prerequisites must be resolved before
the first affected task launch.

Other lifecycle gaps can still force waste even when no test is flaky: two agents can
collide on one artifact lock, an interrupted runner can leave valid completed tasks
that an agent fails to resume, evidence promotion can fail after every task passed, a
candidate can drift during the run, and a focused test can be retried outside the
incident-aware runner. The long checkpoint must be a recoverable single attempt, not
a disposable command invocation.

Required outcome:

- Every canonical task declares its exact restricted execution prerequisites. The
  plan validates them and arranges existing scoped approval before the first launch
  when the current sandbox is known to be insufficient. Workspace-only tasks do not
  inherit broader access from a browser or evidence task in the same pack.
- If declared access is denied or unavailable, no child task is launched and an
  `environment-prerequisite-blocked` diagnostic names the task, capability, and route.
  It supplies no passing evidence but consumes no flaky-test retry. An unexpected
  sandbox denial creates a blocking `environment-contract-failure` against the
  prerequisite/routing contract and permits no unchanged retry.
- Before expensive work, checkpoint preflight validates the immutable candidate,
  tools and executables, registry and plan, artifact inputs, bounded receipt/output
  capacity, unresolved incident state, execution prerequisites, and a single active
  checkpoint/artifact lease. A competing invocation attaches, queues outside task
  timing, or reports the exact owner instead of creating a duplicate run.
- The runner durably records every passed boundary and automatically continues the
  one compatible attempt after a runner, agent, tmux, or host interruption. Already
  passed work from that same attempt is not rerun; interrupted and unstarted work is.
  Ambiguous or identity-mismatched state blocks rather than silently starting over.
- Candidate commit, tree, registry, plan, toolchain, and artifact identities remain
  fixed throughout the attempt and are checked between stages. Drift stops before
  more work runs, and results from different candidates are never combined.
- Once every planned task, including packaging, has passed, receipt completion,
  pending-evidence creation, Git-note recording, and handoff validation can be retried
  independently. A valid completed receipt rejects a duplicate all-pack run and
  directs the agent to the unfinished promotion step.
- Every repository-declared focused or broad verification task uses the same
  incident-aware boundary. A direct diagnostic run supplies no handoff evidence and
  cannot make a manifested failure disappear; unresolved focused incidents block the
  closing all-pack checkpoint.
- Every failure manifested through registered focused or canonical verification
  creates a repository-common, tamper-evident reliability incident before any
  unchanged retry.
  It survives coder, refactorer, architect, and specifier worktrees.
- The incident identifies the candidate lineage, task, owning pack, failure class
  and fingerprint, last started logical target or smaller case when one exists,
  active phase, bounded final state, receipt, and artifact/toolchain identity.
- Browser and other multi-boundary programs emit enough process, target, case,
  phase, assertion, cleanup, and completion progress to preserve the smallest failed
  boundary. Timeouts additionally retain their exact limit and termination result.
- At most one unchanged diagnostic retry is permitted. It runs only the smallest
  failed target, scenario, generated case, setup boundary, or indivisible task.
  Previously passing work is never part of this retry. An agent may instead repair
  the failure immediately; ordinary resume cannot bypass incident classification.
- The retry keeps the same candidate tree, artifact, toolchain, execution-load
  class, task configuration, and applicable limits. A pass classifies a confirmed
  flake regardless of whether the first symptom was a timeout, hit-test assertion,
  settling assertion, or another failure. A repeated or different failure also
  remains unresolved. No outcome silently becomes a pass, and a second unchanged
  retry is rejected.
- Evidence recording and Git handoff fail while the current candidate lineage owns
  any unresolved reliability incident. Repair notes remain available so a role can
  route the work to the appropriate owner.
- Resolution requires a changed candidate, a named causal repair, a deterministic
  regression that would have caught the original failure without waiting for the
  production timeout, focused fresh verification of the repaired boundary, and one
  fresh all-pack checkpoint. Raising a timeout alone cannot resolve an incident. A
  narrow capability declaration or routing fix resolves only an environment-contract
  incident and cannot relabel a product or verification assertion as environmental.

Acceptance criteria:

- Two invocations for the same candidate and plan produce one attempt and one receipt.
  Active lock ownership is visible before task timing begins, and stale ownership has
  a bounded audited recovery rather than a blind delete or a production-length wait.
- After an external interruption, an exact compatible restart automatically reuses
  only durably passed tasks from that same attempt and runs only interrupted or
  unstarted boundaries. A fresh post-repair attempt never imports pre-repair results.
- When all planned tasks have passed but receipt finalization or Git-note recording
  fails, recovery retries only finalization or recording. A second all-pack run is
  rejected while the completed receipt and all bound identities remain valid.
- Candidate, plan, toolchain, registry, or artifact drift halts before the next stage
  and cannot create mixed evidence. A verification tool that writes tracked files
  creates a repairable execution-contract incident.
- A focused unit, property, acceptance, browser, checkpoint, or package failure uses
  the same incident and causal-repair rules as a failure in the all-pack run; direct
  rerun output cannot qualify the candidate for handoff.
- A browser task known to bind a loopback socket requests and uses its scoped approved
  route before its first process starts; it does not run once in the inadequate
  sandbox and again with permission. A workspace-only task launches unchanged without
  a new approval prompt.
- Denied declared access launches no child and records a non-passing prerequisite
  block. A task whose declaration incorrectly omits socket access creates an
  environment-contract incident, rejects unchanged retry, and after the declaration,
  routing, and deterministic preflight regression are repaired, future first attempts
  receive the required access.
- Missing, unknown, contradictory, or catch-all capability declarations fail plan
  validation, and no declaration bypasses explicit approval or enables unrelated
  host or public-network access.
- Forced offscreen-control hit-test and Property Set settling failures create the
  same blocking incident contract as a forced timeout and isolate their exact target
  or case rather than rerunning the all-20 checkpoint.
- A forced batch timeout after target progress records the exact target and phase;
  a timeout before target progress records the setup boundary, not every target in
  the batch.
- The historical 600-second Capture-lock receipt is represented by a bounded fixture
  and is classified as dist-artifact setup with all 274 passing tasks excluded from
  its isolated retry.
- Pass-on-retry for timeout, hit-test, settling, and ordinary assertion fixtures is
  always classified as confirmed flaky. Same-failure, different-failure,
  missing-progress, and attempted second-retry fixtures remain blocking and have
  distinct diagnostics.
- Concurrent incident writers cannot overwrite one another; malformed, redirected,
  symlinked, truncated, or manually altered state fails closed.
- A candidate with only a timeout-value increase, only a verbal explanation, reused
  focused results, or no causal regression cannot enter the fresh checkpoint or
  create handoff evidence.
- After a valid repair, its focused boundary and one fresh canonical all-pack run
  pass, the resolution is linked into durable Git-note evidence, and the handoff
  gate reports no unresolved incident for that lineage.
- Runs without a failure retain their exact task plans, batching, budgets,
  calibrations, worker limits, and package check. Previously passing work may be
  reused for diagnosis, but no failed result bypasses incident classification.

Dependencies: VTD-002 provides durable receipt identity and VTD-007 provides
target/phase progress. VTD-006 makes the shared side-panel batches target-aware.

Expected effect: developers stop paying repeated retry penalties for hidden test
problems, predictable environment failures, lock collisions, interrupted attempts,
and failed receipt promotion. The process preserves good work, fixes genuine debt,
and reruns all 20 packs only when a changed candidate truly needs fresh proof.

Approved repair-focused prerequisite correction (2026-08-10): a VTD-008 repair run
proved that ordinary focused planning closes acceptance sessions over build, parse,
and generation tasks, while repair-focused planning launched the session leaf alone.
The correction must derive the same canonical predecessor closure without adding
unrelated evidence, prove absent Hotkeys generated outputs are created before the
session launches, and attribute any predecessor failure to that predecessor. It must
also renew both current-lineage incident proposals on one final descendant candidate
so one fresh all-20 checkpoint plus package can resolve them together. This candidate
changes shared reliability tooling only. It does not broaden VTD-008 product behavior
or activate another controller extraction.

Approved checkpoint-recovery and universal-prerequisite clarification (2026-08-10): once an eligible repair
has claimed its checkpoint, a later checkpoint failure does not permit that proposal
or its focused evidence to be renewed. Explicit rebase transitions move the effective
repair candidates to the descendant, and the existing audited reclaim operation gives
that descendant one new checkpoint claim. Diagnostic incidents `d5e9fd9d` and
`809dd54e` exposed a general bypass: not every runner mode obtains a validated,
task-bound launch authorization, and focused dependency closure omits upstream strict-
receipt results. The systematic correction routes every mode through one typed,
transitive prerequisite gate, rejects unknown kinds and unauthorized spawns, and
classifies failures by whether they occur before or after authorization. A registry-
generated matrix makes every future mode and prerequisite kind supply its validator,
satisfier, authorized path, blocked path, and contract-failure path before it can be
registered. Both incidents receive causal repairs rather than abandonment. Checkpoint incident
`e9572d6b` and the two original repair incidents also remain active, so the final
compatible checkpoint resolves all five without changing product behavior.

Approved bounded closure policy (2026-08-10): live closure work exposed 17 unresolved
records, including nine successive Shell records with one coarse task fingerprint but
different failing scenarios or assertions. The approved steady-state rule freezes the
approved VTD-014 contract for closure, classifies product execution separately from
verification execution and post-result recording, and keys repeated occurrences by a
structured causal boundary rather than candidate commit or task fingerprint alone.
Off-lineage incidents are retired from the selected delivery without being called
resolved; ancestor product failures still require causal repair, while one exact verifier
repair may supersede every occurrence of the same cause without claiming a product fix.

The terminal checkpoint starts with one fresh all-20 run. A verifier-only repair
after that start may retain an earlier passing task only when a complete digest proves its
contract, executable, transitive code and inputs, product artifact, runner semantics,
environment, toolchain, and limits are identical. Changed, failed, interrupted, unknown,
or incompletely mapped inputs rerun; package always runs freshly on the final tree. This
prevents bookkeeping-only changes from recursively discarding unrelated product proof
without allowing a real or uncertain product failure to pass.

### VTD-015 — Review changing candidates before one final-tree all-20 gate

Priority: P0

Status: user-approved bounded implementation slice. The authoritative contract is
`docs/vtd015-settled-final-verification-workflow-R01.md` with executable behavior
in `features/settled-candidate-final-verification.feature`. Stable task name:
`vtd015-settled-final-verification`.

Problem:

The coder must currently attach complete handoff evidence before the refactorer and
architect perform work that may change the candidate. Any later production, test,
registry, build, or verification change correctly invalidates that passing result
and forces another full checkpoint. The Command Palette lineage recorded three
successful 20-pack, 837-task checkpoints before integration.

Required outcome:

- Add an explicit review-ready state that cannot be integrated and does not claim
  final regression evidence.
- Coder, refactorer, and architect use focused behavior evidence while the
  candidate is expected to change.
- After those roles settle one candidate tree, one named final-verification owner
  runs all 20 packs with properties and packaging and records durable evidence.
- Any change to behavior-bearing inputs after that pass invalidates it and requires
  a new final run.
- If the final run fails, retain the VTD-014 rule: record the failure, repair and
  prove the exact cause narrowly, then run all 20 packs freshly on the changed
  candidate.
- Record approval, implementation, review, final-verification, repair, and
  integration timestamps automatically enough to report feature delivery without
  adding manual ceremony to every role.

Acceptance criteria:

- A simulated candidate changed once by the refactorer and once by the architect
  performs focused checks during review and exactly one successful all-20 run after
  the final change.
- A failing final run followed by a causal repair performs a fresh second all-20
  run; no earlier failure or passing task is relabelled as final evidence.
- A review-ready candidate cannot be integrated, broadcast as complete, or reuse
  an unrelated final receipt.
- A documentation-only recording step can finish evidence promotion without
  rerunning unchanged product proof when all bound identities remain equal.
- All current terminal evidence leaves and the package check remain required on
  the final tree.

Trade-off and expected value:

Full-suite-only defects are discovered later than they are today, but still before
integration. The change adds one explicit workflow state and handoff validation.
Its expected value is very high because it avoids successful full runs that later
review work immediately invalidates. Replay of the Command Palette sequence must
demonstrate the saved full runs; task-count reduction alone cannot close the item.

Measured target and decision boundary:

- Workspace tabs provides the immediate baseline: two successful 838-check full
  runs, including one 21-minute-21-second pass invalidated by later review work.
- VTD-015 itself bootstraps under the previously integrated handoff protocol. It
  cannot safely use the state it is still implementing.
- VTD-012 is the first live payback measurement. While its tree is changing, coder
  and refactorer perform no all-20 run. After the final review change, the
  architect owns one successful settled all-20 run unless a recorded failure and
  repair require a fresh second run.
- The claim remains provisional until the VTD-012 scorecard demonstrates at least
  one invalidated successful full run avoided with every final evidence leaf and
  package result preserved.
- Stop this slice if it requires weakening VTD-014, permitting review-ready
  integration, repeated full-suite rehearsals, manual per-role timing ceremony,
  scheduler or artifact-lock changes, or product behavior changes.

### VTD-016 — Partition Shell product evidence for a faster inner loop

Priority: P0 after the VTD-012 verification-process separation

Problem:

The `shell` pack combines workspace navigation, general presentation, branding,
package behavior, architectural verification, and verification-process contracts.
A workspace-tabs controller change therefore selects a roughly 173-second
verification-process unit, a roughly 92-second combined Schema/workspace browser
observation, and a roughly 32-second acceptance session containing 19 features.

Required outcome:

- Inventory which Shell evidence can actually observe workspace tabs, general
  Shell presentation, branding, packaging, architecture, and verification
  infrastructure.
- Give those behaviors separate focused boundaries while retaining shared checks
  wherever one change can genuinely affect several behaviors.
- Let a workspace-tabs presentation change select its unit and property evidence,
  its observable accessibility and navigation features, and the workspace
  containment target without selecting Schema containment or
  verification-process-only behavior.
- Keep shared platform, utility-registry, navigation-model, accessibility-kernel,
  and composition-root changes broad wherever their consumers require it.
- Preserve all current Shell evidence exactly once in the terminal all-20 plan.
- Measure focused elapsed time before and after on the same environment class.

Acceptance criteria:

- Changing only the installed workspace-tabs controller does not schedule
  `test/verification-process-contract-test.mjs` or the Schema-view containment
  target.
- Changing the semantic workspace navigation model still selects Command Palette,
  Hotkeys, and every applicable Shell behavior.
- Changing `src/side-panel.ts`, the utility registry, or shared platform adapters
  retains the current broad safety closure.
- The final terminal plan contains every pre-slice unit, property, feature,
  handler, browser observation, checkpoint, and package leaf exactly once.
- A measured focused workspace loop is materially faster; a smaller task count
  without an elapsed-time improvement does not satisfy the item.

Trade-off and expected value:

The work needs careful evidence mapping because Shell behavior is shared. Incorrect
partitioning could miss a regression during development, so the final all-20 gate
remains unchanged and negative planner cases prove shared paths stay broad. The
expected value is high: it removes clearly unrelated work from a common local
change and gives failures a smaller, more understandable home.

### VTD-017 — Add bounded isolated parallel browser execution

Priority: P1 after measured lane balancing

Problem:

The runner already uses bounded parallel workers for unit, property, parse,
generate, acceptance-session, and browser-observation stages. Browser observations
normally use two workers, while ordinary browser adapters remain serial. The final
gate is dominated by browser work, but simply launching more pack runners would
duplicate shared checks, contend over the prepared artifact, fragment receipts,
and risk resource-driven timeouts.

The workspace-tabs settled checkpoint measured a hidden serialization point. One
browser-observation worker held the exclusive `dist` artifact lock while another
otherwise independent task waited as long as 195.4 seconds; that waiting task took
231.9 seconds overall. A configured worker count of two is therefore not yet proof
of useful two-way execution.

Required outcome:

- Keep one coordinator, one canonical deduplicated all-20 plan, one prepared build
  candidate, and one combined pass or fail result.
- Use VTD-011 timing weights to balance the existing workers before adding more.
- Audit the `dist` artifact lease before raising worker counts. Keep build,
  validation, and promotion writes exclusive, while allowing proved read-only
  consumers to share the same validated immutable artifact or separate validated
  snapshots. Preserve artifact digest identity and fail on any consumer mutation.
- Prove that every parallel browser task owns its Chrome profile, automatically
  selected debugging port, temporary writable data, evidence output, child-process
  lifecycle, and cleanup. Keep an unproved task serial.
- Audit the ordinary browser adapters, then allow at most two adapter workers for
  the subset proved independent.
- Trial browser-observation concurrency three only after the two-worker schedule
  is balanced. A higher default requires a material typical elapsed-time reduction
  and focused normal and loaded evidence without a new failure pattern.
- Preserve stage ordering, explicit dependencies, shared-session batching, and
  every current assertion and evidence leaf exactly once.
- Use focused representative stress samples and one ordinary final gate for the
  concurrency decision. Do not add repeated all-20 rehearsals.
- Treat a parallel failure as a real recorded failure. Do not automatically retry
  at lower concurrency or otherwise turn a failing result green.

Acceptance criteria:

- Process-contract fixtures prove that dependent or shared-writable-state tasks
  cannot enter different workers and that independent tasks can.
- Two read-only browser consumers overlap against the same validated artifact
  identity without writing it; build and promotion remain exclusive, and an
  attempted consumer mutation fails rather than contaminating another task.
- Measurements separately report scheduled worker count, useful overlap, and
  artifact-lock wait. Removing lock wait must precede any claim that a higher
  Chrome worker count improved parallelism.
- Two concurrent browser fixtures use distinct profiles, debugging ports,
  temporary data, and evidence paths; one fixture cannot read or remove the
  other's state.
- The canonical plan and combined receipt contain the same terminal tasks,
  logical targets, assertions, checkpoints, and package result as the serial
  baseline, with no duplicate leaf.
- Given the same accepted timing snapshot and worker count, assignment is
  deterministic and accounts for indivisible long tasks.
- Focused normal and loaded samples show no new timeout, cleanup, port, profile,
  or evidence collision pattern. The chosen default improves typical wall time;
  one unusually fast run is insufficient.
- A failed worker makes the combined run fail and preserves its evidence without a
  silent retry.

Dependencies: VTD-001, VTD-002, VTD-007, and VTD-011.

Trade-off and expected value:

The profile, port, and evidence isolation foundations already exist, but the
artifact lease needs correction before their parallel value is real. The expected
effort remains medium and can be delivered incrementally. The expected value is
high when final-gate browser work remains a material share of feature delivery.
More Chrome processes still compete for processor time and memory, so three
workers may be slower or less stable on a constrained machine. The accepted
default is the fastest stable bound, not the largest possible worker count.

## Enabling-slice user review gate

The course-adjusted sequence is not an automatic chain. Before each enabling
slice, provide the user with its measured baseline, target elapsed-time benefit,
expected effort, safety trade-off, success measure, and stop condition. The slice
still requires explicit specification approval and the normal coder, refactorer,
architect, and settled-final-gate review process.

After each slice settles, provide a plain-language scorecard containing its actual
approval-to-integration time and breakdown, comparable before-and-after elapsed
times, full-gate count, invalidated passes, failures, repairs, reruns, preserved
terminal evidence, confidence limits, and continue/adjust/stop recommendation.
Task count may explain a result but is not the outcome measure.

Do not approve or hand off the next enabling slice until the user has reviewed the
scorecard and explicitly chosen the course. If the benefit can only be measured on
the next applicable slice, mark it provisional; that next slice must close the
payback claim before any further enabling slice is recommended.

## Course-adjusted recommended sequence

The earlier phase order established useful measurement and safety foundations but
is superseded for new work by the feature-development outcome. Completed items
remain delivered; they do not create an obligation to finish every remaining item.

### Transition — Finish and measure the in-flight slice

Finish the approved workspace-tabs controller lineage. Record its elapsed-time
breakdown, successful full checkpoints, failed checkpoints, and verification
repairs. It is a technical-debt transition measurement, not a completed feature.

Do not automatically activate another VTD-008 controller afterward.

### Phase 1 — Remove avoidable delivery-loop overhead

1. VTD-015 — settle the tree before one final all-20 gate.
2. VTD-012 bounded first slice — separate verification-process contracts from
   ordinary product checks and split the monolithic process test by responsibility.

Exit condition: later roles do not invalidate successful full runs unnecessarily,
and later verification changes have smaller, responsibility-specific contracts.

### Phase 2 — Accelerate the remaining course work

1. VTD-011 — balance terminal work using measured indivisible task weights.
2. VTD-017 — add bounded isolated parallel browser execution without starting
   competing pack runners.

Exit condition: the same full evidence finishes faster and remains stable under
focused normal and loaded measurements. VTD-011 must shorten VTD-017's terminal
gate; VTD-017 must then shorten VTD-016's final gate. A missed enabling payoff
stops automatic continuation for another bottleneck review.

### Phase 3 — Narrow the common Shell product loop

VTD-016 — partition Shell product evidence by observable behavior. This slice now
benefits from the workflow, verification-contract, lane-balancing, and browser
parallelism improvements delivered before it.

Exit condition: a workspace or similarly small controller change uses only the
behavior evidence that can observe it, while shared changes and the terminal plan
retain complete coverage.

### Phase 4 — Prove the compounded payoff on a real feature

Deliver one modest user-visible feature. Count it, record approval-to-integration
time, and compare its implementation, review, planned-verification, and repair time
with the transition measurements. If the expected gain is absent, stop and inspect
the actual new bottleneck before selecting more debt.

### Phase 5 — Continue only from the measured bottleneck

Use VTD-006 and VTD-007 patterns to reduce repeated setup and waiting in the two
largest layered browser batches only if they still lead the final gate. Audit
VTD-014 implementation only where measurement shows process overhead, and
consolidate only demonstrably duplicate enforcement.

Resume VTD-008 or another structural item only when a real upcoming feature would
otherwise need the global composition root or another proven bottleneck. State the
expected effort, feature-delivery value, safety trade-off, and later payback check
before approval.

The historical phase plan below is retained only as delivered-program context.

## Historical recommended sequence

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
3. VTD-014 — unreliable-test repair gate
4. VTD-010 — redundant smoke launch consolidation

Exit condition: terminal batching is retained, focused targets initialize only
their fixtures, and no manifested flaky failure can be retried away without a causal
repair.

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
3. Read `docs/feature-development-throughput-course-adjustment-R01.md` and do not
   reactivate the historical phase order as the current work queue.
4. Run the locked toolchain checker once.
5. Inspect `git status`; preserve unrelated user changes.
6. Use the delivered canonical timing ledger and environment classes; never edit a
   raw receipt to make it eligible.
7. For VTD-014, inspect repository-common unresolved reliability incidents and the
   sanitized timeout, hit-test, and Property Set settling fixtures before changing
   retry behavior.
8. Select exactly one backlog id. Do not hand the entire program to one coder as an
   unbounded task.
9. State expected effort, expected feature-delivery value, safety trade-off, and
   the later feature measurement that will prove or reject its payoff.
10. Write its deterministic contract and evidence-conservation table.
11. Use task-scoped tests only during specification work; do not run mutation.
12. Ask the user for explicit approval before committing and sending the coder
    handoff.

## Handover summary

VTD-001 through VTD-007, VTD-009, VTD-013, and VTD-014 are delivered, including
corrected scheduling, canonical timing evidence, representative budgets, narrower
ownership, shared readiness, the modular side-panel browser program, and the
reliability-repair gate. The bounded Event Library VTD-010 implementation completed
the coder, refactorer, and architect sequence and is integrated in current `master`
at `cc2c9a01`. The installed Hotkeys controller is complete in integration baseline
`9808acce74`. The bounded installed Command Palette controller slice is complete at
`5ec9ff34f7`. The workspace-tabs controller slice completed at `ad002047a3`. It
is the last automatic VTD-008 slice before the feature-development throughput
course adjustment. Other VTD-008 controllers and VTD-010 pack slices remain
inactive.

After measurement truth, the fastest direct development-time wins are precise
impact boundaries and layered editor target partitioning. Preserve terminal
coverage and browser batching. The schema side-panel program already batches its
46 logical observations into one process; its needed refactor is modular source and
target-specific initialization, not 46 independent Chrome launches.

The Flow editor is no longer the leading general bottleneck for a simple UI change:
its representative path is about 27 seconds and remains under the 35-second
guardrail, and its isolated examples regression was stabilized by VTD-013. The
shared one-megabyte side-panel runtime was modularized by VTD-006. VTD-014 now stops
exact-checkpoint retries from hiding timeouts, hit-test races, settling failures, and
other unreliable tests without a causal repair. The largest remaining product-code
debt is the `src/side-panel.ts` composition root, but debt size no longer determines
the next work automatically. The next work follows measured feature-delivery
value: VTD-015, the bounded VTD-012 verification-process separation, VTD-011, the
conditional bounded VTD-017 parallelism slice, VTD-016, then one real feature
payback check. This order intentionally lets broad workflow and final-gate
improvements accelerate the narrower slices that follow. Each enabling claim must
be checked on the next applicable slice rather than deferred until the end.
