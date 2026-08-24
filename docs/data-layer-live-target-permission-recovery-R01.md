# Data Layer Live target permission recovery R01

Status: both ownership preparations QA-integrated through `80721743c8`;
approved product implementation resumes from its exact QA descendant

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
read-only intent and exact changed-path planning initially authoritative. Before
installed-seam proof, the preparation must remain smaller than all runnable
packs, run its exact plan with properties and package proof, and cannot run an
all-runnable-pack feature checkpoint. The independently reviewed installed-seam
result and subsequent user decision are governed by the causal focus below.

The preparation implementation-and-review effort ceiling is two hours from
coder receipt to architect `qa-ready`. At one hour report the extracted source
prefix, broad-path disposition, exact consumers, current/base packs and tasks,
behavior-conservation proof, failures, remaining work, confidence, and forecast.
Stop for user direction if the consumer set cannot be proved, the preparation
still selects all runnable packs, coverage would weaken, or the seam would
change product or safety requirements. After QA integration, automatically
reissue `live-target-permission-recovery` from that exact QA head without another
user decision; fresh product intent and exact preflight remain authoritative.

## User-approved causal focus after installed-seam proof

The stopped preparation candidate proved the dormant coordinator through the
public Capture facade and the installed side panel, but exact path planning still
reported all twenty packs and 889 tasks. That result is not a causal verification
requirement. It is the conservative combination of whole-file ownership for
`src/side-panel.ts` and `src/utilities/data-layer/capture.ts` with the rule that a
candidate cannot use its own new disposition to narrow the same canonical change
set. The user rejected an exceptional all-pack run and approved only QA-necessary
focused testing on 2026-08-24.

This approval is a one-time, fail-closed bootstrap for
`verification-slice-live-target-permission-recovery`. It does not narrow either
broad production file for another task. It is valid only while independent diff
review confirms all of the following:

- the new `src/data-layer-live-target-permission-recovery/` prefix and compiled
  mirror remain dormant and behavior-preserving;
- `src/side-panel.ts` changes only import, construct, project through, and delegate
  to that dormant coordinator, retaining the previous behavior whenever the
  coordinator is inactive;
- `src/utilities/data-layer/capture.ts` changes only export the new public Capture
  facade, with the compiled mirror equivalent;
- browser fixtures, assertion leaves, target contracts, verification registry,
  dispositions, process contracts, and acceptance handlers change only to prove
  that exact seam and its existing installed composition; and
- product scenarios 009 and runtime 002 remain unchanged and red.

The exact causal pack boundary is `capture`, `event-library`, `schemas`,
`defects`, and `shell`. Capture owns the seam unit plus the existing
observation-target and target-path prerequisites. Shell owns the preparation
contract and the installed `LIVE_TARGET_PERMISSION_RECOVERY_WIRING_BROWSER_ADAPTER`;
its already-composed containment batch may retain the Schema View and Workspace
Panel targets. Event Library, Schemas, and Defects are included only because the
candidate changes their shared installed-browser assertion and fixture support.
No task from the other fifteen packs may run merely because the two broad
production paths expand through the registry graph.

Evidence execution must be task-focused inside that five-pack boundary. It runs
the declared Capture seam task and prerequisites, the Shell preparation contract,
the installed combined browser task with all six new wiring leaves, the directly
changed ownership/process-contract checks, the acceptance scenarios for this
preparation, and package proof. A property task runs only when the settled slice
declares it as a germane direct or prerequisite observation. It does not expand to
the ordinary whole-pack task arrays, unrelated properties, or the all-runnable-
pack checkpoint.

Any production hunk outside the reviewed seam, facade export, and dormant Shell
composition; any newly affected browser-support owner; activation of permission
recovery; a missing task or observation leaf; a weakened assertion; or a changed
product requirement invalidates this bootstrap before execution. The candidate
then returns for current scope classification rather than widening automatically.
The normal user-requested master-promotion terminal gate remains unchanged.

## Settled preparation result

The dormant Capture seam and installed Shell composition are QA-integrated at
`9f8a8b037b1e6df45f190180168723be8f282b9c`. Review-ready evidence passed the
exact nine-task focused plan across `capture`, `event-library`, `schemas`,
`defects`, and `shell`: build, the seam unit, observation-target and target-path
prerequisites, the preparation and focused-acceptance contracts, the directly
changed verification-process contract, the combined installed browser
observation, and package proof. The slice declares no germane property task, so
none ran. No unrelated pack array or all-runnable-pack checkpoint ran.

Product scenarios 009 and runtime 002 remain unchanged and red. Stable task
`live-target-permission-recovery` now resumes automatically from the exact QA
descendant containing this result. Product implementation changes the new seam
and bounded adapters; changing the broad side-panel composition path requires a
fresh causal scope decision.

## Target-path apply-callback ownership preparation

Status: standing-authorized task
`verification-slice-live-target-permission-path-apply` starts from exact QA
`59d9089c6d`. Stable product task `live-target-permission-recovery` is paused at
coherent candidate `1cf347a22cf9325d5406055ab4d400667acab952`, tree
`80ae4784309a7b0641639a3857e46786778b5044`, based on the preparation QA
`9f8a8b037b1e6df45f190180168723be8f282b9c`.

The product candidate is accepted as the conserved product remainder, including
its slow-success causal repair. Do not merge it into the preparation or alter its
product behavior while ownership is reviewed. Reconstruct it after preparation
from that immutable patch reference, omitting only byte-identical overlap already
integrated into QA.

Exact product planning selects all twenty packs and 890 tasks because the target-
path controller's production `apply` callback in `src/side-panel.ts` newly calls
permission-probe reconciliation. The prior dormant-seam bootstrap did not cover
that later behavior-bearing callback and cannot be reused as product evidence.
This is a second independent ownership preparation, not authority for an all-pack
feature run.

The preparation installs the exact target-path apply bridge while recovery remains
dormant. The bridge receives the applied observation's exact tab, history path,
and page-access result; resolves only the matching attached or selected target;
delegates through the Capture-owned permission-recovery seam; and requests a Live
readiness render only when that seam reports a relevant state transition. During
preparation the seam returns inactive, so the bridge cannot update target access,
show `Request access`, request permission, recheck a path, change readiness, or
start a session.

Any extracted source remains under
`src/data-layer-live-target-permission-recovery/`. Its proposed parent is
`capture`, its stable subordinate slice is
`capture_live_target_permission_path_apply`, and `shell` is its one exact
installed consumer. The preparation may install the reviewed bridge call in the
broad side-panel callback, but it must not assign all of `src/side-panel.ts` to a
Live slice. Direct installed proof must show both that the callback reaches the
dormant bridge with the exact applied observation and that current UI, target,
path, session, and permission behavior are unchanged.

The causal evidence boundary is task-focused inside `capture`, `event-library`,
`schemas`, `defects`, and `shell` only when shared installed-browser support makes
those owners unavoidable. It includes build, the permission-recovery seam unit,
the observation-target and target-path prerequisites, the preparation and
focused-acceptance contracts, the directly changed verification-process contract,
the existing combined Shell browser observation, and package proof. No unrelated
whole-pack task array runs.
A property task runs only if the new slice declares it as a germane direct or
prerequisite observation; otherwise none runs. No all-runnable-pack checkpoint is
authorized.

An unproved target identity, callback outside the reviewed apply boundary,
behavioral activation, changed product requirement, weakened assertion, missing
installed observation, inability to leave the broad callback unchanged during
the resumed product task, or evidence expansion beyond this causal task set
blocks before execution. After architect `qa-ready` integration, automatically
reissue `live-target-permission-recovery` from that exact QA head and reapply the
conserved candidate remainder without another product decision.

## Settled target-path apply result

The dormant callback bridge and its exact installed Shell composition are
QA-integrated at `80721743c847d771f0dcd4e8063a309697561aa7`. Review-ready
evidence passed ten named focused tasks across `capture`, `event-library`,
`schemas`, `defects`, and `shell`: build; the seam unit; observation-target and
target-path prerequisites; path-apply, preparation, and existing focused-
acceptance contracts; the directly changed verification-process contract; the
combined installed browser observation; and package proof. No property task,
unrelated pack array, or all-runnable-pack checkpoint ran.

The slice was not quarantined, so no quarantine-repair record applies. Product
scenarios 009 and runtime 002 remain unchanged and red. Stable task
`live-target-permission-recovery` resumes from the exact QA descendant containing
this result. Reconstruct the accepted product behavior and slow-success repair
from immutable patch reference `1cf347a22c`; do not merge its old lineage. The
resumed product candidate must leave the now-integrated broad side-panel callback
unchanged and activate recovery only through the bounded Capture seam.
