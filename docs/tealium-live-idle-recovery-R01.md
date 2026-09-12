# Tealium Live idle connection recovery R01

Date: 2026-09-10. Stable task: `tealium-live` (bounded repair).
Status: user resumed the active scope and requested coder handoff on 2026-09-12.
Mode: feature correction in QA. The user has lifted the hold. Continue the
approved bounded repair as `tealium-live` through focused review and QA
integration. Preserve the existing task approval.
Specification baseline: QA `e4f5121e`.

Required instruction: docs/tealium-live-verification-R01.md

## Problem and outcome

The unchanged packaged extension reproduced the reported warning in Chrome
151.0.7922.75 on Linux. With DevTools open and no tag selected, seven normal idle
worker shutdowns exhausted the connection retry allowance after about four
minutes. Observation continued, but selecting a tag left source navigation
unavailable. Earlier reconnects also showed the misleading instruction to open
DevTools while it was already open.

`docs/tealium-devtools-connection-investigation-R01.md` records the reproduction,
controlled confirmation, limits, and preserved diagnostic files. That evidence
proves the defect; it is not proof of a repair or of every user-reported case.

Restore automatic recovery after separate successful quiet connections. A user
must not need to select a tag, restart Live, or reopen DevTools to keep recovery
available. A valid connection must reset the consecutive-failure allowance even
when no source request follows it. Creating a port alone is not sufficient proof
that the receiver accepted the connection.

## Behavior contract

Use `features/tealium-connection-recovery.feature` and
`features/tealium-connection-recovery-runtime.feature` alongside the accepted
source-navigation contracts.

- Each confirmed connection starts a fresh allowance of six automatic retries
  after a later disconnect. Preserve delays of 500, 1000, 2000, 4000, 8000, and
  8000 milliseconds for consecutive failures. Browser scheduling may delay an
  attempt; no exact wall-clock recovery promise is made.
- Confirmed quiet connections must recover across at least eight separate worker
  shutdowns without a source request. Eight crosses the existing six-retry limit.
- Invalid or missing confirmation cannot reset the allowance. A late message from
  a replaced port cannot restore connection state or cancel the current failure
  limit. Disposal and an invalid extension context still stop retries.
- During recovery of a previously established connection, show
  `Reconnecting to DevTools...`. On exhausted retries, show
  `Cannot connect to DevTools for this website.` Do not infer that DevTools is
  closed from a missing connection. This replaces the old opening instruction
  only for recovery of a previously confirmed connection; initial setup and
  another-tab guidance keep their accepted behavior.
- Observation, filters, and current selection remain intact where their document
  and session remain valid. Cancel pending source actions on connection loss.
  Recovery must not repeat an old open action. A new explicit action must pass
  the existing target, session, document, frame, and tag checks.

The implementation may acknowledge the accepted bridge handshake. It must retain
sender checks and both Live and DevTools endpoint behavior. Add no periodic
keepalive traffic, debugger permission, automatic DevTools opening, new retry
button, unrelated metadata work, or extension-reload recovery promise.

## Development focus and QA impact

Start with the existing connection-limit check and add a focused regression for
separate accepted quiet connections followed by another disconnect. Also check
consecutive refusal, missing or stale confirmation, disposal, and invalid context.
Use controlled time for delay checks; successful port creation must not fake an
accepted handshake.

Use the packaged extension with a local executable Tealium fixture. Keep the
worker debugger detached. With no selected tag, stop the worker, observe an
accepted reconnect, then repeat eight times. Only then select a tag and open its
source. Check the actual Sources editor URL and nonempty content. Cover native
side-panel and full-width source actions through the retained owner. Keep the
existing pending-action cancellation and document/session invalidation checks.
Use controlled stops for routine regression; do not add a four-minute idle wait
to every verification run. No external customer site or tracking call is needed.

Likely paths: `src/tealium/devtools/connection.ts`, `entry.ts`, `broker.ts`,
`src/tealium/live/source-actions.ts`, `render.ts`, and their behavior-owned tests.
No new source prefix is proposed. Existing parent pack is `shell`; development
focus is `shell.tealium_devtools` and its `shell.tealium_live` consumer. No
manifest, shared utility host, Data Layer code, or ownership changes are expected.
The canonical path query for `connection.ts` is recorded in
`tmp/tealium-idle-ownership.json`: Shell only, two Tealium slices, 33 existing
checks. This is an advisory path query, not the final task plan; derive the complete intent and
exact changed-path plan after resumption. Keep the canonical selected checks
and package proof. Do not start a new preparation or verification-maintenance
project from this specification.

Planning allowance after resumption: 60 minutes of implementation and focused
checks, with a progress report at 30 minutes. This is an estimate, not a waived
gate or a promise for the full review queue. Report scope or verification-cost
variance before any broader work. Use the accepted coder/refactorer/architect
route under the user's resumption authority. Master promotion is separate.

## Success and specification checks

Success requires repeatable recovery beyond the former lifetime retry limit,
bounded consecutive failure, accurate recovery feedback, preserved stale-action
safety, and actual installed source navigation. Record repair proof separately
from the existing defect reproduction. Run the locked APS parser and IR-DRY
checker for the two new contracts; mutation and runtime repair proof remain
future implementation/review duties.

Specification validation on 2026-09-10: both contracts passed the locked APS
parser and IR-DRY checker, with zero DRY findings. The pair has six scenarios
and 15 expanded cases. All outline parameters are used; no multi-row table has
an identical column. Shared setup is in Background. No acceptance mutation,
product tests, implementation, or coder handoff ran for this specification.

What worked: normal idle reproduction supplied an exact causal boundary.
The earlier process missed healthy reconnections with no selected tag.
Recommendation: retain a fast regression for that state, keep this correction
within the two Tealium slices, and keep the repair within the approved scope.
