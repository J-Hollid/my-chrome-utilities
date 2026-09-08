# Project observation sources QA scorecard R01

Task: `project-multiple-observation-sources`. Date: 2026-09-08.
Result: QA integration complete. Master promotion remains separate.

QA advanced from `6fa4c97a0b341a680264f5bf660b2876c4d64f4a` to
`2b6f724ee983eec4ac27bad99dd71d42496f1bfe` at 17:02:30 UTC.
The candidate tree is `8aa6133cb58d60ed8fa039ed28418ead2d68edac`.
The fast-forward preserved the approved source specification, the retrieval
defaults, and unrelated working files. Master remains
`dce549f1c31a3cc46192be27eae243f04eb80834` with its existing terminal proof.

## Delivered behavior

Projects can observe multiple event arrays on one selected tab. Each source has
its own settings, status, and identity. Live shows source labels and a source
filter. Durable settings, legacy migration, saved evidence, independent source
cleanup, and the separate Default push path remain supported.

Settings, persistence, page hooks, subscriptions, coordination, and feed display
have separate modules. The largest new production module has 151 lines. The
Capture controller lost two lines overall; the Live observer UI lost 98 lines.
The 25 approved source scenarios have no behavior changes. Existing transport
contracts now express their single-source cases through the source list.

## Evidence scorecard

| Check | Result |
|---|---|
| Exact architect review-ready evidence | Passed: 1,038 tasks across 18 selected packs |
| Installed source checks | Architect reports all 14 groups passed |
| Existing transport browser checks | Architect reports nine cases and the installed boundary passed |
| Four-feature acceptance baseline | Architect reports 90 example runs passed |
| Source property checks | 60 receipt schedules and 50 project cases registered and covered |
| Assertion quality | Architect reports 243 soft mutation cases with no remaining survivors or errors |
| Resolver regression | Architect reports 2 tests and 36 assertions passed |
| Build, types, and package | Passed in the reviewed candidate and bound evidence |
| Specifier evidence validation | Exact task, base, candidate, tree, and receipt passed |
| Terminal all-pack runs | Zero; no new terminal or master claim |

The final note is in `refs/notes/swarmforge-review-ready`. Its run started at
16:24:15.798 UTC, ended at 16:55:52.473 UTC, and was recorded at 16:57:12.071 UTC.
Receipt SHA-256: `d13f254bad2ad45a1d5907e5da7f2d5bbdf96acc3dca92034c48ebad61f765d8`.
Plan digest: `c0881e12faa6b8a97aca0d24b46c59d6f4b32f8b8ce278d62b48d46b0d6e98cd`.
Artifact output digest: `497aee58498ca788b2fcb4aef0904116a4c1f57d0b217bc2471fd65efe850e93`.
The specifier reused this valid evidence and did not run a second focused suite.

## Delivery timing

All times are UTC. Queue times are elapsed intervals, not active work estimates.
User approval is recorded in specification `fa4cbfd952`; the first handoff was
created at 05:31:26.557. Coder claimed it at 05:31:33.776.

| Interval | Start to end | Elapsed |
|---|---|---|
| Initial coder work, to first review handoff | 05:31:33.776–13:23:12.372 | 7h 51m 39s |
| First refactorer task | 13:23:21.156–13:29:58.782 | 6m 38s |
| Review and repair window, first to replacement coder handoff | 13:23:12.372–15:50:43.137 | 2h 27m 31s |
| Second refactorer task | 15:59:40.294–16:03:34.684 | 3m 54s |
| Architect claim to QA-ready handoff | 16:04:14.888–16:57:30.205 | 53m 15s |
| Specifier claim to QA integration | 16:57:44.230–17:02:30 | 4m 46s |
| Coder start to QA-ready handoff | 05:31:33.776–16:57:30.205 | 11h 25m 56s |
| Coder start to QA integration | 05:31:33.776–17:02:30 | 11h 30m 56s |

The eight-hour QA-ready estimate was exceeded by 3h 25m 56s. The available
records do not establish compliance with the four-hour progress checkpoint.

| Completed focused run | Tasks | Start to end | Duration |
|---|---:|---|---|
| Coder `0030725425` | 1,029 | 12:45:40.795–13:21:55.407 | 36m 15s |
| Repair `4fada2bb5e` | 1,033 | 14:21:22.024–14:58:29.810 | 37m 8s |
| Revised repair `ec32f826f7` | 1,033 | 15:34:29.118–15:49:28.966 | 15m 0s |
| Architect `2b6f724ee9` | 1,038 | 16:24:15.798–16:55:52.473 | 31m 37s |

These four passing focused runs total 1h 59m 59s. Earlier passes do not prove
the final changed tree. The task receipt inventory also has 19 failed review
attempts and 34 repair-focused receipts, of which six are incomplete. In total,
27 of the 57 task-bound receipts contain a failed task. Missing completion times
prevent a reliable total elapsed verification cost. These are not full gates.

## Receipt disposition

The approved integration helper evaluated all 23 review receipts. It removed 21
with no active obligation and retained two for active incidents. It retained
`0030725425` proof for `23f98ab6-34a0-4efe-afea-69dc3641ac21` and `ec32f826f7`
proof for `c116c4f2-81f4-447e-bd5c-4f42ccfe5ddd`. Existing incident obligations
remain for master integration. The 34 repair-focused receipts lack the plan
digest required by this helper and remain unchanged; no identity was invented.
Compact decisions are in `.swarmforge/verification-receipt-dispositions.json`.
The final Git note retains the bound proof after consumed raw data is removed.

## Process assessment

What worked: separate source modules made lifecycle review practical. Controlled
schedules found receipt-order and continuous-polling faults. Installed browser
observations and mutation checks found an assertion gap that examples missed.

Process failures: initial tests missed refresh overlap and source properties.
Browser readiness, fixture migration, verification conservation, and Clojure
lane discovery needed repairs. A later merge kept stale planned-feature entries.
Specifier reads also exceeded output limits; narrower reads recovered the needed
facts. One receipt query assumed an array instead of a keyed task object.

Recommendation: adjust. Add ordering properties and a real two-array installed
case early. Check fixture startup, focused test discovery, and registry status
before a complete evidence run. Use compact receipt summaries and bounded reads.
Assess the 18-pack verification cost at the next release review. No new process
infrastructure or measured retrieval saving is claimed by this scorecard.
