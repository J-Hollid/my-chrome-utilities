# Portability baseline evidence limitation R01

Status: user-approved for implementation and coder handoff on 2026-09-19.
Scope: verification tooling only. No product behavior change.
Stable task: `portability-baseline-evidence`.
Starting QA: `b82cbe5d591052a249a5a9fe7f728eb0cbcb3c01`.
Contract: `features/deterministic-baseline-evidence.feature`.

## Where work stopped

Declaration candidate `8fea2c4f37ca407a627263094653c77bd533cf98` has a
passing content review, but no review-ready evidence. Product candidate
`35c35fc3aff4d377f5e643d73ca974793aab93c4` remains retained outside QA.
Preserve both candidates and all existing evidence unchanged.

The declaration receipt recorded 1,189 passed tasks, including 90 property
tasks, one failed verification_process acceptance session, cancelled Shell
work, no final package result, and no completedAt value. The failure is
Modular verification packs 042/example_1: `Owner handler is not declared
isolated.` The project_management handler and isolation arrays are unchanged
between base `3825605b0672ddfaa12bb81fd20e573b40b7db79` and the candidate.
This establishes the reported baseline finding, not a completed verification.

Receipt identity: `3675789-78ac9a9b-7bd3-4dce-8a79-4bfa58b09b51`.
Recorded SHA-256:
`29dd00bb93ae233aecc0a6d42583988f8db7d902b222bcc6c980763ee8045a3b`.
The architect could not find the receipt at its recorded path. Its absence
does not authorize reconstruction, a replacement digest, or a success claim.

## Exact limitation and decision

Current review recording rejects non-passing tasks and incomplete receipts.
Current admission supports eligible repair, confirmed flaky failure, and the
existing bootstrap obligation; none represents this deterministic baseline
failure. The special blocked-aggregate route does not apply.

The approved change permits an explicitly bound baseline obligation in a
fresh, complete focused review. It does not upgrade the retained failed run.
The user explicitly approved this specification and coder handoff after review
of the evidence-policy change. This approval supersedes the earlier read-only
routing restriction only for this bounded repair. Preserve all other limits.

Implement from the specification commit based on the starting QA above, in the
assigned coder worktree. Do not inherit unrelated changes from an old task
branch. Complete read-only intent classification before coding, then follow
coder to refactorer to architect review and return exact qa-ready evidence to
the specifier. This authorizes QA integration only, not master promotion.

## Required behavior

1. Use the existing evidence and incident lifecycle. Add no separate framework,
   permanent census, portability exception, or general ignore-failure switch.
2. Classify only a deterministic failure proved to exist on the accepted base
   and not made worse by the candidate. Bind the task, base and candidate
   commits and trees, relevant failing inputs, exact check and failure
   identities, authenticated source evidence, and canonical selected plan.
   Equal handler arrays alone do not prove every input is unchanged.
3. Missing source evidence blocks admission. A new diagnostic pair may supply
   separately identified proof: execute only the exact failing check on the
   accepted base and candidate. Each receipt must bind its immutable diagnostic
   intent, commit and tree, locked toolchain, check identity, complete relevant
   input closure, result and failure digest, timestamps, and source path.
   Authenticate both receipt bytes against their recorded digests and repository
   identities; require equal relevant inputs and the same deterministic failure.
   Keep both source receipts in the existing durable evidence lifecycle while
   consumers need them. A caller assertion or recorded historical digest without
   its source bytes is insufficient. This pair cannot replace the historical
   receipt or acquire review-evidence intent. Do not run a baseline suite.
4. A fresh review must account for the complete selected plan. Every check
   other than the exact admitted failure must pass, including previously
   cancelled work, required properties, and the final package check. Preserve
   the admitted check's fresh matching failure as a failure with a deferred
   obligation. A missing or stale admitted-check result blocks recording. Do not mark
   skipped, cancelled, missing, or failed results as passed.
5. Reject changed failure inputs, a changed failure, extra failures, missing
   identity proof, incomplete work, or absent package proof. The admitted
   failure cannot hide other failures in the same acceptance session.
6. Record the exact deferral and review-ready evidence in one transaction.
   A failed transaction leaves neither a usable review claim nor a partial
   deferral. Revalidate identities when evidence is consumed.
7. Retain the unresolved obligation for the later user-requested master gate.
   This route permits focused review and QA only. It never proves final-ready
   status and does not weaken the terminal gate.

## Bounded development and verification

Repair family: deterministic-baseline-admission.
Known defects: no baseline admission representation; review promotion cannot
distinguish an authenticated baseline obligation from an unclassified failure.
The architect completed one read-only discovery of the recording and admission
boundary. Missing historical evidence remains a runtime blocker, not permission
to enlarge this repair or invent proof.

Likely integration paths:

| Paths | Parent pack and slice | Consumers |
|---|---|---|
| scripts/settled-final-verification-review.mjs, scripts/settled-final-verification.mjs, and scripts/settled-final-verification-policy.mjs | verification_process / evidence_promotion | focused review recording, handoff eligibility, and review evidence validation |
| scripts/verification-policy/reliability/run-intent.mjs, scripts/verification-reliability-store.mjs, and scripts/verification-reliability-persistence.mjs | verification_process / reliability_run_intent | admission and incident persistence; scripts/verification-run-intent.mjs is the export surface |
| scripts/verification-policy/reliability/terminal-closure.mjs and scripts/verification-reliability-deferred.mjs | verification_process / reliability_run_intent | terminal obligation and conservation of all baseline-bound inputs across later changes |
| scripts/verification-execution/bounded-stage-coordinator.mjs | verification_process / execution_checkpoint | continuation of independent selected tasks after the exact admitted failure |
| scripts/verification-execution/runner.mjs and scripts/verification-evidence/core.mjs | verification_process / evidence_administration_preflight | complete receipt finalization and result validation |
| verification/manifests/verification_process.json and generated verification/packs.json | canonical registry ownership | selected plan and contract registration |

Before coding, use the canonical ownership query and read-only intent plan.
Keep new logic in small modules. Do not extend a monolith. Do not alter product
files, project_management handlers, existing candidate bytes, or old receipts.
If actual dependencies exceed this boundary, report the exact cause first.

Development focus: direct contracts for admission, receipt completeness,
evidence conservation, incident storage, transaction failure, and terminal
policy. Execute production validators with real receipt fixtures; source-text
assertions and acceptance-world flags are not runtime proof.

QA impact: the canonical changed-path selection for evidence_promotion,
reliability_run_intent, and the execution/evidence paths above, with required
consumers, properties, and package. Do not assume a two-slice plan.
The exact plan governs. No all-runnable-pack feature checkpoint is authorized.
Do not use this new policy to excuse failures in its own implementation proof.
Coder, refactorer, and architect review remain required before QA integration.

Target: 90 minutes, with a bounded progress assessment after 45 minutes.
Report any unresolved cause rather than starting another infrastructure stage.

## Specification checks

The architect's first draft review found missing execution and terminal paths,
an export-only run-intent path, and incomplete fresh diagnostic proof rules.
This revision addresses those findings and marks product resumption as context.
Canonical path queries confirm the added execution_checkpoint and
evidence_administration_preflight owners. These queries are not a settled plan.
The revised seven-scenario contract parses, and the APS IR DRY checker reports
zero findings. No implementation or runtime verification has occurred.

## Continuation after approval and QA

After this repair reaches QA, resume the same declaration task with conserved
source changes and fresh evidence. If source evidence cannot be authenticated,
keep only that gate pending and report the exact missing input.
Non-authorizing context: existing product routing resumes
`complete-configuration-portability` only after declaration QA, preserving the
product remainder and accepted Shell prerequisite repair `0fe143757d`. This
tooling proposal does not itself resume product work or authorize the old-base
full-review loop.
Do not call done_with_current.sh for either earlier undelivered assessment note.
