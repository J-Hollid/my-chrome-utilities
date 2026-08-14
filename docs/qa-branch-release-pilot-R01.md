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
   ceiling. These are reporting expectations rather than automatic intervention
   gates. At halfway and at the ceiling, report progress, the cause of any
   variance, remaining work, confidence, and current forecast. Continue by
   default while product and requirement scope are unchanged and the completion
   path is bounded and safe. A bounded difference between the forecast QA-impact
   list and the canonical changed-path plan is not a scope expansion requiring a
   user decision: use the complete planned pack set, record the variance, and
   continue. Pause for a user decision when product or requirement scope expands,
   requirements need
   reinterpretation, failures repeat without a causal explanation, no credible
   completion path remains, or another safety boundary requires authority.
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
   feature-mode roles do not audit, reverify, mutate, or re-defer every earlier
   incident, including one whose shared disposition was recorded on an abandoned
   parallel candidate. Failure-lineage ancestry and changed-path overlap alone
   create no incident proof obligation, do not attach the disposition to the
   later candidate, and do not require the parallel candidate to be merged. The
   later slice still needs its own exact focused evidence and package proof. Reopen one
   incident case by case only when ordinary focused work naturally reproduces
   its diagnosed failure boundary, or when the approved slice intentionally
   changes that incident's repair, regression, task-succession, runner, or
   evidence contract. Shared-infrastructure expansion remains subject to the
   preflight scope-choice rule in step 2. Otherwise leave the recorded incident
   unchanged for the frozen master-integration assessment.
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

### Development-focus and QA-impact convention

For ordinary features beginning after Flow relationship port snapping, use the
documentation-only convention in
`docs/feature-development-focus-and-advisory-scouting-R01.md`. The implementation
handoff distinguishes a minimal **development focus** for red/green iteration
from a bounded **QA impact** for the settled candidate. This is a knowledge
ratchet, not a new verification mechanism or intervention gate. Existing exact
changed-path planning remains authoritative, and the all-20 checkpoint remains
exclusive to explicit master integration.

The same document authorizes a telemetry-disabled, advisory RepoWise scouting
pilot over three to five varied features. Scouting may improve the two lists but
cannot block work, widen evidence on its own, or override the canonical registry.

### Verification run intent

An ordinary focused invocation is `development-diagnostic` unless it carries
explicit review-evidence, governed repair-focused, or terminal-checkpoint
authority. A diagnostic receipt retains task output, timing, and local failure
detail, but it never creates or mutates repository-common incidents, retry
allowances, terminal deferrals, or handoff debt. It cannot support review-ready,
QA-ready, or final-ready evidence and cannot be retrospectively upgraded.

`--prepare-evidence` is explicit review-evidence authority. A failure during that
run creates the normal durable reliability incident. Governed repair-focused and
terminal invocations retain their existing durable semantics. Evidence recording
must validate the receipt's immutable run intent and reject a missing, mismatched,
diagnostic, or retrospectively upgraded intent. Later diagnostic success does not
erase an earlier diagnostic receipt.

The first implementation includes an audited compatibility pass for receipts
created before run intent existed. It may make an incident nonblocking only when
the source receipt proves that the invocation had no evidence task, repair
authority, terminal authority, or readiness claim and the disposition retains
the incident and immutable failure history. Missing or ambiguous authority stays
blocking. Existing eligible terminal-verification-deferred incidents remain
unresolved on their recorded candidates, including abandoned parallel
candidates. They do not enter a later
feature evidence preflight merely because changed paths overlap their inputs. No
carry-forward transition is recorded for an unrelated feature candidate; its
exact focused evidence and package proof cover its approved scope only. Master
integration evaluates the accumulated deferred incidents, their diagnoses, and
any repairs from another lineage against the frozen cumulative tree case by case
before the terminal checkpoint.

The following one-time bootstrap is completed and is not a precedent for later
feature work. Because the original correction changed shared runner semantics,
its first checkpoint
cannot satisfy ordinary path-only conservation against older deferred incidents.
One explicit `--run-intent-bootstrap` review-evidence invocation is permitted only
when the approved base contains the run-intent contract but lacks its
implementation and the candidate adds that implementation. Preflight must prove
that every other applicable incident is already eligible and terminal-deferred
and that the exact focused plan selects each deferred failure task or its declared
successor. Pending evidence then requires all of those tasks to pass freshly with
package proof before handoff may re-defer the incidents on the exact candidate.
Any unrelated, ineligible, uncovered, or ambiguous incident blocks. Once the base
contains run-intent implementation, bootstrap authority is exhausted.

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
