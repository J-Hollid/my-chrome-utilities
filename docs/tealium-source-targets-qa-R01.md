# Tealium source targets: QA acceptance R01

Accepted on 2026-09-10 by the specifier. Task: `tealium-source-targets`.
Handoff: `20260910T083112Z_000917_from_architect`.
QA was advanced from `1f38befa8d3f4d3b4b745936c44607fe30d18dbe` to
`70420b39426797854ae104b1ba95994d60a9d598` with a fast-forward merge.
The accepted tree is `b2d57f49c73bf816aa31f03d20bab8ce4230a4ed`.
This is QA acceptance. Master promotion is not part of this task.

## Result and specification checks

The Live view now has separate **Go to u.send** and **Go to u.extend**
actions. The second action selects the extension array definition. An absent
or unreadable array disables only that action; an empty array remains inspectable.
Observed tag script URLs take priority. Registered extension code can distinguish
otherwise equal send definitions. A verified file can open at its start when the
exact location is uncertain. Multiple possible files remain ambiguous.

The review covered the full product and test changes against the approved source
contracts and `docs/tealium-source-targets-R01.md`. Generated JavaScript for all
13 changed TypeScript modules matched compiler output. All 13 source maps matched
the source and compiler mappings; the delivered HTML matched its source.
The diff whitespace check passed. Metadata and connection recovery remain in scope
as preserved behavior. No manifest, permission, dependency, registry, DataLayer,
or shared utility host change was added.

## Runtime proof and exact evidence

Both exact review and Shell verification records were validated for these ranges:

| Range | Recorded tasks | Result | Review run wall time |
| --- | ---: | --- | ---: |
| `1f38befa8d` to `73ae7c9933` | 46 | All passed | 2m 40.895s |
| `73ae7c9933` to `70420b3942` | 34 | All passed | 2m 41.107s |

The final range is the architect repair. Its smaller selection does not replace
the full feature range. Neither range selected a DataLayer pack or an all-pack
gate. The specifier validated the records without repeating the runtime suite.

The full feature receipt is
`tmp/verification-receipts/1173527-c01dd5ac-666a-46e4-9414-ccb7d33bb6ba.json`
in the coder worktree. Its SHA-256 is
`780a7d8e565994fb20fe0bb5539875e1da1a42cdf53ca3f79c4aa0d43f0664bc`.
Its run ID is `7abe28ae-9c56-44e0-8e16-df547abaa3d9`.
The final receipt is
`tmp/verification-receipts/1217874-d66ba82c-d297-493a-b8be-072ec087a2fc.json`
in the architect worktree. Its SHA-256 is
`4844ea76c63c645f6e817f902fad474c3de7230b2f014f5b852e2700c64422d5`.
Its run ID is `019a5404-a4ab-42af-93c6-2c3802b5c42c`.

Actual Chromium Sources editor checks passed for five new target fixtures and
three existing source fixtures, including the pinned real bundle. They cover
file-start fallback, an observed separate script, extension-based selection,
both definitions, and an empty array. The tests check both destinations after
formatting and the full-width extension action. Inspection did not execute tags.

Three action-limit fixtures preserve ambiguity and independent action availability.
Two extension lifecycle cases each recorded zero stale opens and one new explicit
open in the actual editor. Existing reload, frame, session, and connection recovery
checks also passed. The worker recovery checks detached the debugger and terminated
the worker. These are automated fixture results, not a check of every user website.

## Scorecard and process result

| Check | Result |
| --- | --- |
| Approved source behavior | Pass in specification review |
| Actual editor, lifecycle, and read-only behavior | Pass in recorded runtime checks |
| Generated output and exact evidence | Pass |
| Bounded test selection | Pass; 46 feature tasks, 34 final repair tasks |
| First-pass source matching | Failed; several review returns required repairs |
| Low-cost development goal | Not proved; total active coding time was not measured |

The five successful review runs at `8cde1064`, `3afd42bc`, `63f96447`,
`73ae7c9933`, and `70420b3942` used 15m 15.695s in total. This excludes failed
attempts, direct checks, coding, and other role work. The interval from the
specifier handoff at 07:11:14 UTC to the architect handoff at 08:31:12 UTC was
1h 19m 58s. Elapsed time must not be reported as active coding time. The first
editor proof was reported about 12 minutes after the coder claimed the task.

What went well: runtime tests inspected the actual editor and proved that stale
actions cannot open sources. Existing ownership kept the task within Tealium/Shell.
What failed: the first source scanner treated some regular expressions and other
non-code text as code. Later review found incorrect association across member
paths and reassigned owners. These defects caused repeated repair and review work.
Recommendation: keep these regression cases together and check source boundaries
early. Keep file-start fallback when exact matching cannot be proved. A new
preparation stage is not required for this accepted feature.

The full feature receipt records the confirmed-flaky admission for incident
`d4097737-bdbf-4914-8f32-55d565d1fcd9` on
`checkpoint:shell:tealium-detection-states-browser`; its fresh final task passed.
Acceptance does not remove that incident, prior failures, or inherited terminal
obligations. No unrelated reliability incident was closed by this review.
