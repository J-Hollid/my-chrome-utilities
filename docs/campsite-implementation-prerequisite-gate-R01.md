# Campsite implementation-prerequisite gate R01

Status: standing-authorized corrective prerequisite on 2026-08-28 under the
outcome-bounded autonomy and stacked-campsite contract

## Objective

Prevent a campsite specification commit from being mistaken for its implemented
and independently reviewed prerequisite. A preserved product remainder resumes
only after the exact prerequisite implementation is architect-reviewed and
integrated into QA.

This is a process correction for conserved product task
`event-library-target-page-push-closure`. It does not change the Event Library
behavior, its preserved two-commit product delta, its causal paths, or its
verification requirements.

## Reproduced boundary

Generation `56b862f0012f` preserved product head
`0cab2f7b363d09c89b97037d043148c1f5dc5689`, but its immutable manifest recorded
specification commit `963204f773aa7a91418f41c5853239847a94af32` as
`prerequisite.commit`. The QA trigger interpreted ancestry of that specification
as completed implementation and prematurely created resumed head
`9273c9c9037dcd61ee15e7a11eb6f9b7ccf38f4c` plus active self-handoff
`resume-event-library-target-page-push-closure-56b862f0012f`.

Placement-corrected descendant `ca1a21a683bea23c19ceb992560e2af12493039a`
implements this gate and officially quarantines `9273c9c903` while retaining
the parked outer task. It has not completed independent review or reached QA:
its bounded evidence run exposed an undeclared production child plan. Follow
the child-plan containment correction in
`docs/verification-task-checkpoint-incident-repair-R01.md` before treating any
descendant as review-ready. Neither `963204f773`, `9273c9c903`, nor unreviewed
`ca1a21a6` may satisfy or resume the product prerequisite.

## Durable prerequisite contract

Keep the preserved manifest immutable. Its prerequisite identity denotes the
approved specification authority, not proof of implementation. A separate
append-only satisfaction record must bind all of:

- full generation
  `56b862f0012f740dbf5eeb4f2d5a20eff57f6b0fe07a990cd7479870e97c0803`
  and manifest digest
  `df3889aae16503e5237b6db925b9e8ce416f96312f95d63d043661e89cc3211c`;
- stable prerequisite task `verification-task-checkpoint-incident-repair`;
- the latest specification lineage, including placement correction
  `91c8ed5b6c179a41107558ca385643d39a9d4dca`;
- the exact architect-reviewed implementation commit and tree;
- its `readiness: qa-ready` handoff and bound focused `review-ready` evidence;
  and
- the exact QA head that contains that implementation.

Validation is fail-closed. The implementation must descend from the latest
specification, the QA head must contain the exact reviewed implementation, and
the bound candidate must include implementation paths rather than only
specification files. A missing, stale, superseded, unreviewed, unintegrated, or
specification-only record cannot satisfy the prerequisite. A later replacement
specification invalidates any in-flight candidate that does not contain it.

The QA trigger derives the resumption base from the satisfaction record's exact
integrated QA head. It must not resume from `manifest.prerequisite.commit` or
from specification ancestry alone.

## Premature-resumption recovery

Do not delete, overwrite, or hand-edit the preserved manifest, premature resumed
record, active handoff, or queue state. Add an official atomic helper that:

1. appends an immutable quarantine or supersession record for resumed head
   `9273c9c903`, with reason `specification-only-prerequisite`;
2. makes the quarantined result ineligible as a verification, evidence,
   product, retry, or later-resumption base;
3. keeps the active product self-task parked while the nested prerequisite is
   implemented and integrated; and
4. after valid satisfaction, starts a successor resumption transaction from
   original remainder head `0cab2f7b36` onto the exact implementation-bearing
   QA head.

The successor must conserve the immutable runtime manifest's own task, ordered
commits, causal paths, change-set digest, and expected product delta. The stored
change-set digest and expected delta are both
`0f1194bd3a45b67182b3223e7857323070650737b5f9108b2ff06fff1e2e26dc`.
The stored manifest is authoritative; do not rewrite those identities from a
later documentation calculation. Existing crash recovery, conflict handling,
idempotence, and atomic queue routing remain required. A quarantined completed
record must not cause `resumeOntoQa` to return early.

The active product task receives this correction through a structured
`mode: resume` unblocker. It remains the active outer task while the coder
handles stable nested task `campsite-implementation-prerequisite-gate`. Do not
change or verify `9273c9c903`. Preserve `ca1a21a6` as the coherent gate
implementation basis, but do not advance it toward QA until a corrected
descendant contains the bounded child-plan guard and is independently reviewed.

## Legacy satisfaction compatibility

Exact candidate `ff7a562c2763d3652b2e354324e8b7397e6d6a28`, tree
`3a34f4af8aad81e9635ed640ff6e0a533ad886db`, is QA-integrated after fresh
review-ready evidence for nested task `bounded-evidence-child-plan-containment`
from specification base `b2195db9a3ac6dc84f99006fbedb5fd43f868738`.
The exact `shell` and `verification_process` plan passed 90 tasks with package
proof and no terminal obligation. That proof remains valid and must not be
rerun or invalidated by this compatibility correction.

The preserved generation predates the manifest's `prerequisite.task` field.
Its immutable bytes contain prerequisite authority `963204f773` but no task,
while its filename and approved recovery lineage identify
`verification-task-checkpoint-incident-repair`. The final independently
reviewed descendant is correctly evidenced and handed off under the narrower
stable task `bounded-evidence-child-plan-containment`. The recorder currently
matches later specifications only through the absent manifest task, falls back
to `963204f773`, and therefore cannot bind the exact evidence base
`b2195db9a3`. It also searches only the caller worktree for the QA-ready
handoff, although the immutable manifest and parked product live with the coder
and the architect handoff is routed to the specifier's common project queue.

Stable corrective task: `legacy-campsite-satisfaction-compatibility`.

Keep the manifest, premature resumed result, quarantine, active product
handoff, and review evidence byte-for-byte unchanged. Add one append-only
compatibility binding for generation
`56b862f0012f740dbf5eeb4f2d5a20eff57f6b0fe07a990cd7479870e97c0803`
and manifest digest
`df3889aae16503e5237b6db925b9e8ce416f96312f95d63d043661e89cc3211c`.
It binds prerequisite task `bounded-evidence-child-plan-containment` and latest
specification `b2195db9a3ac6dc84f99006fbedb5fd43f868738`; it is not a general rule
that lets any task satisfy a taskless manifest.

The compatibility route must prove that the manifest authority is an ancestor
of the bound latest specification, that the exact review evidence uses that
specification as its base, that the implementation and tree match the evidence
and architect handoff, and that the implementation is contained by the exact
current QA head. A later applicable replacement specification, another
candidate, an ambiguous binding, or a different generation or manifest digest
blocks before state changes.

Resolve the architect-to-specifier handoff and Git-note evidence through the
common project authority even when recording from the active product worktree.
The satisfaction itself remains beside that worktree's preserved manifest so
the existing QA trigger can start from original remainder `0cab2f7b36`, append
a successor result that supersedes quarantined `9273c9c903`, and route the same
stable product task. Do not copy, fabricate, or hand-edit a handoff or campsite
artifact to bridge worktrees.

This correction does not include the independent standalone fallback defect in
Modular verification packs scenario 088. That diagnostic issue neither blocks
this correction nor invalidates the 90-task receipt.

## Development focus and QA impact

Likely existing integration surfaces are:

- `scripts/campsite-artifacts.mjs`, `scripts/campsite-git-runtime.mjs`, and
  `scripts/campsite-store.mjs` for satisfaction, quarantine, validation, and
  atomic successor transactions;
- `scripts/stacked-campsite-control.mjs` for official record, quarantine, and
  trigger commands; and
- `test/stacked-campsite-control-test.mjs` plus SwarmForge scenarios 020-023 for
  direct specification-only, replacement-specification, valid-integration, and
  premature-resumption recovery proof.

The pre-coding read-only intent plan from `91c8ed5b6c` is `bounded-ready`: exact
pack `shell`, 82 tasks, no expansion cause, and no terminal-full obligation.
The coder repeats intent before coding and exact plan-only readiness after the
first coherent commit. No Gherkin mutation or all-runnable-pack feature run is
authorized.

The legacy compatibility correction starts from exact QA `ff7a562c27`. Its
read-only intent is independently `bounded-ready`: exact pack `shell`, 82
tasks, no expansion cause, and no terminal-full obligation. Likely shared
integration surfaces remain `scripts/campsite-artifacts.mjs`,
`scripts/campsite-git-runtime.mjs`, `scripts/campsite-store.mjs`,
`scripts/stacked-campsite-control.mjs`, the SwarmForge autonomy handler, and
their direct campsite tests. No new source prefix is proposed. The coder runs
only the exact committed Shell plan with properties and package proof; no
Gherkin mutation or all-runnable-pack feature checkpoint is authorized. The
implementation-and-review effort ceiling is two active hours, with a one-hour
checkpoint covering compatibility identity, common-authority discovery,
unchanged artifact digests, exact packs and tasks, remaining work, confidence,
and forecast.
