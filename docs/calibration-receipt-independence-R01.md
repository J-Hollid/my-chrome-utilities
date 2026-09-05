# Calibration receipt independence R01

Status: bounded clarification and repair for the active Serena preparation.
Prepared: 2026-09-05. Active task: `verification-slice-serena-development-pilot`.
Candidate to preserve: `3dae61aa25bd66c8547e9e2cabdbf15feff86aba`.
Received specification: `f338e511090712038e2f789a927a1514293e8000`.

## Decision

Coder note `20260905T154122Z_000002_from_coder` reports the user's direction
that calibration receipts should not be necessary. Ordinary feature checks
must test calibration rules with fixed, explicit test inputs. They must not
depend on old files in worker temporary directories. Committed calibration
values can remain historical planning references without a claim that their
source measurements have been reverified.

Use both deterministic rule tests and validation of the committed aggregate's
structure and provenance. Do not replace a missing raw receipt with invented
bytes, a made-up retirement record, a guessed completion time, or a passing
evidence claim. The live receipt validator must still reject missing inputs
when asked to verify raw measurement evidence. No catch-and-pass fallback.

## Completed bounded discovery

Repair family: `historical-calibration-dependency`.
Repair boundary: `calibration-contracts-and-receipt-consumer`.
Discovery is complete for the two selected failing contract tests, their shared
calibration support, the snapshot validator, and its cleanup consumer.

- `temporary-input-dependency`: both calibration and regression-routing checks
  load the August snapshot's live temporary sources. Six declared digests have
  neither raw bytes nor validated compact retirement identities.
- `ambient-test-population`: the shared checks derive their future cutoff and
  rejected/cross-class examples from the current receipt population. Test
  outcomes therefore depend on unrelated worker activity and retained files.
- `historical-consumer-coupling`: the calibration cleanup consumer loads and
  validates that same population before it can determine whether a receipt is
  still needed. A historical aggregate needs an explicit source-use status.

No further filesystem search is required. The reported searches did not find
the six raw samples. The user confirmed that workflow cleanup of `/tmp` removed
the receipts to prevent artifact buildup. A specific cleanup run identity is
not needed to repair the invalid dependency on temporary storage.
Later defects in this same boundary are covered by this repair through review;
record them in the final list without another repair task or unblocker.

## Historical sample disposition

Retain the committed calibration values, sample digest declarations, environment
identities, cutoff `2026-08-07T17:52:01Z`, and existing valid retirement entry.
Add a small explicit provenance record bound to the prior committed calibration
content. Mark these six source digests `unavailable`, with the reported lack of
retained sources after workflow cleanup and no invented per-sample environment
or completion time:

```text
036d34237df27751e01c1f14b8a72d549091a337334080c1b4c48bc5c305f94f
06c5d8d3ab8f6c24f338400a4b732ba38d6b4bb61e1512791a551efa7d7f1e6c
0ae5a5030a8a22dc27635db9f6652e48ca1215042ee0050d7442da37e14964f3
67079c46c2b9252184ca2565f6612e7feb78c9b079b13cf022ad8ca74e29a68c
7ba1be419524ae6bb11fd37d38869c32fea46594bff342af20b1c4c67ece14d4
dfab23992aa1c83ae5d17c86a858abacb943b174194a39be314ad99c0ea756a2
```

The seventh digest, beginning `7ec18d46`, retains its existing compact retirement
record unchanged. Unavailable is a distinct status, not successful retirement.
The aggregate is a historical reference with incomplete source evidence. Do not
count the six unavailable samples as newly validated measurements or use this
disposition to support fresh performance, review-ready, or final-ready proof.

Validate the aggregate's schema, finite limits, declared identities, provenance
binding, and retained values without loading temporary sources. Keep timing
limits and their existing use unchanged. Report source limitations wherever
this record is presented as measurement evidence. An explicit recalibration
still requires valid source measurements; it is outside this repair.

The explicitly recorded historical-reference status ends calibration-only raw
retention for this snapshot. Other consumers, active incidents, pending reviews,
and release obligations retain their normal authority. Cleanup must not load
the old timing ledger for this closed historical consumer, nor delete anything
merely because a calibration input is missing. This clarification supersedes
the raw-calibration retention clause only for the explicitly disposed snapshot.
Other active calibrations keep their existing input validation requirements.

## Implementation and verification boundary

Extract the duplicated calibration test setup into one small authored fixture
helper, with fixed pre-cutoff, post-cutoff, rejected, duplicate, missing, and
cross-environment examples. Fixture timestamps and digests must be clearly test
data and must never use the six missing identities as reconstructed receipts.
Exercise the real snapshot validator and comparison logic. Preserve omission,
duplicate, rejection, environment, cutoff, retirement-match, and nonmutation
assertions. Keep unrelated topology and regression-routing assertions intact.
Separate fixture helpers from test cases; do not add to the large test monoliths.

Development focus: the calibration fixture/aggregate checks, the two selected
calibration and regression-routing contracts, and the calibration receipt
consumer test with active-consumer controls. Acceptance contract:
`features/calibration-receipt-independence.feature`.

Likely shared paths: the two selected contract tests,
`test/verification-contracts/reliability-calibration-conservation-support.mjs`,
`scripts/verification-calibration-receipt-consumer.mjs`,
`scripts/verification-performance/retired-calibration-receipts.mjs`,
the calibration part of `scripts/verification-performance/report-throughput.mjs`,
and `verification/performance-calibration.json`. Change only what this boundary
needs. Use the existing `verification_process/timing_performance` and
`verification_process/reliability_run_intent` slices. Register a new small
fixture or aggregate helper by exact path under its existing parent slice;
exact consumers are the two selected contract tests and the calibration
receipt consumer. No new broad source prefix or verification pack is required.

QA forecast remains `shell` plus `verification_process`, subject to full
current/base planning and properties. Run intent for these repair paths and
exact preflight for the coherent candidate. Do not omit selected checks, alter
runtime pins, remove global ownership, rewrite past evidence, or weaken the
review/incident/terminal gates. No all-runnable-pack feature run is authorized.

## Resume the current task

Use a structured verification-repair unblocker in resume mode for active
handoff `20260905T144521Z_000884_from_specifier`. Keep the same preparation task
and candidate lineage; do not close it or create a replacement task. Merge this
clarification commit into the preserved candidate, make the bounded repair in
an identifiable commit, and continue normal focused review from the received
specification. Preserve the existing preparation work and repair history.

Forecast: 90 minutes, with a progress report at 45 minutes. Report variance and
the remaining causal work; continue bounded safe work. No further recovery
search, calibration benchmark, synthetic evidence archive, or new enforcement
programme is required. The repair is complete only after fresh focused evidence
and normal independent review. Keep `serena-development-pilot` paused until
the preparation has exact architect `qa-ready` proof integrated into QA.
