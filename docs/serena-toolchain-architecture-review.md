# Serena preparation architecture review

Task: `verification-slice-serena-development-pilot`.
Received candidate: `230dfd5fc0cc9046c5b59d993f75e1fe793a8458`.
Approved specification: `f338e511090712038e2f789a927a1514293e8000`,
with calibration clarification `9ca0284109`.
Architect review started on 2026-09-05 at 18:42 UTC.

This is a tooling-only preparation. It does not enable Serena or change the
extension. The original pilot must wait for QA integration of reviewed
preparation evidence.

The complete task change was reviewed in all four architecture phases.
Pin validation is separate from file access, provider dispatch, and the CLI.
The dispatch code calls explicit local providers; pin data cannot name commands
or import paths. Small modules preserve the dependency direction. Test fixtures
are separate from test cases. Calibration tests share authored inputs instead
of loading temporary measurement files.

The core checker and root lock retain their specification bytes and global
ownership. Both original causal paths have explicit optional-boundary
dispositions. The new slice retains worker-control consumers, historical
selection, properties, quarantine fallback, and the preparation review rule.
The pilot contracts remain planned features. No current product ownership was
narrowed. Historical calibration values and the valid retirement identity are
retained; six unavailable sources cannot become fresh measurement evidence.

The received candidate has valid evidence for 179 focused tasks. Architecture
quality checks killed all 15 Clojure mutations: four in the Serena handler and
eleven in the calibration handler. Soft Gherkin mutation killed all 72 mutants:
42 Serena examples and 30 calibration examples. The pinned DRY check found no
duplicate forms. The strict runtime check passed. The mutation tools wrote the
records committed with this report; no mutation record was edited by hand.

The final candidate still needs its exact focused evidence and package proof
before the QA-ready handoff. The durable review note records that result and
its times. No all-runnable-pack checkpoint is authorized for this preparation.

The small tool boundary and direct handler-selection checks worked. Earlier
development failed at historical temporary-input dependencies, fixed inventory
counts, split JSON observations, and general handlers selected before feature
handlers. Those failures and repairs remain in the candidate history. Check
registered handler selection for every new feature before recording evidence,
and complete mutation checks before the settled evidence run. No Serena setup,
runtime, or token saving is claimed.

The architect evidence run at `aa51def7f5` exposed one missing prerequisite in
the narrower preparation plan. The settled-verification stylesheet scenario
requires `registry-style-boundary-contract-test.mjs`, but the evidence-promotion
slice did not select it. All other commands loaded by the scenario's process
evidence helpers had passed. Incident `a9a05e9e-8e8f-4f92-ae44-888b2afcf17d`
retains the failed acceptance session. The package and other checks passed;
evidence promotion was cancelled because acceptance had failed.

Repair family: `settled-acceptance-prerequisite-closure`. Boundary:
the preparation's evidence-promotion consumer. Bounded discovery is complete;
the observed defect list contains the missing stylesheet prerequisite only.
The manifest now declares that prerequisite. The existing ownership test uses
the production planner with the failed registry and current registry to prove
the missing-to-present transition. It failed before the repair and passed after
it. No task, assertion, or runtime behavior was removed. Governed repair proof
and a fresh exact evidence run are required before forwarding this candidate.
