# SwarmForge verification defect census and consolidated repair R01

Status: user-approved on 2026-08-29; census
`0f535b736aa7ebe018c8df856d26ee3ab389600d9b07cafa5df07a133f105076`
is closed at generation 36 after complete nested-capability, synthetic-receipt,
recursive helper-inventory, and replacement-specification succession; the first
combined evidence attempt stopped before task launch on an immutable
pre-succession incident, and every partial implementation and failed receipt
remains parked

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

- exact product or preparation task, immutable origin candidate and QA base,
  current received implementation/evidence base, plan digest, selected tasks,
  and repair-family identity;
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

The origin candidate and QA base remain identity inputs for the lifetime of the
census. The current received base is a separately derived authority head. It
initially equals the origin candidate and may advance only through the
append-only replacement-specification succession defined below. Advancing that
head never changes the census identity, family, entries, stable repair task, or
prior generations.

## Consolidated repair lifecycle

1. Record the first blocking failure and run the bounded census before drafting
   repair authority.
2. Classify the complete census. Repair cannot start while an entry is unknown
   or dependency-skipped without a resolved prerequisite.
3. Bind every `in-family-defect` to one stable repair task. Coherent groups may
   be separate commits so they remain understandable and revertible.
4. If a later approved specification replaces the received base, append one
   exact succession generation before reconstruction or evidence.
5. Run direct red/green checks for every group, then one fresh evidence cycle
   covering the complete family, its state matrix, and direct consumers.
6. If another same-family failure appears before QA integration, append it,
   reopen the census, retain the unintegrated candidate, and continue the same
   task. Do not send another repair unblocker.
7. Architect `qa-ready` and specifier integration require the exact closed
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
- reconstruction and evidence planning: require the current received base and
  reject a candidate that omits or reverses the latest replacement
  specification;
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
closed census and binds its exact final evidence; and `specification-succeeded`
retains a closed census while advancing its received base through the exact
replacement binding below. Repeated or skipped generations, a missing or wrong
previous digest, an impossible event/status pair, rewritten prior entries, or
terminal history that disagrees with current status, authority base, or evidence
is rejected during normalization, storage, recovery, and validation.

### Structured repair intent

Whether an unblocker requests verification repair is determined from its
canonical structured intent before census headers or free-form body are
considered. Repair intent requires both the exact closed census digest and its
stable repair task; neither header may be omitted, and body text cannot supply
either. An ordinary non-repair unblocker with no repair intent continues through
the existing authority checks without acquiring census requirements. Missing,
partial, body-only, stale, or mismatched repair authority is rejected before
queue state changes.

### Replacement-specification succession

A later user-approved replacement specification does not create another census
or rewrite the origin identity. A `specification-succeeded` generation is the
exact previous generation plus one, binds its previous digest, and records:

- the prior received commit and tree and the replacement commit and tree;
- proof that the replacement descends from the prior received base;
- the exact specification-only changed paths and their digest; and
- a complete mapping from every replacement requirement to already classified
  in-family entry identities.

The transition preserves the census identity, origin candidate and QA base,
family, stable repair task, entries, repair groups, and every prior history
event. It clears current final-evidence authority without deleting the earlier
evidence-bound generation and retains closed status only when the replacement
mapping is complete. A missing or non-descendant commit, changed
non-specification path, unknown or cross-family entry, incomplete mapping,
rewritten field, or stale prior digest rejects the transition before
reconstruction.

After succession, repair admission, reliability admission, final-evidence
binding, review-ready, QA-ready, and campsite satisfaction use the replacement
commit and tree as the current received base. The implementation candidate must
descend from and contain that exact authority. The immutable origin remains an
audit identity and cannot continue as the evidence base.

### Stopped-sibling incident applicability

An incident produced by a candidate that does not descend from the current
received base remains immutable and unresolved, but it is not applicable to a
clean sibling reconstructed from that base. Applicability requires all of the
following: the occurrence base equals the current received base, its candidate
is an ancestor of the candidate being admitted, the exact failure task and
identity are selected, and a matching census entry supplies authority.

Lineage inapplicability is a derived admission/census result, not an incident
transition. It grants no retry, pass, deferral, repair, or evidence credit.
Matching package input/output digests, a prior pass, a shared fingerprint, or
the absence of changed product paths cannot make the stopped occurrence
applicable. Only a new exact occurrence on the clean lineage may enter that
lineage's classification, while the stopped sibling's receipt and incident
history remain unchanged.

### Conserved pre-succession incident admission

A replacement-specification succession advances the current implementation and
evidence base; it does not retroactively change an immutable incident's
occurrence base. An unresolved same-family incident from an earlier received
base remains applicable when the census history authenticates one complete,
consecutive specification-succession chain from that occurrence base to the
current received base and the occurrence candidate is an ancestor of the
candidate being admitted. The current received base remains the invocation,
evidence, review, QA, and satisfaction base.

Admission additionally requires the exact incident id and failure digest, one
classified in-family observed-failure entry, the same stable repair task, the
exact selected failure task identity, and a candidate descended from both the
current received base and the incident occurrence. The persisted admission
projection binds the occurrence base, current received base, authenticated
succession-chain digest, census generation and digest, entry evidence, and both
task identities without rewriting the incident or its source receipt.

This rule applies equally at initial discovery, immediately before task launch,
receipt finalization, evidence preparation and recording, handoff and QA
validation, campsite satisfaction, and product resumption. Each boundary
re-derives the relation from the authoritative census and immutable incident.
The evidence-bound census successor may conserve the admitted prior census
digest only through its exact next generation.

A current-base occurrence and a predecessor-base occurrence with one or several
authenticated succession steps are admissible under the same rule. A stopped
sibling whose occurrence is not an ancestor remains lineage-inapplicable under
Scenario 036. A foreign or missing occurrence base, a gap, fork, ambiguity, or
rewrite in succession history, an open or unclassified census, a missing or
mismatched incident entry, failure digest, repair task, evidence task, selected
task, candidate, tree, or current base fails closed before task launch and at
every downstream boundary. Shared fingerprints, matching output or package
digests, unchanged paths, ancestry from the occurrence base alone, and prose
cannot supply the missing authority.

Incident `2ea2222a-cb50-4d5e-a8d1-8c61453c16c5`, source receipt
`tmp/verification-receipts/3937523-968f97eb-0d53-4570-b66e-94c54b7ff110.json`,
failure digest
`52bd159a3644cac515919cc18dd76d7fed219ce8d653d3e47e0edd7b99efc962`,
occurrence candidate `eb47b681fb8f9049618478f87362948aefac804d`, and occurrence
base `6709529562e081c06ab711d81fb1ccaade61e7c2` are the exact live
boundary. The census must append this occurrence and the complete cross-base
state and consumer matrix to its current diagnostic boundary, classify every
entry, and close before implementation or another evidence attempt. No incident
mutation, census-history rewrite, clean-sibling exception, subordinate task, or
partial admission is authorized.

The additive boundary is exact:

- diagnostic task `diagnostic:cross-base-census-incident-admission` depends on
  `diagnostic:nested-capability:synthetic-receipt-evidence-projection` and
  `diagnostic:nested-capability:receipt-reliability-promotion-resumption-gates`;
- observed failure
  `observed-failure:conserved-pre-succession-incident-admission` binds the exact
  live incident id and failure digest above;
- supported states are `cross-base-current-ancestor`,
  `cross-base-one-succession-ancestor`,
  `cross-base-multiple-succession-ancestor`,
  `cross-base-stopped-sibling`, `cross-base-foreign-base`,
  `cross-base-missing-base`, `cross-base-succession-gap`,
  `cross-base-succession-rewrite`, `cross-base-open-census`,
  `cross-base-unclassified-entry`, `cross-base-missing-entry`,
  `cross-base-incident-mismatch`, `cross-base-failure-digest-mismatch`,
  `cross-base-entry-evidence-mismatch`, `cross-base-repair-task-mismatch`,
  `cross-base-evidence-task-mismatch`, `cross-base-selected-task-missing`,
  `cross-base-selected-task-mismatch`, `cross-base-current-base-mismatch`,
  `cross-base-current-base-nonancestor`,
  `cross-base-occurrence-nonancestor`, and `cross-base-candidate-tree-mismatch`;
- direct consumers are `cross-base-admission-discovery-partition`,
  `cross-base-admission-prelaunch-revalidation`,
  `cross-base-admission-receipt-finalization`,
  `cross-base-admission-evidence-preparation`,
  `cross-base-admission-evidence-recording`,
  `cross-base-admission-review-handoff`, `cross-base-admission-qa-handoff`,
  `cross-base-admission-campsite-satisfaction`, and
  `cross-base-admission-product-resumption`;
- persisted projection `cross-base-defect-census-reliability-admission`,
  generated projection `cross-base-specification-succession-chain`, and repair
  group `authenticated-cross-base-census-incident-admission` complete the
  owner.

The three ancestor states must pass as admissions. Every other state must pass
by proving the specified fail-closed rejection or lineage-inapplicability. One
diagnostic-boundary generation must add all identities and their classified
results together; splitting this matrix across later repair discoveries is
invalid.

### Current diagnostic-boundary succession

The census identity retains its immutable origin diagnostic boundary, while a
separately derived current boundary may advance when a later same-family finding
adds plan tasks or dependencies, supported states, direct consumers, persisted
or generated projections, or coherent repair groups. The advance is one exact
append-only generation bound to the previous census digest. It records the
prior and replacement boundaries and the expected structured entry identity for
every added item.

Prior entries, history, origin candidate, QA base, family, and stable repair task
remain unchanged. Existing final evidence is cleared. The current generation is
open while any added item lacks a classified persisted result and can close only
when every current plan task, state, consumer, projection, and repair group maps
to immutable entries. A local report or handoff body cannot supply missing
coverage.

Removal, rewrite, duplicate identity, unknown dependency, partial expansion, or
a stale prior digest rejects before authority changes. Concurrent and
interrupted writes recover one complete next generation or none. Diagnostic-
boundary succession and replacement-specification succession both serialize
through exact previous digests, preserve each other's history, and remain
independent derived authorities. Collection, repair admission, evidence, review,
QA, campsite satisfaction, and product resumption always use the latest current
boundary rather than the immutable origin boundary.

### Authenticated nested-verification capability conservation

A governed aggregate that starts a nested real verification CLI has one
canonical descendant delegation derived from registry, planner, and task-
succession authority. The digest-bound delegation names the candidate commit and
tree, run id and intent, parent task, exact descendant task set and plan digest,
restricted capabilities, routes, and launch authorizations. Parent capabilities
remain distinct: the parent isolation boundary exposes only routes required by
the delegated descendants and does not acquire a catch-all capability.

Each descendant launch authorization is single-use and exact-task bound.
Removing environment markers cannot turn a spawned descendant into an unbound
top-level runner. Copied, modified, mismatched, consumed, expired, or post-
termination authority rejects before nested planning or checkpointing. Isolated
synthetic execution has separate authenticated provenance and remains
inadmissible as production evidence. Direct tasks, aggregates without restricted
descendants, fail-closed declaration validation, compatible/incompatible/stale
checkpoint classification, and process-group termination retain their existing
behavior.

Development diagnostics, repair-focused runs, review evidence, terminal runs,
diagnostic retries, repair resumes, checkpoint attempts, and promotions conserve
the same descendant identity and routes. Receipts record the exact child result:
a pass is fresh delegated proof, an environment block remains the child's exact
capability block, and a failure retains the child's ordinary reliability
boundary. Parent-only routes, aggregate nonzero exits, synthetic results, and
free-form explanations cannot replace that proof. Reliability admission,
evidence promotion, checkpoint and aggregate resumption, review, QA, campsite,
and product resumption validate the exact delegation before accepting it.

## Recursive verification-helper inventory

Verification-helper inventory recursively discovers retained modules below
`test/support/`, including modules in nested directories. A retained nested
helper has the same exact declaration, reachable-consumer, duplicate, stale,
and unknown-consumer validation as a top-level helper. Explicit compatibility
exclusions remain exact; a nested path cannot silently inherit broad Shell
ownership.

The retained cardinality is derived from that complete recursive inventory.
The ownership-impact contract uses the same population, proves that a nested
helper selects every registered consumer once, and rejects an undeclared nested
helper with its exact path. Modular-verification Scenario 221 authenticates the
one assertion-leaf transition from the obsolete fixed cardinality to the
derived cardinality under Scenario 224; a task-local conservation exception is
not allowed.

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

Acceptance authority is scenarios 025–043 in
`features/swarmforge-outcome-bounded-autonomy-and-unblockers.feature` plus
scenarios 221 and 224 in `features/modular-verification-packs.feature`.

Implementation starts from the exact current QA head. Read-only intent and
changed-path planning are authoritative. Begin with `shell` and
`verification_process`; include properties, the autonomy process contract,
repair/unblocker helper contracts, census persistence and crash recovery,
current diagnostic-boundary and replacement-specification succession,
stopped-sibling and conserved pre-succession incident applicability, nested
descendant delegation and every mode/checkpoint/receipt/downstream consumer,
recursive helper inventory and its authenticated conservation transition,
review/QA admission gates, generated acceptance, and package proof. Do not run
an all-runnable-pack feature checkpoint.
