# Tealium DevTools connection reproduction

Date: 2026-09-10. Task: diagnose the reported connection warning.
QA HEAD: e4f5121e. Product source: current QA, including connection repair ba51f3a225.
Browser: Google Chrome 151.0.7922.75 on Linux x86_64.
Mode: development diagnostic. No review-ready or release evidence is claimed.

## Normal idle reproduction: confirmed

The unchanged packaged QA extension reproduced the exact user warning in a
local fixture with no forced worker stops, no worker debugger, and no replacement
of extension functions. The browser target list and rendered UI were read at
500 ms intervals.

Steps: open the native side panel, start Tealium Live, open DevTools for the bound
website, leave all tags unselected for about four minutes, then select a tag.

At 13:13:42 UTC the connection was available. Chrome stopped the idle worker
seven times. The first six connections recovered. The seventh stop occurred at
13:17:41 UTC, 238.8 seconds after the initial connection. After tag selection and
a further ten-second observation, Live was still Observing, the source button
was disabled, and the exact warning was present. Both the DevTools frontend and
the extension's DevTools iframe still existed in the browser target list.

The fifth recovery already showed the false open-DevTools instruction for about
8.5 seconds before recovering. Thus the same defect causes temporary misleading
feedback before its retry allowance is exhausted.

Closing and reopening DevTools restored the same tab/document/tag selection.
A new explicit source action then returned `Source opened`. This diagnostic did
not inspect the editor contents after that recovery; the recovery claim is
limited to enabled source navigation and its production success callback.

Runtime evidence: `tmp/tealium-devtools-natural-idle.json`.
Reproduction script: `tmp/tealium-devtools-natural-idle.mjs`.
These files are retained for this active investigation. No specification,
product implementation, registry, or test-pack changes were made.

| Check | Result |
| --- | --- |
| Exact warning with DevTools still open | Reproduced under normal idle shutdowns |
| Live observation during the failure | Continued |
| Six healthy quiet reconnections followed by a seventh stop | Reproduced with controlled worker stops |
| DevTools reopen after failure | Restored the source action |
| Cause in connection handling | Identified |
| User's exact browser/profile cause | Not yet established |
| Repair implementation and verification | Not started |

The existing recovery test selects a tag before it stops the worker. Recovery
then sends a source request to the bridge, which resets the counter. That setup
does not exercise a healthy quiet connection. A focused regression should model
acknowledged reconnects with no selection and then another worker stop. It can
use controlled stops; a four-minute idle wait need not become a routine test.

## Controlled reproduction

1. Build and package the current extension.
2. Start an isolated Chrome profile with the unchanged package and local
   `shop.example` Tealium fixture. Open the native side panel and start Live.
3. Open DevTools for that same website. Leave all tags unselected.
4. Stop the extension background worker seven times. Its debugger is detached.
   After each of the first six stops, wait for the real owner UI to report
   `Resolving the selected source`. This confirms the broker has accepted the
   recovered connection. No source request is issued while no tag is selected.
5. Select the tag after the seventh stop.

Observed: observation remains active. The source button stays disabled, and the
UI reports `Open DevTools for the bound website to inspect sources.` DevTools
remains open. The connection observer recorded six successful new ports and no
incoming bridge messages. The next stop did not schedule another attempt.
Closing and reopening DevTools restores source availability.

Evidence: `tmp/tealium-devtools-idle.json` and diagnostic script of the same name
with `.mjs`. The earlier less strict run is retained as
`tmp/tealium-devtools-idle-first.json`; its successor adds broker acknowledgement
checks between stops. Both produced the same warning.

## Cause in product code

`src/tealium/devtools/connection.ts` increments `failures` when it schedules a
reconnect. It resets that count only when the port receives a message.
`src/tealium/devtools/entry.ts` sends a `hello` message on connection.
`src/tealium/devtools/broker.ts` accepts the hello and publishes connection state
to Live owners, but does not acknowledge it to the DevTools bridge.

Thus, successful quiet connections still consume the failure allowance. A tag
selection normally generates a source request to the bridge and resets its
counter. This is why a test which selects a tag before each worker stop can pass
while the no-selection sequence fails.

A bounded repair should acknowledge an accepted bridge connection and reset
backoff after that acknowledgement. Preserve the limit for consecutive failures,
invalid-context termination, old-request cancellation, and document/target checks.
No polling keepalive or debugger permission is needed to address this cause.

## Other observations and limits

Successful checks: DevTools open before Live; two DevTools close/reopen cycles;
one worker stop with a tag selected; side-panel closure/reopening while DevTools
stays open. These used the packaged extension and real native side panel.

Reload diagnostics found a retained DevTools iframe with an invalid extension
context while Chrome still reported the extension as reloading. This is not
proof of a persistent post-reload defect. Attempts to invoke the extension
before reload had settled crashed Chrome in both display modes. One displayed
probe also failed to make the initial Live target ready. Those diagnostic setup
failures are retained; they are not user-issue reproduction or product test proof.
The initial package attempt needed a fresh build. The restricted launch needed
local socket access. No production files were changed.

The user has not yet supplied their Chrome version or operating system. A local
reproduction does not prove this is the only cause of their report, particularly
if a complete DevTools close/reopen does not restore the connection.
