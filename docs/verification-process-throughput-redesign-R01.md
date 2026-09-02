# Verification process throughput redesign R01

Status: full program approved on 2026-09-02; delivery order is adaptive when a
later-phase control is a direct prerequisite for the current phase

## Outcome

Complete the verification-process redesign that the bootstrap fast path made
possible. A normal process-only change must select and run only its exact
verification slices. The complete master integration gate must retain all
current coverage.

This is a process program. It changes no product behavior and does not authorize
an all-runnable-pack feature run.

## Delivered foundation

The one-time bootstrap fast path is on QA at `1a29a68d141a3a3679b9427840378b7a267de583`.
Its exact proof ran 10 tasks in 15.19 seconds, with a 95-second forecast, no
parent fallback, and a passing package result. Its authority expired when the
candidate reached QA.

The bootstrap supplied reusable plan, execution, preflight, durable-run,
receipt, and review components. It did not connect those components to the
normal verification-process route. It also did not split the large contracts,
replace the 174,005-line conservation fixture, or repair role liveness.

## Measured baseline

The prior verification administration change took 3 hours and 37 minutes from
specification handoff to QA. The settled run executed 42 tasks and used 5
minutes and 52 seconds of wall time. Two new direct contracts used 694
milliseconds. Six older contracts used about 91 percent of accumulated task
time.

The registry-planner aggregate ran 13 times across coder and architect work and
used about 45 minutes and 36 seconds of accumulated task time. A mutation
baseline used about 16 minutes for a 12-line legacy entry point with no
applicable mutants. A lost output connection caused duplicate 39-task runs.

The current conservation fixture is
`test/fixtures/verification-process-contract-conservation.json`. It has 174,005
lines and is about 8.8 MB. One process change added 63,954 lines to it.

The bootstrap delivery then took about 6 hours and 48 minutes although its final
proof used 15.19 seconds. A role reported active while no agent command was
running, and an architect handoff waited until the user caused the role to read
its mail. This delay is a liveness defect, not verification execution time.

## Target state

The completed program has these properties:

1. The canonical planner returns exact slice tasks, not every task in an owned
   parent pack.
2. The canonical executor runs each selected task at most once.
3. Readiness, execution, receipt recording, and review use one task plan.
4. Large multi-purpose contracts are independent boundary-owned tests.
5. Aggregates validate child results and do not execute selected children.
6. Zero-mutant discovery does not start a test command.
7. Lost output attaches to or reads one durable exact run.
8. Compact Git-bound records replace the whole generated-registry fixture.
9. False active state cannot leave ordinary handoff mail blocked with no agent
   work.
10. Current validators can read a provable completed legacy unblocker without
    reopening work.
11. Feature-mode process changes do not run the parent pack or all runnable
    packs.
12. Explicit master integration still runs the complete canonical gate once.

## Safety rules for every phase

- Use the exact current QA base and a stable phase task.
- Run read-only intent classification before coding.
- Forecast no more than five minutes for the final exact proof.
- Start zero tasks when ownership, closure, capability, identity, fixture
  freshness, or the forecast cannot be proved.
- Do not fall back to the old `verification_process` parent workload.
- Do not reuse task results across candidate, tree, plan, toolchain, or artifact
  identities.
- Finish direct development checks and structure review before one final exact
  proof.
- Let unchanged reviewers validate the bound receipt without a new run.
- Keep the full master gate and package evidence unchanged.
- Do not add a top-level verification pack.
- Do not add to large multi-purpose source or test files. Split work by the
  existing observable slice boundaries.
- Keep user product files and unrelated process programs outside the candidate.

If a phase cannot meet these rules, it stops before expensive work and reports
the exact unresolved boundary. It does not request or start the old broad route.

## Adaptive phase order

The phase numbers describe the expected main sequence. They do not require a
new user decision when work from a later phase is the smallest safe prerequisite
for the active phase. Pull that bounded work forward, keep it in the same active
program, and report it in the current phase scorecard. Do not pull unrelated
later-phase work forward.

For Phase 2, current unblocker delivery is blocked because
`matchingBindings` validates unrelated completed legacy records before it tests
their binding. Two retained records contain retired `defect-census` and
`repair-task` fields. The minimum Phase 4 compatibility rule is therefore an
approved Phase 2 prerequisite: compare safe canonical binding fields first,
strictly validate each matching record, and leave unrelated legacy records
unchanged. This changes no completed result and accepts no unrelated record as
evidence.

## Delivery phase 2: normal exact-slice execution

Graduate the bootstrap controls into the canonical planner, executor, receipt,
and review route. The normal process path must use the existing
`verificationSlices` declarations in
`verification/manifests/verification_process.json`.

Split large multi-purpose contracts by their declared observable boundaries.
The first candidates are the reliability run-intent, execution checkpoint,
registry inventory, timing, ownership, and evidence contracts. A compatibility
entry point can retain historical invocation, but it can only route to or
validate independent child results.

The six approved aggregate-owner transitions are evidence promotion, execution
checkpoint, ownership impact, registry inventory, reliability run intent, and
timing performance. Their new child modules become the direct owners of their
declared boundary cases and module-setup occurrences. The former aggregate owner
remains historical provenance. No other owner transition is part of Phase 2.

The completed bootstrap cannot authorize this phase because its authority has
expired. This phase therefore has one fixed successor transition plan bound to
the approved QA base and stable task `verification-process-exact-slice-execution`.
It uses the integrated bootstrap safety components, selects only this phase's
exact child checks, and expires at QA. After this phase, all later process phases
use the normal canonical exact-slice route. They require no new bootstrap.

Phase 2 exit conditions:

- one canonical task plan is identical across readiness, execution, receipt,
  and review;
- no unselected `verification_process` task starts;
- each selected child starts once;
- the parent closure equals the union of all child slices for master mode;
- the exact final proof finishes inside five minutes;
- the package passes; and
- the measured specification-to-QA interval is reported.

Acceptance authority is
`features/verification-process-exact-slice-execution.feature`.

## Delivery phase 3: compact conservation

Replace the 174,005-line snapshot with small deterministic records per owned
boundary. Each record binds the schema, Git source identity, input and generator
digests, boundary identity, normalized output digest, and item count.

Migration must first prove exact normalized parity between the legacy fixture
and the compact records. The old fixture can be removed only after that parity
and independent review pass on the same candidate. Fixed invariants and
historical ownership checks must prevent a changed generator from accepting its
own output only by changing an expected digest.

Phase 3 exit conditions:

- the compact and legacy forms have exact semantic parity;
- routine refresh changes only affected compact records;
- the whole generated registry is not stored a second time;
- stale, missing, unexplained, or inconsistent records fail before expensive
  work;
- rename, copy, delete, and former-owner behavior remains conserved;
- the old fixture is removed and cannot be regenerated; and
- the full master task union remains equal to the accepted legacy baseline.

Acceptance authority is
`features/verification-process-compact-conservation.feature`.

## Delivery phase 4: role liveness and legacy unblockers

Make role activity depend on observable work, not only an in-memory or file
claim. A role is working while it has a live command or a current progress
lease. If it has neither, an expired active claim becomes available and ordinary
handoff mail can run. A valid priority unblocker continues to preempt at the
next safe boundary and never waits for idle state.

Add a read-only compatibility projection for completed legacy unblocker records.
It can accept a record only when sender, recipient, task, active handoff,
authority ancestry, completion result, and content identity are provable.
Ambiguous records are quarantined. Completed work is never reopened merely to
produce current administrative form.

Phase 4 exit conditions:

- false active state cannot hold a queued architect handoff while no work runs;
- live commands are never stopped destructively;
- valid unblockers still preempt at a safe boundary;
- provable legacy completions remain completed;
- follow-up rules do not create replacement receipts or handoffs for completed
  work;
- state changes are atomic and use dedicated helpers; and
- existing timestamps separate work time, queue time, and stale-state delay.

Acceptance authority is
`features/swarmforge-role-liveness-and-legacy-unblockers.feature`.

## Development focus and QA impact

Each phase is a separate QA candidate. Do not combine all paths into one change.

| Phase and prefix | Parent pack | Slice | Exact consumers |
|---|---|---|---|
| Phase 2: `scripts/verification-planner/` | `verification_process` | existing ownership, dependency, task-batching, and historical-planning slices | readiness, canonical runner, receipt review |
| Phase 2: `scripts/verification-execution/` | `verification_process` | `execution_checkpoint` | exact runner and durable execution |
| Phase 2: `scripts/verification-evidence/` | `verification_process` | evidence administration and promotion | receipt recording and unchanged review |
| Phase 2: `verification/manifests/verification_process.json` | `verification_process` | `registry_inventory` | planner, child-task union, master gate |
| Phase 2: `test/verification-contracts/` | `verification_process` | each existing observable boundary | direct exact child checks |
| Phase 3: `scripts/verification-registry/` | `verification_process` | `registry_inventory` | compiler and conservation validator |
| Phase 3: `test/fixtures/verification-process-contract-conservation.json` and its compact successor | `verification_process` | `registry_inventory` | parity migration and historical planning |
| Phase 4: `swarmforge/scripts/` | `shell` | `swarmforge-handoff-control` | daemon, role launcher, handoff helpers |
| Phase 4: role and shared process prompts | `shell` | `swarmforge-handoff-control` | coder, refactorer, architect, specifier |
| Phase 4: direct handoff process tests | `shell` | `swarmforge-handoff-control` | liveness and compatibility proof |

Read-only intent is authoritative inside each listed phase. A phase may add an
exact prerequisite or consumer that the canonical planner proves. It cannot add
a product pack, browser pack, all-runnable-pack feature gate, or unrelated
process program.

## Time and scorecard rules

Each phase must be small enough to forecast 30 to 45 minutes from approved
specifier handoff to QA integration. If the forecast is larger, split the phase
by an existing observable boundary before coding. Do not split by reducing
evidence for one boundary.

At 20 minutes, report current paths, exact task plan, completed work, active
command or wait state, failures, remaining work, confidence, and forecast. At 45
minutes, report the same data and the exact cause of variance. Continue only
when the remaining path is bounded and active. A role with no live command and
no current progress lease is not active work.

After each phase, report:

- approval, handoff, first implementation, review, proof, and QA timestamps;
- active coder, refactorer, and architect intervals;
- queue and stale-state intervals;
- forecast and actual task count and wall time;
- failures, repairs, reruns, and duplicate starts;
- parent-pack and all-pack launches, which must both be zero in feature mode;
- package and receipt result; and
- a continue, adjust, or stop recommendation.

Produce the current phase scorecard before the next independent phase starts.
A direct bounded prerequisite from a later phase can move forward immediately
under the adaptive-order rule. The full-program approval does not hide a failed
phase exit condition.

## Completion

The full recommendation is complete only when all three acceptance features are
QA-integrated and the next ordinary process-only change demonstrates the normal
route without a bootstrap, parent-pack run, duplicate run, or stale role wait.
That payback change must reach QA in no more than 45 minutes or produce an
evidence-backed adjustment before more verification infrastructure work starts.

Promotion from QA to `master` remains a separate user request and requires the
unchanged complete terminal gate.
