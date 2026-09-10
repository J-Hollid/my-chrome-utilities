# Tealium Live metadata specification checks R01

Date: 2026-09-10. Task: `tealium-live-metadata`.
Approval: automatic lookup with fallback was explicitly approved by the user.

| Contract | Scenarios after change | New scenarios | New example cases | Parser | IR-DRY |
| --- | --- | --- | --- | --- | --- |
| Tealium detection | 9 | 1 | 4 | passed | completed |
| Tealium detection runtime | 8 | 1 | 1 | passed | completed |
| Tealium Live | 14 | 6 | 20 | passed | completed |
| Tealium Live runtime | 12 | 3 | 7 | passed | completed |

All four files passed the repository's `bb gherkin-parser` and
`bb gherkin-ir-dry-checker` commands. Reports are under
`tmp/tealium-metadata-spec/`. The 11 new scenarios have 32 expanded cases.
New example columns are used by their steps and have no redundant constant
columns. Existing shared setup stays in each file's Background. Distinct
metadata setup remains local to its scenario. Existing scenarios are unchanged.

Four IR-DRY suggestions were reviewed. Two are existing distinctions: fixed
Detected versus varying detection state, and Start versus Pause. One new
suggestion pairs a retrieval-completion action with a permission-outcome
assertion; they have different roles. The final pair compares protection of
the stopped snapshot after an inventory read with protection after a metadata
response. Keep the explicit metadata boundary so its own pending request is
proved. No suggestion identified accidental wording drift or redundant setup.
No finding is a parser failure.

These are specification checks only. Acceptance execution, mutation, installed
behavior, and package proof remain coder/reviewer duties. The earlier public
HTTP probe proves feasibility for one profile; it is not extension runtime proof.

The forecast uses the canonical owner query: 45 Tealium/Shell checks plus one
package task. Coder intent and exact changed-path planning remain mandatory.
No registry, manifest, shared host, or DataLayer change is proposed.

The existing real fixture and small owner query supplied useful evidence.
Some discovery output was too broad; later queries selected only the relevant
paths and fields. Retain bounded retrieval and separate parser success from
runtime success. Continue to implementation from the accepted recovery base.
