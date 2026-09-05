# Serena pilot QA scorecard

Recorded: 2026-09-05. Task: `serena-development-pilot`.
QA-integrated implementation: `677c44d1f9b04856f61dfd073a1448c7bdf4dd78`.
Master remains `fd8575e994dc453c50e79193bd9648988248120b`.

## Delivered behavior

The pilot now contains the pinned Serena provider and installation command,
isolated worker launch settings, explicit startup instruction reading, and the
canonical read-only ownership query. Core toolchain, root npm lock, and extension
source bytes are unchanged. See `swarmforge/scripts/serena/README.md` for setup.

Local inspection after QA integration found the pinned installation available
in the specifier, coder, refactorer, and architect worktrees. The coder's live
checks connected separate servers in all four trees and checked product `.ts`
and process `.mjs` definitions and references. The architect repeated its own
installed connection and checked effective Codex launch settings.

New role launches receive the optional Serena tools. Existing Codex sessions
retain their previous MCP settings until a safe new launch; none was restarted
by this integration. Temporary configuration overlays used for the live checks
were removed. These checks prove installation and worktree-bound connection,
not adoption by every existing session. Clojure remains unprovisioned; ordinary
tools remain the route for `.clj` and `.bb` files.

The ownership helper is available now, for example:

```sh
node scripts/verification-ownership-query.mjs path swarmforge/scripts/serena/server.mjs
```

That query ran successfully from the integrated root checkout. It reported the
current worktree, revision, dirty state, owner, consumers, and required checks.
It ran no checks and wrote no evidence. Serena discovery cannot replace it as
verification authority.

## Evidence and elapsed time

| Item | Result |
|---|---|
| Resumption handoff | 2026-09-05 19:44:40 UTC |
| Incoming exact review | `9a811cdebe` against `268279a9bf`; 180 tasks passed in 12 min 44.036 s |
| Architect review start | 21:13 UTC, from the architect report |
| Final exact review | `677c44d1f9` against `9a811cdebe`; 166 tasks passed |
| Final run interval | 21:24:01.486–21:36:27.025 UTC; 12 min 25.539 s |
| Final evidence recorded | 21:38:02.477 UTC in `refs/notes/swarmforge-review-ready` |
| Architect handoff | 21:38:12 UTC |
| QA integration confirmed | By 21:39:43 UTC; about 1 h 55 min after resumption |
| Implementation forecast | 4 h; this resumed stage finished within the forecast |
| Focused packs | `shell`, `verification_process`, with package proof |
| Architecture mutation | 167/167 Clojure/Babashka and 160/160 soft Gherkin mutants detected |
| Full release gates | 0; no master integration or final-regression claim |

Three task-bound review receipts were found, all with passing task results.
The first candidate passed 180 tasks in 13 min 8.772 s. Refactorer correction of
query check classification and later architecture mutation records required
new exact candidate evidence. Only the last claim authorized this integration.
The recorded passing review intervals total 38 min 18.347 s. This is not a
complete measure of setup, direct checks, waits, or worker effort.

There were no repair or flaky admissions in the final review claim. Earlier
preparation incidents retain their recorded terminal obligations. No release
proof was created or invalidated by this feature-mode task.

After exact evidence validation and QA integration, the official receipt
disposition helper removed the three consumed pilot receipts with no active
obligation. The compact Git evidence and disposal facts remain. The two earlier
preparation proofs were also submitted for disposition because the pilot no
longer needs them; any active incident consumer retains its normal protection.

## What worked and what failed

Small modules kept installation, configuration, launch, and query behavior
separate. Real server checks caught the process `.mjs` project configuration
gap. Shared test handlers were checked through their registered selection path.
The architect needed no implementation repair.

Setup initially used an incorrect upstream language-server directory, and one
connection returned empty references until restarted. Ownership registration
also required correction before evidence. The coder reported `impeded` by setup;
the architect reported `neutral` because queries confirmed code already present
in the full diff. No local time or token saving is claimed.

Verification remains too broad for this category of work. The final plan still
ran seven browser tasks, including side-panel checks. The reorderable-editor
browser task took 6 min 28.523 s. Passing two packs does not establish that all
selected tasks have a useful connection to an optional development-tool change.

Continue the approved pilot during normal development. Inspect actual task
selection when assessing scope, use a fresh connection or ordinary files for
doubtful references, and record useful or failed use in existing delivery
reports. Do not start repeated benchmarks or another optimization programme
from this scorecard.
