# VTD-012 verification registry and planner modularization R01

Status: technical decomposition QA-integrated through `2759c41a2b`; natural
five-feature delivery-payback observation remains open

Prepared: 2026-08-26

## User decision represented by this specification

Prepare one outcome-bounded program that removes the verification registry,
planner, process-contract, runner, and evidence workflow as shared development
bottlenecks. "Overnight" means that the approved program may continue unattended
across as many work periods as its outcomes require. It is not an elapsed-time
budget and it creates no routine phase-by-phase user gate.

The user approved implementation and coder handoff on 2026-08-26. That approval
authorizes every stage below, including required behavior-preserving ownership
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

## Activated specification-owner preparation

Exact preflight for coherent stopped candidate `4bb46a9d` proved the approved
feature path has no historical owner at specification base `74cf0eac58` and gains
owner `verification_process` in the candidate. The planner correctly refuses to
let that candidate create and immediately consume its own historical ownership.
This is `ownership-unavailable` for the product candidate and a bounded standing-
authorized preparation for the already approved specification path.

Task `verification-slice-verification-registry-planner-modularization` starts from
current QA at `74cf0eac58`. It establishes only the historical specification owner:

- add one non-runnable `verification_process` compatibility-metadata pack;
- register `features/verification-registry-planner-modularization.feature` as its
  only `plannedFeatures` entry;
- keep its source, dependency, unit, property, executable feature, handler,
  browser, observation, checkpoint, and package task inventories empty;
- leave the canonical runnable-pack set and every existing task identity,
  selection, dependency, consumer, evidence leaf, and product behavior unchanged;
  and
- add only the minimum deterministic preparation proof needed to validate those
  invariants without importing VTD-012 production implementation.

The preparation's one-time focused bootstrap may admit the otherwise prohibited
`undefined -> verification_process` transition only when all of these facts are
proved before task launch:

1. the exact feature already exists at base `74cf0eac58` and has no registered
   owner there;
2. the candidate assigns that exact path once as a planned feature of the exact
   non-runnable `verification_process` metadata pack;
3. no other current or historical path changes owner;
4. no runnable pack, task, consumer, dependency, package input, or terminal
   obligation is added, removed, or narrowed; and
5. the ordinary current registry validates and the normal terminal inventory is
   byte-for-byte conserved apart from the non-runnable metadata definition.

Any second unowned path, executable task, runnable-pack change, product change,
weakened validation, or attempt to consume candidate `4bb46a9d` as preparation
blocks the bootstrap. The preparation uses only its direct deterministic owner
proof, the existing Shell registry/process validation required by that metadata
change, and package proof when canonical planning selects it. It cannot run an
all-runnable-pack feature gate.

After an architect returns the exact preparation as `qa-ready`, the specifier
fast-forwards QA and automatically reissues stable task
`verification-registry-planner-modularization` from that exact QA commit. Candidate
`4bb46a9d` remains a stopped patch reference: reconstruct or port its task-owned
changes onto the prepared QA lineage, do not merge its stale ancestry wholesale.
The resumed exact preflight must observe `verification_process` as both historical
and current owner of the feature before any evidence task launches.

## Ownership preparation result and product resumption

Ownership preparation candidate `276db16442` is QA-integrated. Its only registry
delta adds the exact non-runnable `verification_process` compatibility-metadata
pack with the approved feature as its sole planned feature and empty source,
dependency, task, executable-feature, handler, browser, checkpoint, and package
inventories. The runnable pack set and terminal task inventory are conserved.

The one-time bootstrap is hard-bound to this task, specification base, feature,
exact registry delta, and exact support-path inventory. Those support changes
make its focused evidence and incident obligations portable and fail closed; they
do not activate the VTD-012 production decomposition or change Chrome-extension
behavior. The reviewed Shell-focused checkpoint passed build, the modular utility
architecture contract, pack-cardinality contract, process contract, and package
proof in 273.405 seconds. No properties or all-runnable-pack feature gate ran.

The bootstrap conserved 49 applicable incident entries. In particular, incidents
`2dbbc9f9-280e-4b00-8ea3-1159f6a5539b`,
`494ddfa3-2926-43bf-b74d-8ceee38f4242`,
`aadcb8c6-393f-4d49-a803-ad1e289411f5`, and
`fd10e821-af43-45c0-b1a5-fe041e9c52b3` remain unresolved with exact-candidate
`terminal-verification-deferred` dispositions. Their immutable broad-attempt
failures were neither abandoned nor represented as passing focused tasks; they
remain obligations of the later explicitly requested QA-to-master terminal
checkpoint.

Stable task `verification-registry-planner-modularization` therefore resumes
automatically from this recording descendant with `276db16442` as its exact
implementation base. Candidate `4bb46a9d` remains a stopped patch reference only.
The coder reconstructs its task-owned behavior on the prepared QA lineage, runs
fresh read-only intent and exact preflight before product coding and evidence,
and continues through the approved durable stages without another routine user
decision or a feature-mode all-runnable-pack gate.

## Activated cross-pack causal repair slice

Coherent stopped candidate `962affc8c2` completes the nine policy boundaries,
passes every focused boundary contract, passes a complete 81-task product-only
Shell plan, and records the adoption scorecard. Its review-scope preflight also
correctly stops before evidence: the candidate includes four repair groups whose
shared paths expand `shell,verification_process` to all 21 runnable packs and
578 tasks. Those repairs restore already-approved inherited behavior, but they
are not part of the VTD-012 product remainder and cannot justify an all-runnable
feature checkpoint.

Standing task `verification-slice-vtd012-cross-pack-repairs` starts from current
QA `23f0284b39`. It reconstructs only the following causal repair groups; the
commits are patch references, not ancestry to merge or cherry-pick wholesale:

| Repair group and patch reference | Development focus | Proposed parent and slice | Exact consumers and QA impact |
|---|---|---|---|
| Inherited Shell and acceptance compatibility, `15f11021` | activation-neutral task, entrypoint, path, and cardinality expectations in `bb.edn`, shared acceptance support, and affected direct contract fixtures | `verification_process` / `cross_pack_acceptance_compatibility` | Shell acceptance; modular architecture; live-target permission path; side-panel preparation; workspace-tabs; review-evidence compatibility |
| Installed schema-contributor browser flows, `31fc1b81` | `src/data-layer-installed/event-library/`, `src/data-layer-installed/runtime.ts`, `src/data-layer-installed/schemas/`, their generated outputs, and direct tests | `schemas` / `installed_contributor_coordination`, with `event-library` and `shell` consumers | installed schemas controller; Event Library test-case review; guided-test-cases, property-set-flow-sections, Shell, and layered-schema browser targets |
| Shared side-panel browser synchronization, `1bb4ae05` | permission-dialog state and matching fixture discovery in the shared browser session support | `shell` / `side_panel_permission_fixture` | the side-panel browser session contract and every selected target that uses the shared session fixture |
| Modular-architecture acceptance matching, `bdfab2fa` | exact phrase matching in the VTD-014 and VTD-015 modular-architecture handlers | `verification_process` / `acceptance_step_isolation` | the modular-architecture acceptance session only |

The repair-only candidate must be independently understandable and revertible.
For every hunk it records the causal failing contract, the existing approved
behavior it restores, its direct verification consumer, and its disposition in
one of the four groups above. A mixed hunk is split; a hunk that implements a
VTD-012 boundary, successor contract, manifest migration, compatibility alias,
or adoption scorecard remains exclusively in the preserved product remainder.
The reconstruction starts from current QA and must not inherit any other file
from `962affc8c2`.

The installed contributor repair preserves the current active specifications:
durable hydration replaces only the active project's compatibility projection;
another project's notification cannot replace it; all installed contributor
kinds continue through the existing compact canonical editor, command,
settlement, Undo, and Redo contracts; reopening or hydrating retains the intended
selection and scroll state; and Event Library test-case review remains accessible
and bound to the selected project without guessing relationships. This is a
causal restoration, not authority for another schema-editor design.

The standalone review route is bounded by causal work, not the catalogue count.
Before launch, read-only intent must bind the exact four-group change set and
prove every included task is a direct contract, declared prerequisite, or exact
consumer of one of those groups. Fresh evidence must cover the complete causal
union, the affected browser targets, generated source parity, properties where
selected, and package proof. It must also prove that excluded packs have no
changed owned input or consumer edge. Unknown ownership, an unclassified hunk,
missing direct consumer, product behavior outside the active contracts, or a
request for an all-runnable feature run blocks before execution.

After architect `qa-ready` integration, the specifier records the repair result
and automatically reissues stable task
`verification-registry-planner-modularization` from that exact QA descendant.
The coder reconstructs the conserved VTD-012 remainder from patch reference
`962affc8c2`, subtracts every integrated repair hunk, and records the conservation
identity. Exact preflight must then use the repaired historical base to select
only `shell,verification_process` and the nine successor contracts plus declared
prerequisites. The 81-task product-only Shell scorecard remains evidence of
partial payoff rather than fresh review-ready proof.

Throughout both slices, incidents
`2dbbc9f9-280e-4b00-8ea3-1159f6a5539b`,
`494ddfa3-2926-43bf-b74d-8ceee38f4242`,
`aadcb8c6-393f-4d49-a803-ad1e289411f5`, and
`fd10e821-af43-45c0-b1a5-fe041e9c52b3` remain unresolved
`terminal-verification-deferred` obligations. Neither slice abandons, resolves,
reclassifies, or copies them, and neither runs the all-runnable feature gate.

## Cross-pack causal repair result and product resumption

Repair candidate `bb8d05ae64` is QA-integrated from exact specification base
`c2cc6daaa6`. Its 59-path change set independently reconstructs the four
approved repair groups and the causal corrections discovered while exercising
their direct consumers: installed contributor settlement and project isolation,
shared permission and Shell readiness synchronization, exact acceptance phrase
matching and compatibility expectations, and the direct workspace, durable,
Flow, Layered Schema, and Schema evidence needed to prevent those repairs from
regressing.

The exact review-evidence plan selected 16 affected packs and 533 tasks with
properties and package proof. All 533 tasks passed. The summed task duration was
1,517.598 seconds; parallel execution completed the review interval in
1,229.227 seconds, and the fresh package task took 0.959 seconds. Plan digest
`2c058b9209c1daec4355b503aabc3f03b8dd958a95009232b273fdb86aba00ae`
and receipt digest
`9b2a6e62e947db4070f2492682875ed3d09b15f612e6ab4ad6f236553cfd3c6e`
bind that result to tree `09124b5c7648`. No all-runnable feature gate or
terminal-full obligation ran.

The repair candidate does not contain the nine VTD-012 production boundary
modules, successor contracts, manifest migration, compatibility alias, or
adoption scorecard from stopped candidate `962affc8c2`. That candidate remains a
patch reference only. Incidents
`2dbbc9f9-280e-4b00-8ea3-1159f6a5539b`,
`494ddfa3-2926-43bf-b74d-8ceee38f4242`,
`aadcb8c6-393f-4d49-a803-ad1e289411f5`, and
`fd10e821-af43-45c0-b1a5-fe041e9c52b3` remain unresolved terminal obligations;
the feature-mode repair neither reclassified nor abandoned them.

Stable task `verification-registry-planner-modularization` now resumes
automatically from the documentation-only recording descendant of
`bb8d05ae64`. The coder reconstructs the conserved product remainder from
`962affc8c2`, removes every hunk already represented in the integrated repair,
and records the conservation identity. Fresh exact preflight must bind the
repaired historical base, select only `shell,verification_process` and the nine
successor contracts plus declared prerequisites, and run new review evidence.
The earlier 81-task product-only Shell result remains a payoff comparison, not
review-ready evidence for the resumed candidate.

## Verification specification

The executable behavior contract is
`features/verification-registry-planner-modularization.feature`. The original
specification commit left it executable-unregistered. The activated preparation
registers it as a planned feature of the non-runnable `verification_process`
metadata owner; the resumed implementation activates that same pack and feature
only when its steps and exact process contracts are implemented.

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

## Policy-boundary integration result and delivery scorecard

Policy-boundary candidate `8340dd220c` is QA-integrated from exact recording base
`db157699df`. The candidate contains no Chrome-extension `src/` or `dist/`
change. It activates `verification_process`, extracts the nine approved policy
boundaries, routes each boundary path to its own contract and declared
prerequisites, and makes the old process-contract command a 15-line delegation
facade that executes the nine successors once in canonical order.

The 12,225-line construction-time legacy checkpoint is absent from the final
tree. Normal focused and terminal plans schedule neither a legacy checkpoint nor
the compatibility alias. Exact conservation is instead bound by a committed
inventory of 1,289 assertion occurrences, 74 fixture occurrences, and seven
evidence occurrences with one exclusive successor owner for each occurrence.
The terminal planner retains every successor once. A product-only Shell path
selects no `verification_process` pack or successor contract. Candidate inventory
uses the task worktree's governed Git state, so unrelated primary-worktree
artifacts remain outside validation and evidence identity.

Exact review evidence selected only `shell,verification_process`, properties,
and package proof. All 108 tasks passed. The review interval completed in
518.277 seconds from 823.067 seconds of summed task duration; the fresh package
task took 0.964 seconds. Plan digest
`aa9188dfbf2841d5ea0ec6725279f94eb5b5ec17aabadd3cc4d274027941fceb`
and receipt digest
`9ced9ff2968763a1c36e4195ff027126b4f7e2bf290c9253c035ce530f296521`
bind the result to tree `466c0324f618`. No all-runnable feature gate or
terminal-full obligation ran.

The comparable product-only Shell scorecard is a partial payoff, not the full
forecast. Its complete 81-task plan passed in 265.981 seconds against the
accepted roughly 300-second baseline, selected zero policy contracts, and
avoided all nine successors and the former 181.447-second umbrella task. It did
not reach the 150-second target because its 164.508-second installed reorder
browser observation remained the critical task. The result proves default
policy isolation and an observed 11-percent wall-time improvement; it does not
prove the forecast 15-to-30-percent Shell improvement or a general
specification-to-delivery reduction.

The final repaired resumption ran from the coder handoff at
2026-08-27T17:25:13Z to architect `qa-ready` at
2026-08-28T11:42:16Z, an elapsed 18 hours 17 minutes. Much of that interval was
spent discovering acceptance, ownership, and conservation differences serially.
The final boundary-owned conservation fixture corrected the architecture, but
this task's own elapsed implementation process is not evidence of the intended
delivery-time payoff. Future topology migrations should compute and classify one
complete base-to-candidate inventory delta before repeated acceptance execution.

Incidents `2dbbc9f9-280e-4b00-8ea3-1159f6a5539b`,
`494ddfa3-2926-43bf-b74d-8ceee38f4242`,
`aadcb8c6-393f-4d49-a803-ad1e289411f5`, and
`fd10e821-af43-45c0-b1a5-fe041e9c52b3` remain unresolved terminal obligations.
They were not reclassified, resolved, or abandoned by this feature integration.

Recommendation: retain the policy-boundary adoption, complete the already
approved manifest-decomposition stage below, and then measure both across the
next five ordinary product features. Record actual selected and avoided tasks,
focused loops, role intervals, repairs, and wall time without adding a separate
broad run. Do not activate another enabling VTD item or claim the portfolio
forecast from this result; adjust or stop further decomposition after the five
observations if ordinary delivery does not materially improve.

### Post-adoption contract-conservation maintenance

The committed 1,289 assertion, 74 fixture, and seven evidence occurrences are
the immutable VTD-012 baseline, not a disposable snapshot. Later approved
contract evolution may replace an occurrence, but cannot make the check green
by deleting that baseline entry or silently accepting every leaf currently in a
successor file.

Maintain one canonical append-only ledger. Each generation binds the exact nine
owner-source SHA-256 values and the complete retained, added, and transitioned
occurrence inventory. Each transition binds one exact prior occurrence to its
exact successor occurrence, exclusive owner, and ancestral approved contract.
The original legacy provenance, totals, inventory, and entry order remain
unchanged. The read-only check compares both directions: every ledger occurrence
must exist with its declared cardinality and owner, and every derived current
occurrence must be present in the current generation. An addition, deletion,
replacement, owner move, duplicate, source-byte change, or ordering change is
therefore visible rather than being accepted as an untracked extra.

An explicit refresh command may write only the deterministic manifest delta. It
must refuse an absent transition for a removed or reassigned prior occurrence,
a non-ancestral authority, an ambiguous or missing successor, a changed owner
set, or a task-local exemption. Ordinary tests and evidence runs use check mode
and never rewrite the fixture from environment authority. The checked diff and
focused review evidence remain the approval boundary for a refreshed generation.

Baseline immutability is anchored outside the writable manifest. Its exact
source is commit `a62bde42ab1b9ec4471517ec028a2b368ef46139`, path
`test/fixtures/verification-process-contract-conservation.json`, SHA-256
`7ea22d66d9c499f2971a906f2d6753862c8506665da3a9d4fa793ef1242070b2`.
The current manifest's version, owners, provenance, totals, inventory contents,
and inventory order must equal that historical projection before transitions or
generations are evaluated. Self-consistent edits to those fields are invalid.

An ancestral commit is necessary but insufficient transition authority. For
each transition, load the feature blob at its declared authority commit and
canonical path `features/modular-verification-packs.feature`; require the exact
Scenario 221 comment, Scenario Outline name, and one exact Examples row binding
the prior leaf, owner, governing contract, and successor leaf. The four cells
are one indivisible authorization. A supplied alternate path or scenario,
cells borrowed or swapped between rows, a candidate-authored mapping, or an
unrelated existing successor fails both check and refresh. Refresh derives its
permitted transitions only from authenticated rows and has no free-form
deletion, weakening, or replacement input.

Authority discovery is also one runtime-owned operation. Check, refresh, and the
direct registry-planner aggregate enumerate the complete distinct authority
commit population from all manifest transitions and generations; refresh adds
its requested authority before validating or writing. Each route applies the
same Git-ancestry proof and the existing exact transition-row authentication.
No route may maintain a fixture-specific commit list or accept a caller-asserted
set as proof. A newly appended valid generation therefore becomes visible to
every route without editing a second allowlist, while an absent, non-ancestral,
unreadable, or unauthenticated authority still fails closed.

## Full pack-manifest decomposition completion

The user confirmed on 2026-08-28 that retaining heavily centralized pack
declarations does not satisfy the requested decomposition. QA currently has one
authoritative fragment, `verification/manifests/verification-process.json`, while
the other 21 pack objects remain in the 8,101-line hand-authored
`verification/packs.base.json`. The compiler and mixed-registry proof are a pilot,
not completion of the outcome at lines 124-147 above.

This was unfinished work inside the existing approved VTD-012 program, not a new
VTD item. Stable task `verification-registry-planner-modularization` resumed from
QA recording commit `c7409bea` and migrated every remaining pack declaration
before technical completion was restored.

The settled registry shape is:

- every registered pack has exactly one authoritative
  `verification/manifests/<pack-id>.json` declaration;
- `verification/packs.base.json` is removed or contains no pack object;
- `verification/packs.json` remains the generated historical-compatibility
  representation and is byte-identical before and after the declaration move;
- pack identity, order, ownership, dependencies, consumers, task identity,
  batching, evidence leaves, budgets, calibrations, and terminal inventory are
  unchanged; and
- normal work on one pack edits its local fragment and mechanical generated
  output, never another hand-authored pack declaration.

The non-goal against rewriting every manifest in one cutover permits durable
migration stages; it does not permit stopping while any pack remains centrally
declared. The existing `verification_process` fragment is the required
low-coupling pilot. The remaining migration now proceeds without another pilot
or user gate.

To avoid repeating the inefficient construction history, the coder first records
one complete 21-pack migration ledger containing each source-object digest,
destination fragment, canonical order, and expected compiled digest. It then
constructs every fragment mechanically before acceptance reconciliation. Direct
registry, historical-planning, and task-planning contracts must aggregate every
difference in one pass. Durable commits may group the mechanical moves, but they
do not trigger a broad evidence run per pack. One exact focused review runs only
after the complete conserved candidate is ready.

Any canonical-byte change, reordered declaration, changed task or owner,
duplicate authority, missing pack, ambiguous historical load, or need for an
all-runnable feature gate blocks before evidence and is repaired within this
stage. The user's `artifacts/` tree and
`scripts/create-flow-property-table-template.mjs` remain outside candidate
inventory. The four named terminal-deferred incidents remain unresolved and are
neither copied, reclassified, nor resolved by this migration.

Manifest-migration candidate `2759c41a2b` is QA-integrated. All 22 registered
packs now have one fragment whose filename exactly matches its pack identity,
`verification/packs.base.json` contains `[]`, and the generated canonical
registry retains pre-migration digest
`15f0982af0874fdf863a1892cb22beff06c2d9ac550277a36ed6ca9a88b5a65a`.
The committed migration ledger binds all 21 moved source objects to their
destination, order, object digest, and compiled digest. No Chrome-extension
product source or generated `dist` path changed.

The construction followed the corrected efficient sequence. It produced the
complete mechanical migration and two bounded fixture corrections in three
commits, then ran one final exact review. From the specification handoff at
2026-08-28T12:35:15Z to architect `qa-ready` at
2026-08-28T13:45:20Z, the correction elapsed 1 hour 10 minutes 5 seconds.

Exact review evidence selected only `shell,verification_process`, properties,
and package proof. All 108 tasks passed. The review interval completed in
523.310 seconds from 829.328 seconds of summed task duration; the fresh package
task took 0.941 seconds. Plan digest
`6faed69cbc1e6e5f8c31ced9f7e5ec0ed9c43a9c8deaa69c6d7a683f87553d99`
and receipt digest
`a6f767b3d60cdbc18e5b07c049e84ef2c8e4a505cddc3e8e1e9ddd72783ef589`
bind the result to tree `77254f26cc1e`. Neither the legacy compatibility alias
nor an all-runnable or terminal-full checkpoint ran.

The four named terminal-deferred incidents remain unresolved and absent from
the candidate's reliability resolutions. Technical decomposition is now
complete. The remaining five-feature scorecard is passive outcome observation:
it records naturally requested work and does not authorize another refactor,
feature, broad run, or user gate.

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
- every registered pack has one authoritative local manifest and no pack remains
  in a hand-authored central base registry;
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
