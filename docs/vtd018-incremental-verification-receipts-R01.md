# VTD-018 incremental verification receipts R01

Status: stopped and unintegrated on 2026-08-12 after the terminal stop threshold;
candidate `c7ad4698f9` is inactive unless the user explicitly resumes it

The unimplemented Gherkin contract was removed from the executable `features/`
inventory when the experiment stopped. Its approved wording remains available in
Git history at specification commit `9f8627f420`; resumption must restore and
reapprove the contract deliberately rather than silently registering it.

Prepared: 2026-08-12

## Approved decision

Implement one bounded verification-infrastructure slice that persists each
completed task once in a small durable result and assembles the canonical receipt
at the final boundary. The slice changes storage amplification, not verification
coverage, task meaning, evidence identity, or the settled-final workflow.

## Plain-language outcome

The coordinator currently rewrites and synchronizes a growing canonical receipt
after every task and repeats the completed result in checkpoint state. Hundreds of
cheap parse and generation tasks therefore spend minutes updating evidence that
contains only seconds of task work.

VTD-018 makes a completed task durable once. A restart can reuse a complete bound
result, rejects a torn result, and reruns only unfinished work. After all planned
tasks settle, the coordinator assembles the same canonical receipt expected by
the current evidence validator. Final evidence also retains the raw coordination
timings that VTD-017 could not preserve durably.

## Measured starting point

The detailed 21-minute-42-second workspace-tabs receipt contained:

- 267 parse tasks with about 4 seconds of parallel work but 115.363 seconds of
  occupied stage time;
- 267 generation tasks with about 4.5 seconds of parallel work but 123.266
  seconds of occupied stage time; and
- about 230 seconds around those two stages beyond their measured task work.

The VTD-015 final result retained a roughly 5-minute-37-second difference between
modeled task wall time and complete elapsed time. VTD-017 then reduced the final
commit-to-evidence upper bound to 17 minutes 43 seconds, while its exact task
durations model to about 11 minutes 16 seconds. Its durable note did not retain
exact complete-gate coordination, artifact-wait, or overlap fields.

These records make repeated receipt and checkpoint persistence the strongest
measured next bottleneck, but they do not prove that every second outside task
execution is receipt writing. VTD-018 must therefore measure recording time
directly and retain that confidence limit in its scorecard.

## Required behavior

- Use one coordinator and one deduplicated plan in focused and final modes.
- Give each run an immutable identity that binds its task, base, candidate commit
  and tree, plan, artifact, registry, toolchain, and environment.
- Persist each completed task once as one complete durable result bound to its run
  and task identities. Do not rewrite earlier task results after a later task
  completes.
- Support concurrent task completion without losing, replacing, or duplicating a
  result.
- Treat a task as recoverable only after its complete result is durable. Reject a
  torn, incomplete, corrupt, foreign, or conflicting result, and rerun only work
  without a complete reusable record.
- Preserve complete failing results and VTD-014 incident evidence. A later result
  in the same run cannot overwrite a failure or turn the run green.
- Assemble the canonical receipt once at the final boundary. It must contain
  every planned result exactly once and retain the current task identities,
  outputs, result digests, timings, artifact binding, change set, and evidence
  meaning.
- Keep the existing evidence validator authoritative. Incremental storage cannot
  relax final-ready validation or create a second evidence format that bypasses
  it.
- Preserve exact run start, finish, and elapsed time; per-stage task work,
  recording time, durable bytes written, and final compaction time; and VTD-017's
  worker-count, useful-overlap, artifact-wait, and browser-stage fields in the
  canonical receipt and final durable evidence.

## Bounded implementation surface

Implementation may change only focused and final runner receipt persistence,
checkpoint-attempt recording and recovery, final receipt assembly, timing and
byte accounting, evidence serialization and validation needed to carry the same
bound information, the focused process-contract and deterministic persistence
fixtures, verification ownership needed to register the feature, and the VTD
course records.

Do not change product source, the canonical pack inventory, task selection or
deduplication, task commands, assertions, properties, worker counts, browser
scheduling, artifact lease behavior, timeout budgets, package contents, Git-note
identity, handoff readiness, or failure-repair policy. Do not make results
reusable across different run identities. If the behavior requires an external
database, a new evidence authority, or broad planner redesign, stop for a new
scope decision.

## Verification and effort budget

Coder and refactorer use focused verification-process checks, the new acceptance
contract, and one deterministic persistence and interruption fixture while the
candidate can still change. They do not run all 20 packs as an edit loop. After
review and repair settle one tree, the architect runs one fresh canonical all-20
checkpoint with properties and packaging and records its final-ready evidence.
A behavior-bearing repair invalidates that result and requires the normal fresh
final run.

The exact review-ready selection is:

```sh
node scripts/run-focused-acceptance.mjs --pack shell \
  --focused-task unit:test/verification-process-contract-test.mjs \
  --focused-task acceptance-session:shell
```

The session task closes over its registered parse and generation prerequisites.
Adding unrelated focused tasks or widening this checkpoint to another pack
requires new changed-path evidence or user approval.

No separate all-20 baseline rehearsal is authorized. Compare the one settled
final gate with the accepted historical baseline and use a same-environment
focused fixture to isolate legacy and incremental persistence cost.

Expected approval-to-integration effort is 3 to 5 hours, including focused
implementation and review, one settled final gate, and the scorecard. Stop for a
scope decision if the work cannot stay inside the bounded surface or needs more
than one new persistence abstraction plus its final assembler.

## Success, adjustment, and stop measures

The slice succeeds when:

- the 534-task deterministic fixture writes each completed result once, reduces
  pre-compaction durable bytes by at least 90 percent from repeated whole-receipt
  rewriting, and spends no more than 30 seconds in recording and recovery
  bookkeeping in the accepted environment class;
- interruption, concurrent completion, corrupt-result, identity-mismatch,
  duplicate-result, and recorded-failure fixtures all preserve the required
  outcomes;
- the existing validator accepts the final compact receipt with every planned
  result and bound identity exactly once;
- final durable evidence contains the exact coordination and per-stage metrics;
  and
- the one settled all-20 gate completes in no more than 14 minutes 43 seconds
  with every property, failure record, evidence leaf, and package result intact.

The complete-gate target is three minutes below VTD-017's conservative
17-minute-43-second upper bound. A result from 14 minutes 44 seconds through 15
minutes 43 seconds is an adjustment result: preserve the implementation only if
the scorecard shows a worthwhile measured benefit, and do not activate another
enabling slice automatically.

Stop and reassess if the final gate exceeds 15 minutes 43 seconds, fixture
recording exceeds 30 seconds, durable bytes do not fall by 90 percent, a completed
task cannot be recovered, a torn or foreign result can pass, a failure is lost or
retried away, any terminal evidence changes meaning or disappears, or repeated
all-20 rehearsals are proposed as the measurement method.

## Settled scorecard and following decision

After integration, report approval-to-integration time and role intervals,
focused verification, final-gate time, successful and invalidated full runs,
failures, repairs, reruns, task work, persistence time, bytes written, compaction
time, worker overlap and artifact wait, preserved evidence, and confidence
limits. Compare the outcome with VTD-017 and recommend continue, adjust, or stop.
The user then chooses the new measured longest path; VTD-018 does not
automatically activate VTD-012, VTD-016, another VTD-008 slice, or product work.
