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

The campsite prerequisite is the exact committed specification handed to the
coder, the stable task remains `event-library-target-page-push-closure`, and the
return route remains coder to refactorer after fresh product evidence. After
this process prerequisite reaches QA, use the existing QA-triggered campsite
resumption helper to rebase or reapply the unchanged two-commit remainder onto
that exact QA head, prove complete and product delta conservation, and reissue
the same product task automatically. Do not reconstruct it manually or reduce
it to a patch reference.

## Development focus and QA impact

Stable prerequisite task: `verification-task-checkpoint-incident-repair`.

Development focus is fail-fast parallel-stage cancellation and quiescence,
cancelled-task receipt semantics, exact task-checkpoint repair-boundary
derivation, rejection fixtures, and the three-incident resumption path. Likely
existing integration surfaces are:

- `scripts/verification-execution/execute.mjs` and
  `scripts/verification-execution/runner.mjs` under subordinate slice
  `execution_checkpoint`;
- `scripts/verification-reliability-repair.mjs` under subordinate slice
  `reliability_run_intent`; and
- their direct execution-checkpoint and reliability-run-intent contract tests.

The pre-specification read-only intent plan is `bounded-ready`: exact packs
`shell` and `verification_process`, 85 tasks, no expansion cause, and no
terminal-full obligation. The coder repeats read-only intent before coding and
uses exact committed changed-path planning before evidence. The settled process
candidate runs only its canonical bounded plan with properties and package
proof. No Gherkin mutation or all-runnable-pack feature checkpoint is
authorized.

The process implementation-and-review effort ceiling is four active hours. At
two active hours report cancellation/quiescence status, repair-boundary
validation, preserved stack status, exact packs and tasks, failures, remaining
work, confidence, and forecast. Continue while behavior and evidence strength
remain unchanged and the completion path stays bounded.
