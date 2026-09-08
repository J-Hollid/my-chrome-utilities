# Utility tab expansion verification R01

Status: user-approved forecast for `utility-tab-expansion-boundary`, 2026-09-08.

## Development focus

Start with tab registration and keyboard navigation, independent startup and
cleanup, then canonical ownership and executable coverage conservation. Use
controlled startup and storage failures. Run the failing leaf during repairs.
The Probe fixture must call the production contribution loader and launcher.
It must not use a second host implementation or merely assert source strings.

Installed proof covers a third tab at 360 and 800 CSS pixels, launching its own
page, correct target identity, closing/reopening, a Data Layer startup failure,
and capture continuing across a tab switch. Use fresh controlled browser data.
No external Tealium account, permission change, or actual website write is needed.

Also prove load-on-first-use, retained document identity, unsaved draft/filter/
selection/scroll retention, isolated styles and IDs, startup-failure containment,
validated host/page messages, and one job owner across embedded and full-width
surfaces. Use controlled Probe jobs and explicit ready/event acknowledgements.
Do not add timer sleeps in place of an observed lifecycle boundary.

## Existing shared paths and ownership forecast

| Paths | Current ownership | Required assessment |
|---|---|---|
| `src/workspace-tabs.ts`, `src/workspace-tabs-ui.ts`, `side-panel.html` | Shell fallback; tab model also reaches Hotkeys and command palette | Exact navigation and host checks; preserve current two-tab behavior |
| `src/side-panel.ts`, `src/side-panel-bootstrap.ts`, `src/utility-registry.ts` | Shell global paths | Separate additive registration from shared runtime semantics with declared installed observations |
| `src/data-layer-installed/runtime.ts` | Installed Data Layer runtime boundary | Include its real controller consumers for any extraction; never classify controller behavior as registration |
| `src/platform/utility-contract.ts`, `src/platform/utility-bootstrap.ts`, `src/platform/utility-shell-dom.ts` | Shell global paths | Prefer reuse; assess every required edit before coding |
| `verification/manifests/shell.json`, `verification/packs.json` | Verification-process registry inventory | Preserve executable conservation and current/base selection |

The host forecast is `shell`, `hotkeys`, and `command-palette`; ownership changes
also require `verification_process`. Data Layer runtime changes add the current
declared controller consumers. This forecast is not an allow-list or evidence.
Test helper edits can widen it and must enter the exact preflight.

Proposed new prefix `src/utility-host/`: parent `shell`, slice
`utility_workspace_host`, consumers `hotkeys` and `command-palette` plus the
exact installed Data Layer entry checks proved by caller inspection. Proposed
contribution prefix `src/utility-contributions/`: parent `shell`, slice
`utility_registration`, consumer `shell.utility_workspace_host`.
These are design proposals, not installed ownership. The coder must name the
complete concrete consumer list before a declaration can be reviewed.

Keep fixture code under `test/utility-tab-expansion/` with exact root runner and
acceptance-handler registrations. Do not put it in a globally owned shared
fixture folder merely for convenience. Existing shared fixtures remain binding.

## Plan and evidence

Use `node scripts/verification-ownership-readiness.mjs intent` with the exact
base, stable task, forecast packs, likely paths, and proposed prefixes. Use
canonical exact plan-only preflight before any complete evidence run. Every
ownership-only checkpoint needs its own review and QA integration before a
runtime candidate consumes the new boundary.

Use the existing review runner with `--property --changed-since <base>
--prepare-evidence utility-tab-expansion-boundary`, the exact selected plan, and
package proof. Record after the runner exits. The architect sends QA-ready
only for the exact settled candidate. The specifier validates bound evidence;
it does not rerun the same suite routinely. No all-pack feature gate is allowed.

Test three actual planner cases: an additive local contribution selects only
its causal boundary; a change to shared utility semantics retains all applicable
consumers; a browser permission or unknown shared-path change retains conservative
selection. Unknown ownership must never default to the cheap route.

Add a fourth case: a later private utility edit does not reselect complete Shell
or unrelated Data Layer families. Compare standalone and hosted execution of
the same Probe implementation and shared utility checks. List exact additional
host tasks and their measured durations from the focused receipts. Use existing
planning and evidence tools; no new telemetry or enforcement programme.

A complete parent-pack fallback containing unrelated work is not a successful
expansion route, even if fewer than all packs are selected. Report the unresolved
cause before launching it. Preserve every check in its actual owner and preserve
terminal coverage; the requirement is correct selection, not deletion of tests.

Report before/after task identities and counts, installed targets, prerequisites,
receipt durations, failed attempts, and repair time. Preserve unresolved incident
and terminal obligations. Use the existing receipt disposition helper at QA.
