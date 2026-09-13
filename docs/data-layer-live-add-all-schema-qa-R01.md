# Live Add all to schema QA result

QA integrated `6df76049cd` on 2026-09-13 by fast-forward from `6f58bf54e0`.
Task: `live-add-all-schema`. Architect handoff:
`20260913T014448Z_000928_from_architect`.
Master remains `dce549f1c31a3cc46192be27eae243f04eb80834`.

## Accepted behavior and specification checks

The selected Live event can add all observed properties to a new or existing
schema draft. The review distinguishes added, preserved, and blocked paths.
Existing definitions remain intact. New properties derive structure, scalar
types, and typed examples; mixed and null-only types remain unspecified.
The operation preserves draft, publication, assignment, and durable-save rules.
The approved product and runtime contracts contain ten scenarios.

The final repair removes implicit type assignment while descending through
parent properties. The specifier repeated both reported model cases against
the built candidate: an existing untyped parent remains untyped, and a mixed
object/string parent remains untyped. Both passed. Permanent model tests also
cover array and inherited parents.

Historical VTD-004 conservation remains 294. A direct check derives it from
immutable `09828badc5`; current derived totals 300 and 306 are checked separately.
This specification check is distinct from installed runtime proof.

## Runtime and evidence scorecard

| Check | Result |
| --- | --- |
| Exact candidate/base/task review evidence | Passed |
| Final focused tasks | 1,063 passed across 15 packs |
| Generated bulk model cases | 200 passed, architect reported |
| Permanent native hidden-host recovery test | Registered and passed |
| Returned parent-type model cases | Passed independently by specifier |
| QA integration | Fast-forward complete |
| Master promotion and terminal regression | Not performed |

The native recovery test is
`test/data-layer-live-add-all-schema-native-recovery-browser-test.mjs`.
It establishes Live active and Projects hidden, uses native keyboard confirmation,
checks visible and hit-testable recovery controls, exports retained unsaved data,
checks no partial durable commit, and exercises close, cancel, reopen, and Escape.
The architect also reported native installed proof for new and existing
destinations and durable reload. The permanent recovery target closes the
specific hidden-host coverage gap; this record does not claim every temporary
native proof was converted into a permanent target.

Final receipt: run `6ca6eb55-29cc-4ece-9867-387f34f48511`, from
2026-09-13T01:12:39.696Z to 2026-09-13T01:42:40.229Z, about 30 minutes.
The exact Git review note binds candidate `6df76049cd`, base `6f58bf54e0`,
and task `live-add-all-schema`. The specifier validated this binding before merge.

## Delivery time and failures

Approval was recorded in specification commit `806ad82f` at
2026-09-12T12:45:18Z. Product activation was sent at 17:01:22Z after the separate
modal repair reached QA. Final QA-ready arrived at 2026-09-13T01:44:48Z:
about 13 hours after specification approval and 8 hours 43 minutes after activation.
Architect review began with the 21:12:46Z incoming handoff and lasted about
4 hours 32 minutes through repairs and repeated returns. These are wall-clock
intervals, not measured active labor. The two-hour candidate expectation failed.

Five inspected passing review-note intervals total about 1 hour 59 minutes:
`d5e1430ae8`, `eb150a7d37`, `c71bfbe440`, `605274012e`, and `6df76049cd`.
This is a lower bound, not total verification cost. The short `c71bfbe440`
record does not represent a complete fresh browser run. Failed runs, repair runs,
and other reusable task receipts add cost that is not fully totaled here.
No terminal run was requested or performed in this feature cycle.

The process failed at several boundaries: copied registration and conservation
counts, short/full base identity mismatch, an incomplete permanent browser proof,
historical/current authority mixing, unsupported fallback records, and missing
model checks for unspecified parents. The architect also reported two compact
output failures and a completion wrapper that treated `--help` as completion.
Existing incident records and exact repair admissions remain authoritative;
QA integration does not erase failures or terminal obligations.

## What went well and refinement

Native input found the hidden recovery dialog before QA integration. Review
preserved the product through the corrections. The final small model repair
retains parent types, and permanent tests now cover the reported failures.

Adjust the process before another enabling slice: resume the already approved
`verification-registration-review-preflight` task from this accepted product
descendant. Preserve independent historical truth while sharing current task
construction and derived inventory checks. Check the complete return criteria
and small negative cases before each expensive evidence run.

The durable presentation observation is retained under portfolio identity
`2b6cdc3b0d04cc0009073fa40f2fe6fb4943e2165aaabe9e025d54dd9abc7539`.
Its measured parent scope has 13 tasks and an estimated 109 seconds, including
an unrelated renderer batch. Conservative coverage remains; immediate ownership
preparation was judged disproportionate. Revisit it through normal portfolio
intake before a requested master promotion.

Retain completion-wrapper argument handling and clearer evidence-recording
guidance as recommendations. This record does not activate a new framework,
change queue semantics, or authorize master promotion.
