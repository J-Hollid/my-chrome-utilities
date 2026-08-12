# QA-pilot verification latency correction R01

## Status and authority

The user requested this correction after the QA-integrated Flow Section context
menu took 69 minutes 17 seconds to become QA-ready and approved this
specification and its first slice on 2026-08-12. This program refines the active
QA-branch release pilot. It does not reactivate VTD-018, weaken focused or
terminal coverage, authorize a master promotion, or change product behavior.

Each slice is independently reviewable and revertible. The first slice is
authorized for coder handoff. A later slice requires its own approval after the
preceding slice's QA scorecard is reviewed.

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
- Flow verification checks observe structured results rather than generated
  source spelling, local names, or statement order.
- DevTools framing handles standard payload boundaries, while the Flow authoring
  program is sent as deterministic segments of at most 60000 bytes.
- The architect performs one evidence-producing focused run after the last
  candidate change instead of a preliminary duplicate on the same tree.
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

Acceptance authority is Settled candidate final verification 011. The exact
checkpoint is:

```sh
node scripts/run-focused-acceptance.mjs --pack shell \
  --focused-task unit:test/settled-final-verification-workflow-test.mjs \
  --focused-task unit:test/verification-process-contract-test.mjs
node scripts/package.mjs
```

The implementation-and-review ceiling is 60 minutes from coder receipt to an
architect QA-ready candidate. By 30 minutes, deterministic preflight fixtures
must prove both an authorized `flow_graph` plan and a blocked all-20 expansion
without launching a task. Reaching the ceiling stops the slice for a user
decision.

## Slice 2: structured Flow verification proofs

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

The ceiling is 45 minutes. By 20 minutes, one former source-shape assertion must
pass after a harmless source transformation and fail after its semantic value is
changed. Reaching the ceiling stops the slice for a user decision.

## Slice 3: bounded Flow browser programs

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

The ceiling is 90 minutes. By 45 minutes, framing boundary tests must pass and
the Section-authoring segment must run independently below 60000 bytes with its
original evidence leaves. Reaching the ceiling stops the slice for a user
decision.

## Slice 4: one final review-ready run

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

The ceiling is 60 minutes. By 30 minutes, a fixture must show that the final
post-change tree runs its focused plan once, records its receipt, and invalidates
that evidence after a later change. Reaching the ceiling stops the slice for a
user decision.

## Scorecards and stopping rules

Every slice reports approval-to-QA time, role intervals, focused wall time,
failures, repairs, reruns, selected packs and tasks, and QA queue time. It also
reports terminal attempts as zero during feature integration and preserves the
exact review-ready note and package receipt.

Continue to the next slice only if the current slice meets its stated behavior
without weakening evidence or silently widening scope. Adjust if a correction
moves cost into another shared path or adds more verification time than it
removes. Stop if it needs an all-20 feature-mode run, changes product behavior,
reopens VTD-018, or cannot deliver within its ceiling without a new user choice.
