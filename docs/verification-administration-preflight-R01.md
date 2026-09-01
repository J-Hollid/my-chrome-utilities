# Verification administration preflight R01

## Status and authority

The user approved this correction on 2026-09-01 after the completed side-panel
paper-first redesign repeatedly reran expensive focused verification because
administrative evidence faults appeared only after all planned tasks passed.
This is a verification-process correction. It does not change product behavior,
weaken verification, reuse proof across candidate identities, authorize an
all-runnable-pack feature run, or promote `qa` to `master`.

## Observed bottleneck

Candidate `2c3180329fbd24a821ad594a7ed716f18d2dbdbf` passed an exact 17-pack,
865-task review run and package proof under receipt
`2730347-6d9664f7-34b1-4816-b273-37f0586d7f87`. Earlier candidate attempts
finished or nearly finished the same costly checks before evidence
administration exposed stale conservation authority, an incorrect incident
checkpoint binding, an integrated raw-receipt identity that had moved to a Git
note, and a valid large Git note that exceeded the reader's default buffer.
Each repair changed the candidate identity and forced another exact run.

The final architecture handoff exposed the same ordering defect at a smaller
boundary: the accepted candidate validator passed, but a stale reviewer-worktree
validator could not read an already retired incident. A bounded candidate-
validator route sent the unchanged QA-ready handoff without another proof run.

## Required behavior

Before the first planned verification task starts, evidence mode runs the same
read-only administrative eligibility logic that pending-evidence creation and
recording use where completed task results are not required. It validates:

- the clean candidate, canonical change set, exact plan, conservation authority,
  registry, toolchain, artifact-input identity, and receipt contract;
- bounded readability and exact identity of required Git notes and compact
  integrated-resolution records;
- every applicable incident admission, binding, disposition, resolution, and
  terminal deferral needed by the candidate; and
- required receipt-output, artifact, local execution, and Git-metadata promotion
  capabilities through their existing scoped routes.

The preflight is read-only. It does not create or change an incident, receipt,
checkpoint, pending-evidence file, Git note, review record, candidate file, or
handoff. If one condition fails, it reports the exact condition and launches
zero planned tasks.

A passing preflight does not replace any verification. The runner still executes
the complete canonical product, property, browser, acceptance, package, receipt,
pending-evidence, Git-note, and review checks. Final evidence repeats the same
administrative checks so a state change during the run remains fail-closed.

If all planned tasks passed on an unchanged candidate but a later promotion step
fails, the existing checkpoint attempt remains eligible for promotion-only
recovery. A compatible restart retries only the unfinished administrative step
after exact identity and eligibility revalidation. Candidate, tree, plan,
artifact, registry, toolchain, receipt, incident, or authority drift blocks
reuse and follows the existing fresh-verification rule.

## Development focus and QA impact

Likely existing shared integration surfaces are
`scripts/verification-execution/runner.mjs`,
`scripts/verification-evidence/core.mjs`, and the existing checkpoint-attempt
promotion recovery. Proposed source prefixes and consumers are:

| Prefix | Proposed parent pack | Slice | Exact consumers |
|---|---|---|---|
| `scripts/verification-execution/` | `verification_process` | `evidence_administration_preflight` | focused evidence runner and checkpoint recovery |
| `scripts/verification-evidence/` | `verification_process` | `evidence_administration_preflight` | prelaunch compatibility, pending evidence, Git-note recording, and durable evidence verification |
| `test/verification-contracts/` | `verification_process` | `evidence_administration_preflight` | evidence-promotion and execution-checkpoint contracts |

The coder must run read-only intent classification before implementation. The
expected result is bounded-ready under `verification_process`. Any genuinely
global result or all-runnable-pack feature plan stops before task launch.

## Acceptance and proof

Deterministic fixtures must prove that each observed administrative defect fails
before a child task launches, including a large valid Git note within the
supported bound. They must also prove that a passing preflight preserves the
complete planned task set, final evidence rechecks eligibility, and a completed
unchanged attempt resumes promotion only after a forced pending-file, Git-note,
or review-record failure. Identity drift must reject promotion-only reuse.

Use the exact focused `verification_process` plan selected by candidate
preflight, with properties and package proof. Do not run product browser packs,
reuse the side-panel receipt as proof for this correction, or run an
all-runnable-pack feature checkpoint.
