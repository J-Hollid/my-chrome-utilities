# Project observation sources architecture review R01

Task: `project-multiple-observation-sources`. Mode: feature integration.
Inbound: `20260908T160327Z_000016_from_refactorer`, claimed at
2026-09-08T16:04:14Z. Received candidate: `ec32f826f765941c26c3b3ed79010348f2bfd8b7`.
The review merges that candidate with QA `6fa4c97a0b341a680264f5bf660b2876c4d64f4a`.
This preserves the approved retrieval changes already on QA. The QA commit is
the base from which this role started the integration changes.

## Architecture result

The production changes implement the approved functional scope. Settings,
durable persistence, source subscriptions, event delivery, and feed presentation
have separate modules. Pure settings and coordination rules have direct tests.
The browser and repository adapters call these rules through narrow ports.
The source coordinator hides subscription generations and cursors. Captured
events retain source identity without exposing page hook state to the UI.

All four review phases passed: UI/core separation, dependency direction,
information hiding, and local quality. The review covered the production diff,
the acceptance handlers, test fixtures, registry changes, and generated assets.
The build reproduced the received delivery assets. No additional production
split was needed after the refactorer's extraction from the Capture controller.

## Review repairs

- Removed the two implemented observation features from the registry's planned
  list and regenerated the compiled registry. They remain executable features.
- Soft mutation exposed a scalar-input assertion gap. The product resolver
  mapped all non-missing values to the same scalar browser observation.
  The browser now reports its actual input value, and the resolver matches that
  value. A regression checks `17`, rejects `18`, and rejects a missing input.
- Updated language and acceptance mutation records with the pinned tools.

## Scorecard at the settled-tree boundary

| Check | Result |
|---|---|
| Production and architecture review | Passed all four phases |
| Build and TypeScript check | Passed; generated assets unchanged |
| Installed observation browser checks | All 14 groups passed |
| Repaired unavailable-source browser group | Passed with observed input values |
| Existing transport browser checks | Passed all nine transport cases and installed boundary |
| Acceptance baseline | 90 example runs passed across four features |
| Resolver regression | 2 tests, 36 assertions passed |
| Differential Clojure mutation | 40 selected mutants detected before repair; repaired form has no mutation sites |
| Clojure DRY | No duplicate candidates in changed scope |
| Soft acceptance mutation | 243 cases covered; no remaining survivors or errors after the repair |
| Complete feature-mode focused evidence | Must be bound to this exact commit before handoff |
| Terminal all-pack gates | Zero |

The mutation adapter uses fresh production browser observations and the real
acceptance handlers. It reuses completed model checks to avoid launching Chrome
for each mutant. This is assertion-quality evidence, not final delivery proof.
No pinned TypeScript mutation tool is configured. Clojure mutation does not
establish TypeScript mutation coverage.

Final focused duration, task selection, package proof, and result belong to the
runner receipt and the candidate's `swarmforge-review-ready` Git note. A QA-ready
handoff requires those records. This review does not authorize a master release.

## Process assessment

What worked: the extracted coordinator and browser ports allowed direct review
of ordering, isolation, disposal, and saved provenance. Real installed controls
and callbacks supplied runtime proof. Soft mutation found a concrete assertion
gap that the baseline did not detect.

Failures: an inline Clojure command failed because of command parsing; a small
runner file fixed it. The first Chrome run could not create its local socket in
the sandbox; a scoped approved run passed. Some reads returned too much output;
smaller reads completed the review. The registry merge retained stale planned
feature entries. These were corrected before final verification.

Refinement: keep exact input values in browser evidence, check registry lists
after merges, use runner files for Clojure commands, and keep review output
bounded. Continue feature integration after the exact focused gate passes.
No elapsed-time saving is claimed from discovery tools.
