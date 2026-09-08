# Repository retrieval QA scorecard R01

Recorded: 2026-09-08. Task: `repository-retrieval-defaults`.
Accepted candidate: `4f6ae341dad6bd115972421a6cd2688f2434112a`.
Specification: `fb952727466350c8d16d66e709cf3f7f3f04e619`.
Final review base: `9fa98a1c8d9aa396614171e1ef7c9791482dc6d2`.

QA fast-forward completed at 14:14:48 UTC, from its reflog. Master remains
`dce549f1c31a3cc46192be27eae243f04eb80834`. This is a tooling and prompt delivery
to QA, not a master release or a terminal regression claim.

## Delivered behavior

Root AGENTS.md has the approved retrieval rules and the installed helper usage.
`node swarmforge/scripts/retrieval.mjs` provides file discovery, literal search,
and text reads with an 80-line or 12-KiB body limit, explicit completion, and
quoted continuation commands. Full instruction reads remain available.
Query, paging, and CLI responsibilities are separate small modules. No product
TypeScript, role prompt, or MCP protocol was changed. No contract was deleted.

## Evidence and timing

| Measure | Result |
|---|---|
| Specification handoff | 10:00:15 UTC; priority 20 after the data-layer coder task |
| Implementation evidence | 100/100 tasks; 13:45:47.127–13:49:43.127 UTC; 3 min 56 s |
| Refactorer diagnostic | 9/9 tasks; 13:54:29.505–13:55:06.668 UTC; 37.163 s; not review evidence |
| Final architect evidence | 76/76 tasks; 14:06:50.621–14:10:53.711 UTC; 4 min 3.090 s |
| Bound review time | 7 min 59.090 s across two passing runs |
| Initial/final selected packs | Project Event Transport, Shell, Verification Process / Shell, Verification Process |
| Initial/final property tasks | Four passed / three passed |
| Initial/final package proof | Passed in 1.131 s / passed in 1.181 s |
| Architect handoff | 14:12:24 UTC |
| Handoff to QA | 2 min 24 s after architect handoff |
| Specification queue to QA | 4 h 14 min 33 s, including the wait behind product work |
| Full gates, invalidated terminal passes | Zero, zero |

Both exact Git review notes were validated before integration. The earlier
candidate required fresh evidence after the architect changed its tests and
acceptance checks. The specifier did not repeat the focused suite. Exact coder
and refactorer role-start intervals are not established by the available report;
the queue-to-QA interval is not a measure of active implementation effort and
cannot alone establish whether the two-hour effort forecast was met.

The implementation receipt hash is
`c59102fe9a27762f3e2f5e60a4347d249a26be0779e8234f3e930e7890d3db12`.
The final receipt hash is
`12c1951316ab72ca6a0015295b3425b7d47cea6532eb6b410c609d9d5a8839f7`.
The exact candidate identities, trees, task sets, and receipt timestamps remain
in `refs/notes/swarmforge-review-ready`.

## Activation and actual use

| Role | Evidence |
|---|---|
| Coder | Delivery report records an explicit full read and scoped helper calls |
| Architect | Delivery report records an explicit full read and a scoped search |
| Specifier | Installed AGENTS.md read fully through the helper after QA integration; bounded reads and continuation used successfully |
| Refactorer | Live activation unconfirmed; fixture checks are not live-session evidence |

No busy role was restarted. The existing local AGENTS.md draft matched the
approved attachment and was moved to the task's temporary directory before the
tracked candidate was installed. Other local changes were preserved.
Retrieval assessment: helped for bounded reads and explicit continuation; no
token saving or permanent compliance is claimed.

## Failures and refinement

Mutation review exposed eight missed acceptance checks: expected values were
not read from their actual keyword-keyed representation, and unknown instruction
routes were accepted. Both were repaired before the final passing evidence.
The final mutation record detects all 23 selected Gherkin mutations. The delivery
report also records eight detected Clojure mutations and no duplicate candidates.
JavaScript mutation coverage is not claimed because no tool is pinned here.

The task needed registration of inherited observation-source contracts as
planned, a regenerated Shell plan digest, and separation of an instruction
fixture from its test. These are the recorded causes of extra work. The product
implementation remains on its separate review lineage and is not delivered by
this tooling integration.

Two additional receipt records contain no task results or completion timestamp;
their presence is not proof that checks ran. The exact task-bound architect
record and the two consumed bound receipts were removed by the approved
disposition helper at 14:18:41 UTC after it found no active obligations. Compact
receipt identities and disposition facts remain in repository state and Git notes.
Two refactorer diagnostic records lack base/task binding required by that helper;
retain them without inventing identity fields. This is a nonblocking retention
follow-up, not authority to expand this tooling task into a cleanup repair.

Recommendation: continue the installed defaults during ordinary tasks. Confirm
the refactorer's instruction delivery at its next safe task boundary. Keep
fixture checks independent of live status reports and validate actual example
values before an evidence run. Do not activate another enabling slice from this
scorecard without the required user review.
