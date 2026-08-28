# Verification task-checkpoint incident repair R01

Status: standing-authorized for coder handoff on 2026-08-28 under the
outcome-bounded autonomy and stacked-campsite contract

## Objective

Prevent a failed parallel review-evidence task from leaving sibling tasks live
while repair work begins, and make runner-created task-checkpoint incidents
repairable through the same immutable causal-proof lifecycle as other
reliability incidents.

This is a verification-process prerequisite for stable product task
`event-library-target-page-push-closure`. It does not change Event Library
behavior, weaken incident blocking, add an unchanged retry, authorize an
all-runnable-pack feature run, or create a one-off exception for the observed
incidents.

## Reproduced boundary

Review-evidence run `bdc7122f-c744-4064-b8c8-1dc42717869b` on candidate
`de90a7238c4a988fdb0a9113a744801db230d6dd` first recorded the legitimate
nonzero-exit incident `7d6cfd80-fda4-4c10-9c26-ede4b43a526a` for
`unit:test/side-panel-single-cutover-preparation-test.mjs`. The assertion proved
that five additive inventory leaves changed a canonical installed-assertion
digest.

While other unit workers from that run were still active, the product
correction changed the tracked inventory file. The checkpoint guard correctly
stopped two not-yet-launched tasks and recorded immutable
`execution-contract-failure` incidents:

- `046f498d-a4b9-4b29-8630-80ce2eec2387` for
  `unit:test/verification-contracts/timing-performance-contract-test.mjs`; and
- `64aa270e-787c-4d3d-9378-efdfba615039` for
  `unit:test/verification-contracts/evidence-promotion-contract-test.mjs`.

Both failures have boundary kind `checkpoint-identity`, operation `task`, stage
`unit`, and the tracked path
`test/side-panel-single-cutover-preparation-test.mjs`. They intentionally have
no `retryScope`. That is correct for unchanged diagnostic retry, but
`timeoutRepairDiagnosedBoundary` also rejects them, so an autonomous causal
repair cannot become eligible even after the worktree is clean and the runner
defect is fixed.

## Failure-quiescence contract

The bounded parallel scheduler and command runner must establish one durable
failure-quiescence barrier for every incident-aware evidence stage:

- The first task failure closes that stage to new task launches.
- Every already-running sibling receives coordinator-owned termination, using
  the existing graceful termination deadline and bounded force-kill fallback.
- The runner waits until every sibling process and its output, receipt, and
  cleanup callbacks have settled before it exposes the stage as failed or
  permits repair work to start.
- Coordinator-cancelled siblings are recorded as cancelled by the failed stage,
  not as task failures and not as reliability incidents. A sibling that had
  independently failed before cancellation retains its own ordinary incident.
- The checkpoint attempt records the causal failed task, cancelled and
  unstarted tasks, termination results, and a durable `quiesced` boundary. A
  resume or mutation is rejected until that boundary is complete.
- A runner, agent, or host interruption continues to use the existing durable
  interruption and stale-owner recovery rules. The new barrier cannot blindly
  delete a lease, invent passing evidence, or reuse results from another
  candidate.

The implementation may compose this contract entirely inside the existing
`scripts/verification-execution/` slice. It must not weaken the checkpoint
identity guard: an external or premature tracked mutation still creates the
normal execution-contract incident.

## Task-checkpoint causal-repair route

Add a repair-only boundary derivation for an immutable incident when, and only
when, all of these are true:

- the failure class is `execution-contract-failure`;
- the failed boundary is exactly `checkpoint-identity` with operation `task`;
- the incident task has a nonempty canonical key, non-promotion stage,
  executable, argument vector, pack identity, and required-capability vector;
- the immutable incident envelope binds the incident id, failure digest, source
  receipt, run id, and task, while that receipt binds the same run, candidate,
  exact canonical plan, and task identity;
- the task exists uniquely in the failure-commit registry and its canonical
  digest matches the incident; and
- the checkpoint observation proves identity drift before the task launched.

For that route, derive a repair boundary of kind `task` from the receipt-bound
canonical task identity and execution arguments. This derived boundary is
available only to governed causal-repair planning. Do not add or backfill
`failure.retryScope`, permit an unchanged diagnostic retry, rewrite the source
receipt, or mutate the immutable failure.

The two preserved task-checkpoint incidents predate bounded causal identity and
therefore also lack `failure.causalKey` and `failure.registryDigest`. Derive one
versioned repair-only causal key from the incident id and failure digest, source
receipt digest and registry digest, canonical task digest, and failed-boundary
digest. Persist it in the repair proof, never in the immutable failure. Existing
eligible-repair validation and admission may use that key only after the whole
task-checkpoint route above validates; a present but mismatched failure causal
key or registry digest remains blocking. This compatibility is exclusive to the
validated prelaunch task-checkpoint shape and cannot classify an arbitrary
legacy incident as repairable.

Repair eligibility still requires a changed candidate, a named bounded causal
category and explanation, a deterministic regression that fails before and
passes after the repair, fresh focused execution of the derived task boundary,
and the existing exact-candidate repair protocol. Missing receipts, mismatched
digests, unknown or ambiguous tasks, non-task checkpoint operations, task
succession without conservation proof, dirty repair candidates, and absent
causal regressions remain blocking.

Promotion checkpoint, environment-contract, browser logical-boundary, ordinary
task-retry, eligible-repair admission, and terminal-resolution semantics remain
unchanged.

## Preserved incident disposition and product resumption

Keep all three incidents unresolved and immutable. Deterministic fixtures may
reproduce their shapes; tests and implementation must not edit the live records.

- `7d6cfd80-fda4-4c10-9c26-ede4b43a526a` receives the product candidate's
  canonical-inventory repair and its focused preparation-contract proof.
- `046f498d-a4b9-4b29-8630-80ce2eec2387` and
  `64aa270e-787c-4d3d-9378-efdfba615039` each receive the runner
  failure-quiescence repair, the same deterministic cancellation regression,
  and fresh execution of their own exact governed unit task.
- Each proposal remains independently bound to its incident and failure digest.
  A single explanation, synthetic catch-all incident, deletion, abandonment,
  or compatibility classification cannot dispose of the three records.
- After each repair is eligible on the resumed exact product candidate, the
  existing ordinary eligible-repair admission route must admit all three into
  one fresh canonical owned-pack review run. It adds no task, resolves no
  incident, and atomically records review-ready evidence plus three matching
  terminal deferrals only after fresh selected coverage and package proof pass.

Before process coding, preserve the existing product as a first-class campsite
remainder with these immutable identities:

- split base and approved specification:
  `621200ae083a31f25ac03727fbb845600cd1d64a`;
- remainder head: `0cab2f7b363d09c89b97037d043148c1f5dc5689`;
- remainder tree: `bf89b098ad0e0ac67da2a0f02efeb5b41434233b`;
- ordered commits: `de90a7238c4a988fdb0a9113a744801db230d6dd`, then
  `0cab2f7b363d09c89b97037d043148c1f5dc5689`; and
- canonical complete change-set digest:
  `3a4325e5df508dfafdf65d1d24765307f08fa95824494b34505f983412033b0a`.

That digest was the documentation calculation before preservation. The
immutable runtime manifest records
`0f1194bd3a45b67182b3223e7857323070650737b5f9108b2ff06fff1e2e26dc`
as both its change-set digest and expected delta; that stored identity is
authoritative for recovery and must not be rewritten.

The campsite records the exact committed specification handed to the coder as
prerequisite authority; that specification is not implementation satisfaction.
The stable product task remains `event-library-target-page-push-closure`, and
the return route remains coder to refactorer after fresh product evidence. Only
after an implementation of this process prerequisite includes the latest
placement correction, receives architect `qa-ready` review with bound focused
evidence, and reaches QA may the QA-triggered helper rebase or reapply the
unchanged two-commit remainder onto that exact QA head. Follow
`docs/campsite-implementation-prerequisite-gate-R01.md` for the immutable
satisfaction record and the append-only recovery of premature resumed head
`9273c9c903`. Do not reconstruct the remainder manually or reduce it to a patch
reference.

## Exact ownership placement correction

Candidate `a606f6588a8a16bfeddd3002eb11988cc0c027c4` proves the behavioral
implementation is bounded but places its stage-cancellation scheduler in
`scripts/shared-artifact-parallel.mjs`. Exact plan-only readiness correctly
classifies that path as `genuinely-global`: 21 packs and 914 tasks, with no
credible reviewed boundary. No task may launch from that plan.

Correct placement without an ownership exception:

- `scripts/shared-artifact-parallel.mjs` must be byte-identical to
  specification base `963204f773aa7a91418f41c5853239847a94af32` in the
  corrected exact change set. Its existing scheduling, artifact-lease,
  browser-worker, and exported helper semantics remain unchanged.
- The incident-aware fail-fast bounded-stage coordinator belongs under the
  existing `scripts/verification-execution/` prefix and subordinate
  `execution_checkpoint` slice. `execute.mjs` may consume that local
  coordinator while reusing unchanged shared artifact primitives.
- Do not change `verification/packs.json`, add a global-impact exception,
  reclassify the shared file, narrow historical ownership, or claim that the
  candidate's own new ownership proves its evidence scope.
- Deterministic execution-checkpoint tests must prove first-failure closure,
  sibling termination and drain, independent-failure retention, cancellation
  receipt semantics, and shared-helper blob conservation against the
  specification base.
- The existing focused passes on `a606f658` remain useful diagnostics only.
  They are not review-ready evidence for the corrected candidate.

A read-only replay of every known candidate path except the global helper, plus
a local `scripts/verification-execution/` coordinator path, is `bounded-ready`:
exact packs `shell` and `verification_process`, 82 tasks, no expansion cause,
and no terminal-full obligation. The corrected committed candidate repeats
exact preflight. Any remaining global-helper change, new expansion cause,
registry exception, or all-runnable-pack plan remains blocking.

## Bounded child-plan containment correction

Candidate `ca1a21a683bea23c19ceb992560e2af12493039a` implements the campsite
prerequisite gate and officially quarantines premature resumed head
`9273c9c903` while the original product task remains parked. Its read-only exact
plan is bounded to `shell` and `verification_process`.

During exact review-evidence run `a75732cd-0958-4dc5-a85e-dbbd4c01c04a`, the
registered `unit:test/modular-utility-architecture-test.mjs` task invoked the
production `runFocusedAcceptance` entrypoint twice with an injected command
runner. Those calls constructed real production-registry child plans of six
packs and 441 tasks, then terminal 21 packs and 935 tasks. The separately
registered `unit:test/package-clean-checkout-contract-test.mjs` passed and is
not the causal task. The interrupted parent receipt and every child receipt or
plan observation are diagnostic only and cannot be promoted, resumed, or used
as review-ready evidence.

Stable nested correction task: `bounded-evidence-child-plan-containment`.

Every production verification task launch must carry a reserved, parent-bound
execution context covering the parent receipt and run IDs, run intent,
candidate and tree, exact parent task key, authorized task-set digest, plan
digest, and launch authorization. If the production runner observes that
validated context, it rejects a nested production invocation before it creates
a child receipt, prints a plan summary, allocates launch authorizations, calls
an injected runner, or starts a task. Requested subset, pack list, diagnostic
mode, repair mode, terminal mode, and injected command runner cannot bypass the
guard. The current verification contract authorizes no recursive production
runner inside a registered task; adding one is a separate specification.

Missing, malformed, stale, or mismatched claimed parent context also fails
before child side effects. The parent records one ordinary task failure and the
existing bounded-stage coordinator closes, terminates, drains, and preserves
independent failures as already specified. No child receipt, incident,
terminal obligation, passing task result, or evidence claim is created.

Tests that need to inspect current broader topology use pure option and planner
functions without invoking the production runner. Tests that need child-runner
behavior use an isolated synthetic registry, receipt directory, and reliability
store whose identities cannot be admitted as production evidence. The
clean-checkout package contract may continue its direct `build.mjs` and
`package.mjs` subprocesses; they are not recursive verification-runner entry
points, and its package semantics remain unchanged.

The corrected descendant retains all behavior from `ca1a21a6`, repeats exact
plan-only readiness from specification base `6c20da62`, and runs one fresh
bounded review-evidence plan with properties and package proof. It cannot reuse
the interrupted receipt. Any production child plan, missing inherited binding,
all-runnable-pack child, or weakened direct contract remains blocking.

## Development focus and QA impact

Stable prerequisite task: `verification-task-checkpoint-incident-repair`.

Development focus is fail-fast parallel-stage cancellation and quiescence,
cancelled-task receipt semantics, exact task-checkpoint repair-boundary
derivation, bounded child-plan containment, rejection fixtures, and the
three-incident resumption path. Likely existing integration surfaces are:

- `scripts/verification-execution/execute.mjs` and
  `scripts/verification-execution/runner.mjs`, plus a local bounded-stage
  coordinator under the same prefix, under subordinate slice
  `execution_checkpoint`;
- `scripts/verification-reliability-repair.mjs` under subordinate slice
  `reliability_run_intent`;
- `scripts/verification-execution-prerequisites.mjs`,
  `scripts/verification-policy/reliability/run-intent.mjs`, and their direct
  execution-checkpoint and reliability-run-intent contract tests for inherited
  parent authorization and fail-closed child invocation; and
- `test/modular-utility-architecture-test.mjs` for pure planner coverage with no
  production child runner.

The stopped coherent candidate paths at `ca1a21a6` remain part of intent replay:
its campsite artifacts/runtime/store/control, task-checkpoint, bounded-stage,
execution, run-intent, reliability repair/store, modular architecture and
SwarmForge handlers, and their direct tests. The correction may add only the
existing execution-prerequisite surface named above; it proposes no new source
prefix or consumer.

The correction's read-only replay from `6c20da62`, including every stopped
candidate path and the child-run guard, is `bounded-ready`: exact packs `shell`
and `verification_process`, 89 tasks, no expansion cause, and no terminal-full
obligation. The coder repeats read-only intent before coding and uses exact
committed changed-path planning before evidence. The settled process candidate
runs only its canonical bounded plan with properties and package proof. The
global shared-artifact helper stays unchanged. No Gherkin mutation or
all-runnable-pack feature checkpoint is authorized.

The process implementation-and-review effort ceiling is four active hours. At
two active hours report cancellation/quiescence status, repair-boundary
validation, preserved stack status, exact packs and tasks, failures, remaining
work, confidence, and forecast. Continue while behavior and evidence strength
remain unchanged and the completion path stays bounded.

## Registered aggregate child failure routing correction

Legacy campsite candidate
`b3ef82623fb7d27f184d8fc9ef1dbf3d35e7e670`, tree
`20f3bf01941149034fcc629cd163dc93d5329080`, is a coherent six-file descendant
of exact QA `fa9a595024a9c68f44b52d4b4a8b89f59b935511`. Its direct campsite
contracts passed, its read-only and committed plan remained bounded, and every
preserved Event Library campsite artifact remained byte-identical. Keep this
candidate as an immutable parked remainder; it is not rejected and must not be
rerun, repaired, or mixed into the verification-process correction.

Its Shell review-evidence receipt
`tmp/verification-receipts/1201128-1d321a66-5907-4ad7-8546-5262a4c45ab1.json`,
SHA-256 `682cba620616115f181d5ebef93d0070f4ae988a98e314550a6925639e4b49df`,
created immutable incident `39b11f5e-e0f4-49c0-8709-b9bd6845df29` with failure
digest `39e793128964a1a0a3d616506f8307b86df7e4e77f5e5e8883609858b2212c9f`.
The recorded task is the Shell-owned
`browser-observation:REORDERABLE_EDITOR_CONTROLS_BROWSER_ADAPTER`, classified
`incomplete-result` because its aggregate emitted no target timing after a
child failed.

The immutable receipt proves that the declared `flow_export` child command
`node test/browser-packs/flow-table-documentation-export.mjs` failed at both
declared viewport invocations with `Deselected matrix context was not durably
saved`. That command maps uniquely to canonical task
`browser:test/browser-packs/flow-table-documentation-export.mjs`. The aggregate
retained only its coarse parent retry scope, so neither an aggregate retry nor a
Flow product change currently has governed child-task authority.

Stable correction task: `aggregate-child-failure-routing`.

For future registered aggregates, require an immutable parent-bound declaration
for every direct child command. Each declaration maps the child id, executable,
arguments, and allowed invocation-environment projection to exactly one
canonical task in the candidate registry. A child may not infer ownership from
free-form stderr, inherit an undeclared command, or claim a task from another
run, candidate, parent, or environment.

Every child completion records its parent run and task, candidate and tree,
canonical child task and digest, invocation identity, exit result, bounded
output digests, and completion status. The first failed child closes the
aggregate to new launches; already-running children are terminated or drained
under the existing bounded quiescence rules, and independently manifested
failures remain distinct. The parent aggregate still emits its own logical-
target timing and failed result. A missing child outcome, parent completion, or
drained boundary is a process-contract failure, not a fabricated child cause.

The runner retains the parent task as the failed plan member but makes the exact
validated child task the causal identity and normal retry-or-repair boundary.
The existing one-diagnostic allowance, confirmed-flaky classification, changed
causal repair, deterministic regression, fresh focused child execution,
eligible-repair admission, and terminal deferral rules then apply without
special cases. The aggregate itself runs again only as fresh canonical review
evidence after the governed child disposition; it is not the diagnostic retry
fallback.

The observed incident predates this child-result protocol. Add one append-only
compatibility binding for its exact incident id, failure digest, source-receipt
digest, run `38241b21-6c04-4912-9f52-9195b85410aa`, candidate and tree, parent
task, canonical Flow-export child task, command, and the complete 1280- and
360-pixel invocation set. The binding derives only the repair-time causal task
and ordinary child scope. It does not rewrite the incident or receipt, classify
the failure, consume a diagnostic allowance, create passing evidence, or act as
a general stderr parser. Missing, duplicated, stale, superseded, mismatched, or
role-local-only proof blocks before any child execution.

After this routing correction is independently reviewed and reaches exact QA,
reissue the unchanged `b3ef8262` campsite remainder on that QA descendant. The
normal child diagnostic or repair route may then classify and settle the exact
Flow-export cause. Only a changed exact candidate with the required child proof,
fresh canonical aggregate evidence, properties, package proof, and the normal
incident disposition may continue campsite review. Incident deletion,
abandonment, manual disposition, a coarse aggregate retry, or a product change
outside the governed child route is prohibited. Event Library product remainder
`0cab2f7b36` and premature result `9273c9c903` remain parked and unchanged.

### Correction development focus and QA impact

Likely integration surfaces are the Shell-owned
`test/browser-packs/reorderable-editor-controls.mjs`; the existing
`scripts/verification-execution/` child-result parsing and bounded-stage
surfaces; `scripts/verification-reliability-repair.mjs`; the task-checkpoint and
run-intent acceptance handler; and their direct execution-checkpoint and
reliability-run-intent contract tests. Use the existing prefixes and owners; no
new source prefix, registry pack, or global-impact declaration is proposed.

Read-only intent from exact QA `fa9a595024` is `bounded-ready`: exact packs
`shell` and `verification_process`, 84 tasks, no expansion cause, and no
terminal-full obligation. The coder repeats intent before coding and exact
plan-only readiness on the first coherent commit, then runs only the exact
committed plan with properties and package proof. Synthetic deterministic child
fixtures prove failed completion, quiescence, registry mapping, compatibility
binding, and every fail-closed mismatch without rerunning the live incident or
the parked aggregate. No Gherkin mutation or all-runnable-pack feature
checkpoint is authorized.

The implementation-and-review effort ceiling is four active hours. At two
hours, report the child-result protocol, parent completion, quiescence,
compatibility identity, exact packs and tasks, conserved candidate and incident,
remaining work, confidence, and forecast. Continue while the routing and
evidence scope remains bounded and no product behavior is changed.

## Blocked aggregate evidence preparation

Routing candidate `777017aae2a9995aa36cd6e007844f2dd63e814e`, tree
`15f64f31fa46c1eb7287b2fab351a5ea2178a95d`, is a coherent eight-file direct
descendant of specification commit `cc6a216334cb6606e1f733bcd0197087a52594a3`.
Its synthetic child-result and legacy-binding contracts pass. Keep this exact
candidate and its implementation patch parked and immutable: its canonical
`shell` plus `verification_process` plan contains 88 tasks, including the live
`browser-observation:REORDERABLE_EDITOR_CONTROLS_BROWSER_ADAPTER` aggregate.
Executing that aggregate would reproduce the prohibited parent and Flow child
before the routing correction that governs their result reaches QA.

Stable preparation task: `blocked-aggregate-evidence-preparation`.

Implement one reusable fail-closed evidence preparation on exact QA
`cc6a216334cb6606e1f733bcd0197087a52594a3`. The preparation itself is owned
only by `verification_process`; read-only intent is `bounded-ready` with six
tasks, no expansion cause, and no terminal-full obligation. Its allowed paths
are the evidence core and runner, reliability run-intent policy and one local
blocked-aggregate evidence helper, and the direct reliability-run-intent and
evidence-promotion contract tests. It must not change the Shell aggregate,
product code, registry ownership, Gherkin handlers, the parked candidate, the
incident store, or its source receipt.

The preparation admits no generic task exclusion. It recognizes at most one
canonical aggregate task when all of these identities agree before launch:

- one immutable unresolved incident and its failure and source-receipt digests;
- the incident run, candidate, tree, parent aggregate, exact causal child,
  declared command, and complete invocation-environment set;
- the approved routing correction task and its exact candidate commit, tree,
  change-set digest, canonical plan digest, and selected blocked parent task;
- a deterministic synthetic task selected by that same canonical plan which
  exercises the changed child-result, parent-completion, quiescence, mapping,
  and legacy-binding behavior; and
- a clean verification-infrastructure-only candidate descended from the
  independently reviewed preparation QA commit.

The exact plan remains authoritative and retains the aggregate as a selected
member. The runner records it exactly once as `blocked-obligation`; it does not
launch the task or call the child, and it must not label the member passed,
failed, skipped, cancelled, reused, or absent. Every other selected canonical
task, every selected property leaf, the named synthetic proof, and package
proof must execute freshly and pass on the exact routing candidate. Any other
failure follows normal incident handling and prevents review-ready recording.
No resume receipt, focused-task substitution, second blocked member, inferred
child, product change, stale binding, or identity mismatch is admissible.

The immutable receipt and review-ready record carry a versioned blocked-
aggregate obligation with all identities above and the fresh synthetic proof.
That record permits the verification-infrastructure correction alone to follow
ordinary review and QA integration. It does not resolve or defer incident
`39b11f5e-e0f4-49c0-8709-b9bd6845df29`, claim that the live aggregate passed,
authorize its diagnostic retry, or make the parked campsite candidate eligible.

After the preparation is independently reviewed and reaches QA, reissue the
unchanged `777017aa` implementation patch on that exact QA descendant and use
this route for its fresh exact plan. After that routing correction reaches QA,
reissue the unchanged `b3ef8262` campsite patch on the routing descendant. Only
the ordinary governed disposition of the exact Flow child followed by a fresh
passing execution of the bound aggregate on the product descendant consumes
the obligation. A child or aggregate failure records its normal immutable
failure and retains the obligation. Different candidates, plans, tasks,
children, incidents, receipts, commands, invocation environments, synthetic
proofs, manual resolutions, waivers, or coarse retries cannot consume it.

The preparation-and-review effort ceiling is two active hours. Report the exact
six-task plan, blocked-obligation schema, no-launch proof, identity mismatch
coverage, fresh evidence and package result, conserved candidates and incident,
remaining work, confidence, and forecast before expanding scope. No live
aggregate, Flow child, parked candidate, Gherkin mutation, or all-runnable-pack
feature checkpoint is authorized during preparation.
