# SwarmForge verification defect census and consolidated repair R01

Status: user-approved on 2026-08-29; implementation candidate `3a98215a75` is
parked after independent whole-delta review found four same-family blockers

## Outcome

SwarmForge must collect the complete bounded defect set before it authorizes a
verification repair. A first observed failure is a diagnosis input, not repair
scope. One causal family receives one census, one stable repair task, and one
fresh final evidence cycle. Discovering another defect in that family reopens
the census; it never creates another nested repair task.

This closes the failure mode in which an approved product remains parked while
successive repair candidates expose cross-base, cross-lineage, empty-population,
registry-authority, history, migration, succession, property-selection, and
acceptance-routing defects one at a time. Those defects may be real, but the
process must inventory and group their causal families before implementation.

## Complete and bounded

“Collect all defects” means complete within the exact authorized boundary, not
an all-repository or all-runnable-pack search. The census covers:

- every failure produced by the candidate's complete authorized diagnostic
  plan while independent tasks continue safely;
- every task skipped because a failed dependency prevents execution, with the
  exact dependency recorded;
- the failed owner's supported input and state classes, including empty,
  singleton, multiple, historical, current, missing, ambiguous, and mismatched
  cases when that owner supports them; and
- every direct consumer and persisted or generated projection of the invariant
  being repaired.

The state matrix comes from registered schemas, contracts, and current direct
consumers. It does not promise to predict unknowable future behavior. An unknown
cause, unenumerated supported state, or unresolved dependency keeps the census
open. Diagnostic collection creates no review-ready evidence, incident
transition, retry-based pass, satisfaction record, product resumption, or
all-runnable-pack authority.

## Immutable census

One digest-bound census records:

- exact product or preparation task, candidate commit and tree, QA base, plan
  digest, selected tasks, and repair-family identity;
- the causal owner, invariant, state model, direct consumers, persisted and
  generated projections, and boundary generation;
- every observed failure, independent pass, dependency skip, synthetic state
  result, and direct-consumer result;
- for every entry, one disposition: `in-family-defect`,
  `distinct-nonblocking-defect`, `proved-nondefect`, or
  `proved-out-of-boundary`; and
- the stable consolidated repair task, ordered repair groups, closure status,
  append-only reopen history, and final evidence identity.

A free-form handoff body cannot substitute for this record. A distinct defect
must have evidence that its owner and invariant are independent; renaming the
incident, task, pack, state, digest, or failure text does not create a distinct
family.

## Consolidated repair lifecycle

1. Record the first blocking failure and run the bounded census before drafting
   repair authority.
2. Classify the complete census. Repair cannot start while an entry is unknown
   or dependency-skipped without a resolved prerequisite.
3. Bind every `in-family-defect` to one stable repair task. Coherent groups may
   be separate commits so they remain understandable and revertible.
4. Run direct red/green checks for every group, then one fresh evidence cycle
   covering the complete family, its state matrix, and direct consumers.
5. If another same-family failure appears before QA integration, append it,
   reopen the census, retain the unintegrated candidate, and continue the same
   task. Do not send another repair unblocker.
6. Architect `qa-ready` and specifier integration require the exact closed
   census and evidence. After QA integration, automatic resumption reissues the
   conserved product once.

A genuinely distinct repair may receive its own durable route only after the
census proves the separation. If it materially expands product behavior,
external risk, authority, global cost, or safety scope, request the exact user
decision instead of nesting work.

## Machine gates

The process implementation must fail closed at these boundaries:

- repair handoff and `unblocker_send.sh`: reject missing, open, stale,
  candidate-mismatched, body-only, or single-symptom census authority;
- repair resumption: reject a different stable repair task for the same family
  and generation;
- `review-ready` and `qa-ready`: reject an open entry, unresolved dependency
  skip, untested supported state or direct consumer, or same-family defect parked
  in another candidate or remainder;
- QA integration and campsite satisfaction: reject partial repair ancestry and
  require the closed census's exact candidate, tree, evidence, and QA base; and
- later recurrence: reopen the existing census identity rather than increasing
  repair nesting depth.

The helpers must derive these decisions from structured fields and immutable
records. Agent prose can explain a result but cannot create census authority,
close an entry, split a family, or waive a consumer.

## Whole-delta review correction

Independent review of the first complete implementation candidate gathered four
defects before QA or downstream product resumption. They remain in the same
stable task and must be repaired and proved together.

### Dependency-ready diagnostic collection

Plan serialization order is not execution authority. Collection validates the
complete selected dependency graph before launching a task, rejects a cycle or
missing selected dependency before execution, and uses deterministic
dependency-ready topological waves. Lexical ordering applies only among tasks
ready in the same wave. A dependent whose passing prerequisite sorts after it
must wait and then execute; it cannot be recorded as skipped. A failed or
dependency-skipped prerequisite skips only its transitive dependants with the
exact blocking identities, while independent tasks continue.

### Distinct-family proof identity

An entry classified `distinct-nonblocking-defect` has an owner and invariant
that both differ from the active census family. Its proof must bind exactly that
entry owner and invariant, not a third identity and not the active family. The
same relation is required during entry normalization, census closing, stored
validation, and later admission. A missing proof or any entry/proof mismatch
keeps the census open.

### Exact lifecycle history

History begins exactly once at generation zero with `created`, open status, and
no previous digest. Each successor generation is exactly the prior generation
plus one and binds the immediately prior census digest. `closed` transitions an
open classified census to closed; `reopened` transitions a closed census to open
and names non-empty appended same-family entries; `evidence-bound` retains a
closed census and binds its exact final evidence. Repeated or skipped
generations, a missing or wrong previous digest, an impossible event/status
pair, rewritten prior entries, or terminal history that disagrees with current
status or evidence is rejected during normalization, storage, recovery, and
validation.

### Structured repair intent

Whether an unblocker requests verification repair is determined from its
canonical structured intent before census headers or free-form body are
considered. Repair intent requires both the exact closed census digest and its
stable repair task; neither header may be omitted, and body text cannot supply
either. An ordinary non-repair unblocker with no repair intent continues through
the existing authority checks without acquiring census requirements. Missing,
partial, body-only, stale, or mismatched repair authority is rejected before
queue state changes.

## Current Event Library recovery

The Event Library target-page callback fix remains the conserved product
remainder. After QA integration of the already-reviewed combined
task-succession/property repair, no further single-defect unblocker is allowed.
Before another verification repair begins, the remaining stopped routing,
campsite, aggregate, nested-checkpoint, registry, and evidence states receive
one bounded census and consolidated disposition. The original Event Library
product resumes once from the resulting exact QA head.

This correction does not authorize an all-runnable-pack feature run, weaken a
failure, delete an incident, reuse a failed receipt, or represent an unexecuted
task as passing.

## Acceptance and focused verification

Acceptance authority is scenarios 025–034 in
`features/swarmforge-outcome-bounded-autonomy-and-unblockers.feature`.

Implementation starts from the exact current QA head. Read-only intent and
changed-path planning are authoritative. Begin with `shell` and
`verification_process`; include properties, the autonomy process contract,
repair/unblocker helper contracts, census persistence and crash recovery,
review/QA admission gates, generated acceptance, and package proof. Do not run
an all-runnable-pack feature checkpoint.
