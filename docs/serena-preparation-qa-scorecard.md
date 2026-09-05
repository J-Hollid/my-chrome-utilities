# Serena preparation QA scorecard

Recorded: 2026-09-05. Task: `verification-slice-serena-development-pilot`.
QA fast-forward accepted candidate `fa6c204e9de910c04d544212cdca1dc7c607d734`.
This completes the preparation on QA. Serena is not installed or enabled yet.
Master remains `fd8575e994dc453c50e79193bd9648988248120b`.

## Accepted result

The optional-tool pin, IO, dispatch, and CLI boundary is installed under
`swarmforge/toolchain/`. Both original causal paths have reviewed dispositions.
The core checker and root lock retain their exact bytes and global ownership.
The pilot can add optional pins and providers through the new boundary.

Calibration rule tests use authored inputs. The historical aggregate retains
its prior values and seven declared identities: six source files are recorded
as unavailable after workflow cleanup, and the existing compact retirement
identity is unchanged. No deleted receipt or measurement was reconstructed.

## Evidence and time

| Item | Observed result |
|---|---|
| Preparation handoff | 2026-09-05 14:45:21 UTC |
| First coder review handoff | 17:28:17 UTC; 2 h 42 min 56 s after issue |
| Final refactorer handoff | 18:29:12 UTC |
| Architect review start | 18:42 UTC, from the architect report |
| Architect QA-ready handoff | 19:35:30 UTC |
| QA integration confirmed | By 19:39:45 UTC; about 4 h 55 min after issue |
| Original elapsed forecast | 2 h; exceeded by about 2 h 55 min |
| Pre-architect exact proof | `230dfd5fc0` against `f338e51109`; 179 focused tasks passed |
| Final exact proof | `fa6c204e9d` against `230dfd5fc0`; 170 focused tasks passed |
| Final evidence interval | 19:24:38.206–19:32:58.369 UTC; 8 min 20.163 s |
| Evidence recorded | 19:34:57.246 UTC, in `refs/notes/swarmforge-review-ready` |
| Final task scope | `shell`, `verification_process`, with package proof |
| Architecture mutation checks | 15/15 Clojure mutants and 72/72 soft Gherkin mutants killed |
| Full release gates | 0; no master integration or final-regression claim |

The task receipt inventory found ten review-evidence attempts: four completed
passes, five with failed tasks, and one with no task result. Six repair-focused
attempts completed. The four passing review intervals total 38 min 47.131 s;
the six repair intervals total 30 min 12.268 s. These are recorded run intervals,
not total worker effort. Failed runs without completion timestamps are excluded
from those sums. Earlier development diagnostics are not included in this count.
Three earlier passing review runs were superseded by later candidate changes;
only the final bound claim authorized this QA integration.

Five task-related incidents remain unresolved with
`terminal-verification-deferred` disposition:

- `7996bfb0-f3c2-4e4a-9d4b-1c506f245fed`;
- `a9a05e9e-8e8f-4f92-ae44-888b2afcf17d`;
- `ae022954-be05-43f6-b96b-564c4cfa0dd9`;
- `b53e6d66-919e-443f-9918-425d77507f7c`;
- `ddc74fe6-8d11-4d46-84e2-7952a0f41813`.

Their obligations remain for the later user-requested release checkpoint.
QA integration does not resolve them. No quarantine mapping repair was required
for the new optional-tool boundary.

## Receipt disposition

Sixteen task-bound raw receipts were assessed in the current role receipt
stores. The official disposition helper evaluated eight and removed six with
no remaining obligation. It retained two for active incident consumers. The
two exact preparation proofs remain for the pending pilot resumption. Six
repair receipts without the helper's complete identity remain unchanged;
no identity was invented to authorize their removal. Incident archives remain
subject to their active obligations. Compact removal facts are in the existing
receipt-disposition state. This was task-scoped cleanup, not a workspace purge.

## Assessment and next action

The small optional-tool boundary, unchanged runtime authority, and direct
ownership checks worked. Development lost time to temporary calibration inputs,
fixed historical inventory counts, split JSON observations, general acceptance
handlers taking precedence, and a missing stylesheet prerequisite. Several
problems were found only after a broad focused run or a return from review.

Use fixed rule inputs and test actual registered handler selection for every
new feature before recording evidence. Finish mutation and prerequisite checks
before the settled run. Apply these refinements during the already-approved
pilot; no extra optimization project or repeated benchmark is required.
No Serena setup, elapsed-time saving, or token saving has been measured.

Resume `serena-development-pilot` from the QA recording descendant of this exact
candidate, with its existing three feature contracts. The preparation is now
implemented and independently reviewed; no product patch needs reapplication.
The original tool-use, setup, ownership-query, and startup-reading scope remains.
