# QA-branch release pilot R01

Status: approved by the user for immediate activation

Prepared: 2026-08-12

## Purpose

Reduce development latency by running change-appropriate focused checks while
features accumulate on `qa`, then run the complete end-to-end gate once for an
explicitly requested promotion of the frozen cumulative tree to `master`.

This is a delivery-process pilot, not permission to weaken regression coverage.
`qa` is the frequently integrated development line. `master` remains the exact
release line and advances only to a tree that passed the complete terminal gate.

## Specifier mode selection

At the start of each new request, the specifier determines which of these two
modes the user wants. If the request is ambiguous, ask whether the user wants to
develop or integrate a feature into `qa`, or promote accumulated `qa` work to
`master`.

### Feature integration mode

Use this mode for a new behavior slice, correction, or other independently
reviewable change.

1. Start the specification and implementation lineage from current `qa`. Do not
   inherit an abandoned or unrelated task branch.
2. The specification names the smallest checks that directly observe the change,
   an elapsed effort ceiling, and a checkpoint expected by halfway through that
   ceiling. Reaching the ceiling without a deliverable candidate stops the slice
   for a user decision.
   Before any review-ready task launches, exact changed-path preflight compares
   the planned scope with that approved scope. If an incidental shared
   verification-infrastructure repair expands a product slice to all 20 packs,
   task launch stops for a user choice: restore the product-only candidate, or
   stop it and approve the repair as a standalone infrastructure slice. The
   planner never omits owned packs to preserve the smaller scope.
3. Coder and refactorer run focused checks and record review-ready evidence. The
   architect completes architecture and quality review and runs focused checks
   for any changes or repairs. No role runs the all-20 gate in this mode.
   A reliability incident with an eligible causal repair, deterministic
   regression, exact focused review-ready evidence, and passing package proof is
   recorded as `terminal-verification-deferred`. That unresolved disposition
   permits focused review and QA integration only; it is neither resolution nor
   abandonment. Missing, failing, stale, or identity-mismatched proof remains
   blocking.
   A later independently approved slice may start from that QA descendant. Its
   specification-only handoff retains the ancestor disposition. Its review-ready
   and QA-ready candidates may carry the disposition only when changed-path
   conservation proves no deferred failure, repair, regression, focused plan,
   runner semantic, or evidence input changed, and the later slice has its own
   exact focused evidence and package proof. A relevant change requires fresh
   incident-focused proof on the exact candidate.
4. The architect sends the exact candidate to the specifier with
   `readiness: qa-ready` and `verified: review-ready`. That claim must have bound
   focused evidence for the exact task, base, commit, tree, changed paths, and
   receipt.
5. The specifier may fast-forward `qa` to that exact candidate. QA integration is
   not master integration, release completion, or final regression proof.

After the architect's last candidate change, the required focused check is run
once in evidence-producing mode. Its receipt records review-ready evidence for
that exact tree; an ordinary preliminary run of the same plan on the same tree is
not required. A later change requires one new evidence-producing run.

Feature candidates must be independently understandable and revertible. Partial,
speculative, or known-failing work stays in task worktrees and never enters
`qa`. Persistence, concurrency, migration, security, packaging, and verification
infrastructure changes should normally occupy a release batch alone.

### Master integration mode

Use this mode only when the user explicitly requests promotion to `master`.

1. The specifier reports the exact `master` base, frozen `qa` head, accumulated
   QA-integrated tasks, and elapsed queue time. No new feature handoff enters the
   frozen release candidate.
2. The specifier sends the exact QA head directly to the architect with
   `readiness: release-candidate` and `verified: qa-candidate`, using current
   `master` as `base:`. The architect starts a clean release lineage at that
   candidate rather than merging it into stale task ancestry.
3. The architect reviews the cumulative `master..qa` change set, seals one exact
   tree, and runs one fresh canonical all-20 checkpoint with properties and the
   package check.
   The release-candidate route remains open for terminal-verification-deferred
   incidents so the architect can perform this checkpoint. Its passing receipt
   resolves matching deferred incidents and supplies final-ready evidence; no
   second all-20 run is required. Any unresolved incident still blocks the
   final-ready handoff and master fast-forward.
4. A pass produces the existing `final-ready` evidence and architect-to-specifier
   handoff. The specifier verifies its exact base, task, commit, tree, plan, and
   package proof, then fast-forwards `qa` and `master` to that exact tested commit.
5. A failure remains recorded. Diagnose and prove a repair with the smallest
   relevant focused check. Prefer reverting an independently revertible offending
   QA slice when that is faster and safer. Any changed release candidate requires
   one fresh complete gate. No unchanged retry may turn a failure green.

Neither the specifier nor another role starts master integration merely because a
batch reaches a suggested size. The user owns the promotion instruction.

## Branch invariants

- `master` must be an ancestor of `qa` before a release candidate is cut.
- A feature specification base is current `qa`, not current `master`, while the
  branches differ.
- A QA candidate is integrated by fast-forward. A non-fast-forward integration
  stops for lineage correction.
- A master promotion is a fast-forward to the exact final-ready commit. Do not
  squash, rebase, amend, merge another commit, or record behavior-bearing changes
  after the passing gate.
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

If active time falls but approval-to-master latency rises, shorten the batch. If
final-only failures dominate, improve the missing focused or medium integration
coverage before increasing batch size. Do not answer either failure by starting a
new broad verification-infrastructure program automatically.

## VTD-018 disposition

VTD-018 remains a stopped, unintegrated experiment. Candidate `c7ad4698f9` and its
descendants are not part of `qa`, the pilot baseline, or a release candidate.
Resuming that implementation requires a separate explicit user decision.
