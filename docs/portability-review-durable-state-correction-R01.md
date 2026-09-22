# Portability review durable-state correction

## Current authority and continuation

Continue `verification-slice-portability-durable-state-declaration`. This is a
bounded correction of the approved evidence-retention behavior, under existing
outcome-bounded authority and the user's 2026-09-22 process-failure report.
It supersedes the backup-dependent next action in
`docs/portability-review-state-loss-assessment-R01.md` and the specifier note
`20260922T061051Z_001051_from_specifier`. The user has no backup and reports no
manual deletion. Do not ask for that backup again.

Required instruction: `docs/verification-temporary-data-and-receipt-lifecycle-R01.md`.

Preserve candidate `bedb01d6a835ab5401a1502fd5a5fb935effd0d0`, its base
`c0ec9345d98170682216ee745513a0451acc08c2`, all prior declaration and product
remainders, receipts, and Git notes. This specification-only QA descendant
restores the same task's correction route. It does not replace or replay its
implementation. Retain the candidate as the implementation reference and record
any necessary overlap resolution. Keep existing coder, refactorer, and architect
duties. QA acceptance remains pending; master promotion is not authorized.

## Bounded discovery result

Repair family: `review-evidence-durable-state`.
Boundary: repository-common evidence location, incident and transaction retention,
and validation of this exact retained review receipt.
Discovery complete for this boundary. The deletion event itself is unknown.

Observed defects:

1. `temporary-obligation-store`: `defaultRepositoryRuntimeDirectory` places
   incident envelopes and review transactions below `os.tmpdir()`. This violates
   the existing requirement to retain reusable and obligation evidence outside
   `/tmp` until the last authorized consumer finishes.
2. `environment-dependent-store`: the same repository has different store
   addresses when `TMPDIR` differs. The runner sets task-specific `TMPDIR`.
   A two-child-process test on 2026-09-22 confirmed the address difference with
   no file writes. This proves an addressing defect, not the historical loss
   mechanism.
3. `missing-review-state-recovery`: the exact retained receipt and review note
   name eight absent incident envelopes and one absent committed transaction.
   The existing record-review route requires those missing envelopes. Admission
   summaries cannot supply the original complete records. A valid continuation
   must preserve this loss and all unresolved obligations.

The existing reliability planner test explicitly expects the temporary location.
Correct that expectation against the approved durability contract. Do not treat
it as authority to keep required proof in temporary storage. No general cleanup
audit, external backup search, or unrelated verifier redesign is required.

## Required result

Use one stable, writable, project-local durable evidence location shared by the
main checkout and linked role worktrees. Its identity must not depend on a
task's temporary environment. Keep disposable task data temporary. Preserve
the protection against ordinary writes to protected Git metadata.

Use supported, validated migration for any surviving legacy records. Preserve
bytes and identities; reject conflicting copies. Cleanup must retain required
incident, transaction, and receipt evidence while review, integration, or a
terminal obligation remains active. Keep storage policy in a small module;
do not extend the persistence monolith with another unrelated responsibility.

For the retained candidate, first inspect already-retained source receipts and
recording inputs inside the known task evidence boundary. Recover exact records
only where full authenticated inputs support their original identities. A hash,
summary, guessed timestamp, or successful current test does not authenticate a
missing historical envelope. Never hand-edit the journal, incidents, or note.

If the original envelopes cannot be recovered, implement the smallest explicit
same-task evidence continuation that can honestly preserve their unavailability:

- retain the original candidate, note, receipt hash, eight incident IDs, admission
  classes, failure and repair/classification digests, and consumed retry facts;
- record unavailable predecessor evidence separately from newly observed proof;
  do not label a reconstructed envelope as an original record;
- keep every missing incident as an unresolved terminal obligation and do not
  grant another flaky retry merely because its old record is unavailable;
- require fresh canonical changed-path review evidence, all selected tasks,
  properties, and package proof on the exact settled candidate; conserve each
  named failure/regression target or its authenticated successor;
- validate and durably commit the new transaction before another role accepts
  it; missing, mismatched, uncovered, or failed current proof remains blocking;
- do not overwrite the old note, convert its unverifiable claim into a pass,
  silently accept an empty incident population, or erase master obligations.

Use existing evidence and incident operations where they can express these
requirements. A narrowly scoped addition may represent the exact missing-state
gap; it must not become a generic waiver, fabricated history, or new verification
platform. If the retained inputs cannot support even this bounded continuation,
report that exact missing invariant and continue the independent storage repair.
Do not repeat an unchanged broad run to discover the same missing-input error.

## Development focus and review

Before code changes, perform canonical read-only ownership intent. Forecast
`verification_process` with these existing surfaces and proposed slices:

- persistence location and transaction store: `scripts/verification-reliability-persistence.mjs`
  and `scripts/eligible-repair-review-transaction-store.mjs`; durable evidence
  storage slice; consumers incident store, checkpoint store, record-review,
  verify-review, and linked role worktrees;
- exact continuation, only if needed: existing eligible-repair transaction and
  settled-review boundaries; review evidence slice; consumers review recording,
  refactorer and architect handoff validation, and terminal obligation intake;
- current retention and temporary cleanup: existing lifecycle modules; evidence
  retention slice; consumers task completion and integration disposition.

Keep the canonical current/base consumers. The actual intent and changed-path
plan control selection, not this forecast or the previous run's pack count.
Do not run an all-runnable-pack feature checkpoint. Apply standing ownership
rules if this exact change exposes a coarse boundary.

Direct tests must prove stable location across TMPDIR changes and linked
worktrees, retained evidence after owned task cleanup, restart and cross-role
validation, conflict rejection during migration, and failure on absent or
mismatched current proof. If a missing-state continuation is needed, test
preserved predecessor identities, retained terminal debt and retry consumption,
fresh target coverage, and rejection of unsupported reconstructed history.
Use isolated fixtures; never remove or replace live repository evidence in tests.

Keep one repair family through review. Add directly exposed same-family defects
to the final list without another task or authorization. Use failing leaves
during correction, then one exact settled review run with properties and package.
Resume ordinary review of the preserved declaration candidate after the gate is
valid. The full portability product remains dependent on declaration QA.

Report progress after 30 minutes and assess cost, scope, remaining work, and
confidence after 60 minutes. Continue within the approved outcome while the
completion path remains bounded. This correction has no new product behavior.
