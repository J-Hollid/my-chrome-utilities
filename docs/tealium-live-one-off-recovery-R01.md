# Tealium Live: approved one-off evidence recovery

The user approved this route on 2026-09-10 after rejecting the proposed
2–4 hour general evidence-loss implementation. Continue stable task
`tealium-live`. This instruction supersedes the pending general recovery
proposal. There is no new verification framework or preparation task.

## Preserved work and authority

Keep product candidate `37dfa7e574399e17e2501c3004552301824b997a`, tree
`a2653bac3ba96360eb6c7dbf0e250856c9fce0db`, based on `fa8ea6c1ed`.
The refactorer's complete product audit found no additional blocking product
finding. The candidate's old review note remains invalid for admission because
its original incident and transaction records are unavailable. The cause and
time of storage loss are unknown; a Windows restart is only a possible cause.

The approved product requirements and registration/activation sequence in
`docs/tealium-live-preparation-acceptance-R01.md` remain unchanged. Preserve
the product delta when merging this documentation-only QA descendant. Use the
resulting new candidate for fresh evidence; do not overwrite the old review
note or present its receipt as newly passed evidence.

## New current-time incident, using the existing API

The specifier used `createTimeoutIncidentStore().create()` to record the
preserved failed observation under new incident
`c3ac1af2-5a9b-4fe1-b9b6-34d581bc8451`, created at
`2026-09-10T00:08:17.987Z`. Its state is unresolved. It was read back through
the store and accepted by `timeoutRepairDiagnosedBoundary()` for
`checkpoint:shell:tealium-live-closure`.

The failure receipt's SHA256, failed task, Git tree, and causal key were checked.
The existing failure-contract function derives the same causal key as the old
review admission. Only fields supported by the preserved receipt are recorded.
The record explicitly names the unavailable original incident, transaction,
failure digest, old review, and unknown historical fields. It does not recreate
the original incident envelope, transition history, repair eligibility, or
journal. No tests or package checks have been rerun by this recording action.

`docs/tealium-live-recovery-sources-R01.json.gz` archives exact UTF-8 bytes and
SHA256 values for the original failed, repair, and review receipts, the old
review note, and the new incident envelope. These copies preserve evidence;
they do not waive any admission check. The original receipts also remain in the
coder worktree's `tmp/verification-receipts/` directory.

## Coder continuation

1. Merge this documentation-only QA descendant into the preserved product
   candidate. Commit only the task's changes. Preserve unrelated worktree files.
2. Read the new incident through the existing store. Run the existing focused
   repair route for `checkpoint:shell:tealium-live-closure`, with the new incident
   ID, the current QA documentation base, and stable task `tealium-live`.
   Keep causal category `other:reset access readiness`: the old test clicked
   Start before access confirmation; the repair waits for enabled Start.
   The deterministic held-probe before/after fixture must run again under the
   new incident context. Do not relabel the old repair receipt.
3. Use ordinary repair eligibility and exact-candidate admission. Derive and
   inspect the exact focused plan with properties and fresh package proof.
   The prior review had 125 tasks; this is a comparison, not a ceiling or a
   substitute for the actual plan. No all-pack gate is authorized.
4. Record a new review only after the required fresh run passes. Keep the new
   incident unresolved with the normal terminal deferral. Preserve the closure
   obligation and all master obligations for `build-delivered-dependencies.json`
   and `src/background.ts`; record loss does not remove them.
5. Forward through refactorer and architect with the normal exact evidence.
   QA integration remains pending until the architect sends `qa-ready`.

Use existing helpers only. If the operator route fails, report that exact
failure and preserve all results. Do not add a new evidence-loss policy, invent
missing historical fields, or start another preparation program. Later
same-task product work and manifest activation remain part of the approved
Tealium delivery.
