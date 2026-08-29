# SwarmForge verification defect census and consolidated repair R01

Status: user-approved on 2026-08-29; census
`0f535b736aa7ebe018c8df856d26ee3ab389600d9b07cafa5df07a133f105076`
is closed at recovered generation 45. Bounded post-repair diagnostics have
classified the complete 99-leaf plan and its direct state, consumer, projection,
and repair-group matrix before another implementation repair. The immutable
invalid generations, partial implementation, failed receipts, and first
mis-typed diagnostic receipt remain parked.

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

### Authenticated diagnostic-result evidence

A census entry is coverage authority only when its evidence resolves to an
immutable diagnostic execution receipt, not merely to a readable file with a
matching digest. The receipt binds the census and prior digest, candidate commit
and tree, current received base and diagnostic-boundary digest, diagnostic plan
and executor, fixture/input digest, case kind and identity, actual result and
disposition, and exact output digest. A batched receipt lists and digests each
case separately; one result cannot be reused for another identity.

Collection, closing, diagnostic-boundary succession, specification mapping,
normalization, storage, recovery, repair and reliability admission, evidence
binding and promotion, review, QA, campsite satisfaction, and product resumption
all authenticate the same receipt and result. Passing and failing executions are
both admissible when their recorded outcomes and dispositions agree. A prose or
local report, source-code digest, hardcoded or caller-asserted outcome, missing
or unreadable receipt, missing or duplicate case, skipped or unexecuted case,
unknown identity, stale executor or plan, result reuse, or any census, prior
digest, candidate, tree, base, boundary, fixture, case, outcome, disposition, or
output mismatch fails closed.

The complete added state population is exact:

- `diagnostic-evidence-executed-pass`, `diagnostic-evidence-executed-fail`, and
  `diagnostic-evidence-exact-batch-results` are the accepted states;
- `diagnostic-evidence-prose-report`, `diagnostic-evidence-source-digest`,
  `diagnostic-evidence-hardcoded-outcome`, `diagnostic-evidence-missing-receipt`,
  `diagnostic-evidence-unreadable-receipt`, `diagnostic-evidence-missing-case`,
  `diagnostic-evidence-duplicate-case`, `diagnostic-evidence-skipped-case`,
  `diagnostic-evidence-unexecuted-case`, `diagnostic-evidence-unknown-identity`,
  `diagnostic-evidence-stale-executor`, `diagnostic-evidence-stale-plan`,
  `diagnostic-evidence-result-reuse`, `diagnostic-evidence-census-mismatch`,
  `diagnostic-evidence-prior-digest-mismatch`,
  `diagnostic-evidence-candidate-mismatch`, `diagnostic-evidence-tree-mismatch`,
  `diagnostic-evidence-base-mismatch`, `diagnostic-evidence-boundary-mismatch`,
  `diagnostic-evidence-fixture-mismatch`, `diagnostic-evidence-case-mismatch`,
  `diagnostic-evidence-outcome-mismatch`,
  `diagnostic-evidence-disposition-mismatch`, and
  `diagnostic-evidence-output-mismatch` must reject;
- direct consumers are `diagnostic-evidence-collection`,
  `diagnostic-evidence-close`, `diagnostic-evidence-boundary-succession`,
  `diagnostic-evidence-specification-mapping`,
  `diagnostic-evidence-normalization`, `diagnostic-evidence-storage-recovery`,
  `diagnostic-evidence-repair-admission`,
  `diagnostic-evidence-reliability-admission`,
  `diagnostic-evidence-binding-promotion`, `diagnostic-evidence-review-qa`,
  `diagnostic-evidence-campsite`, and `diagnostic-evidence-product-resumption`;
- persisted projection `authenticated-diagnostic-result-receipt`, generated
  projection `authenticated-diagnostic-case-index`, and repair group
  `authenticated-diagnostic-result-evidence` complete this owner.

### Complete post-repair diagnostic consolidation

The first focused evidence attempt on the recovered candidate stopped after one
registry-contract failure. That failure is a diagnosis input, not authority for
a one-symptom repair. One candidate-bound diagnostic continuation must account
for the complete selected plan and every supported diagnostic dimension before
the same stable repair task resumes implementation.

The consolidated repair groups are exact:

- `migration-source-object-conservation` preserves each immutable source object
  recorded by the migration ledger while allowing a current local manifest to
  evolve additively. A current fragment is not substituted for its historical
  source object, and an additive declaration cannot silently rewrite migration
  provenance.
- `task-set-succession-property-admission` requires every destination identity
  declared by a task-set succession to resolve in the current authoritative
  registry. When registry evolution changes an executable destination identity,
  one authenticated append-only successor transition conserves the earlier
  identity; no hardcoded, stale, missing, reordered, or caller-asserted identity
  may satisfy the property.
- `failure-quiescence-completeness` makes a stopped run account for every
  selected plan leaf. Completed leaves retain their actual results; every leaf
  that did not start is enumerated exactly; dependency-blocked leaves retain the
  exact blocking identities; and no later leaf disappears behind an empty
  `unstartedTaskKeys` projection.
- `focused-continuation-property-routing` consumes immutable candidate-bound
  diagnostic results, reuses already completed passes without replay, launches
  only still-eligible unstarted leaves or an explicitly selected property
  population, and produces one complete non-evidence diagnostic projection.
  It also owns first-class typed capture: every executable plan leaf is a
  `task` case whose case id and census `taskKey` equal the authoritative task key
  byte-for-byte. Task-key validation uses the canonical verification task-key
  contract, including existing compound keys containing `+`; it must not apply
  a narrower census-only alphabet, encode or shorten the key, classify the task
  as a state, or attach both task and state dimensions. Non-task case kinds keep
  their own exact identity validation.

The bounded live inventory contains exactly 99 plan leaves: 97 passed, two
failed, and none skipped. Its direct audit matrix contains 110 cases: 98 passed
and 12 failed. The first immutable 209-case receipt that classified the 99 task
leaves as states is invalid evidence and remains byte-for-byte audit material.
It cannot be overwritten, rebound through dual-dimension entries, or admitted
to the census. A successor receipt is admissible only after a no-write preflight
proves truthful one-to-one typing and exact task-key round trips for all 209
cases.

### Append-only invalid-generation recovery

If a structurally accepted census generation is later proved to contain
unauthenticated diagnostic results, no later generation may treat it or any
authority derived from it as valid. Its bytes and every structural successor
remain immutable. One `invalid-generations-quarantined` next-generation event
binds the current head and exact invalid root generation/digest, authenticates
the failure with the diagnostic-result contract above, enumerates the complete
transitive dependent-authority range, and gives each later event an explicit
`quarantined-derived-authority` or `retained-audit-event` disposition.

The event records the last independently valid diagnostic boundary and received
specification commit/tree, proves them by replaying the unquarantined prefix,
and makes those values the effective authority for subsequent derivation. It
does not change structural generation numbers, previous digests, entries, event
bytes, or history. A later corrected diagnostic-boundary succession derives
from that effective boundary, and a later specification succession derives from
that effective received base. Retained recurrence and classification audit
entries remain visible but grant no boundary or specification authority.

Recovery accepts one exact invalid root with no dependent authority, one with a
single derived event, or one with several derived and retained audit events.
It rejects an unknown or valid target, wrong digest, missing authentication,
incomplete or extra dependent range, an unknown or ambiguous event disposition,
rewritten or skipped history, wrong last-valid boundary or base, a target or
dependent event already quarantined under another identity, stale current head,
and conflicting concurrent recovery. An identical committed recovery is
idempotent. Interrupted persistence recovers the complete event or none; until
commit, the census is unreadable for repair, evidence, review, QA, satisfaction,
or resumption.

The complete added recovery states are
`invalid-generation-root-only`, `invalid-generation-single-derived`,
`invalid-generation-multiple-derived-with-retained-audit`,
`invalid-generation-identical-recovery`, `invalid-generation-unknown-target`,
`invalid-generation-valid-target`, `invalid-generation-wrong-digest`,
`invalid-generation-missing-authentication`,
`invalid-generation-incomplete-dependent-range`,
`invalid-generation-extra-dependent-range`,
`invalid-generation-unknown-disposition`,
`invalid-generation-ambiguous-disposition`, `invalid-generation-rewritten-history`,
`invalid-generation-skipped-history`, `invalid-generation-wrong-boundary`,
`invalid-generation-wrong-received-base`,
`invalid-generation-multiply-quarantined`, `invalid-generation-stale-head`,
`invalid-generation-concurrent-conflict`, and
`invalid-generation-interrupted-write`. Direct consumers are
`invalid-generation-normalization`, `invalid-generation-storage-recovery`,
`invalid-generation-effective-boundary`, `invalid-generation-effective-base`,
`invalid-generation-diagnostic-successor`,
`invalid-generation-specification-successor`,
`invalid-generation-repair-reliability-admission`,
`invalid-generation-evidence-review-qa`, and
`invalid-generation-campsite-resumption`. Persisted projections
`invalid-generation-quarantine-event` and
`effective-census-authority-state`, generated projection
`invalid-generation-dependent-authority-closure`, and repair group
`append-only-invalid-generation-recovery` complete this owner.

The live recovery targets invalid generation 39/digest
`25326b217fa6e0d98f678b55ff1da09e58301ea9ea7ab02c55a70e9c791ad7aa`
and its generation-40 Scenario 043 succession. Generations 41 and later that
only record the recurrence and its classification are retained audit events.
The last valid diagnostic boundary is generation 35's effective boundary as
retained through generation 38; the last valid received specification is
generation 36 commit `b711bbe950916069b69b4c54174ad8df78031b1b`, tree
`65999453d81895e1ee8968e541c23ae25ad3a869`. Commit `1837193b` and the
generation-40 merge are parked references only.

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

## Immutable legacy checkpoint-quiescence compatibility

The first generation-51 focused evidence attempt reached repository-common
checkpoint discovery and failed before current task execution because one old
interrupted attempt uses the failure-quiescence shape that predated complete
plan accounting. A complete read-only store census found 337 attempt identities:
321 validate under the current candidate and have no `failureQuiescence`, while
16 share this one legacy shape. No persisted attempt provides a current complete
failure-quiescence control. This is one same-family persisted-state defect set,
not authority to repair the first named attempt or discard unrelated history.

The exact immutable legacy population is:

- `1e43c218827942421b1f277817267306c7f50dfbf74fd5e679811008f8b2fd07` / envelope `6d39bcbc5da6d071f274c1f026370ffda1810dd086f797217d4fe117367c5f36`;
- `252fce3a0919dd7f648a52e27a25edbc7ce022a406b830da7e10d592849b5fd4` / envelope `ffd1d50a93e1df258363e62c0ef3865783d0c6bc2e0b254b3ee37dd8c878b679`;
- `255805788efe3169d36a06aa95a48167b8c283991a64a688bcd2c1357d2c1fd5` / envelope `1c3bdcdfd518ca580f6873b683ef155fa95181591d966c682a3ab5218ba510fe`;
- `49fa323add216c4eb7bb28cbea14db28f04711e85fbf3cb39bef5a54860150b2` / envelope `61853f09093838f1afd65f3ac79de06b41b42a8f133dba0368901af19a318328`;
- `6fb37c630e284e37fe0bf93762c644487a5fcb173491765d70c40534ee06846e` / envelope `fb7402945dd53f9e7fea01c09d521e09c08ffdb96b139e9677ddca2e3b30d1d3`;
- `872a1318bed7f7ab2a970f6c8a507ee64bb01e6b8ceeebb75d4209e571365def` / envelope `04c1547db352229a8a51c66739324c67cf0bd1c05cad11d273d46d0ae9e11ec8`;
- `90617049789c442ca1bec79575e4171daf3846ed88712c8578ac5f45df6a9d7a` / envelope `bc26ad4b5da17ffa5f52f07e783ae2a3fde2b50bdbf087e88bb2e73e2366e222`;
- `91a679a24dff60fd4f5a89f30a49cefd3814460159ff84472587d57e6ba07fb4` / envelope `0f342ca91939c9425490c3f82eaa382812d4f12db65ec43337ba6ffff4706def`;
- `972441b8a2b2c04633ea918bc8da240e17764150d9026afe793003051a535d54` / envelope `8a76b539a3ba1c08b491d4f574cabe4309cb387a019a040f5d986eee6f1132db`;
- `aced4f99e04980b5f1bd04facf4096ad83c7ce52423906af844c34001d721bc7` / envelope `5c6a5a09f546ea9caf5b7ff7cfff3768c4c8a45fd014c7d62ba667e6c9c1a26e`;
- `bd28913cb188220445310120f37491aba1c777b8b1667aa91aa199b2f0de6ec1` / envelope `91b0edbd10ab8b674c06af78566945e54b0c63a353532211abd945b36ffa7e99`;
- `c5f8e7b5db241f47eaf85e76fe6a845cc3169112d4d97f745c8322c897d8a0f6` / envelope `475c33139423234c4b33715ccc21e1a1b6f990eb96d0e1efbc0dfa0c160fa3ae`;
- `c6b5d8d2bf03956b36dd7159718982816147e88f07821242437acbe30d3904db` / envelope `98d0ddf34031a65729400fd4340a39cd7bbf8693d6820012ce63b448a375589c`;
- `ccc3b2bfc4d5b55c007cb7a3815eeeeaff3eaf5e55e24b4bffd398c5cf6b2b51` / envelope `d8b9cf61290daff9d5b3fa6e0eda1d594142340e59b55e974592d477d44bd4cb`;
- `e02e43e5d0609e7772cc4f22e1fc7aa53a02178bdf95b039ada9c2bfbc1f7218` / envelope `2137d96d56f0e460a627b80c31b97509fde96b872d327253b63076a001454845`;
- `e93cedaddcf73ef32bd20857f86fb74cb0fb1e111b8f2c910914359eab6f2ac0` / envelope `d07727c28bc661e620cff6c365b4feded6ff849f3e960b5b4970778f762d7ec7`.

Every listed document is version two, interrupted, internally digest-bound,
and contains the old failure-quiescence keys but omits
`completedTaskKeys` and `dependencyBlockedTasks`. Some also demonstrate the
old empty or partial `unstartedTaskKeys` projection with cancelled tasks. Their
bytes, transitions, results, causal failures, and recorded lists remain
immutable.

One compatibility projection may admit only this exact ledger. It derives
`completedTaskKeys` from the authenticated passed-result keys. It conservatively
places every selected task absent from completed, failed, and cancelled into
`unstartedTaskKeys`; it records no dependency block that the immutable source
did not prove. The four populations form one exact, duplicate-free partition of
the attempt's task keys. The projection binds the attempt id, source-byte digest,
envelope digest, original quiescence, derived quiescence, and compatibility
schema. It never creates a pass, dependency reason, retry credit, evidence, or
incident transition and never rewrites the source file.

The bounded state matrix covers all 16 exact ledger rows, the 321 currently
valid attempts without quiescence, an isolated generated current-complete control,
cancelled and partial-unstarted legacy shapes, and missing, extra, duplicated,
rewritten, wrong-id, wrong-envelope, wrong-byte, wrong-task-population,
non-ledger, and newly malformed records. Only the exact ledger rows receive a
projection. All other malformed states reject before claim or task launch.

The current-complete control is not caller-asserted persisted history. It is
generated in an isolated ephemeral store from the exact immutable
`1e43c218827942421b1f277817267306c7f50dfbf74fd5e679811008f8b2fd07`
ledger row and the conservative projection above. Its receipt binds that source
attempt, source-byte and envelope digests, complete projected document digest,
task partition, compatibility schema, executor, fixture, and plan. Collection
also binds equal before-and-after byte inventories for all 337 live documents.
The fixture is destroyed after the case and grants no persisted-attempt,
evidence, retry, incident, or product-resumption authority.

The batch's case-level `scenario` identity is `44`, the existing authenticated
diagnostic-result evidence owner. Diagnostic-boundary succession separately
maps those authenticated case identities to behavior scenario `50`. Tagging the
receipt cases as `50`, broadening the authenticator's owner set merely to admit
the batch, or treating a self-consistent envelope digest as end-to-end
authentication is invalid. Before a receipt is written, a no-write preflight
must pass every proposed case through the current candidate's real
`authenticateDefectCensusDiagnosticEvidence` consumer with exact expected
authority. The external authority's `boundaryDigest` is the declared `digest`
of `defectCensusCurrentBoundary(census)`, not a new hash of that already-bound
boundary envelope.

Downstream authenticated census consumers currently re-read a receipt from its
bound filesystem path and do not accept the case authenticator's injected
in-memory read boundary. Collection therefore uses an exact two-stage gate
rather than creating another prerequisite repair. Before the one immutable
receipt write, an in-memory preflight authenticates all proposed cases, maps
them to every typed census entry, and uses the pure transition constructors to
validate the reopen, close, and diagnostic-boundary successors through
generation 54. `succeedDefectCensusSpecification` itself reauthenticates stored
receipt paths, so the pre-write stage does not mislabel it as a pure
constructor. Instead that stage independently proves the replacement
specification's ancestry, tree, specification-only changed paths, change-set
digest, exact added `scenario:050` requirement, and one-to-one mapping of that
requirement to all 373 proposed entries. After the single write, and before any
census record is mutated, the real authenticated transition consumers must
reconstruct the complete chain through specification generation 55 from the
written receipt. Only then may its four successors be recorded. A receipt that
fails the second stage remains immutable audit with no census or repair
authority; case authentication, pure structure, or specification inspection
alone is insufficient.

Direct consumers are checkpoint `read`, `list`, `claim`, `update`, exact
continuation, and recovery; runner prelaunch and continuation; receipt
finalization; evidence preparation, recording, and promotion; review and QA;
campsite satisfaction; and product resumption. Persisted projections are the
immutable checkpoint documents and exact compatibility ledger. The generated
projection is `legacy-checkpoint-complete-failure-quiescence`; repair group
`legacy-checkpoint-quiescence-compatibility` completes the additive boundary.
All cases must be collected and classified together before the same stable
repair task changes implementation or attempts evidence again.

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

Acceptance authority is scenarios 025–049 in
`features/swarmforge-outcome-bounded-autonomy-and-unblockers.feature` plus
scenarios 221 and 224 in `features/modular-verification-packs.feature`.

Implementation starts from the exact current QA head. Read-only intent and
changed-path planning are authoritative. Begin with `shell` and
`verification_process`; include properties, the autonomy process contract,
repair/unblocker helper contracts, census persistence and crash recovery,
current diagnostic-boundary and replacement-specification succession,
stopped-sibling and conserved pre-succession incident applicability,
authenticated diagnostic-result evidence, append-only invalid-generation
recovery, nested descendant delegation and every mode/checkpoint/receipt/
downstream consumer, recursive helper inventory and its authenticated
conservation transition, review/QA admission gates, generated acceptance, and
package proof. Do not run an all-runnable-pack feature checkpoint.
