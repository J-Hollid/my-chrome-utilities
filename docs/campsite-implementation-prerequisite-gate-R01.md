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
