# Portability baseline evidence: QA result

Task: `portability-baseline-evidence` (verification tooling only).
QA accepted candidate: `b8ba361b37084d2d4f13c4407723d20049237f67`.
Approved base: `ac6b14759d94813e7cfc50f1122d4a5cdf3e819b`.
Architect handoff: `20260920T071056Z_000941_from_architect`, qa-ready.

## Specification checks

The architect accepted the implementation and its causal repairs. The
specifier validated exact review-ready evidence before QA fast-forward and
again with the integrated validator. This is QA integration, not master
promotion or final regression proof.

The retained declaration `8fea2c4f37ca407a627263094653c77bd533cf98`, product
`35c35fc3aff4d377f5e643d73ca974793aab93c4`, and their earlier evidence remain
unchanged. No old incomplete receipt was promoted.

## Runtime evidence and scorecard

| Item | Result |
|---|---|
| Exact selected task results | 648 passed out of 648 |
| Selected packs | 13 |
| Property tasks within that total | 37 passed |
| Final package check | Passed |
| Architecture review | Accepted |
| Architect Clojure mutation report | 3 of 3 mutants killed |
| Architect DRY report | One small nonblocking wrapper duplicate |
| Final all-pack gate | Not run; remains a master obligation |

Receipt: `tmp/verification-receipts/4054442-877e90d1-c157-4ef3-bc7a-69af3925cb47.json`.
SHA-256: `4e50af7b5a3bd952930e557a61cd955512df38eb32ce2ff2a899affcb708131a`.
Exact focused run: 2026-09-20 06:35:52.975Z to 06:57:54.487Z,
22 minutes 1.512 seconds. Evidence recorded at 06:58:51.469Z.
The Git verification note preserves the exact candidate, base, plan, and results.

Approval commit time was 2026-09-19 09:35:30Z; architect QA-ready handoff time
was 2026-09-20 07:10:56Z: 21 hours 35 minutes 26 seconds. This exceeds the
90-minute target. That interval includes repairs and waits; it is not active
coding time. Separate role work time and total failed-run counts have not been
established here. No new verification run was started by the specifier.

## Process result and next step

What went well: the final failure identity preserves the legacy fingerprint
contract, and the exact candidate passed review and package verification.

Where the process failed: repairs expanded to 61 paths and 13 packs; the
90-minute target was missed. A direct contract created a synthetic incident
because it used an invalid run intent. Its exact association was abandoned
through the existing helper, preserving its failure record. The older QA
validator could not read a historical transition that the reviewed repair
handles. Direct note reads also produced excessive output; summary extraction
and the evidence validator were used afterward.

Recommendation: adjust. Resume the retained declaration using the accepted
tooling; do not start another enabling stage. Use the canonical exact plan and
new evidence. Preserve every existing terminal obligation. If authentication
cannot prove the baseline finding, report that exact gate without inventing
proof or repeating an unchanged failed full run.
