# Data Layer Event Library target-page push closure correction R01

Status: user-approved for coder handoff on 2026-08-28

## Objective

Restore saved Event Library pushes on a selected page when Chrome executes the
registered callback in the target page's `MAIN` world.

The existing product contract already requires Library row **Push** to append
the exact saved event and payload to its explicit Destination. This correction
adds runtime evidence for Chrome's callback boundary; it does not change
Library destination precedence, payload shape, target selection, permissions,
feedback, drafts, or persistence.

## Reproduced failure boundary

The installed side panel passes the exported readiness and push functions to
`chrome.scripting.executeScript({ func })`. Chrome reconstitutes such a function
in the target page without its extension-module lexical bindings. Both exported
functions currently call the private `valueAtPushPath` binding, so production
execution can fail with `ReferenceError: valueAtPushPath is not defined` before
it reports readiness or appends the payload.

Existing direct unit calls preserve the module closure. The installed Event
Library browser fixture also returns a synthetic successful result without
executing the callback. Neither observation crosses the failing boundary.

## Runtime contract

- The readiness callback and the payload callback each remain executable after
  source serialization and reconstitution without extension-module bindings.
- Each callback may use only its supplied arguments and target-page globals.
- For the existing `dataLayer` fixture, readiness reports push-capable and one
  saved `purchase` payload is appended exactly once.
- Existing missing-destination and non-push-capable results remain unchanged.
- Successful and failed attempts preserve the saved Library record and any open
  draft exactly as the existing product scenarios require.
- Calling the original function object directly is not sufficient runtime
  evidence. The installed observation must exercise source-reconstituted
  callbacks in a target-global context or the equivalent native Chrome boundary.

Acceptance is the new directional runtime scenario
`Data layer Library direct template push runtime 005` in
`features/data-layer-library-direct-template-push-runtime.feature`.

## Development focus

- Add the smallest direct regression proving both exported page callbacks work
  after source serialization and reconstitution.
- Make the installed `LIBRARY_DIRECT_TEMPLATE_PUSH_BROWSER_ADAPTER` observation
  execute the callbacks at that boundary and report readiness, the single page
  append, success feedback, and unchanged persisted bytes.
- Preserve the existing destination error cases and direct-push scenarios.

Likely existing shared integration surfaces are
`src/data-layer-selected-target-push-page.ts`, its re-exports under
`src/utilities/data-layer/`, the `src/data-layer-installed/runtime.ts` call
site, and the Event Library installed browser fixture. No new production source
prefix is proposed. The existing page helper path belongs to parent pack
`event-library` under `event_library_page_push_semantic`; current registry
consumers include `capture`, `project_event_transport`, `defects`, `replay`,
`guided_test_cases`, and `shell`.

## QA impact and effort

Start with the direct selected-target-push unit regression and the installed
Event Library direct-push browser target. Forecast the `event-library` parent
and its declared consumers above; the coder's read-only intent classification
and the exact committed changed-path plan are authoritative. Run the settled
focused plan once with properties and package proof. Do not run the
all-runnable-pack checkpoint in feature mode.

The implementation-and-review effort ceiling is two hours from coder receipt to
architect `qa-ready`. At one hour, report the direct serialized-callback result,
installed observation status, exact planned packs and tasks, failures, remaining
work, confidence, and forecast. Continue while the behavior remains unchanged
and the completion path is bounded and safe.
