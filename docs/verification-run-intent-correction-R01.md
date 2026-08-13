# Verification run-intent correction R01

Status: user-approved and active before Flow relationship snap feedback

## Problem

Slice 1 used the incident-aware evidence runner as its ordinary red/green loop.
Diagnostic failures therefore created shared incidents, retry allowances,
terminal-deferral obligations, and handoff debt before a candidate was sealed.
The coder worktree produced 194 receipt artifacts and 28 durable incidents during
the slice; 34 repair-focused runs consumed about 93 minutes.

Slice 2 reproduced the boundary failure. A deliberately interrupted plain run
created four incomplete-result incidents, and a repaired stale unit expectation
remained a fifth blocking diagnostic incident. Evidence preflight then rejected
the clean candidate before launching a task.

## Required boundary

- An ordinary focused invocation defaults to `development-diagnostic` unless it
  carries explicit review-evidence, governed repair-focused, or terminal authority.
- Development-diagnostic receipts retain task output, timing, and local failure
  detail, but never mutate repository-common incident state.
- A development-diagnostic receipt cannot support review-ready, QA-ready, or
  final-ready evidence and cannot be retrospectively upgraded.
- `--prepare-evidence` is explicit review-evidence authority. A task failure in
  that invocation creates the normal durable reliability incident before any
  unchanged diagnostic retry.
- Governed repair-focused and terminal invocations retain their existing durable
  incident and evidence semantics.
- Evidence recording validates the receipt's immutable run intent and rejects a
  missing, mismatched, or retrospectively upgraded intent.
- A later diagnostic pass cannot erase or supersede an earlier diagnostic
  failure; both remain local diagnostic receipts.

## Pre-correction compatibility

The implementation performs one audited classification of applicable incidents
whose source receipts predate explicit run intent. An incident becomes
nonblocking only when the immutable source receipt proves all of the following:

- there was no evidence task or pending evidence authority;
- there was no repair-focused or terminal authority;
- there was no review-ready, QA-ready, or final-ready claim; and
- the failure came from an ordinary development invocation or its deliberate
  interruption.

The compatibility record retains the incident, original receipt, failure,
timestamps, and transition history. It does not resolve, delete, rewrite, or
retroactively upgrade the receipt. A missing source receipt, ambiguous authority,
or contrary readiness metadata remains blocking.

Eligible terminal-verification-deferred incidents are not diagnostic records and
remain unresolved. Evidence preflight may provisionally admit them only when
changed-path conservation proves the deferred failure, repair, regression,
focused plan, runner semantics, and evidence inputs are unchanged. Exact focused
evidence and package proof remain mandatory, and the handoff gate records the
carry-forward disposition only after those proofs pass.

## Delivery boundary

Apply this correction to the clean Flow CSS candidate before its evidence run,
then continue to relationship snap feedback from the resulting QA head. Keep the
implementation in distinct commits so the verification correction remains
independently reviewable and revertible. It does not authorize an all-20
feature-mode run or master promotion.

## Focused proof and timing expectation

Use the existing release-pilot verification boundary:

```sh
node scripts/run-focused-acceptance.mjs \
  --pack shell \
  --focused-task unit:test/settled-final-verification-workflow-test.mjs \
  --focused-task unit:test/verification-process-contract-test.mjs
```

The implementation expectation is four elapsed hours, with an analysis update at
two hours. These are reporting checkpoints, not intervention gates: work continues
while scope is unchanged, failures have causal explanations, and a bounded safe
completion path remains. Stop only for the release-pilot pause conditions.

Acceptance authority is Modular verification packs 159. Proof covers run-intent
resolution, immutable receipt persistence, diagnostic isolation, review-evidence
failure recording, repair-focused and terminal preservation, evidence rejection,
pre-correction compatibility classification, and conserved deferred-incident
preflight. Gherkin mutation and an all-20 checkpoint are not authorized.
