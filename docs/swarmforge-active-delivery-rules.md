# SwarmForge active delivery rules

This file is part of the current active-scope authority. It controls cross-program delivery, lineage, review, incident, and maintenance behavior.

## Feature-development throughput authority

The program's headline outcome is completed user-visible feature slices and their
elapsed time from approved specification to accepted integration. VTD completion,
pack count, task count, file size, and lines moved are diagnostic only. A VTD slice
records an expected payoff and must be checked against later applicable feature
deliveries.

Safety remains non-negotiable. Feature tasks use focused checks while changing and
may integrate into `qa` only through an exact architect `qa-ready` handoff. The
all-runnable-pack gate does not run per QA-integrated task. When the user explicitly
requests master integration, freeze the cumulative QA head; that settled release
candidate runs every runnable pack from its exact registry with properties and the
package check. If it fails, record and repair or revert the exact cause, prove the
change with focused evidence, and rerun every runnable pack on the changed
candidate. Only the exact final-ready tree may advance `master`. Historical
`all-20` wording and receipts describe the current twenty-pack registry and do not
freeze later registry cardinality.

The integrated final-gate speed work uses one coordinator and one deduplicated
plan, not 20 competing pack runners. VTD-017 removed the exclusive artifact wait
that prevented the existing two browser workers from overlapping. It retained two
workers because no qualifying three-worker normal-and-loaded comparison was
durably recorded. A parallel failure remains a recorded failure and cannot be
retried at lower concurrency to turn it green.

The workspace-tabs settled all-20 run measured up to 195.4 seconds of exclusive
`dist` artifact-lock waiting inside a 231.9-second browser task even though two
observation workers were configured. VTD-017 must make validated read-only
artifact use safely shareable, while retaining exclusive build and promotion,
before testing a higher Chrome worker count. Its scorecard must report useful
overlap and lock wait, not configured worker count alone.

VTD-017 is complete and proved at least a 3-minute-43-second final-gate saving.
VTD-018 did not settle: its second terminal occurrence failed 65 Schemas scenarios
and its 16-minute-16-second gate exceeded the 15-minute-43-second stop threshold.
The candidate and repair lineage are inactive. The user approved VTD-012
implementation on 2026-08-26. Its ownership preparation is QA-integrated at
`276db16442`, and its independently reviewed cross-pack causal repair is
QA-integrated at `bb8d05ae64` after a 16-pack/533-task focused plan. Stable task
`verification-registry-planner-modularization` resumes automatically from that
recording descendant with `962affc8c2` retained only as the conserved product
patch reference. VTD-016 and standalone VTD-011 remain deferred while ordinary
product work proves whether batching one terminal gate reduces total delivery
time.

Every enabling slice requires two visible user reviews: a pre-approval baseline,
target, expected effort, safety trade-off, and stop condition; then a settled
plain-language scorecard with actual elapsed-time breakdown, comparable timing,
full gates, invalidated passes, failures, repairs, reruns, preserved evidence,
confidence limits, and a continue/adjust/stop recommendation. Do not approve or
hand off the next enabling slice until the user reviews that scorecard and
explicitly chooses the course. A provisional benefit measured on the next slice
must close before recommending anything beyond that next slice.

The approved course adjustment controls backlog selection and measurement. Each
bounded slice still requires its own explicit user approval. It does not silently
change another role's prompt, handoff validation, verification selection, or
active evidence leaf.

## Scope and lineage invariants

- Before accepting or rejecting a handoff, compare its commit with current
  `master` and read this file from the newest user-approved specification commit
  in the received lineage.
- A stale role-worktree copy cannot deactivate a later user-approved contract.
- A rejected implementation candidate does not deactivate its specification,
  correction program, verification pack, or later handoff.
- A task-local note cannot overrule a later user-approved specification commit.
- Removing an inherited file is an affirmative task change and requires current
  specification authority; it is not lineage cleanup.
- Never remove an active contract or production capability merely to exclude
  rejected ancestry. Port task-owned changes onto a clean current parent.
- Reject a candidate that deletes an active contract while this manifest, its
  program, or `verification/packs.json` still names it.
- Every Git handoff carries its exact base. Verification evidence may be
  forwarded only while the candidate tree remains unchanged.

## Review batching

For each active candidate, Refactorer and Architect complete a whole-delta audit
before returning implementation work. Findings are returned as one consolidated
inventory. If an exception prevents later checks, the report names the interrupted
phase and every unexecuted downstream phase; unexecuted work is never implied to
have passed. A known-red bounded pre-gate is returned without spending the exact
pack or package command.

## Feature-mode deferred-incident boundary

An eligible terminal-verification-deferred incident stays attached to its
recorded candidate and remains a master-integration obligation, even when that
candidate is an abandoned parallel descendant of an earlier QA base. A later
feature does not audit, reverify, mutate, re-defer, or copy that incident merely
because its failure lineage applies or its changed paths overlap incident inputs.
It does not merge the parallel candidate to inherit the disposition. Its focused
evidence and package proof cover only its approved scope.

Reopen an earlier incident during feature work only when ordinary focused work
naturally reproduces its diagnosed failure boundary, or when the approved slice
intentionally changes its repair, regression, task-succession, runner, or
evidence contract. Otherwise leave it unchanged for case-by-case assessment on
the frozen master-integration candidate. Path overlap alone is not a proof
obligation and does not authorize an all-20 run.

### Exact-candidate eligible-repair admission

When an ordinary feature evidence run creates an incident and a causal correction
on the same task lineage makes its repair eligible, the unresolved incident must
not create a circular dependency between review-ready evidence and terminal
deferral. Eligibility authorizes one bounded admission into fresh review evidence;
it does not resolve the incident and does not activate terminal verification.

The admission route must:

- require an immutable eligible repair bound to the exact candidate commit and
  tree, including its causal category and explanation, deterministic regression,
  passing focused repair receipt, and causal-protocol result;
- derive the feature's exact owned-pack plan from its canonical change set and
  require that plan to execute the repaired regression, the original governed
  task, or a validated task successor;
- use the persisted eligible-repair record as the admission proof. The failed
  source receipt is not required to anticipate the later incident through a
  bootstrap or deferral declaration;
- record every admitted incident and selected regression or successor in the
  immutable review receipt, while preserving normal candidate, toolchain,
  artifact, plan, and package identities;
- fail closed for an unresolved repair, unclassified diagnostic, reproduced or
  changed failure, stale candidate, identity mismatch, missing selected task, or
  any new failure during the admitted run; and
- after the exact run and fresh package proof pass, record review-ready evidence
  and the matching `terminal-verification-deferred` disposition atomically. A
  crash may leave neither result or a safely resumable transaction, never a
  handoff record without its incident disposition.

The resulting `review-ready` and `qa-ready` handoffs remain focused claims. The
incident stays attached to the candidate and is consumed only by the canonical
all-20 properties and package checkpoint during explicitly requested master
integration. Coder, refactorer, and feature-mode architect work must not run the
all-20 gate to resolve or work around this state. A standalone verification-repair
slice still requires separate user approval and is not implied by eligible-repair
admission.

Until the runner implements this route, encountering the circular state is a
bounded verification-tooling blocker. Report `eligible-repair-admission-needed`
with the incident, candidate, exact pack plan, and regression identity; do not
recommend or launch an all-20 feature checkpoint as the fallback.

## Verification-maintenance ratchet

The user approved this policy on 2026-08-11 for remaining VTD work. When an
approved change exposes a brittle verification check and the product behavior is
sound, repair that attributable check at the same task boundary while preserving
its meaningful invariant.

- Replace exact source-name, magic-text, frozen whole-task-inventory, and
  post-baseline digest assumptions with behavioral or structural coverage, or
  with accounting derived from the canonical registry plus explicit approved
  additions.
- Centralize duplicated verification-task accounting when an active slice
  encounters it. The approved task inventory is the strongest immediate
  candidate; other cleanup remains just-in-time.
- Do not add compatibility shims solely to satisfy source-shape checks, weaken
  runtime evidence, delete active assertions, change unrelated packs, or turn an
  incident repair into repository-wide cleanup.
- Keep each repair subject to VTD-014 incident causality and the active slice's
  exact verification boundary. This policy does not activate another VTD item or
  controller slice.

This brittle-check maintenance rule is distinct from the approved within-pack
campsite ratchet in `docs/qa-verification-granularity-ratchet-R01.md`. The latter
may introduce a subordinate task-selection slice only after actual work proves a
stable observable boundary and must preserve the parent pack's complete closure.
