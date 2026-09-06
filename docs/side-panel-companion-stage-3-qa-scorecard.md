# Side-panel companion Stage 3 QA scorecard

Task: `project-library-dialog-decomposition`.
Classification: production refactor with preserved behavior.
Specification base: `8ce48c75e2c38388d6195befce5b565e8af95cdf`.
Accepted implementation: `ba0e86e1b9ba8c4ca616ee3440cf5982af104e6a`.
Final review base: `d46e038def0704d2842904c6b0607861e1d31777`.
Architect handoff: `20260906T190451Z_000896_from_architect`.
QA integration: 2026-09-06 19:15:03 UTC, from the QA reflog.

The four dialogs now have separate production modules. Controls, metadata, and
focus have three small helpers. The coordinator retains repository operations,
project identity, subscriptions, transport, revision, save, and Undo. Production
source and generated delivery assets satisfy the functional delivery requirement.
The presentation module and unfinished companion branding remain separate.

| Measure | Recorded result |
|---|---|
| Dialog workflows | Four extracted |
| Installed close cases | Twelve passed: cancellation, native close, and Escape for each dialog |
| Production coordinator behavior checks | Seven passed |
| Coder review record | 1,007 tasks passed across 17 packs |
| Refactorer review record | 239 tasks passed; 18 min 52.614 s |
| Final architect review | 191/191 tasks passed across three packs; 8 min 50.414 s |
| Final properties | Nine property tasks passed |
| Final package | Fresh `package:extension` passed in 1.123 s |
| Evidence identity | All three bound records passed validation; final raw receipt SHA-256 matched |
| Selected Clojure mutations | 24/24 detected after adapter corrections |
| Full release gates | Zero; master did not advance |
| Handoff-to-QA time | 3 h 46 min 9 s; exceeded the two-hour expectation |

The Stage 3 handoff was queued at 15:28:54 UTC. The coder's recorded passing
receipt interval was 17:36:34.733 to 17:39:42.087 UTC. The refactorer interval
was 17:55:12.292 to 18:14:04.906 UTC. The final interval was 18:54:46.041 to
19:03:36.455 UTC, with evidence recorded at 19:04:36.571 UTC. These intervals
do not establish total active effort or the cost of every earlier run. Failed
checks, repair checks, coverage, mutation work, and idle time remain separate.
Approval-to-master measurement stays open.

What went well: explicit callbacks preserve domain operations. Installed Chrome
checks observe native dialog closure, focus restoration, stored state, and the
same production coordinator. The reviewed architecture rule permitted a bounded
17-pack product plan with conservative consumers. No planner policy changed.
The final review reran the installed Projects checks and passed package proof.

Where the process failed: the extraction first used a missing source marker,
and a focus assertion ran before the close event. Registration assumptions and
conservation records required repeated repair. A later audit found duplicate
evidence producers and stopped another run. The architect then found six missing
acceptance producers. The mutation adapter initially omitted cache and historical
result controls. These corrections account for repeated work; the delivery report
retains the detailed findings and failed receipts.

The incidents `b6d68f0a-1d26-48ed-8363-55c6be83c7a4`,
`6789d618-845c-4454-af32-8317a1b20550`, and
`f1dacce1-d0d6-4c65-a66e-6e5ad461ad89` retain their terminal-verification-deferred
obligations. QA integration does not resolve them. The refactorer reported
88.43% direct line coverage for the new dialog modules and useful Serena outline
use. The other reviews used the permitted missing-tool fallback. No measured
Serena time saving or TypeScript mutation coverage is claimed.

Recommendation: resume the original approved companion design correction.
Preserve the reviewed dialog callbacks and lifecycle while adapting the old
draft. Keep fresh all-view contrast, navigation, action, and accessibility proof
under the existing product contract. Check complete evidence-producer
dependencies before a settled run. Keep prerequisite effort separate from the
product estimate and do not add another verification program.
