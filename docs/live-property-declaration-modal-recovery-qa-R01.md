# Live property declaration modal recovery QA record

QA accepted: `a79b169d0129b2901156103b0fe194e4dc0d89ef`, 2026-09-12,
integration recorded at 16:59 UTC. Evidence base: `abfa4d8fc7`.
Task: `live-property-declaration-modal-recovery`.

## Outcome and proof

The production dialog lifecycle now makes its host visible, closes the modal,
removes its listeners, and restores the host state. The destination picker and
declaration review remain separate from Add validation.

The exact review-ready validator passed 945 focused tasks for the accepted
candidate. The architect's supplemental native-input observation used the
installed extension side-panel page on that unchanged candidate. Reviewed local
sources: `.worktrees/architect/tmp/live-property-native-input-proof.mjs` and
`.worktrees/architect/tmp/live-property-declaration-modal-recovery-evidence.note`.

The observation uses CDP mouse/key input with hit tests. It opens both branches,
checks a single visible modal, cancels with native Escape and pointer Cancel,
restores Live focus, and reopens. It selects a destination and confirms
product_name with Tab/Enter, confirms product_id with pointer input, then reads
both saved declarations and the existing metadata from IndexedDB after reload.
The architect reported picker bounds 166.53125 by 103.234375 and review bounds
476 by 144.171875 pixels. The test uses a 1200 by 900 viewport; it does not
establish all narrow-screen layouts. The existing focused evidence covers
declaration semantics, siblings, rules, publication, and persistence separately.

The supplemental script was inspected, not rerun by the specifier. Its passing
result is architect-reported installed runtime evidence. No behavior-bearing
file changed for that observation, so the exact focused evidence was retained.
The permanent browser regression now checks visible bounds and close/focus
outcomes, but still invokes synthetic events. The native-input script supplies
the additional proof for this candidate; it is not a registered automated
regression. Preserve that distinction in future delivery claims.

Specification checks, focused evidence, and this installed observation support
QA acceptance only. Master is unchanged; no terminal checkpoint or release
completion is claimed. The earlier quota report remains unclassified and was
not reproduced by opening this dialog.

## Scorecard

| Measure | Result |
| --- | --- |
| Specification commit | 19aee85aa1, 09:57:43 UTC |
| First implementation commit | 0e7d1245, 10:07:52 UTC; 10m 9s later |
| QA integration | About 16:59 UTC; about 7h 1m after specification |
| Coder passing focused run | 00e87bf846; 14:42:51.714–15:08:27.629 UTC; 25m 35.915s |
| Architect passing focused run | d8078b06cf; 15:47:36.502–16:12:54.284 UTC; 25m 17.782s |
| Reconciled candidate passing focused run | a79b169d01; 16:22:22.127–16:48:01.701 UTC; 25m 39.574s |
| Known passing focused runtime | 1h 16m 33.271s; excludes failed/diagnostic work |
| QA returns | One ancestry correction; one actual-input proof gap |
| Full terminal runs requested by specifier | Zero |
| Approval-to-master measurement | Pending; master promotion is separate |

What went well: the original isolated probe exposed the invisible modal; a small
lifecycle owner fixed it; both later approvals survived reconciliation; native
input proof was added without repeating the last passing focused run.

Process failures: runtime assertions previously accepted an invisible modal;
registration and task-conservation gaps expanded the repair; evidence-base
confusion caused late recording friction; the candidate initially omitted later
QA approvals. The first review also lacked native-input proof. The one-hour
first-candidate target was exceeded. The timings above do not classify all
unmeasured time as execution or review work.

Recommendation: continue the approved product feature, retain visible/input
boundary checks, and implement the already approved bounded process correction
after product priority. Do not open another verification framework effort or
claim that the 945-task count alone proves input usability.

## Approved follow-ups

`live-add-all-schema` can now start from this accepted repair and its recording
descendant under `docs/data-layer-live-add-all-schema-R01.md`.
`verification-registration-review-preflight` remains approved under
`docs/verification-registration-and-review-preflight-R01.md` and follows product
priority. Neither task requires repeat behavior approval.
