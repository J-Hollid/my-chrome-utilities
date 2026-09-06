# Architecture module declaration ownership delivery

Task: `architecture-module-declaration-ownership`.
Specification base: `46ee8bd6540e4b3f2b2fe7d9fd8fbd7efa64dd61`.
Classification: verification tooling. Feature integration into QA only.

## Change

Canonical Git change discovery binds the base and candidate declaration data to
that exact change-set object. The planner uses the changed entries and contract
connections from both versions. Ordinary ownership, dependencies, and consumers
remain authoritative. The complete architecture checker still runs in the build.
The `architecture/` global rule remains unchanged. Shared policy changes retain
its coverage. Invalid declarations reject planning; missing evidence retains
conservative planning. Caller labels and copied change-set objects cannot narrow
coverage. The policy must exist in the base, and a range that edits planner policy
cannot use the new declaration treatment to narrow its own evidence.

The declaration graph visits each path once. Git children have five-second
limits. Checker tests copy the real source tree to a temporary worktree directory
and have twenty-second process limits. No nested aggregate or full-suite test
is added. The path-impact calculation was extracted from the large planner into
one focused module; the planner became smaller.

A path-only intent has no declaration content and remains conservative. Bounded
classification requires actual base and candidate repository evidence. This is
not permission to use a declaration-only label as future-change evidence.

## Direct checks

- All five declaration deltas and cyclic contract graphs pass.
- Canonical planner and readiness checks pass with small temporary Git fixtures.
- Current and base consumers, shared/mixed policy changes, invalid declarations,
  missing owners, missing base identity, and same-range policy protection pass.
- The unchanged complete checker accepts a new module in a real source copy and
  rejects invalid layer/runtime and import relationships.
- Existing ownership core, planner modularization, and Serena registration pass.
- The generated feature executes all eleven examples with the new handler.
  The dispatch regression also proves that failed behavior evidence rejects it.

## Process observations

The intent checks were bounded-ready for Shell and verification process. The
first intent command used a short Git id; the helper rejected it before planning.
The corrected command used the full specification id. No test ran in preflight.

The first generated acceptance probe exposed an inherited catch-all handler ahead
of the newly appended handler. Its success did not exercise the new behavior.
The new handler now precedes it. A direct dispatch regression failed before this
registration repair and passed after it. Generated acceptance then passed with
the actual behavior checks. No older acceptance assertion was removed.

Serena assessment: a symbol query was suitable for planner structure, but this
session did not expose its mandatory initial-instructions tool. Ordinary limited
reads were used. This report claims no Serena query or measured saving.

What went well: direct tests found both the original all-pack behavior and the
handler-order defect before review evidence. The resource limits held.
Process failure: appending the handler initially permitted a false acceptance
success. Recommendation: retain the dispatch/failure regression and one-worker
review verification. Focused review and package evidence remain required before
handoff. Master integration remains a later release obligation.

The first review prelaunch rejected the older Phase 2 session destination digest
before any task or receipt started. Canonical derivation showed only the new
feature's generated-test/IR pair and target had been added. The existing
succession destination was updated to that derived identity. The prior identity,
source receipt, source lineage, and incident boundary remain unchanged. Direct
succession tests passed. This is registration metadata for this feature, not a
new incident, successor policy, or evidence waiver.

The authorized one-worker review then passed 29 tasks and stopped at
`unit:test/verification-pack-cardinality-contract-test.mjs`. Its exact handler
inventory did not contain the newly activated declaration handler. Incident
`f9719a44-373a-479d-8427-3f8ea17a4cde` retains that failed run. The repair family is
architecture acceptance registration: handler order, derived session identity,
and this exact inventory. Discovery found no additional defect in that boundary.
The inventory was extracted from the large cardinality test into a small shared
fixture. The original exact assertion remains. The dispatch regression evaluates
the original array in a one-second VM, reproduces its rejection, and proves that
the current inventory adds only the new first handler and rejects an extra row.
Both direct tests pass. Fresh governed repair and review evidence are required.

The first governed repair passed its executable checks but did not become
eligible: the new regression lacked the required causal protocol record. The
regression now emits that record from its observed old/current/extra-row results,
bound to the runner-supplied incident and diagnosed boundary. No repair success
was recorded from the incomplete attempt. This protocol omission was a coder
error; use the existing causal-report convention when adding governed regressions.

The next fresh review exposed the exact-slice consumer assertion. Incident
`37f3354b-fae2-45b7-86c6-7f7801d00c95` binds the parent-only Shell consumer error.
This is the same acceptance-registration family. The declaration slice now names
Shell's explicit `architecture_validation` slice, backed by the existing modular
architecture test. It does not map the architecture declaration file itself:
unproved declaration changes retain every Shell task and the global rule.
The new regression executes the existing consumer assertion against the failed
and repaired registries in a one-second VM. It also proves complete exact Shell
task conservation and unchanged global-impact declarations. Direct regression
and exact-slice tests pass. The regression includes its native causal report.

## Architecture review

The architect reviewed the complete task diff from specification `46ee8bd6`
through received candidate `5652e7919c`. All four phases passed: IO is confined
in the Git adapter, comparison and planning are separate, repository evidence
is private and bound to the exact object, and the extracted path-impact module
retains the previous behavior. The large planner became smaller. Tests remain
separate from calculation helpers. No extension behavior or later stage entered
this task. The unchanged global rule, full checker, current/base union, and
complete Shell fallback remain present. Generated registry bytes match the
source manifests. The incoming review record passed 205 focused tasks.

The differential Clojure mutation run detected 20 of 21 covered mutations.
The survivor revealed a dispatch-test gap: the test supplied an already-active
world instead of checking the state produced by each previous step. The revised
registration test executes each real step and requires the declaration handler
at every transition. A focused rerun detected the remaining mutation. Combined
coverage is 21/21 detected, with no uncovered site. The pinned tool wrote the
manifest. DRY analysis found no duplicate candidate in the changed handler.
No JavaScript mutation tool is pinned, and Clojure tools were not used as a
substitute. No feature contract changed in this task range, so Gherkin mutation
was not applicable. The existing eleven feature executions passed directly.

Serena was neutral: the required instruction tool remains unavailable in this
session. No query, setup, download, or measured saving is claimed.
What went well: mutation testing found the state-transition coverage gap before
forwarding. What failed: static handler selection alone did not prove live
selection after the first step. Keep the real step-by-step dispatch check.
The architect delta requires fresh focused evidence before the QA-ready handoff.
