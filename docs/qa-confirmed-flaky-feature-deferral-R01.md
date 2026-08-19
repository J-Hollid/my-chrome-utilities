# QA confirmed-flaky feature deferral R01

Status: approved correction for immediate QA implementation on 2026-08-19

Prepared: 2026-08-19

## Problem and outcome

An ordinary feature review run may fail one governed task and then pass the one
allowed exact diagnostic retry. The reliability store correctly classifies that
result as `confirmed-flaky`, but currently leaves the incident blocking because
feature-mode terminal deferral accepts only a causal repair. This forces an
unrelated verification repair or an impermissible all-20 run before the product
can obtain review-ready evidence.

The correction admits a current, exact `confirmed-flaky` incident into one new
canonical owned-pack review run. The diagnostic pass is classification proof
only: it is never reused or promoted as review evidence. Every task in the
canonical plan, including the governed failed task or one validated conserved
successor, must pass freshly with package proof. Recording then binds
review-ready evidence and a `terminal-verification-deferred` disposition in one
recoverable transaction. The incident remains unresolved and visible for the
explicitly requested master-integration checkpoint.

Incident `e5df733f-58e5-45e6-8488-bda10eb58bf4`, source candidate
`f6db2c89a9200bbd4c09b328d50bbdff7c5629de`, and its two receipt paths are
immutable motivating references. Tests reproduce their shape in isolated
fixtures and do not read or mutate the live incident store. The candidate is a
patch reference only and is not merged into the correction lineage.

## Admission semantics

No new operator flag is added. After ordinary strict candidate, toolchain,
change-set, plan, artifact, and incident validation, the existing command
automatically discovers qualifying confirmed-flaky incidents:

```sh
node scripts/run-focused-acceptance.mjs \
  --pack <owned-pack> \
  --property \
  --changed-since <approved-base> \
  --prepare-evidence <stable-task>
```

Admission requires one unresolved incident whose single governed diagnostic
retry is durably `classified`, has outcome `passed`, and has classification
`confirmed-flaky`. The retry receipt must be the exact fresh repair-focused
diagnostic named by the incident and must bind the same failure digest, causal
key, retry identity and scope, candidate commit and tree, base, evidence task,
artifact, environment, resolved deadlines, registry, and toolchain. A recorded
rebase is acceptable only when the existing lineage-transition validator proves
the current candidate conserves the recorded product delta and every other
identity can be rederived without ambiguity.

Admission never adds a task or pack. The canonical changed-path plan must
already select the unchanged governed task or one unique current successor that
passes the existing logical-boundary and conservation-digest checks. If neither
is selected, preflight blocks before task launch. A diagnostic target nested in
a grouped browser task is coverage of that governed task only when the fresh
review plan selects and passes the current grouped task identity; the isolated
diagnostic target pass is not a substitute.

The route rejects a claimed-but-unclassified retry, `reproduced-failure`,
`changed-failure`, `diagnostic-contract-failure`, an eligible repair, a stale or
missing diagnostic receipt, more than one retry, ambiguous succession, or any
candidate, tree, lineage, task, retry, receipt, plan, artifact, environment,
deadline, registry, or toolchain mismatch. Existing eligible-repair admission
continues unchanged and is independently validated.

## Fresh evidence and receipt

An admitted run cannot use `--resume-receipt`. It executes the complete current
owned-pack plan with properties and a fresh package result. Every selected task
must pass in this run. Any failure creates or updates the ordinary immutable
incident state, prevents review-ready recording and deferral, and leaves the
original confirmed-flaky incident unresolved.

The immutable runner receipt adds `confirmedFlakyAdmissions` version 1 with the
evidence task, base, candidate commit and tree, change-set digest, and plan
digest. Entries are sorted by incident id and bind:

- `incidentId`, `failureDigest`, and `causalKey`;
- `retryIdentity`, `retryReceiptSha256`, and `classificationDigest`;
- `governedTaskDigest`, `selectedTaskKey`, `selectedTaskDigest`, and
  `coverageKind` (`governed-task` or `successor`); and
- for successor coverage, `destinationTaskDigest` and `conservationDigest`.

The ordinary receipt still binds its locked toolchain, artifact, canonical
plan, environment, resolved deadlines, fresh task results, and package task.
Admission is rederived at task launch, receipt completion, and review recording;
a changed set blocks rather than being carried.

## Atomic deferral and handoffs

`settled-final-verification.mjs record-review` owns one deterministic transaction
covering the review-ready Git note and one exact deferral for every eligible-
repair or confirmed-flaky admission in the receipt. The confirmed-flaky
disposition records `basis: confirmed-flaky`, the classification and diagnostic
proof digests, selected fresh coverage, candidate and lineage, review-ready
receipt, package proof, and transaction identity. It does not invent a repair
or `repairDigest`.

The existing canonical lock order, prepared journal, conflict checks, idempotent
replay, and crash recovery apply to the combined transaction. Until it is
committed, review-ready and QA-ready validation fail. Handoff validation is
read-only and requires every bound disposition; it cannot create a late
deferral.

The disposition is neither resolution nor abandonment. During explicit master
integration, the ordinary fresh canonical all-20 properties-and-package
checkpoint consumes it as follows:

- if the governed task or its validated current successor passes in the sealed
  checkpoint, the confirmed-flaky obligation is resolved with that terminal
  evidence and its full diagnostic history retained; or
- if the same failure reproduces, a changed failure occurs, identity is stale,
  or coverage is absent, final-ready recording blocks and the incident remains
  unresolved for causal repair.

No feature-mode role may run the all-20 gate or treat the diagnostic retry as a
passing review task.

## Development focus and QA impact

Stable task name: `confirmed-flaky-feature-deferral`.

Development focus is automatic confirmed-flaky discovery, exact governed-task
or successor coverage, receipt validation, repair-free disposition persistence,
transaction recovery, read-only handoff validation, and terminal consumption.
Likely integration surfaces are:

| Proposed source path or prefix | Proposed parent pack | Proposed subordinate slice | Exact consumers |
|---|---|---|---|
| `scripts/run-focused-acceptance.mjs` and `scripts/verification-run-intent.mjs` | `shell` | `confirmed_flaky_feature_deferral` | exact feature review runner, admission preflight, and receipt preparation |
| `scripts/verification-reliability-` and `scripts/verification-task-succession.mjs` | `shell` | `confirmed_flaky_feature_deferral` | classification identity, governed coverage, repair-free deferral, and terminal disposition |
| `scripts/settled-final-verification` and `scripts/verification-evidence.mjs` | `shell` | `confirmed_flaky_feature_deferral` | atomic recording, crash recovery, evidence validation, and QA handoff validation |

No production source prefix is introduced. The coder performs read-only
ownership intent classification before implementation. The expected candidate
is a bounded Shell plan with properties and package proof; no feature-mode
all-20 execution is authorized.

Direct development checks are:

```sh
node test/verification-process-contract-test.mjs
node test/settled-final-verification-workflow-test.mjs
node test/verification-evidence-production-path-test.mjs
node scripts/verification-task-succession-test.mjs
```

The implementation effort ceiling is six active hours. At three active hours,
report admission, receipt, transaction and recovery status, exact plan, failures,
variance, remaining work, confidence, and forecast. Continue while the approved
verification-only scope and fail-closed boundary remain unchanged and a credible
bounded path exists.

After this correction receives architect `qa-ready` integration, automatically
reissue `documentation-template-recovery` from that exact QA head. Reconstruct
the byte-for-byte product delta from base `a31d16884f` to patch reference
`f6db2c89a9`, record the validated incident rebase transition, and run the fresh
canonical seven-pack review route. Do not merge the stopped branch, reopen
product behavior, weaken its ownership plan, or run all 20 packs.
