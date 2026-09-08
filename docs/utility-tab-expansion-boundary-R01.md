# Utility tab expansion boundary R01

Status: user-approved on 2026-09-08 for coder handoff and QA integration.
Prepared: 2026-09-08.
Task: `utility-tab-expansion-boundary`. Mode: feature integration into QA.
Inspected QA: `3c276a3788c46f124116b70871edf01cd060ee75`.

## Outcome

Establish a working, independently verified route for adding a TWA utility tab
and a launcher to its own extension page. The side panel is an entry point.
An editor or merge workbench can occupy a separate full-width page. Tealium
functionality and DevTools integration need later product specifications.

The user approved separate utility pages with retained working sessions. New
utilities load on first use. Switching workspaces changes presentation without
unloading their pages or resetting their state. Use small host adapters; do not
migrate every existing Data Layer view. The earlier investigation is recorded in
`docs/utility-page-boundary-assessment-R01.md`; the retained-page requirements
below settle its former open lifetime choice.

Required instruction: docs/utility-tab-expansion-verification-R01.md

Contracts: `features/utility-tab-expansion-boundary.feature` and
`features/utility-tab-expansion-runtime.feature`.

## Evidence and task boundary

The read-only intent at the inspected QA head classified the six proposed host
paths as `coarse-boundary`: 21 packs and 1,061 tasks. It states that the expansion
is limited to shared paths with credible exact QA boundaries. No checks ran.
Individual advisory path queries selected 157 checks for the tab list, 132 for
the tab controller or HTML, and 1,155 for globally classified entry paths.
These are different query scopes and must not be presented as equivalent plans.

The existing modular-utility contract already requires a public entry point,
owned storage, and no changes to another utility's internals when adding a tool.
The installed side-panel entry still starts Data Layer, and workspace navigation
is constructed after its durable project startup. Ownership and the installed
host must both satisfy the new expansion boundary; a registry-only declaration
does not establish independent startup.

Preserve Data Layer, Hotkeys, command access, stored selection, focus behavior,
project data, capture continuity, and existing publication semantics. Existing
capture must not stop when the operator selects another workspace tab. Existing
Data Layer startup failures remain visible, while the utility entry remains
usable. Do not rewrite Data Layer controllers or change their storage format.

## Retained utility pages

Each new top-level utility has its own local HTML entry, document, styles, and
entry module. A small persistent host can retain its embedded page when another
workspace is selected. Separate full-width workbenches use the same utility
session and bound website target. Do not create a second capture or override
owner when a second surface opens. Probe supplies a controlled job for this
proof; no Tealium override engine is included.

Preserve unsaved drafts, filters, selection, scroll position, and session
identity across workspace switches. An active job continues until explicitly
stopped or its existing target/permission lifecycle requires cleanup. Hidden
presentation updates may pause. Hiding is not closing, unloading, resetting,
or stopping a job. Do not add automatic eviction of a hidden utility page.

Keep the current whole-side-panel close behavior for Data Layer. This task
does not promise capture after the host is closed or the browser exits. An
explicit close or reset of the new utility protects unsaved edits and stops only
its owned work. A target closure must not silently select another browser tab.

New page styles, duplicate element IDs, and ordinary startup exceptions must not
alter another utility or prevent host navigation. Host/page communication uses
declared messages and validates sender, utility session, and target identity.
Do not traverse another utility's DOM or call its private globals. Separate
pages share extension authority; no process or hostile-code isolation is claimed.

## Required preparation

1. Produce an exact before/after plan and complete owner/consumer map before
   changing installed behavior. Use existing shared-boundary and slice support.
   Establish and independently QA-review any ownership-only checkpoint needed
   before the host implementation can use that narrower boundary. The same
   implementation range cannot narrow its own base evidence.
2. Add or extract only the production host responsibility needed for utility
   contributions, independent entry startup, and a launcher. Reuse the existing
   public utility contract where sound. Keep registration, navigation, and
   utility implementation separate. No new general plugin framework is needed.
3. Prove a controlled `Probe` utility through the production host. Its tab loads
   and retains its own page, and its launcher opens its full-width page with the
   same session and selected target identity. It owns separate state and styles.
   Do not ship Probe as a new user-facing product tab.
4. Replay the exact additive Probe contribution against the integrated boundary.
   This must select its owner checks, declared host consumers, prerequisites,
   installed boundary checks, and package proof. It must not select complete
   unrelated Data Layer feature families merely because it adds a utility.

The controlled contribution is evidence for adding a tab, not permission to
exclude tests for arbitrary future utility code. A tool that changes capture,
project persistence, shared permissions, or messaging must include those owners.

## Development cost acceptance

The user's approval requires a practical route for developing Tealium and later
utilities without recurring broad verification and unrelated repair work.
Prove both adding a utility and later editing only its private implementation.
The latter must not reselect complete Shell or unrelated Data Layer families.
The additive case must select exact host checks, not a full parent-pack fallback
with unrelated work. A bounded pack count alone does not satisfy this outcome.

Compare the same controlled utility in its standalone page and hosted page.
Report common utility tasks separately from additional host checks, with task
identities and durations from focused evidence. Reuse the same utility code and
checks; do not create a second test implementation or a benchmark framework.
Separate the one-time preparation/review cost from this recurring overhead.
No arbitrary minutes or percentage saving is promised before measurement.

If either route still selects broad unrelated families, the preparation is
incomplete. Retain the plan and report the exact unresolved boundary before
launching broad work. Do not accept an expensive fallback as fulfillment of
this task or repair unrelated tools merely to make that fallback pass.

## Limits and completion

No Tealium detection, file replacement, editor, API write, DevTools panel,
additional browser permission, or master promotion is included. Preserve the
existing manifest capabilities. A future DevTools or permission change needs
its own exact impact assessment; this task must not relabel the whole manifest
as local. Do not add wildcard exemptions or task-name bypasses to the planner.

No runtime source, test assertion, consumer, package input, incident obligation,
or terminal check may disappear to reduce the count. Conservation covers the
actual executable task and assertion identities, not only feature filenames.
Failures within the authorized boundary remain blocking. Do not launch a
framework repair programme from an unrelated failure.

Use two explicit review checkpoints if required: ownership declaration first,
then the working host boundary. Do not create a recursive prerequisite chain.
If the preparation itself still requires all runnable packs, preserve the plan
and report the exact conflicting paths before implementation expansion. This
program does not create a new bootstrap exception or authorize an all-pack QA run.

The first progress checkpoint is after one hour of implementation: report the
exact plan, working boundary, remaining changes, and forecast. The planning
allowance is four elapsed hours through QA-ready review; report variance at that
point. This is a planning target, not permission to skip checks or declare
success. A repeated failure with no bounded repair path requires reassessment.

Completion needs installed proof, conserved coverage, exact review-ready
evidence, architect QA-ready review, and the additive contribution plan measured
from the final QA base. Report one-time preparation cost separately from the
cost forecast for adding a utility. No time saving is claimed from counts alone.

## Approval boundary

The user's "Agreed" on 2026-09-08 approves this bounded preparation, retained
utility sessions, and the cost acceptance above. Proceed with coder handoff,
the required ownership/host review checkpoints, and focused QA integration.
Subsequent Tealium product features and master promotion remain separate.

## Specification checks

The approved revision has eight ownership scenarios and twelve runtime
scenarios. Both contracts passed the locked APS parser and IR-DRY review. Nine
advisory matches were retained: they distinguish an integrated host from an
integrated contribution, additive from private-code plans, setup from retention
assertions, project bytes from active capture, and different job/visibility/
switching conditions. The earlier duplicate launcher action remains normalized.
Shared setup is in Background, and the multi-row examples have no constant
columns. No production or browser checks ran at the specification stage.

What worked: the canonical intent proved the broad route before product work.
Process issue: broad initial reads returned excess output; selected sections
resolved the needed facts. Recommendation: judge this preparation by its working
contribution and exact subsequent plan, not by new ownership labels alone.
