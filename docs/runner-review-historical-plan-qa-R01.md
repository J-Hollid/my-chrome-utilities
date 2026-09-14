# Historical review planning: QA result and declaration resumption

Task `runner-review-historical-plan` reached QA at `8675e001d6` on
2026-09-14. The evidence base is `535750dc7c`. Architect handoff
`20260914T050714Z_000933_from_architect` authorized this QA integration.

The repair carries authenticated architecture declaration evidence into historical
review planning. It preserves historical task witnesses, requires an added target
and selected slice task key for declaration additions, and preserves historical
source paths for renames and copies. Missing required historical tasks still fail
population comparison. The same-range planner-policy guard remains in force.

| Check | Result |
|---|---|
| Specification and complete four-file diff | Accepted |
| Exact review evidence | 32 passed tasks; Shell and Verification Process |
| Properties option | Enabled |
| Extension package | Passed |
| Final architect receipt | `597134-75d6f124-a203-4812-82b9-bad0d3cfce73` |
| Final focused run | 05:03:21.881–05:05:03.112 UTC; 1m 41.231s |
| Repair authorization to QA-ready handoff | 01:27:51–05:07:14 UTC; 3h 39m 23s |
| Master integration or full regression proof | Neither requested nor performed here |
| Portability runtime acceptance | Still pending |

What went well: independent review found silent historical-task removal and the
missing negative test. The corrected candidate passed exact focused evidence and
package checks. Architecture review also conserved rename/copy history.

Process failures: the first repair removed historical witnesses; combined product
planning was repeatedly confused with authenticated bounded declaration planning.
This caused repeated handoffs and delayed product delivery. The final focused run
was short compared with the repair interval.

Recommendation: continue the existing independent declaration stage from this
accepted repair. Use one exact range and include its evidence binding and pack
count in the next material result. Do not start another verification framework.

## Resume the existing declaration stage

Resume `verification-slice-portability-durable-state-declaration` from this QA
repair and its documentation descendant, under
`docs/portability-durable-state-declaration-preparation-R01.md`.
Preserve declaration candidate `1733f926` on old repair base `0b7f3a99` and the
combined product references `4ee990e6`, `99e59e90`, and `044e4f21`.
Apply only the conserved declaration-stage remainder onto accepted QA; retain the
architect's corrected historical projection instead of importing the old repair.
Record overlapping paths and exact source/destination identities.

The previously inspected independent range had authenticated declaration evidence,
17 packs, and 1,075 tasks, but lacked the prerequisite consumed by the Shell
acceptance session. Incident `cf934caa-4a5b-40de-984d-f77dfe583b63` remains pending.
Its failed receipt is not package, review-ready, or current-candidate proof. No
supported master deferral has been recorded. Reassess that one prerequisite and
session in the new exact canonical range; preserve the incident and keep the
affected gate pending if the supported evidence route still cannot represent it.
No Shell implementation repair, full run, abandonment, or failure conversion is
authorized by this resumption.

Obtain fresh required stage evidence and independent reviews when the gate permits.
After architect QA acceptance of the declaration stage, resume
`complete-configuration-portability` from that exact descendant with its full
remaining product delta and original behavior/runtime requirements conserved.
