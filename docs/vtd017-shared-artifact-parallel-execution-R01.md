# VTD-017 shared-artifact parallel execution R01

Status: approved by the user for coder handoff on 2026-08-11

Prepared: 2026-08-11

## Approved decision

Implement one bounded verification-infrastructure slice that makes the browser
workers already present in focused and final verification genuinely concurrent.
The same coordinator behavior applies in both modes. This is not permission to
start competing pack runners or to reduce regression coverage.

## Plain-language outcome

Today two browser workers are configured, but the first worker holds an exclusive
build-artifact lock while it runs. The second worker commonly starts and then
waits behind that lock. VTD-017 gives the one verification coordinator ownership
of the validated artifact for the run and lets its own read-only children share
that exact ownership. An outside build still cannot replace the artifact until
the run releases it.

The existing two workers must overlap first. Three workers become the default
only if the exact `--pack layered_schema` focused comparison saves at least 60
seconds and a loaded sample shows no new timeout or isolation failure. A failed
three-worker sample stays failed; it is not rerun at two workers to obtain green
evidence.

## Measured starting point

The detailed workspace-tabs final receipt took 21 minutes 42 seconds. The later
VTD-015 final receipt took 21 minutes 26 seconds, so the complete-gate baseline is
consistently about 21 and a half minutes on the accepted environment.

In the detailed receipt:

- 13 browser-observation jobs occupied 609.849 seconds of wall time;
- those jobs contained 639.265 seconds of work after measured lock wait was
  removed;
- accumulated artifact-lock wait was 566.480 seconds;
- the current work models at 320.246 seconds with two genuinely free balanced
  workers; and
- three balanced workers model at 216.078 seconds, while a fourth improves the
  model by only about 13.5 additional seconds because the longest job remains
  indivisible.

The current two-worker input order is within about six seconds of the balanced
two-worker model after lock wait is removed. A separate VTD-011 terminal-lane
slice therefore has negligible value before this correction. The scheduling
needed to judge three workers belongs inside this bounded VTD-017 slice.

Focused benefit varies with the selected plan. The current exact Layered Schema
plan contains four browser-observation jobs and models about a 90-second saving
from artifact sharing. An exact plan with one observation job receives no
parallel speed-up. A broad shared-infrastructure plan can receive nearly the
complete-gate saving. These differences must be reported rather than presenting
one universal focused-run claim.

## Required behavior

- Use one coordinator, one deduplicated plan, one prepared artifact, and one
  combined result in focused and final modes.
- The coordinator owns the artifact lease while its planned tasks execute. Its
  read-only children share the exact validated artifact identity without
  reacquiring mutually exclusive per-task ownership.
- Build, replacement, and package writes remain exclusive. An outside writer
  waits until the coordinator releases the artifact, and a reader mutation fails.
- Keep the current worker count at two until focused evidence proves useful
  overlap with no per-task artifact wait.
- Use measured indivisible job durations for a deterministic three-worker
  candidate. Accept three only when the exact `--pack layered_schema` normal plan
  is at least 60 seconds faster than two workers and a loaded sample introduces no new
  timeout, cleanup, port, profile, temporary-data, evidence, or artifact failure.
- Keep tasks with shared writable state or unproved dependencies serial or in the
  same worker.
- Preserve each browser task's private Chrome profile, automatically selected
  debugging port, temporary writable data, evidence directory, child-process
  lifecycle, and cleanup.
- Preserve every current task, logical target, assertion, property, checkpoint,
  failure record, and package result exactly once in the final plan.
- A worker failure fails the combined run and retains its original evidence. No
  automatic lower-concurrency retry may turn it green.

## Bounded implementation surface

Implementation may change only the shared artifact lease, focused/final runner
coordination, browser-observation worker assignment, timing and overlap reporting,
the focused process-contract and browser fixtures for this behavior, verification
ownership needed to register the feature, and the VTD course records.

Do not change product source, browser assertions, observation batching, ordinary
browser-adapter concurrency, receipt persistence, process-contract modularization,
terminal evidence meaning, timeout budgets, or package contents. If correct
artifact sharing requires a new general lock service, private artifact copies, or
product changes, stop for a separate scope decision.

## Verification and time budget

Coder and refactorer use only focused process-contract checks and the bounded
parallel browser fixture while the candidate can still change. They do not run
all 20 packs. The architect runs one canonical all-20 gate after review settles
the tree. A recorded failure, causal repair, and changed candidate require the
normal fresh final rerun.

Expected end-to-end effort is about 1.5 to 3 hours, including review and the one
final gate. The slice stops for a course decision if implementation does not fit
that bounded surface or if the existing two-worker overlap cannot be established
without redesigning unrelated verification infrastructure.

## Success and stop measures

The lock correction succeeds when a comparable normal run shows:

- zero per-task artifact-lock waiting after the coordinator acquires the lease;
- two independent browser jobs active at the same time against one digest;
- browser-observation wall time at or below 345 seconds;
- complete-gate time at or below 17 minutes 30 seconds; and
- unchanged complete evidence and no new timeout or isolation incident.

The expected two-worker result is approximately 16.5 to 17.5 minutes, a saving of
about 4.5 to 5 minutes. If three workers satisfy their focused speed and stability
threshold, the expected complete result is approximately 15 to 16 minutes, a
total saving of about 5.5 to 6.5 minutes.

Keep two workers if three fail their decision threshold. Stop and reassess the
slice if the final result saves less than three minutes, artifact identity can
change while readers run, any existing evidence leaf disappears, a failure is
retried away, or repeated all-20 rehearsals are proposed as the measurement
method.

## Scorecard and following decision

After integration, report approval-to-integration time, focused verification,
final-gate time, worker count, useful overlap, lock wait, failures, repairs,
reruns, and preserved evidence. The user then decides whether the next bounded
target is incremental durable receipt recording. That later item remains inactive
until separately reviewed and approved.
