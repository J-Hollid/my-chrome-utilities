# Project Library dialog decomposition

Task: `project-library-dialog-decomposition`.
Specification base: `8ce48c75e2c38388d6195befce5b565e8af95cdf`.
Classification: behavior-preserving production refactor. Review target: QA.

The coordinator delegates edit, switch review, creation, import review, and import
error construction to focused modules. Metadata controls and modal focus have
separate helpers. The coordinator retains repository access, project identities,
activation, subscriptions, save, Undo, and transport operations. The pure
presentation module and companion branding assets are unchanged.

Each modal handles close once. Native close and Escape remove the closed dialog
and return focus. Switch confirmation focuses the selected project after the
close event. Pending Undo and import actions reject duplicate clicks. Import
release is idempotent at the coordinator boundary; closing a pending review
aborts its signal and releases staged resources once.

The direct callback tests pass. Full architecture validation and the existing
Project Library and transport tests pass. Installed Chrome checks all four
dialogs through cancellation, native close, and Escape. A small isolated host
uses the same production coordinator to check creation, switching, save, Undo,
import confirmation and cancellation, and subscription updates. Poll loops are
bounded; there are no nested aggregate runs. Review verification uses one worker.

The initial path-only intent retained global classification because it lacked
candidate declaration content. The user directed continuation with the approved
split and bounded exact verification. No global test run is authorized. The exact
committed plan must retain all actual owner and consumer checks and full
architecture validation. The new dialog prefix has a project_management slice
with conservative current controller consumers. No planner policy is changed.

Serena assessment: a symbol outline would help. The exposed Serena tools require
an initial-instructions tool that is absent in this session. A TypeScript outline
and scoped reads supplied the fallback. Actual Serena queries: none. The missing
instruction tool impeded use; no setup or restart was attempted.

Development scorecard: four workflows extracted; twelve installed close cases
passed; seven coordinator behavior checks passed; full architecture check passed.
The extraction script initially used a missing marker; its first type check caught
the error. A browser test initially checked focus before the native close event;
its wait now observes removal. Acceptance test setup also needed one missing
Clojure delimiter and the shared DOM helper's actual consumer declaration.
These were corrected before review verification. Keep exact marker checks and
wait for the native lifecycle boundary in future extractions.

## Exact scope decision

The first coherent candidate's exact preflight selects 17 packs and 991 tasks.
It classifies the plan as `granularity-assessment-required`, not global. The two
causal paths are the architecture declarations and the existing coordinator.
The reviewed declaration graph follows both dependencies and reverse consumers;
shared project contracts therefore reach Capture, Events, Schemas, Defects,
Replay, and project assurance as well as the forecast controller consumers.

Decision: evidence-backed parent fallback. Those families are outside the direct
dialog edit, but the current reviewed graph binds their conservative evidence.
The plan estimate is 991,000 ms; this is an estimate, not measured runtime.
No exact-run failure has yet occurred. The direct dialog seam is clear and has
its own tests. A smaller declaration-consumer seam is not reviewed. Changing that
policy in this product range would require additional tooling proof and could
hide a real consumer. Retain the exact plan and complete checker, one worker,
existing task time limits, properties, and packaging. Reconsider only if this run
shows a concrete excessive-cost or unrelated-failure boundary. Do not infer a
new tooling task or run all runnable packs from this finding.

## Attributable registration repair

The first review run stopped after 267 passing tasks at
`test/verification-contracts/registry-project-management-contract-test.mjs`.
Incident: `b6d68f0a-1d26-48ed-8363-55c6be83c7a4`.
The failed receipt is
`tmp/verification-receipts/1009975-2a5cad7b-19f9-473e-b822-a897414e2155.json`.
Later checks and package proof did not run.

Repair family: Project Library dialog registration. The bounded discovery found
four old assumptions in that contract: the boundary list, the single isolated
handler and its six features, fixed owner task counts, and historical evidence
accounting without the approved dialog additions. A small registration contract
now checks every old boundary plus exactly the new dialog boundary and handler.
Owner counts derive from the registry. Historical conservation excludes only
explicitly checked dialog additions. The large test became smaller.

The direct registry contract and dispatch regression pass. The regression runs
the exact old assertion from the failed commit in a one-second VM, observes its
rejection, checks the repaired declaration, and rejects extra or missing
boundaries. It emits the runner's native causal protocol when requested. No
product code, planner policy, or unrelated test boundary changed in this repair.
Fresh governed repair and review evidence remain required.

The next review found the retained conservation record for that same test was
stale: incident `6789d618-845c-4454-af32-8317a1b20550`, receipt
`tmp/verification-receipts/1041581-6e55b7c0-8c82-48b7-9fb2-d32175d7c316.json`.
Its 263 passing tasks do not replace complete review evidence. The initial
extraction also moved two assertions from their retained owner. The assertions
now remain with that owner and use the extracted expected declarations. The
existing `generate-compact-conservation.mjs refresh` command updates only the
changed test's source identity. Its semantic projection and legacy baseline stay
byte-equivalent. This is the fifth finding in the same registration family.
The conservation regression rejects the old record against the current test,
accepts the refreshed record, and checks that only this owner changed. No
conservation authority, generator, or planner policy is changed.

Before the third review reached acceptance execution, a direct audit found the
same old assumptions in its evidence consumers. That run was stopped through
the runner's SIGINT cleanup handler. Four contract files built the same Project
Library report. A shared evidence adapter now preserves the historical subset,
reports both verified handler paths and their actual served features, and
provides the pre-dialog profile for the retained historical count assertion.
The full current owner profile and exact task list remain intact. The two
acceptance consumers now use these explicit fields. A direct check consumed the
real reliability-calibration report and passed isolation, counts, conservation,
and a negative control with missing conserved tasks.

The final same-family finding set is: boundary inventory; isolated handler and
feature accounting; owner counts; historical task accounting; retained source
identity; and four duplicate evidence producers plus their two consumers. The
existing generator refreshed exactly the four affected contract source records,
with unchanged semantic projection, legacy baseline, and authority. The first
two eligible repair records stay immutable on their ancestor commits; the next
fresh exact review uses the existing ancestor admission route. Repeating an
already eligible repair proposal was unnecessary and was rejected by the store.

## Refactorer review

Received candidate: `58f3209d5e`. Its bound focused evidence passed 1007 tasks.
The production diff satisfies the dialog contract. Type checking, build, the
complete architecture check, direct dialog and coordinator tests, transport,
registration, and conservation checks passed during this review. Installed Chrome
passed twelve close cases and seven coordinator checks. The new dialog modules
have 88.43% direct line coverage. Serena supplied a useful coordinator outline.

The changed owner-evidence handler had CRAP 7. Profile selection and expected
counts now have separate small functions; all original assertions remain. The
three affected Clojure modules have 96.43% combined line coverage, maximum CRAP 6,
and no duplicate candidates. The earlier mutation-site scan found no module over
100 sites. No mutation tests were run. No pinned JavaScript or TypeScript CRAP,
DRY, or mutation tool was available; compiler, architecture, and runtime checks
provide the applicable evidence for those files.

Process findings: the first browser launch lacked a build manifest; building
resolved that prerequisite. Chrome then needed approved execution outside the
sandbox. A property-only command used an invalid option combination and did not
run. The first coverage selection reached an unrelated temporary-storage test
whose prerequisite was absent from the sender receipt. Restricting coverage to
the existing dialog and modular-pack features passed. An uncommitted changes
query had no candidate range; exact scope must be queried after commit.
Use the documented selectors and check prerequisites before each review command.
Fresh review evidence for this cleanup must bind this candidate to `58f3209d5e`.
The source-path ownership query selects shell and verification_process; retain
their complete owned checks and properties, with one worker. QA remains pending.
