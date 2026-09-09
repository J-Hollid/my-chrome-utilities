# Tealium Live specification checks R01

Date: 2026-09-09. Status: specification complete; user approval recorded.
This is specification evidence, not implementation or release proof.
The scorecard below records the draft checks before approval. The user later
replied "Approved", authorizing the coder handoff and focused QA integration.

## Scorecard

| Item | Result |
| --- | --- |
| Behavior groups | Detection, Live, source navigation |
| Feature contracts | 6 files: 3 product and 3 runtime |
| Named scenarios | 45: 23 product and 22 runtime |
| Expanded example cases | 98: 60 product and 38 runtime |
| Locked APS parser | All 6 files passed |
| IR-DRY review | All 6 checked; 2 setup findings normalized; 4 advisory findings retained |
| Scenario names and parameters | Stable indexes; no missing or unused example parameters |
| Example pruning | No identical columns in multi-row tables |
| Shared setup | Background used in all 6 files |
| Product runtime checks in this turn | None |
| Acceptance mutation and product quality tools | Not run by the specifier |
| Coder handoff, QA integration, master gate | None |

The earlier experimental runtime proof remains in
`docs/tealium-live-experiment-R01.md`. Its 30 checks are not additional passing
checks of this new specification. Frame coverage, access recovery, same-URL
document identity, native side-panel layout, and representative performance
remain implementation obligations.

## Per-contract results

| Contract | Scenarios | Expanded cases | Retained IR findings |
| --- | ---: | ---: | ---: |
| `tealium-detection.feature` | 8 | 20 | 1 |
| `tealium-detection-runtime.feature` | 7 | 10 | 0 |
| `tealium-live.feature` | 8 | 19 | 1 |
| `tealium-live-runtime.feature` | 9 | 16 | 0 |
| `tealium-source-navigation.feature` | 7 | 21 | 2 |
| `tealium-source-navigation-runtime.feature` | 6 | 12 | 0 |

The IR review normalized selected-document setup in Live runtime 004 and 008,
while keeping the pending-read condition explicit. Source runtime setup was
pruned and its observed-fixture step was made identical where meanings matched.
Affected files were parsed and checked again after the edits.

The four retained findings have different meanings:

1. Detection 001 uses fixed Detected, while 002 varies the expected state.
   Adding a constant state column to 001 would add no acceptance value.
2. Live 003 starts and pauses observation. These are distinct actions.
3. Source navigation 001 activates Show in Sources; 002 checks its availability.
4. Source navigation 003 sets up an invalid pending action; 004 evaluates
   resolution evidence. These cannot share one assertion or action.

The checker reports advisory wording similarity, not functional equivalence.
No acceptance mutation was run, so mutation effectiveness remains unproved.

## Reproduction

For each feature basename in the table, run from the assigned checkout:

```sh
bb gherkin-parser features/<name>.feature tmp/tealium-live-spec/<name>.json
bb gherkin-ir-dry-checker tmp/tealium-live-spec/<name>.json tmp/tealium-live-spec/<name>-dry.json
```

Create `tmp/tealium-live-spec/` if needed. This session's parser output, DRY
reports, and parameter review are in that directory. The example review checks
declared parameters against scenario and Background use and checks multi-row
tables for redundant constant columns.

## Process findings and recommendation

What worked: the experiment supplied a real bundled-source case and exposed
the difference between registration and firing. Existing Live contracts supplied
clear target, focus, and scroll behavior. Canonical ownership queries identified
the manifest/background cost boundary before implementation.

Process failures: some discovery output was excessive, and local tools returned
usage errors for conventional `--help` calls. Narrower inspection supplied the
needed facts. No feature parser failed and no product test was attempted.

Recommendation: proceed with the approved product behavior and require coder intent
classification before implementation. Keep private Tealium checks separate from
shared-host changes. Do not interpret this specification as approval to run an
all-pack feature checkpoint or to build another verification framework.

The main specification is `docs/tealium-live-R01.md`; the verification forecast
is `docs/tealium-live-verification-R01.md`. The active-scope manifest was unchanged
during drafting. The approval commit adds the Tealium task row. Existing
unrelated local changes remain outside this task.
