# QA verification pack taxonomy evolution R01

Status: user-approved specification decision recorded on 2026-08-20;
implementation and the first topology migrations await an explicit coder handoff

Prepared: 2026-08-20

Stable implementation task: `registry-derived-verification-packs`

## Decision

Verification-pack cardinality is derived from the runnable entries in
`verification/packs.json`. Twenty is the current runnable count, not an
architectural constant, target, ceiling, or floor. The terminal safety contract
is **all runnable packs from the exact candidate registry**, with properties and
package proof, regardless of how many runnable packs that registry contains.

This decision supersedes only the fixed-cardinality language in the current QA
verification, final-gate, and feature-workflow programs. Historical receipts and
scorecards that say `all-20` continue to describe the exact twenty-pack registry
they executed. They do not constrain a later registry to twenty runnable packs.

The existing subordinate-slice ratchet remains valid, but a reviewed topology
migration may promote a proved slice or other stable boundary into a top-level
pack. Promotion changes organization and selection granularity without removing
an assertion or weakening exact-pack, terminal, packaging, persistence,
security, or migration meaning.

## Audit evidence

At QA `43c019bb`, the registry contains 21 pack definitions and 20 runnable
packs. `selective_profile_inheritance` is a non-runnable empty definition. The
20 runnable packs contain 885 direct task identities; the smallest contains 5,
the median contains 15, and the largest contains 287.

The current slice portfolio contains 17 slices across 9 runnable packs and maps
27 unique direct task identities. `schemas` contains 287 direct task identities
and one two-task slice. `capture` contains 170 direct task identities and no
slice. Current slices map unit, browser-observation, and checkpoint tasks, but no
acceptance or property task. Pack selection is therefore deterministic, while
the present top-level taxonomy and slice coverage do not yet provide consistent
granularity.

First-parent registry history also shows that cardinality was once allowed to
follow product structure: it grew from 8 runnable packs on 2026-07-17 to 20 on
2026-07-31. On 2026-08-02, selective-profile behavior moved into
`layered_schema`, leaving the old id empty and reducing the runnable count to 19;
`property_set_flow_sections` then restored the count to 20. The later policy
froze that incidental count rather than deriving it from the registry.

## Pack, slice, and remainder criteria

A reviewed boundary is eligible for promotion to a top-level pack only when the
evidence establishes all of the following:

1. It is an independently nameable product or verification capability with a
   stable observable outcome.
2. It has exact source or explicitly classified verification-only ownership,
   direct task identities, dependencies, consumers, and a representative path.
3. It can be selected and executed independently without silently requiring the
   unrelated remainder of its former parent.
4. Real feature evidence shows that the parent repeatedly contributes complete
   unrelated task families, or that an indivisible pack-level task such as an
   acceptance session prevents safe slice-level selection.
5. Current and historical ownership can conserve every former source path,
   assertion, task, prerequisite, consumer, reliability boundary, browser
   observation, performance obligation, and package input exactly once.

A boundary remains a subordinate slice when it is an internal seam, shared
component, adapter, or verification support boundary whose behavior is meaningful
only within its parent or declared consumers. The conservative parent remainder
continues to own every path and task that has no proved narrower mapping.

Pack size, task count, elapsed time, source count, forecast variance, or an
attempt to reach a preferred cardinality never decides promotion by itself. When
semantic independence or conservation cannot be proved, record a durable
observation or parent fallback and retain the existing pack.

## Topology migration contract

An approved addition, split, promotion, merge, rename, or retirement is one
atomic registry migration:

- the current registry has unique runnable ids and exact ownership;
- the old and new closures conserve every registered task and terminal
  obligation exactly once;
- compatible historical changed-path planning uses the union of old and new
  ownership so a migration cannot narrow candidate evidence;
- every new or retained dependency and consumer edge is explicit and acyclic;
- exact-pack selectors, timing budgets, calibration, reporting, evidence
  receipts, reliability closure, and terminal planning derive their expected
  pack set and count from the same exact registry identity;
- adding a runnable pack makes it required by the terminal plan without a code
  change to another numerical constant; and
- removing a runnable pack is permitted only after its behavior and tasks are
  explicitly transferred or removed under separate product authority.

An empty compatibility identity is not runnable and does not contribute to
cardinality. If historical identity translation remains necessary, declare it
as migration metadata rather than presenting it as a current capability. A
source-less runnable pack must explicitly declare that it is a
verification-only behavior pack and name the production owner it observes.

## Initial taxonomy portfolio

This specification authorizes assessment, not immediate splitting, for these
boundaries:

| Boundary | Initial disposition | Evidence to seek |
|---|---|---|
| `schemas` | selected for a bounded topology assessment | Independently executable schema core, validation, guided workflow, and specification-builder closures; especially acceptance-session separation |
| `capture` | selected for a bounded topology assessment | Independent live observation, saved-session/recovery, and event-feed closures |
| `selective_profile_inheritance` | selected for explicit disposition | Retire the empty compatibility identity or restore a genuinely independent runnable boundary |
| `project_assurance_severity` | selected for classification | Declare a verification-only pack with its observed production owner or move its evidence to a coherent source-owning boundary |
| `shell` | carried as a cross-cutting parent | Prefer reviewed slices unless a future boundary proves independent terminal and consumer semantics |

Each assessment is a separate task. No row pre-approves a registry change, and
no implementation may batch unrelated product refactoring into the cardinality
correction.

## Development focus and QA impact

The first implementation changes cardinality mechanics only. It must remove
fixed-count validation while leaving the current registry topology and all
twenty current runnable closures unchanged. Likely existing shared integration
surfaces are:

- `scripts/verification-packs.mjs`;
- `scripts/report-verification-throughput.mjs`;
- `scripts/verification-reliability-closure.mjs`;
- the settled final-verification workflow and evidence contracts;
- performance calibration and process-contract tests; and
- `features/modular-verification-packs.feature` and
  `features/settled-candidate-final-verification.feature`.

The proposed new source prefix is
`scripts/verification-pack-cardinality/`, owned by parent pack `shell` under
proposed subordinate slice `verification_pack_cardinality_contract`. Its exact
consumers are every runnable pack in the evaluated registry because terminal
closure, calibration, and evidence reporting consume the same derived set. The
implementation may instead prove a narrower behavior-preserving seam during
read-only intent, but it may not omit a real consumer or widen product scope.

Before coding, run read-only ownership intent against the current QA base and
include every exact existing path above. A `coarse-boundary` result stops the
implementation before mutation and routes an independently reviewed ownership-
preparation task. A bounded `granularity-assessment-required` result receives
structured judgment and a durable seam-or-parent-fallback disposition. Neither
route authorizes a feature-mode all-runnable-pack gate.

Focused review must prove at least two synthetic compatible registries with
different runnable cardinalities, including a newly added runnable pack and an
empty non-runnable compatibility identity. It must prove dynamic calibration,
terminal closure, receipts, failure behavior, exact current/historical
ownership, unchanged current twenty-pack task closure, and package proof. The
single complete all-runnable-pack gate remains exclusive to an explicitly
requested master integration.
