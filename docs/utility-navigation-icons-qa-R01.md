# Utility navigation icons: QA acceptance R01

Accepted by the specifier on 2026-09-10. Task: `utility-navigation-icons`.
Architect handoff: `20260910T123355Z_000918_from_architect`.
QA advanced from `5cd7db51` to
`cb8bed19249ee693a501f44ffb408b16855f90ff` by fast-forward.
Accepted tree: `8100507bb91c534dc40e2f6135341321439a94e6`.
This is QA integration. Master promotion and final all-pack proof are separate.

## Delivered behavior

The top-level navigation now uses the approved DL, HK, and Tealium T artwork.
The existing utility order is retained. Each control is 44 by 44 CSS pixels,
with 24-pixel artwork and an 8-pixel gap. Full names appear on hover and focus;
accessible names, selected states, panel links, and keyboard navigation remain.
Utilities without artwork have a readable short label. Switching retains active
capture and Tealium sessions. Closing and reopening restores the selected tab.

The production change uses two small presentation modules and one host call.
The broad shell stylesheet, browser permissions, and utility implementation
behavior were not changed. Generated JavaScript and source maps for all three
changed TypeScript modules matched the reviewed sources. The generated Shell
registry matches its manifest. The changed-range whitespace check passed.

## Specification checks and runtime proof

Review used the approved icon program, preview, and product/runtime contracts,
including the explicitly authorized record corrections and Tealium step wording.
The architect recorded passing architecture and TypeScript checks, no changed
Clojure DRY duplicates, 11/11 killed language mutants, and 54/54 killed Tealium
Gherkin mutants. These are separate from installed runtime evidence.

| Exact evidence range | Tasks | Result | Recorded run wall time |
| --- | ---: | --- | ---: |
| `b26de510fb` to `15e4113908` | 317 | All fresh and passed | 16m 17.291s |
| `15e4113908` to `cb8bed1924` | 105 | All fresh and passed | 5m 06.683s |

Both review-ready and pack evidence records were validated by the specifier.
The final 105-task range covers the architect's changes; it does not replace
the larger implementation evidence. No repeat runtime suite was run for QA
integration. Both ranges retain their exact declared host and repair consumers.

The implementation receipt is
`tmp/verification-receipts/1693014-cd3a72a4-5cd8-4fa9-9f43-61b0f696c084.json`
in the coder worktree, SHA-256
`e67e1eda89b4694889f2c54ad7eb723729acd9519c6bf2d8bc26acde2962c572`,
run `7330819c-4b2c-4ee2-ac21-06ac53c0918e`.
The final receipt is
`tmp/verification-receipts/1843850-fb874da2-182b-4d83-ab98-7b1b901daddd.json`
in the architect worktree, SHA-256
`134d706b9cc856fbf51009be0970fe00a881a525c804c0052b5404a03332068d`,
run `cc414886-0a0e-4657-ad91-a06571876ef8`.

Both receipts contain 12 installed appearance rows: three selected utilities,
320/800-pixel widths, and normal/forced colors. They also contain six passing
continuity/restoration results. The specifier inspected narrow normal and
forced-color screenshots. Existing Probe checks cover the fallback label.
The final icon browser builds an isolated current package before installation.
It also passed with the worktree archive absent, without recreating that archive.
The earlier package-selection-only repair did not establish execution order;
its intermediate successful receipt is not the final accepted evidence.

## Cost and scorecard

The first coder handoff was queued at 08:44:51 UTC. The architect returned
QA-ready at 12:33:55 UTC: **3h 49m 04s**, before specifier acceptance work.
This interval includes development, verification, repair, and role routing.
It is not active coding time. The coder reports product coding and direct proof
within the original 30-minute allowance; that claim does not establish cheap
delivery when the rest of the cycle takes hours.

The task began with a 31-task host-path forecast. The first exact product plan
was 49 checks plus package. Repairs expanded later plans through 93 and 254
checks to the 317-task implementation evidence. This is not a successful
low-cost result merely because fewer than all packs were selected.

Receipt inventory across the coder and architect worktrees, deduplicated by run
ID and limited to this exact task, contains 21 runs:

| Run intent | Runs | Failed runs | Runs with completion time | Sum of completed run wall times |
| --- | ---: | ---: | ---: | ---: |
| Review evidence | 10 | 7 | 3 | 26m 20.935s |
| Repair focused, including the one flaky diagnostic | 11 | 1 | 10 | 46m 01.447s |

The completed-run total is **72m 22.382s**. The eight failed receipts have no
completion timestamp and are excluded from that sum. Pre-receipt stops, direct
checks, language/Gherkin mutation, coding, and role work are also excluded.
Thus the sum is a lower bound for recorded verification effort, not total task
time. The three successful review runs include the superseded intermediate
architect run. No all-pack release checkpoint was run or claimed.

| Goal | Result |
| --- | --- |
| Approved compact icon behavior | Pass in specification review and installed proof |
| Accessibility, navigation, and session preservation | Pass in the covered runtime cases |
| Exact candidate evidence and package proof | Pass |
| Low-cost feature delivery | Failed: hours of repair and verification |
| Proof that similar future changes are cheap | Not established |

What went well: the icon product change stayed small, and installed tests
observed actual geometry, focus, sessions, and native reopen behavior.
What failed: fixed inventories, historical plan comparisons, stale conservation
records, shared step wording, and fixture assumptions produced repeated repair
cycles. The specifier authorized small repairs separately without controlling
their cumulative delivery cost. Some intermediate success claims were premature
and were corrected before final acceptance.

Recommendation: stop treating another local repair or lower pack count as proof
of the low-cost goal. Any future correction of that goal must demonstrate complete
delivery for an additive utility, shared navigation change, and private utility
extension without manual historical-record repairs, while still detecting lost
checks and broken consumers. This report does not start another preparation task.

## Preserved limits and incident obligations

The inherited global modular-architecture catch-all can precede Tealium handlers
in the combined acceptance registry. The bounded dispatch proof covers Tealium,
sequence replay, and observation-target populations in their registered order.
It does not prove selection of the Tealium handler in the complete registry.
Independent executable Tealium model/browser evidence remains required and passed
in the implementation range. The catch-all finding is retained for acceptance
ownership review; this task did not change that shared dispatcher.

The accepted compact record retains all 46 owners, legacy baseline, compatibility,
and prior authority entries. Only the authorized runner output changes, from
65 to 67 items; aggregate items change from 1455 to 1457. The two blocked-aggregate
contracts change source identities without changing normalized outputs.

Keep the seven implementation repair incidents and the architect package incident:
`36505795-545e-47c9-8825-3f5eac687211`,
`63200393-f3a3-4138-9338-c876bc52bac8`,
`823b0a14-ed24-4fe8-aefb-0a85715bc670`,
`bee6b9ea-60a0-4990-98e6-b6d55545b55c`,
`c19345a0-f9ac-462d-8951-aa4da49d213c`,
`dbfc124c-df1b-4732-a9ef-9d35e5cde9d7`,
`f7bbdc72-e0ae-4761-a213-12fcb2833bd6`, and
`8b9fa6b7-d9cf-4c1a-80b5-ef4413f9260f`.
Keep confirmed-flaky lifecycle incident
`eb4cad49-25fb-455d-8bf9-c9ccead4436d` and all inherited terminal obligations.
QA acceptance neither deletes failed evidence nor resolves these incidents.
