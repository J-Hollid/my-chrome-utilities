# Side-panel companion Stage 4 QA scorecard

Task: `side-panel-companion-brand-correction`.
Specification base: `c3f4e6e66c9d3cac51ad703f871f169b9b9b1c1f`.
Accepted implementation: `c573b9822b47fdafac617faac73e4ce55c63a252`.
Final review base: `d8a1bba911c2d4604e0920083a56fb24424e1433`.
Architect handoff: `20260907T135031Z_000897_from_architect`.
QA integration: 2026-09-07 13:54:42 UTC, from the QA reflog.

The side panel now applies the approved companion presentation to all seven
views. Each project has one record, native details, and its existing actions.
The reviewed dialog split remains in place. Installed checks cover populated
states, long records, recovery, archive, navigation, and the Studio route.
The separately user-approved browser-result and receipt-boundary repair is also
included. It preserves an actual failed target when later output is missing and
validates output before publishing a pass.

| Measure | Recorded result |
|---|---|
| Bound review records | Both validated against their exact bases and commits |
| Earlier review | 1,115 tasks; 21 causal packs; 53 min 18.169 s |
| Final architect review | 946/946 tasks; 17 packs; 31 min 12.251 s |
| Final properties | 82 property tasks passed |
| Final package | Fresh `package:extension` passed in 1.131 s |
| Installed presentation | Seven views at 360, 420, and 512 px; 21 populated observations |
| Minimum measured text contrast | 5.2349:1 |
| Dialog closures | 12 passed |
| Accessibility | Four modes passed; 200% check uses equivalent viewport reflow |
| Acceptance mutations | 146/146 Gherkin mutations detected |
| Clojure mutations | 39 effective mutations detected; one byte-identical tool no-op |
| Final receipt identity | Recorded SHA-256 matched the retained raw receipt |
| Resumption handoff to QA | 18 h 37 min 54 s total elapsed time, including approval waits |
| Overnight approval wait | 5 h 47 min 16.577 s |
| Other recorded response waits | 42 min 2.634 s |
| Elapsed time less recorded waits | 12 h 8 min 34.789 s; includes implementation, repairs, verification, and review |
| Initial presentation commit | 45 min 14 s after resumption; excludes later fixes and verification |
| Master promotion | None; no terminal release claim |

The resumption handoff was queued on 2026-09-06 at 19:16:48 UTC. The final run
was from 13:17:31.752 to 13:48:44.003 UTC on 2026-09-07. The user identified
the overnight approval delay during the scorecard review. Session records confirm
the request at 22:15:19.121 UTC and approval at 04:02:35.698 UTC. The original
summary did not separate this delay and must not be read as 18 hours of work.
The corrected intervals and source records are in
`docs/side-panel-companion-stage-4-timing.md`. These are elapsed intervals, not
measured active effort. Prerequisite timing remains in the three earlier
scorecards. Approval-to-master timing remains open. The 21-pack earlier
review followed the approved shared repair's causal scope; it was not a terminal
release gate. Pack and task counts do not measure product value or speed saving.

What went well: the installed evidence observes actual production controls and
state. Fresh package proof and exact receipt checks passed. The specifier also
inspected final-run images for narrow Projects, populated Live, and a long project
name. The architecture review covered the full delta and acceptance consumers.

Where the process failed: the old draft was incomplete. Overflow, focus timing,
contrast, stale selectors, and hidden-element geometry needed correction. Missing
acceptance consumers and registration assumptions caused repeated work. The
browser wrapper and receipt boundary needed the separately approved causal repair.
The six-hour implementation/review expectation cannot be compared directly with
total elapsed time. Even after subtracting recorded response waits, the delivery
interval is about 12 hours; that interval also includes the separately approved
verification repair. Pure coding time and the cost of each repair are not
separately measured. The later baseline repair request was unnecessary: the
existing deferral already applied. The delivery and architecture reports retain
the detailed failures and proof.

Limits: equivalent viewport reflow is not a Chrome zoom-menu test. The reported
presentation coverage is local to that helper, not whole-product coverage.
Earlier deferred incidents, including the recorded Studio page-removal baseline,
remain obligations for a later requested master integration. No Serena speed or
token saving is established.

Recommendation: accept this QA delivery and perform the already approved Serena
setup correction next. Prove usable instruction-to-symbol access, then measure
its value during ordinary work. Check complete acceptance consumers before the
next settled run. Keep further verifier work tied to a concrete approved cause.
Report response waits, technical work intervals, and added repair scope separately
when comparing delivery with its original estimate. Check existing deferrals
before asking for another repair decision.
