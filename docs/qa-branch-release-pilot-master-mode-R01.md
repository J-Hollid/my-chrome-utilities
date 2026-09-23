# QA-branch release pilot master mode R01

This file is active authority only after the user explicitly requests promotion of accumulated `qa` work to `master`.

## Master integration mode

Use this mode only when the user explicitly requests promotion to `master`.
Promotion timing follows natural delivery boundaries: the user may choose a
lull because priorities have settled, active feature work has slowed, or the
accumulated QA state is worth releasing as one coherent tree. There is no target,
minimum, or maximum batch size and no scheduled release interval. Accumulated
task count is measurement context only; it never starts, delays, or accelerates
promotion by itself.

1. The specifier reports the exact `master` base, current `qa` head, accumulated
   QA-integrated tasks, elapsed queue time, and complete durable granularity-
   observation portfolio. No unrelated product handoff enters the pending
   release candidate after portfolio intake begins.
2. The specifier gives every applicable observation one explicit disposition:
   selected for this promotion, combined with selected work, carried visibly to
   the next promotion, or retired with evidence that its premise no longer
   applies. Selected verification-only hardening receives ordinary focused
   coder, refactorer, architect, and QA integration. Unsafe or disproportionate
   work is carried rather than rushed. No item disappears implicitly.
3. After selected hardening is QA-integrated or explicitly carried, the
   specifier freezes the resulting exact QA head and sends it directly to the
   architect with
   `readiness: release-candidate` and `verified: qa-candidate`, using current
   `master` as `base:`. The architect starts a clean release lineage at that
   candidate rather than merging it into stale task ancestry.
4. The architect reviews the cumulative `master..qa` change set, seals one exact
   tree, and runs one fresh canonical all-runnable-pack checkpoint with properties and the
   package check.
   The release-candidate route remains open for terminal-verification-deferred
   incidents so the architect can perform this checkpoint. Its passing receipt
   resolves matching deferred incidents and supplies final-ready evidence; no
   second all-runnable-pack run is required. Any unresolved incident still blocks the
   final-ready handoff and master fast-forward.
5. A pass produces the existing `final-ready` evidence and architect-to-specifier
   handoff. The specifier verifies its exact base, task, commit, tree, plan, and
   package proof, then fast-forwards `qa` and `master` to that exact tested commit.
6. A failure remains recorded. Diagnose and prove a repair with the smallest
   relevant focused check. Prefer reverting an independently revertible offending
   QA slice when that is faster and safer. Any changed release candidate requires
   one fresh complete gate. No unchanged retry may turn a failure green.

Neither the specifier nor another role starts master integration merely because a
batch reaches a suggested size or age. The user owns the promotion instruction,
and its timing follows priorities and feature momentum rather than an artificial
batch-size rule.

## Branch invariants

- `master` must be an ancestor of `qa` before a release candidate is cut.
- A feature specification base is current `qa`, not current `master`, while the
  branches differ.
- A QA candidate is integrated by fast-forward. A non-fast-forward integration
  stops for lineage correction.
- A master promotion is a fast-forward to the exact final-ready commit. Do not
  squash, rebase, amend, merge another commit, or record behavior-bearing changes
  after the passing gate.
- QA freezes only after the observation portfolio has explicit dispositions and
  selected hardening has either reached QA with focused evidence or been carried.
- After successful promotion, `qa` and `master` point to the same commit before
  the next feature batch begins.
- `qa-ready` can reach only the specifier and can advance only `qa`.
  `release-candidate` can reach only the architect and cannot advance `master`.
  `final-ready` remains the only state that can advance `master`.

## Pilot measurement

Use existing Git, handoff, review receipt, final receipt, incident, and evidence
timestamps. Do not add a telemetry subsystem for this pilot.

For every QA-integrated task report:

- user approval to QA integration;
- implementation and review intervals;
- focused verification wall time;
- repairs and focused reruns; and
- QA integration to master promotion queue time.

For every master promotion report:

- accumulated task count and exact commits;
- observation-portfolio identities and selected, combined, carried, or retired
  dispositions, including focused hardening time and evidence;
- approval of the promotion to master integration;
- complete-gate attempts and wall time;
- final-only failures, repairs, reverts, and reruns;
- approval-to-master time for every included user-visible feature; and
- amortized complete-gate time per included task.

The accepted comparison baseline is VTD-017's conservative 17 minutes 43 seconds
per independently promoted tree. For a release containing `N` QA-integrated
tasks, gross terminal time avoided is `(N - 1) * 17 minutes 43 seconds`; report
actual complete-gate time as well rather than treating the model as observed
saving.

Review the pilot after the first master promotion containing at least two ordinary
product slices, and again after five user-visible feature slices. Continue only
when:

- one exact complete gate still protects every master promotion;
- amortized complete-gate time per task falls;
- active approval-to-QA time falls relative to comparable prior slices;
- median approval-to-master time does not increase;
- final-only failure diagnosis and repair do not consume the gate saving; and
- no feature waits on `qa` longer than the user considers acceptable.

If active time falls but approval-to-master latency rises, report the waiting-time
trade-off and ask whether it remains acceptable in light of current priorities
and feature momentum. Do not respond by imposing a smaller batch, larger batch,
or fixed calendar. If final-only failures dominate, improve the missing focused
or medium integration coverage and the pre-promotion evidence checks. Do not
answer either failure by starting a new broad verification-infrastructure program
automatically.
