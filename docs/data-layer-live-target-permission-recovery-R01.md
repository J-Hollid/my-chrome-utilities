# Data Layer Live target permission recovery R01

Status: product behavior approved; implementation paused for standing-authorized
ownership preparation on 2026-08-24

Prepared: 2026-08-24

Stable implementation task: `live-target-permission-recovery`

## Outcome

Selecting an eligible active tab must not leave Live setup at a permission
state with no operative recovery. If the exact page probe disproves the
candidate's provisional access state, the same target remains selected, its
access state becomes `Permission required`, and `Request access` is available
in the current `Confirm access and path` step. Granting the exact target origin
rechecks the configured history path on the same tab and advances readiness
without another target-selection cycle.

Preserve the valid `activeTab` route: when the existing temporary grant permits
the page probe, selecting the active tab continues without an unnecessary host-
permission prompt. Declining access retains the selected target and the explicit
recovery action without starting observation or selecting another tab.

## Acceptance authority

- Product behavior: `features/data-layer-observation-target-access.feature`,
  scenario 009.
- Installed browser behavior:
  `features/data-layer-target-path-status-runtime.feature`, scenario 002.
- Existing access scenarios 001, 004, 005, and 007 remain authoritative for a
  valid active-tab grant, exact-origin permission, declined permission, and
  failed target resolution.

## Boundaries

- Do not request broad tab metadata permission or an unrelated origin.
- Do not probe page content before an applicable grant exists.
- Do not clear or replace the selected target when its probe reports unavailable
  access.
- Do not require the operator to reopen the target picker, expand secondary
  Settings, or repeat target selection to reach `Request access`.
- Do not start a testing session until both exact target access and the configured
  history path are ready.
- Preserve target tab/window identity, active-session pinning, history-path
  semantics, saved sessions, and project state.

## Development focus

- Observation-target access reconciliation in
  `test/data-layer-observation-targets-test.mjs`.
- Guided-step recovery presentation in
  `test/data-layer-live-guided-workflow-test.mjs`.
- One installed side-panel observation that exercises the failed probe, exact-
  origin request, same-tab recheck, and enabled Start testing action for runtime
  scenario 002.

## QA impact and ownership forecast

Forecast `capture`, `schemas`, `project_event_transport`, `live_flow_testing`,
and `shell`, with the exact read-only intent and changed-path plans
authoritative. Run properties and package proof for the settled candidate. Do
not run the all-runnable-pack checkpoint in feature mode.

Likely existing shared integration surfaces are:

- `src/data-layer-observation-targets.ts` under the `capture` parent and
  `capture_observation_target_semantic` boundary, consumed by `event-library`,
  `project_event_transport`, `schemas`, `live_flow_testing`, and `shell`;
- `src/data-layer-observation-targets-ui.ts` under the local `capture`
  presentation boundary;
- `src/data-layer-target-path-status.ts` under the `capture` runtime-controller
  boundary, with the same declared pack consumers;
- `src/data-layer-live-guided-workflow.ts` and its UI under the `schemas`
  guided-workflow boundary, consumed by `defects`,
  `project_assurance_severity`, `guided_test_cases`, and `shell`;
- `src/active-page-observation.ts` under `shell_active_page_integration`, whose
  declared consumers are `capture`, `event-library`, `project_event_transport`,
  `schemas`, `defects`, `replay`, `live_flow_testing`,
  `project_assurance_severity`, and `guided_test_cases`; and
- `src/side-panel.ts` under the propagating `shell_platform_runtime` boundary.

No new production source prefix is proposed by this specification. Before
product coding, the coder must run read-only ownership intent over the likely
paths above and any proposed extraction. Any new prefix must name its parent
pack, subordinate verification slice, and exact consumers. `coarse-boundary`
requires independently reviewed ownership preparation; bounded
`granularity-assessment-required` or `coarse-within-pack` results require the
recorded structured judgment defined by the active QA ratchet.

## Effort and reporting

The implementation-and-review effort ceiling is four hours from coder receipt
to architect `qa-ready`. At two hours report the reconciled state transition,
recovery-action presentation, installed permission result, exact packs and
tasks, failures, remaining work, confidence, and forecast. Continue while the
behavior and safety boundary remain unchanged and a credible bounded completion
path exists.

## Ownership-readiness pause and automatic preparation

Status: the product handoff is paused before implementation; standing-authorized
task `verification-slice-live-target-permission-recovery` starts from exact QA
`e54f411a0f11abd673ad8f8da7916ec9c4e55258`.

The coder's read-only intent classified the original five-path plan
`coarse-boundary`: it selects all twenty runnable packs and 799 tasks. The exact
cause is `src/side-panel.ts` under `shell_platform_runtime`. In isolation,
`src/active-page-observation.ts`, `src/data-layer-observation-targets.ts`, and
`src/data-layer-target-path-status.ts` each select ten packs; the guided-workflow
model selects six. No product source was changed and no product candidate or
evidence exists.

Under the standing ownership-readiness authority, the preparation establishes a
behavior-preserving coordination seam at
`src/data-layer-live-target-permission-recovery/`. Its proposed parent is
`capture`, its stable subordinate slice is
`capture_live_target_permission_recovery`, and its exact semantic boundary is
selected-target probe reconciliation, current-step permission action projection,
exact-origin grant dispatch, and same-tab configured-path recheck. `shell` is the
one exact installed composition consumer. The other original forecast packs and
the additional Event Library, Defects, Replay, Project Assurance, and Guided Test
Cases families are conservative preparation regressions when selected by the
current/base plan; they are not durable consumers of the new seam unless direct
import or independently observed behavior proves otherwise.

The preferred extraction leaves these state owners intact:

- observation target identity and selection remain in
  `src/data-layer-observation-targets.ts`;
- exact page reads remain in `src/active-page-observation.ts`;
- configured-path status remains in `src/data-layer-target-path-status.ts`;
- guided-step presentation remains compatible with
  `src/data-layer-live-guided-workflow.ts` and its UI; and
- `src/side-panel.ts` remains the application composition root, not a newly
  narrow whole-file boundary.

The preparation may add a dormant action host or capability adapter only when
its hidden/inactive state preserves the current installed UI exactly. It must
record an `integrated-seam` disposition for `src/side-panel.ts` only after direct
proof that the resumed product can implement scenarios 009 and runtime 002 by
changing the new seam and bounded adapters without changing that broad path. It
must not assign all of `src/side-panel.ts` to a Live-only slice. A
`parent-fallback` that leaves the resumed product at all twenty packs is not a
successful coarse-boundary preparation.

The slice must declare exact source paths or the prefix above, direct registered
tasks, prerequisites, and its Shell consumer. Direct proof includes a focused
seam unit, the existing observation-target, target-path-status, and guided-
workflow units, and an installed wiring observation that proves current behavior
is unchanged. The exact task identities are settled with the implementation and
become authoritative in the registry; no task may be invented outside its
owning pack merely to obtain a narrower plan.

This stage implements no permission recovery. In particular, it does not make a
failed probe change target access, expose a new visible `Request access` action,
request a permission, recheck a path, enable Start testing, or alter scenarios
009 and runtime 002. It preserves valid `activeTab` access, current picker-based
permission handling, path states, target/session identity, project state, saved
state, all assertion leaves, exact-pack closure, package inputs, and terminal
obligations.

The conservative preparation forecast is `capture`, `event-library`,
`project_event_transport`, `schemas`, `defects`, `replay`, `live_flow_testing`,
`project_assurance_severity`, `guided_test_cases`, and `shell`, with exact
read-only intent and exact changed-path planning authoritative. The preparation
must remain smaller than all runnable packs, run its exact plan with properties
and package proof, and cannot run an all-runnable-pack feature checkpoint.

The preparation implementation-and-review effort ceiling is two hours from
coder receipt to architect `qa-ready`. At one hour report the extracted source
prefix, broad-path disposition, exact consumers, current/base packs and tasks,
behavior-conservation proof, failures, remaining work, confidence, and forecast.
Stop for user direction if the consumer set cannot be proved, the preparation
still selects all runnable packs, coverage would weaken, or the seam would
change product or safety requirements. After QA integration, automatically
reissue `live-target-permission-recovery` from that exact QA head without another
user decision; fresh product intent and exact preflight remain authoritative.
