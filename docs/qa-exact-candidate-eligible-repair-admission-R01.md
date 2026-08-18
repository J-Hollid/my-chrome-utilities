# QA exact-candidate eligible-repair admission R01

Status: policy and implementation handoff approved by the user on 2026-08-19

Prepared: 2026-08-19

## Problem and outcome

Ordinary feature review evidence can create a reliability incident, after which a causal focused repair on the same candidate becomes eligible. The feature cannot currently obtain fresh review-ready evidence without first resolving or deferring that incident, while deferral itself requires the missing review-ready evidence. The existing repair-checkpoint mode requires the terminal all-pack plan, and the one-time run-intent bootstrap correctly rejects an ordinary post-bootstrap feature lineage.

The runner must break only this circular state. A persisted eligible repair bound to the exact candidate may enter one fresh canonical owned-pack review run when that plan executes its regression, governed task, or a validated current successor. A passing run and fresh package result may then record review-ready evidence and the matching terminal deferrals as one safely resumable transaction. The incident remains unresolved for the explicitly requested master-integration checkpoint.

Incident `fcf745d1-e08a-42f2-ba0c-9f73204988bc` and repaired product candidate `690279385ca886090aac059c075f50c2baf22f2d` are the motivating immutable fixture and patch reference. Policy commit `06ca81cde0c27d6c5b9eba5f728c866467dc230f` is also a reference only. Neither candidate is merged or cherry-picked into this clean verification-tooling lineage.

## CLI and admission semantics

No new operator flag is added. The existing command remains the only admission entry point:

```sh
node scripts/run-focused-acceptance.mjs \
  --pack <owned-pack> \
  --property \
  --changed-since <approved-base> \
  --prepare-evidence <stable-task>
```

After strict toolchain, clean-candidate, canonical change-set, and exact-plan validation, ordinary `--prepare-evidence` preflight discovers applicable unresolved incidents. It automatically admits every incident whose persisted repair is eligible for the exact candidate commit and tree and whose plan coverage is valid. The invocation does not accept `--reliability-repair-incident`, `--run-intent-bootstrap`, `--full`, or a new admission switch for this route.

Admission never adds a pack or task. The canonical changed-path plan must already select one of:

1. the repair's registered regression key;
2. the unchanged governed task identity; or
3. one unique current task successor whose logical boundary and conservation digest validate through the existing task-succession graph.

No coverage match blocks before task launch. Ambiguous, missing, split, weakened, unverifiable, or unselected succession remains blocking. The failed source receipt need not contain a bootstrap or deferral declaration that could only have been known after the incident existed.

An admitted evidence run is fresh. `--resume-receipt` cannot reuse results for it. If a task fails, normal incident creation applies, review-ready recording does not occur, every original incident remains unresolved, and the same unchanged run cannot be promoted into evidence.

## Candidate and revalidation rules

Admission requires all of these at discovery, immediately before task launch, at completed-receipt validation, and before transactional recording:

- the candidate is clean and its commit and tree exactly equal the eligible repair candidate;
- the repair remains `eligible` and its failure digest, causal key, repair digest, causal category, bounded explanation, deterministic pre-repair failure, post-repair pass, regression receipt, and focused repair receipt remain valid;
- the repair checkpoint base and evidence task equal the current invocation;
- the canonical current/base change set, selected pack plan, task identities, registry, locked toolchain, built artifact, and package result retain their bound identities;
- the selected regression, governed task, or successor passes freshly in the admitted receipt; and
- every applicable unresolved incident is independently admitted, already eligible under an existing feature-mode disposition, or remains blocking.

Unclassified, unresolved-repair, reproduced, changed, stale, mismatched, uncovered, newly failing, or differently bound states fail closed. A reviewer change to the candidate requires a new exact repair revalidation and fresh review run.

## Receipt contract

An admitted version-2 runner receipt adds one `eligibleRepairAdmissions` object:

```text
eligibleRepairAdmissions:
  version: 1
  evidenceTask
  baseCommit
  candidateCommit
  candidateTree
  changeSetDigest
  planDigest
  entries[]
```

Entries are sorted by incident id. Each entry records `incidentId`, `failureDigest`, `causalKey`, `repairDigest`, `regressionKey`, `selectedTaskKey`, `selectedTaskDigest`, and `coverageKind` (`regression`, `governed-task`, or `successor`). Successor entries additionally record `destinationTaskDigest` and `conservationDigest`.

The existing receipt continues to bind the normal candidate, change set, canonical plan, registry and toolchain identity, artifact, task results, environment, timestamps, and package task. Every selected admission task must appear once with `fresh` passing provenance. The admission object is copied into the review-ready record and its digest participates in the resulting transaction identity.

## Atomic review recording and recovery

`settled-final-verification.mjs record-review <receipt> <base> <task>` owns recording. For a receipt with admissions it creates one deterministic transaction identity from the candidate, task, receipt digest, and admission digest. The transaction binds:

- the review-ready Git-note record;
- one exact `terminal-verification-deferred` disposition for every admitted incident;
- the fresh canonical package proof; and
- the pre-existing incident and note digests used for conflict detection.

Recording uses one canonical lock order for the repository-common incident store and review-ready Git notes. It writes a durable prepared journal before publishing either side and marks the transaction committed only after all records are durable. Repeating the command with identical inputs is idempotent.

A crash may leave no published record or a prepared transaction with one side already written. Until the transaction is committed, review-ready and QA-ready validation fail. Repeating the exact command resumes the journal, validates any existing exact record, writes only missing records, and commits. A stale candidate, changed receipt, conflicting note, changed incident, or mismatched transaction blocks without overwriting evidence. Handoff validation becomes read-only for this route and cannot create a late deferral.

## Handoff and terminal boundary

A committed transaction permits the ordinary coder-to-refactorer, refactorer-to-architect, and architect-to-specifier focused handoffs. Each validation requires the exact review-ready record, transaction identity, and every matching deferral. The disposition retains the failure, repair, regression, selected coverage, receipt, package proof, candidate, and lineage; it is neither resolution nor abandonment.

No coder, refactorer, or feature-mode architect may use all-pack execution as admission, repair, evidence, or fallback. Only an explicitly requested master-integration phase may run the canonical all-20 properties and package checkpoint, resolve matching deferred incidents, and supply final-ready evidence.

Until this implementation reaches QA, the product task reports `eligible-repair-admission-needed` with the incident id, candidate, exact pack plan, and regression identity. It does not merge the policy reference or run an all-pack checkpoint.

## Development focus and QA impact

Stable task name: `eligible-repair-admission`.

Development focus is automatic preflight admission, exact task/successor coverage, receipt validation, transactional review recording and recovery, and read-only handoff validation. Deterministic fixtures reproduce the immutable shape of incident `fcf745d1-e08a-42f2-ba0c-9f73204988bc`; tests do not read or mutate the live incident.

Likely integration surfaces are:

| Proposed source path or prefix | Proposed parent pack | Proposed subordinate slice | Exact consumers |
|---|---|---|---|
| `scripts/run-focused-acceptance.mjs` and `scripts/verification-run-intent.mjs` | `shell` | `eligible_repair_admission` | exact feature review runner and receipt preparation |
| `scripts/verification-reliability-` and `scripts/verification-task-succession.mjs` | `shell` | `eligible_repair_admission` | incident eligibility, conserved task coverage, deferral persistence, and handoff gate |
| `scripts/settled-final-verification` and `scripts/verification-evidence.mjs` | `shell` | `eligible_repair_admission` | review-ready recording, transaction recovery, evidence validation, and QA handoff validation |

The coder performs read-only ownership intent classification before implementation. A coarse boundary routes the existing independently reviewed preparation lifecycle; no classification authorizes all-pack feature evidence.

Direct development checks are:

```sh
node test/verification-process-contract-test.mjs
node test/settled-final-verification-workflow-test.mjs
node test/verification-evidence-production-path-test.mjs
node scripts/verification-task-succession-test.mjs
```

The settled candidate produces one Shell-only property-enabled review receipt with package proof. The exact changed-path plan must remain bounded and must not use `--reliability-repair-incident`, `--run-intent-bootstrap`, or an all-pack fallback.

The implementation effort ceiling is six active hours. At three active hours report admission preflight, receipt schema, transaction and crash-recovery status, task-succession coverage, current exact plan, failures, variance, remaining work, confidence, and completion forecast. Continue while the approved policy and fail-closed safety boundary remain unchanged and a credible bounded path exists.

After architect `qa-ready` integration, reissue `guided-excel-template-authoring` from that exact QA head. Reconstruct its product and causal browser repair from current QA, using `690279385c` only as a patch reference; do not merge its stopped lineage or policy commit `06ca81cd`.
