# QA-pilot verification latency correction R01

## Status and authority

The user requested this correction after the QA-integrated Flow Section context
menu took 69 minutes 17 seconds to become QA-ready and approved this
specification and its first slice on 2026-08-12. This program refines the active
QA-branch release pilot. It does not reactivate VTD-018, weaken focused or
terminal coverage, authorize a master promotion, or change product behavior.

During the first slice, incident `95d58b02-80ca-460f-973c-bafe121c29d6`
exposed a second all-pack route: the reliability handoff gate required terminal
incident resolution even though the causal fixture repair, exact focused plan,
and package passed. The user approved a mode-aware correction on 2026-08-12.
The incident must not be abandoned or resolved in QA and no all-20 checkpoint is
authorized there.

Each slice is independently reviewable and revertible. Slice 1 and its
carry-forward prerequisite are QA-integrated at `71eaad11af` and `db98b161cd`.
Slice 2 is QA-integrated at `e32f9f7c10`. After reviewing the remaining value and
risk, the user closed this correction program after Slice 2 on 2026-08-13.
Slices 3 and 4 are deferred evidence-triggered backlog items; neither has coder
handoff authority.

## Observed baseline

The Flow Section context-menu product implementation committed 10 minutes 13
seconds after approval, and its first passing Flow check completed after 11
minutes 49 seconds. QA-ready status took 69 minutes 17 seconds.

Three verification failures exposed generated-source coupling, a 65535-byte
WebSocket framing limit, and focus observation after the context menu moved
focus. Their repairs then exposed off-lineage incident selection in the shared
runner. Changing that runner selected all 20 packs and 842 fresh tasks for a
16-minute-48-second non-terminal focused receipt. Architect review also ran the
same final post-mutation Flow plan twice before recording evidence.

## Outcomes

- A product slice never begins an all-20 plan because of an incidental shared
  verification repair. It stops before launch without omitting owned packs.
- A causally repaired QA reliability incident can advance with durable
  terminal-verification-deferred state; only master integration resolves it.
- Flow verification checks observe structured results rather than generated
  source spelling, local names, or statement order.
- DevTools framing handles standard payload boundaries through independently
  decoded structured and property proof. Browser-program segmentation is
  deferred until evidence shows the remaining monolith causes material cost.
- Unchanged-tree duplicate architect runs remain scorecard telemetry. Automated
  consolidation is deferred until recurrence shows material cost.
- Every existing assertion leaf, logical target identity, incident obligation,
  package check, and master-only terminal gate remains intact.

## Slice 1: focused-scope fan-out stop

Before launching review-ready verification, preflight compares the exact planned
packs with the specification's approved focused scope. A product candidate that
selects all 20 packs because it gained an incidental shared verification-runner
repair is not executed. The diagnostic names the expansion-causing paths, exact
packs, task count, critical-path estimate, elapsed time, and remaining ceiling.

The operator may restore the product-only candidate. If the product cannot be
verified without the shared repair, it remains stopped while a standalone
infrastructure slice is specified, approved, integrated into QA, and used as the
new product base. No override may call an all-20 feature-mode run focused, omit
owned packs, or claim terminal evidence.

The same feature-mode boundary applies to the reliability incident gate. After
an incident has an eligible causal repair, deterministic regression, exact
focused review-ready evidence, and passing package proof on one candidate, the
gate records `terminal-verification-deferred`. This permits the current
candidate's remaining focused reviews and QA integration. It preserves the
unresolved incident and active lineage without calling either the failure or
repair terminally proven.

Later independently approved QA slices may inherit that disposition without
rerunning its focused tasks when changed-path conservation proves that none of
its failure, repair, regression, focused-plan, runner-semantic, or evidence
inputs changed. A specification-only handoff may start such a slice from current
QA. Its final candidate still needs its own approved focused evidence and package
proof. A relevant change invalidates carry-forward and requires fresh
incident-focused proof on that exact candidate.

Activation of approved Slice 2 exposed that the integrated gate still allowed
only the exact Slice 1 candidate, so its ordinary specification handoff could not
start from the next QA descendant. Modular verification packs 152 is a separate
Slice 1 prerequisite correction, not part of the Flow proof-hardening change.
Its timing expectation was 30 minutes from coder receipt, with a 15-minute
checkpoint proving that a specification-only descendant starts, a conserved
independent descendant reaches QA-ready, and a relevant incident-input change
remains blocked pending fresh proof. The elapsed correction is reported
separately and does not consume or reset Slice 2's 45-minute expectation.

The carry-forward prerequisite is QA-integrated at `db98b161cd`. Slice 2 starts
from that corrected QA base; its 45-minute clock begins when the coder receives
the `qa-pilot-flow-proof-hardening` handoff.

The frozen QA release candidate may later pass such incidents to the architect.
The one master-integration all-20 checkpoint resolves every matching deferred
incident on its sealed tree and supplies final-ready evidence. A second all-20
run is not required. Unrepaired, failing, stale, or identity-mismatched evidence
continues to block every handoff for which it is insufficient.

Acceptance authority is Settled candidate final verification 011 and 013 plus
Modular verification packs 150, 151, and 152. The exact checkpoint is:

```sh
node scripts/run-focused-acceptance.mjs --pack shell \
  --focused-task unit:test/settled-final-verification-workflow-test.mjs \
  --focused-task unit:test/verification-process-contract-test.mjs
node scripts/package.mjs
```

The implementation-and-review expectation is 60 minutes from coder receipt to
an architect QA-ready candidate. By 30 minutes, deterministic preflight fixtures
must prove both an authorized `flow_graph` plan and a blocked all-20 expansion
without launching a task. Variance is reported under the pilot's non-blocking
timing policy.

The approved mode-aware correction has a separately reported 45-minute
expectation from renewed coder receipt and a 20-minute halfway checkpoint. By
halfway, a fixture must prove that valid focused incident proof permits QA
routing while final-ready remains blocked, and that the release-candidate route
remains open. This correction interval does not reset or hide the original slice
elapsed time.

## Slice 2: structured Flow verification proofs

Status: QA-integrated at `e32f9f7c10`.

Replace the context-menu repair's generated-source regular expressions with
structured helper or planner results and causal fixtures. Harmless formatting,
local renaming, or independent setup reordering passes; semantic changes to
target selection, Section actions, focus transition, or frame encoding fail with
bounded structured diagnostics.

Acceptance authority is Modular verification packs 149. The exact checkpoint is:

```sh
node scripts/run-focused-acceptance.mjs --pack flow_graph
node scripts/package.mjs
```

The expectation was 45 minutes with a 20-minute checkpoint. QA-ready status took
74 minutes 47 seconds. The first passing Flow candidate arrived after about 8
minutes 32 seconds; later review found disconnected target selection,
self-decoded framing, a self-derived Section-action oracle, and missing boundary
property proof. The final exact `flow_graph` run passed 18 tasks in about 72
seconds, the distinct Shell process-contract repair check passed in about 3
minutes, package passed, and no all-20 run occurred.

## Slice 3: bounded Flow browser programs

Status: deferred on 2026-08-13. Reconsider only after another payload or
transport incident, repeated diagnosis cost attributable to the monolithic
program, or continued growth that establishes a concrete segmentation benefit.

Retain `FLOW_WORKSPACE_AUTHORING_TARGET` and its session and evidence identity,
but transmit its installed workflow as ordered evaluation segments. Each segment
declares dependencies and assigned leaves and is at most 60000 bytes. Standard
WebSocket client framing round-trips exact payloads across 125, 126, 65535,
65536, and 66257 bytes. The original authoring evidence union still executes
exactly once.

Acceptance authority is Modular browser runtime adapters 017 and 018. The exact
checkpoint is:

```sh
node scripts/run-focused-acceptance.mjs --pack flow_graph \
  --focused-task unit:test/verification-process-contract-test.mjs
node scripts/package.mjs
```

If reactivated, the expectation is 90 minutes with a 45-minute checkpoint.

## Slice 4: one final review-ready run

Status: deferred on 2026-08-13. Reconsider when unchanged-tree duplication
recurs often enough that its measured focused runtime materially exceeds the
cost and risk of changing shared evidence infrastructure.

After the architect's last candidate change, one evidence-producing focused
invocation verifies the exact tree and supplies the receipt recorded as
review-ready evidence. The workflow does not require an ordinary preliminary
invocation of the identical plan on the same tree. Any later behavior-bearing or
mutation-metadata change requires one new evidence-producing invocation.

Acceptance authority is Settled candidate final verification 012. The exact
checkpoint is:

```sh
node scripts/run-focused-acceptance.mjs --pack shell \
  --focused-task unit:test/settled-final-verification-workflow-test.mjs \
  --focused-task unit:test/verification-process-contract-test.mjs
node scripts/package.mjs
```

If reactivated, the expectation is 60 minutes with a 30-minute checkpoint.

## Scorecards and stopping rules

Every slice reports approval-to-QA time, role intervals, focused wall time,
failures, repairs, reruns, selected packs and tasks, and QA queue time. It also
reports terminal attempts as zero during feature integration and preserves the
exact review-ready note and package receipt.

Timing expectations surface variance; they do not automatically stop safe,
bounded work. Pause when scope expands, requirements need reinterpretation,
failures repeat without a causal explanation, no credible completion path
remains, or a hard safety boundary needs new authority. An all-20 feature-mode
run, product-behavior change, or VTD-018 reactivation remains a hard stop.

For the next three ordinary QA product cycles, report time to first passing
candidate, review and repair time, focused verification time, unchanged-tree
duplicates, unexpected scope expansion, and avoidable versus incidental
failures. Reassess Slices 3 and 4 only from that evidence. Also monitor the size
and processing cost of the recursively retained deferred-incident evidence
chain; do not open another shared-workflow correction unless it has measurable
handoff impact.
