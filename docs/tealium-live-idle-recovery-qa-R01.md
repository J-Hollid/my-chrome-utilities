# Tealium Live idle recovery QA result R01

Task: `tealium-live`. QA integration recorded at 2026-09-12T08:32:09.097349+00:00.
Accepted implementation: `f860448327319ac5750561e9ad721e6afdc61276`.
Specification base: `fad4d513ab1eb2346189f89dc9bbe04645476b5d`.
This is QA integration. Master promotion and terminal obligations remain separate.

## Specification review

The accepted repair acknowledges each accepted DevTools connection and resets
its consecutive failure allowance. It preserves six retry delays, current-port
checks, disposal, invalid-context handling, initial guidance, and source-action
cancellation. Recovery feedback distinguishes retrying from exhausted retries.
Production source and delivered JavaScript are included in the task lineage.

## Runtime proof

The exact Git review evidence passed 80 focused tasks in `shell` and
`verification_process`, including property checks and packaging. The specifier
validated that evidence without repeating the focused run.

The installed recovery test performs eight real quiet worker shutdowns with the
worker debugger detached. It then exercises native-side-panel `Go to u.send`
and full-width `Go to u.extend` cases. Both cases check cancellation of a pending
action, retained selection, one new explicit action, and the actual Sources
editor URL and nonempty content. Acceptance rows now use those case identities.
Controlled production-callback tests check retry delays and recovery feedback.
These are controlled shutdown tests; they do not prove every customer profile
or extension-reload recovery.

Evidence receipt: `tmp/verification-receipts/2403554-2e276437-20aa-4ee2-8843-00ebab1548c1.json`
in the architect worktree. Durable binding remains in
`refs/notes/swarmforge-verification` on the accepted implementation.

## Scorecard

| Measure | Result |
| --- | --- |
| Resumption handoff | 2026-09-12 04:53:56 UTC |
| First QA-ready handoff | 2026-09-12 06:47:48 UTC |
| Review return | 2026-09-12 06:49:12 UTC |
| Accepted QA-ready handoff | 2026-09-12 07:11:16 UTC |
| Handoff to accepted QA-ready | 2 h 17 min 19 s |
| Final focused run | 07:05:46.780 to 07:09:42.853 UTC; 3 min 56 s |
| Final selected tasks | 80 passed, including package |
| Specifier review returns | One; two missing runtime cases |
| Final full runs in this feature phase | None |
| Master integration | Pending separate request |

The 60-minute estimate covered implementation and focused checks, not the full
review queue. Total handoff-to-QA-ready time exceeded 60 minutes. Separate coder
and refactorer intervals, total failed runs, and total verification time were not
established in this review; no cost-saving claim is made. Earlier candidate
`63972116d5` passed its selected tasks but lacked the two required runtime cases.
Its evidence remains historical and is not reused for this accepted tree.
All existing incident and terminal obligations remain in force.

## Process result

What worked: contract review found missing proof before QA integration. The
architect completed the same bounded repair and supplied fresh exact evidence.

What failed: the first candidate reported full-width and extension-action flags
without executing those recovery cases. Registry and acceptance corrections also
expanded the forecast from the two Tealium slices into verification-process work.
Some specifier discovery output exceeded its limit; targeted reads recovered the
required content without treating omitted output as inspected.

Recommendation: adjust. Derive acceptance claims from actual case results and
check each required surface and action before the first QA-ready handoff. Retain
the focused controlled-shutdown regression. Start no new preparation or terminal
verification task from this result.
