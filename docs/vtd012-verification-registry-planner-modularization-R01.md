# VTD-012 verification registry and planner modularization R01

Status: specification prepared; implementation and coder handoff are not yet approved

Prepared: 2026-08-26

## User decision represented by this specification

Prepare one outcome-bounded program that removes the verification registry,
planner, process-contract, runner, and evidence workflow as shared development
bottlenecks. "Overnight" means that the approved program may continue unattended
across as many work periods as its outcomes require. It is not an elapsed-time
budget and it creates no routine phase-by-phase user gate.

This document specifies the program only. A later explicit approval is required
before the specifier commits it and hands task
`verification-registry-planner-modularization` to the coder. That one approval may
authorize every stage below, including required behavior-preserving ownership
preparation and automatic resumption, while the conservation and stop conditions
remain satisfied.

## Plain-language outcome

Verification work is currently concentrated in a small set of shared files. A
single process-contract test combines unrelated policies and is registered as an
ordinary Shell unit, so product-only Shell work pays for verification policy it
cannot affect. The registry and planner also treat unrelated untracked files as
governed repository inventory, making a developer's personal working artifacts
capable of blocking routine validation.

The completed program changes the workflow, not just the file layout:

- ordinary validation plans the committed or explicitly staged candidate and
  ignores unrelated untracked files;
- autonomous work and evidence run in a dedicated task worktree without changing
  or cleaning the user's primary worktree;
- verification-policy boundaries have separately owned contracts and production
  modules;
- the default planner selects and the default runner executes only the affected
  policy contracts and their declared prerequisites;
- product-only Shell work does not execute verification-policy contracts;
- the former process-contract command remains a compatibility alias that expands
  to the complete successor set when explicitly requested;
- reliability, repair, and evidence workflows understand that one-to-many task
  succession without losing or inventing proof;
- pack authors edit one authoritative local manifest and deterministic tooling
  owns the canonical historical representation; and
- receipts and delivery scorecards demonstrate avoided work and elapsed-time
  benefit before the program is described as complete.

Smaller files, moved assertions, module count, pack count, and task count are
diagnostics. They are not completion outcomes.

## Measured starting point

The specification starts from QA commit
`fc552224f290a39dbbd6e27a27f6c3c336b3d2e9` and the following observations:

- `test/verification-process-contract-test.mjs` has 11,820 lines, about 710 KB,
  37 static or dynamic imports, approximately 1,250 assertion calls, and 288
  touching commits;
- its latest accepted comparable receipt took 181,447 milliseconds, while the
  throughput record describes a roughly 173-second earlier run;
- `verification/packs.json` has 7,669 lines and about 333 KB;
- `scripts/verification-packs.mjs` has 1,965 lines and combines registry,
  ownership, dependency, construction, batching, and historical planning work;
- `scripts/run-focused-acceptance.mjs` has 2,385 lines;
- `scripts/verification-evidence.mjs` has 1,759 lines;
- a representative Shell-focused loop is approximately five minutes, of which
  roughly 173 seconds are the unrelated process-contract task, 92 seconds are a
  browser observation, and 32 seconds are the Shell acceptance session; and
- `trackedRepositoryPaths()` currently invokes `git ls-files --cached --others
  --exclude-standard`, so a non-ignored untracked spreadsheet was incorrectly
  presented to ownership validation as a tracked repository path.

The untracked-file command result is an inventory-model defect and an execution-
context defect, not a product or candidate failure. The user's existing
`artifacts/` tree and `scripts/create-flow-property-table-template.mjs` are outside
this task. No role may move, delete, register, ignore, edit, or clean them.

## Delivery outcome and expected payoff

After adoption, a representative product-only Shell change must avoid the entire
verification-policy contract set. On the accepted environment class, its focused
loop should move from roughly five minutes toward two to two and a half minutes
without dropping its product, browser, acceptance, property, build, or package
obligations.

The central portfolio forecast is a 10-to-20-percent reduction from approved
specification to QA integration, with a 15-to-30-percent prospect for Shell and
workspace work and a 30-to-50-percent prospect for verification-infrastructure
work. This is a forecast, not completion evidence. Broad product changes and
master-promotion gates retain their required behavior and are expected to improve
less because browser evidence remains their dominant cost.

Technical adoption is complete only after the default planner, runner, repair,
and evidence paths use the new boundaries. Payback is confirmed only by later
ordinary delivery scorecards as described below.

## Candidate and worktree contract

1. Every program role works in a dedicated task worktree created from the exact
   authorized QA candidate. The user's primary worktree is an input-free sibling,
   not a candidate workspace.
2. Routine inventory validation governs paths present in the Git index for the
   candidate. A committed path and an explicitly staged addition are governed; a
   merely present untracked path is not.
3. Adding, removing, or renaming a governed candidate path still invokes exact
   ownership, consumer, input, and historical-plan validation.
4. Routine validation may report ignored untracked paths diagnostically, but
   their presence cannot change validation status, selected packs, selected
   tasks, or plan identity.
5. Review and terminal evidence continue to require one clean committed task
   worktree. Strict evidence cleanliness is not weakened to accommodate a mixed
   developer workspace.
6. No implementation may solve inventory isolation by modifying project or local
   ignore rules for the user's artifacts.
7. A generated or untracked file that is an actual build input must be committed,
   explicitly generated inside the task worktree, or rejected as an undeclared
   input before evidence. Ignoring unrelated artifacts must not permit hidden
   candidate inputs.

## Authoritative registry manifests

Each runnable pack receives one authoritative manifest fragment. Shared boundary
and cross-pack declarations may use dedicated fragments only when a single pack
fragment would create duplicate authority.

The compiler and loader must:

- validate fragment schema before assembly;
- reject duplicate pack identities, duplicate ownership, missing leaves, unknown
  consumers, conflicting boundaries, and ambiguous shared declarations;
- produce byte-identical canonical output for identical inputs;
- preserve stable declaration ordering and task identity;
- make generated and hand-authored files explicit;
- fail when checked canonical output is stale;
- load current and historical fragments from their respective Git revisions;
- preserve safe rename, copy, and deletion planning through the union of current
  and historical ownership; and
- fail closed to the existing conservative scope when historical fragments or
  their schema cannot be reconstructed safely.

`verification/packs.json` remains the canonical compatibility representation for
existing tools during migration and for historical revisions that contain only
that representation. It is generated, not hand-authored. Normal pack work edits
one local manifest; any canonical-file change is mechanical compiler output and
must not require manual registry reconciliation.

The migration is incremental. One low-coupling pack proves current loading,
historical loading, regeneration cleanliness, and focused planning before later
packs move. A mixed registry of migrated fragments and unmigrated canonical pack
objects must have one deterministic order and one validation result.

## Production policy boundaries

The compatibility entry points remain stable, but their implementation delegates
to modules with these exclusive responsibilities:

1. registry schema, fragment assembly, and candidate inventory validation;
2. ownership, shared-boundary, impact, and consumer resolution;
3. direct dependency and dependant expansion;
4. task construction, prerequisite closure, deduplication, and browser batching;
5. current-versus-historical change planning;
6. execution and checkpoint lifecycle;
7. reliability incidents, repair scope, task succession, and run-intent policy;
8. evidence compatibility, creation, recording, and promotion; and
9. timing, critical-path, avoided-work, and delivery-payback modeling.

One module may call another through an explicit interface. It may not retain a
second implementation of the callee's policy. Compatibility façades parse legacy
inputs, delegate, and present legacy outputs; they do not remain alternate policy
engines.

Before an intentional task-topology change, fixture comparisons must show the new
modules producing the same pack selection, task ordering, prerequisites,
diagnostics, batching, historical union, and evidence identity as the current
entry points.

## Contract ownership and default routing

Each production boundary receives an independently owned executable contract.
Those contracts become normal planner tasks rather than helper files invoked only
by developers.

The proposed stable task boundaries are:

| Boundary | Selected by |
|---|---|
| registry and inventory | manifest, schema, canonical compiler, and inventory changes |
| ownership and impact | owner, shared-boundary, impact, helper-consumer, and input changes |
| dependency expansion | direct dependency, dependant, and prerequisite-graph changes |
| task construction and batching | task identity, closure, deduplication, adapter, and browser-batch changes |
| historical planning | current/base registry, rename, copy, deletion, and compatibility changes |
| execution and checkpoints | launch, worker, checkpoint, artifact-guard, and cleanup changes |
| reliability and run intent | incident, repair, retry, deferral, admission, and intent changes |
| evidence and promotion | receipt compatibility, evidence identity, recording, and promotion changes |
| timing and performance | timing eligibility, critical-path, avoided-work, and scorecard changes |

For every boundary change, the changed-path planner selects that boundary's
contract plus declared prerequisites and consumers. The runner executes exactly
that result, and the receipt records the selection and timing. Unrelated boundary
contracts are absent, not merely skipped internally.

Verification-policy tasks move out of the ordinary Shell task closure. A
product-only Shell change retains its current Shell product ownership and
evidence except for those unrelated policy tasks; this program does not partition
the remaining Shell product evidence or activate VTD-016. Verification
infrastructure is assigned a distinct proposed parent owner
`verification_process`. The exact final pack name may change only if read-only
intent proves an existing parent with the same isolation and terminal behavior.
Such a naming choice is technical and does not require another user decision.

Every master-promotion plan still includes all current verification-policy
contracts exactly once through the canonical runnable registry. Focused
verification reduction cannot remove a terminal evidence leaf.

## Compatibility task and one-to-many succession

The command
`node test/verification-process-contract-test.mjs` remains valid throughout the
cutover. Once boundary tasks are active, it is a compatibility alias that expands
to the complete ordered successor set and reports their combined result. It is
not scheduled in addition to those successors during ordinary focused or
terminal planning.

The task-succession model must support one source identity mapping to a complete
set of destination identities when:

- every destination has a stable canonical identity;
- their conserved boundary digests together cover the source boundary exactly;
- no destination is duplicated, missing, weakened, or ambiguous;
- the graph is acyclic; and
- both the source and destination registry revisions are available or a declared
  compatibility representation proves them.

An unresolved incident or governed repair attached to the former task is covered
only when every applicable successor selected for its conserved boundary passes
freshly. One passing successor cannot erase a failure that formerly covered the
whole umbrella. Missing or ambiguous succession blocks before execution.

## Execution, retry, and evidence adoption

The default focused and terminal runner paths must use the extracted execution,
reliability, and evidence components. No CLI route may bypass their validation by
calling retained legacy logic.

When a boundary task fails:

- the failure remains attributed to that exact task and lifecycle boundary;
- a repair-focused plan closes over only that task, its required predecessors,
  and its declared causal regression or successor coverage;
- already passing unrelated boundary tasks are not rerun unless the repair
  changes their governed inputs;
- a diagnostic run cannot become review-ready evidence; and
- evidence promotion still requires every task in the exact candidate plan.

Execution, checkpoint, reliability, and promotion failures must have distinct
diagnostics and recovery paths. A generic compatibility-facade failure cannot
hide the owning stage.

## Program sequence and autonomous continuation

The implementation proceeds through the following durable stages:

1. candidate/worktree inventory correction;
2. boundary-specific contract extraction behind the existing task;
3. registry, ownership, dependency, task, batching, and historical planner module
   extraction behind the existing façade;
4. execution, reliability, run-intent, evidence, and timing seam extraction;
5. one-to-many task succession and activation of boundary task routing;
6. incremental authoritative manifest migration; and
7. adoption, performance, and delivery-payback scorecards.

Each stage records a durable candidate, its changed boundaries, conservation
proof, focused evidence, observed timings, repaired incidents, and next stage.
Passing that stage's conservation gate automatically starts the next stage after
implementation has been approved. These records are recovery points and progress
reports, not routine user approval gates.

A failed test, regression, flake, merge conflict inside the assigned worktree,
unexpected implementation detail, or missed initial estimate is diagnosed and
repaired autonomously while a credible in-scope path remains. No stage has an
elapsed-time ceiling.

Stop and request the user's decision only when progress requires:

- a new product behavior or externally visible CLI contract outside this
  specification;
- deletion or weakening of an active assertion, task, evidence leaf, incident,
  failure history, package result, or historical-planning safeguard;
- a materially broader verification or repository redesign than these nine
  boundaries and their compatibility migration;
- an unsafe or destructive operation affecting user-owned work;
- external credentials, authority, or information only the user can provide; or
- continuation after measurements show no credible route to the required
  selection or delivery benefit.

Do not stop merely because the program spans more than one night, because a
checkpoint initially fails, or because the user's primary worktree contains
untracked files.

## Conservation gates

Before activating each new default path, prove:

- existing public imports and focused CLI forms remain accepted;
- intentional selection changes are exactly those specified here;
- every former assertion and terminal evidence leaf has one successor;
- current and historical change plans remain conservative for unknown or
  incompatible inputs;
- task ordering, dependencies, browser batches, properties, package inputs, and
  failure recording remain complete;
- diagnostic, review-evidence, repair-focused, and terminal run intents retain
  their distinct authority;
- a behavior-bearing change invalidates earlier candidate evidence; and
- the old policy implementation is deleted or made a delegation-only façade
  before the new path is called adopted.

Moving assertions into directories without changing selection and execution
fails the adoption gate. Adding modules while normal CLI paths retain the old
implementation also fails it.

## Proposed ownership and impact forecast

The coder must run read-only intent classification before production changes.
The following proposal is the starting forecast, not permission to narrow a
coarse path without evidence:

| Proposed source prefix or exact path | Proposed parent | Proposed slice | Exact consumers |
|---|---|---|---|
| `verification/manifests/` | `verification_process` | `registry_inventory` | none |
| `scripts/verification-registry/` | `verification_process` | `registry_inventory` | historical planning |
| `scripts/verification-planner/ownership/` | `verification_process` | `ownership_impact` | task planning |
| `scripts/verification-planner/dependencies/` | `verification_process` | `dependency_expansion` | task planning |
| `scripts/verification-planner/tasks/` | `verification_process` | `task_batching` | execution |
| `scripts/verification-planner/history/` | `verification_process` | `historical_planning` | task succession and evidence compatibility |
| `scripts/verification-execution/` | `verification_process` | `execution_checkpoint` | reliability and evidence |
| `scripts/verification-policy/` | `verification_process` | `reliability_run_intent` | execution and evidence |
| `scripts/verification-evidence/` | `verification_process` | `evidence_promotion` | handoff and promotion validation |
| `scripts/verification-performance/` | `verification_process` | `timing_performance` | throughput reporting |
| `test/verification-contracts/` | `verification_process` | boundary matching each test directory | none |

Existing façades, `verification/packs.json`, and the current process-contract task
remain conservative shared boundaries until the corresponding seam is reviewed.
If read-only intent classifies one as `coarse-boundary`, implementation begins
with an independently reviewed behavior-preserving ownership-preparation stage
and automatically resumes this stable task from the exact QA preparation
descendant. No feature-mode all-runnable-pack run is authorized.

## Verification specification

The executable behavior contract is
`features/verification-registry-planner-modularization.feature`. The specification
commit leaves it executable-unregistered so the handoff remains specification-
only. The coder first registers it under Shell `plannedFeatures`; it moves to the
proposed `verification_process` owner only when its steps and exact process
contracts are implemented.

During construction, roles use the exact boundary contract being changed and its
declared prerequisites. After a stage changes routing or compatibility, its
focused plan must also exercise:

- current and historical registry fixtures;
- product-only Shell exclusion;
- explicit compatibility-alias expansion;
- one-to-many incident succession;
- exact retry closure;
- complete terminal-plan conservation; and
- package proof when the changed boundary can affect packaged inputs.

Feature integration targets current `qa`, uses review-ready focused evidence,
and does not run the all-runnable-pack gate. A later explicit master-promotion
request owns the one canonical terminal gate for the accumulated QA candidate.

The specifier does not run Gherkin mutation. The feature must parse and pass the
vendored APS IR-DRY checker before implementation handoff.

## Completion and payback scorecard

Technical completion requires all of the following observed behavior:

- adding an unrelated untracked file changes no routine validation result or
  plan identity;
- a newly governed unowned candidate path still fails closed;
- product-only Shell changes select zero verification-policy tasks;
- each verification boundary change selects its exact contract and declared
  closure, with zero unrelated boundary tasks;
- the runner executes that narrower plan and the receipt records it;
- an explicit compatibility invocation executes every successor once;
- a terminal plan contains every successor once and never duplicates the alias;
- a boundary repair avoids already-passing unrelated tasks;
- pack-local authoring changes one authoritative fragment and deterministic
  regeneration stays clean;
- current, mixed-migration, and historical registries plan safely; and
- no façade retains duplicate policy logic.

Record before-and-after wall time using comparable environment classes for:

1. a product-only Shell change;
2. one change in each verification-policy boundary;
3. a pack-local manifest change;
4. one repair-focused boundary rerun; and
5. the next naturally requested master-promotion gate.

The product-only Shell comparison succeeds when the complete focused plan
retains its product evidence, excludes all policy contracts, and has a median
wall time at or below two minutes thirty seconds in an environment comparable to
the five-minute baseline. If environment variance prevents the literal threshold,
the exact avoided tasks and their accepted comparable duration must still prove
a material critical-path reduction before technical completion is claimed.

Payback confirmation then uses the next five ordinary QA-integrated product
features and reports:

- approved-specification-to-QA time and role intervals;
- focused verification wall time and number of loops;
- selected and avoided policy tasks;
- failures, repairs, and rerun scope;
- shared-registry or planner conflicts and review corrections; and
- comparison with the 10-to-20-percent portfolio forecast and the applicable
  feature-type forecast.

Recommend continue, adjust, or stop from those observations. Do not manufacture
extra features, extra broad runs, or a calendar boundary merely to complete the
scorecard.

## Non-goals

This program does not:

- change Chrome-extension product behavior;
- remove product acceptance, browser, property, packaging, or terminal evidence;
- resume the stopped VTD-018 candidate or its persistence design;
- activate VTD-011, VTD-016, another VTD-008 slice, or master promotion;
- add a new telemetry service;
- optimize browser observations unrelated to process-policy selection;
- rewrite every pack manifest in one cutover; or
- require the user's primary worktree to be clean.
