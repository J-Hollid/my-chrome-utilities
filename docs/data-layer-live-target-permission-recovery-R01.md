# Data Layer Live target permission recovery R01

Status: approved by the user for coder handoff on 2026-08-24

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
