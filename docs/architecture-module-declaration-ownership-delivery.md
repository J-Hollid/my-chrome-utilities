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
