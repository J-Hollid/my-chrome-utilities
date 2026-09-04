# Data layer side-panel schema editor reachability correction R01

Status: approved by the user on 2026-09-03

Stable implementation task: `side-panel-schema-editor-reachability`

## Objective

Restore access to the compact Schema editor after it opens in a narrow Side
Panel. The editor's internal vertical scrolling already works. The regression is
that the outer panel can no longer move the editor region into view, so only a
small lower part of the editor can be used.

Opening a new schema, a Saved schema, or a project contributor must place the
editor's complete scroll viewport inside the visible Side Panel workspace. The
operator must not need a hidden outer scrollbar to reach that viewport.

## Behavior

At narrow Side Panel sizes, opening any compact Schema editor makes its heading,
first control, and complete internal scroll viewport visible. The editor keeps
one working vertical scroll owner. Pointer-wheel and keyboard scrolling can move
from the first editor control to the final editor actions.

Closing the editor restores the Schema relationship tree, its prior outer scroll
position, and focus on the exact control that opened the editor. Opening and
closing the editor does not change schema content or project content.

This correction does not change schema authoring, contributor routing, editor
controls, persistence, publication, validation, or the wide two-column layout.

## Development focus

Start with these direct checks:

1. installed narrow-panel geometry for opening the compact editor from the
   Schema relationship tree;
2. one focused unit test beside `test/data-layer-installed/` for open, close,
   scroll-position, and focus restoration; and
3. the focused stylesheet contract for compact Schema editor scroll ownership.

The implementation must preserve the editor's working internal scrollbar. It
must correct only the transition that makes the editor viewport unreachable.

## QA impact and ownership forecast

### Behavior ownership

| Behavior | Parent owner | Required direct proof | Not affected |
|---|---|---|---|
| Make the opened editor viewport visible | `schemas` | one focused controller transition test and the installed geometry target | validation, publication, rule editing, guided authoring, and Schema export |
| Keep the editor's existing internal scrolling | `shell` presentation with `schemas` as the product consumer | one narrow stylesheet contract and the same installed geometry target | other Side Panel workspaces and Studio schema routes |
| Restore the tree position and invoking focus on close | `schema_relationship_tree` | one focused open-and-close browser observation | tree filtering, search, relationship derivation, and project switching |
| Prove packaged behavior | `shell` build boundary | one package proof after focused evidence | no additional product pack |

The defect does not change a public installed-controller port. The existing
`defects`, `project_assurance_severity`, `guided_test_cases`, and `shell`
installed-controller consumer tests are not selected unless the candidate
changes that shared port or its lifecycle contract.

### Current coarse paths

These existing paths are possible implementation surfaces, but their current
ownership is too broad for this correction:

- `side-panel-brand/defects-schemas.css` also selects `defects` and
  `layered_schema`;
- `side-panel-brand/workflow-structure.css` is shared by most Side Panel
  workflows;
- the `side_panel_brand_presentation` slice fans out to 15 product packs; and
- the complete `schemas` installed browser batch contains 46 observations.

The candidate must not run these unaffected closures only because the required
selector or controller currently shares a file with them.

### Proposed exact slices

If the read-only intent selects a coarse path, use the independently reviewed
ownership-preparation route before product coding. The proposed boundaries are:

- `src/data-layer-installed/schemas/editor-reachability` — parent pack
  `schemas`, subordinate slice `schema_editor_reachability`, exact consumer
  `schema_relationship_tree:schema_editor_return`, with one focused unit task;
- `side-panel-brand/schema-editor-reachability` — parent pack `shell`,
  subordinate slice `side_panel_schema_editor_reachability`, exact consumers
  `schemas:schema_editor_reachability` and
  `schema_relationship_tree:schema_editor_return`, with one stylesheet task and
  one installed browser target; and
- `test/browser-packs/side-panel-schema-editor-reachability.mjs` — parent pack
  `schemas`, subordinate slice `schema_editor_reachability`, with only the three
  specified viewport and entry-path observations.

The exact filenames remain an implementation choice. The mappings above define
the semantic boundaries that any replacement paths must preserve. They must not
be added under the existing broad `side_panel_brand_presentation` task set.

### Focused evidence budget

The intended focused evidence contains only:

1. the two new feature contracts and their acceptance session;
2. one focused unit test for editor placement and close restoration;
3. one installed browser target covering the three example rows;
4. one narrow stylesheet ownership test when CSS changes; and
5. one package proof.

Run with property mode enabled, but do not add or select an unrelated property
test when this viewport transition has no property-level behavior. The exact
receipt can record that no property task applies.

Do not select the complete `schemas` browser batch, the complete
`schema_relationship_tree` pack, `defects`, `layered_schema`, Flow editor-route
tests, the general branding suite, or the all-runnable-pack gate unless the
settled changed paths prove a direct causal impact. A wider plan caused only by
the current shared file boundary is a `coarse-within-pack` result. For this
feature, the user requires affected-only evidence, so the proportional judgment
is immediate ownership preparation, followed by reissue of the same stable
product task.

No stopped coherent candidate existed at the initial specification handoff.
The coder must perform the read-only intent classification before product
coding. A `coarse-boundary` result also requires the independent
ownership-preparation stage. A bounded forecast difference that contains only
the exact direct tasks can proceed and must be recorded without another user
decision. The activated preparation below records the later stopped candidate
and controls its replay.

## Activated ownership preparation

Task `verification-slice-side-panel-schema-editor-reachability` starts from QA
`8140bc18e6`. Product candidate `d49e7a0833` is a stopped patch reference only.
No product, generated product, acceptance-handler, product-test, or stylesheet
byte from that candidate can enter the preparation.

The read-only preflight classified the existing
`src/data-layer-installed/schemas/` ownership as `coarse-within-pack`. The
approved product packs are `schemas`, `shell`, and
`schema_relationship_tree`, but the prefix also selects unrelated consumer
work from `defects`, `project_assurance_severity`, `guided_test_cases`, and the
general installed `shell` controller. Registry-manifest changes also require
the exact `verification_process:registry_inventory` proof. This process proof
is affected work. It is not authority to select another product pack.

The preparation has these durable path dispositions:

| Causal path or boundary | Durable disposition |
|---|---|
| `src/data-layer-installed/schemas/` | Remove this broad prefix from `schemas:schemas_installed_side_panel`; do not use directory co-location as consumer authority. |
| `src/data-layer-installed/schemas/project-hydration.ts` | Give this path exact ownership in `schemas:schemas_installed_side_panel`; preserve its existing direct task and its `defects`, `project_assurance_severity`, `guided_test_cases`, and `shell` consumers. |
| `src/data-layer-installed/schemas/index.ts` | Give this path exact ownership in `schemas:schema_editor_reachability`; its only product consumer is `schema_relationship_tree:schema_editor_return`. |
| `src/data-layer-installed/schema-editor-reachability.ts` | Reserve this stopped-candidate path in `schemas:schema_editor_reachability`; do not add its product bytes during preparation. |
| `side-panel-schema-editor-reachability.css` | Reserve the narrow `shell:side_panel_schema_editor_reachability` boundary; its only product consumers are `schemas:schema_editor_reachability` and `schema_relationship_tree:schema_editor_return`. |
| Reachability browser, unit, style, feature, and handler evidence | Keep every exact product evidence path in the matching reachability slice. Do not add a complete parent-pack task array or an unrelated consumer. |
| Verification manifests, compiled registry, and migration ledger | Treat these as registry inventory only. Prove deterministic compilation and exact inventory conservation. |

The preparation can introduce only slice declarations, required registry
metadata, and direct ownership and conservation proof. Every declared slice
must be valid against the preparation tree. A future product task that does not
yet exist cannot be used as preparation evidence.

Focused preparation evidence must prove all of these results:

1. `project-hydration.ts` still selects its existing controller task and four
   existing installed-controller consumers;
2. `index.ts` selects only the reachability slice, its declared direct tasks,
   and the relationship-tree return consumer;
3. the future reachability module and stylesheet have one reserved owner each,
   and the stylesheet has only the two named product consumers;
4. complete `schemas`, `shell`, and `schema_relationship_tree` parent-pack task
   closures are unchanged by the ownership split;
5. `defects`, `project_assurance_severity`, `guided_test_cases`,
   `live_flow_testing`, `layered_schema`, and unrelated branding tasks are not
   selected for the editor route; and
6. registry inventory, property mode, and package proof pass without an
   all-runnable-pack checkpoint.

After independent focused review and architect `qa-ready` integration, record
the reviewed slice repair and reissue stable product task
`side-panel-schema-editor-reachability` from that exact QA head. The stopped
candidate remains a patch reference and must not be merged as preparation
ancestry.

### First preparation candidate disposition

Architect candidate `5e7acc05d0` is rejected and remains a patch reference. Its
path ownership is narrow, but its property-mode editor-route plan still has 38
tasks: one build, three unit tests, and 34 inherited parent-pack property tests.
The unit tasks include the general
`unit:test/side-panel-paper-first-brand-test.mjs`. These tasks test behavior that
the correction does not change. The candidate therefore does not satisfy the
user's affected-only evidence requirement and cannot advance `qa`.

The corrected preparation must preserve the accepted path and consumer split
and repair both task-selection defects:

1. When one or more verification slices are selected with property mode, add
   only property tasks that a selected slice declares as a task or prerequisite.
   Do not inherit the complete parent pack `property` array. A slice with no
   applicable property behavior selects zero property tasks and records that
   result without disabling property mode.
2. `shell:side_panel_schema_editor_reachability` must not reuse a general
   branding task to make its declaration valid. Until the focused product style
   test exists, use one narrow preparation-only ownership contract that checks
   only the reserved stylesheet route, its slice, and its two named consumers.
3. Direct conservation proof must construct the future editor route with
   property mode enabled. It must fail if a parent property, general branding
   task, unrelated product pack, or undeclared stylesheet boundary enters the
   plan.
4. The exact preparation review can run the process and registry proof needed
   to change this selection rule. It cannot use that proof as authority to add
   unrelated product behavior or an all-runnable-pack checkpoint.

Reissue the same stable preparation task from QA `6f7a95a9b3`. Preserve the
accepted registry declarations from `5e7acc05d0` as a patch reference, but do
not merge that rejected commit or reuse its evidence receipt.

### Activated product-evidence conservation preparation

Task `verification-slice-side-panel-schema-editor-reachability-conservation`
starts from exact QA `e1eecb13f9`. Product candidate `5948806e52`, tree
`fe069509a66`, is a parked patch reference. Its parent is exact QA
`e1eecb13f9`. Do not merge it into this preparation.

The candidate passed its direct unit, style, type, build, and three-row
installed-browser checks. Its required exact evidence did not complete. The
run started 51 tasks and recorded 12 passes. Then
`unit:test/verification-contracts/registry-reachability-contract-test.mjs`
failed. Two running tasks stopped, and package proof did not start. This is a
missing-evidence blocker. Extra successful tests alone are not a product
readiness blocker. If all required evidence passes, record surplus test scope
as a separate ownership follow-up.

The coder reported failed receipt
`tmp/verification-receipts/1840147-91d9fbee-cfc7-4e41-bcba-5d1790067cdd.json`
with SHA-256
`f01dbefc227d567189fd01f1f761b2883875685858e7d6085c35001ab74bf6c4`.
The receipt is not present in the current QA workspace. Keep this value as
reported incident metadata. Do not reuse the failed result.

The failure has one bounded causal path.
`test/live-target-permission-recovery-preparation-contract-test.mjs` is a Shell
verification consumer that reads `features/modular-verification-packs.feature`.
The feature has an exact slice in `verification_process`. The reachability
contract still treats this relation as a parent-pack impact requirement. The
reviewed exact plan correctly selects only `verification_process` for the
feature path.

The preparation has these durable dispositions:

| Causal path or boundary | Durable disposition |
|---|---|
| Exact slice `consumers` | Treat a declared exact slice consumer as valid verification reachability. Do not add the complete consumer parent pack to the changed-path plan. |
| Exact slice `historicalOwners` | Treat a declared former owner as a valid exact ownership transition. Fail closed when the declaration is absent or names an invalid owner. |
| `features/modular-verification-packs.feature` | Prove that direct planning still selects only `verification_process`. It must not select `shell` or a complete Shell task closure. |
| `test/verification-contracts/registry-reachability-contract-test.mjs` | Correct only the reachability assertion for exact slice declarations. Keep direct import and literal-read checks for paths that have no exact declaration. |
| Compact conservation | Add the authenticated transition for the changed reachability-contract record. Regenerate the compact fixture. Preserve every unrelated record byte. |

The preparation can change only the direct reachability contract, its focused
verification proof, the authenticated compact-conservation authority chain,
and the regenerated compact fixture. It cannot include product source,
generated product, product tests, acceptance handlers, CSS, product feature
bytes, `verification/packs.json`, or product manifests. It cannot restore a
parent-pack impact only to satisfy the old assertion.

Focused preparation evidence must prove all of these results:

1. the real Shell test-to-feature literal-read edge remains visible to the
   reachability contract;
2. the exact slice `consumers` or `historicalOwners` declaration satisfies that
   edge without Shell parent-pack impact;
3. deletion or corruption of the exact declaration makes the focused contract
   fail;
4. planning `features/modular-verification-packs.feature` selects exactly
   `verification_process` and no Shell task;
5. the authenticated compact-conservation chain accepts the new record, the
   regenerated fixture matches it, and unrelated records keep their bytes; and
6. the exact `verification_process` proof, property-mode result, and package
   proof pass.

Do not run an all-runnable-pack gate, CRAP, DRY, language mutation, or Gherkin
mutation check for this preparation.

After independent architect review marks the preparation `qa-ready`, integrate
it into QA. Then reissue stable product task
`side-panel-schema-editor-reachability` from that new exact QA head. Conserve
the product delta from `e1eecb13f9..5948806e52`, and bind the reissue to
consumer-plan digest
`c6c78e519a44dcf3b145d557fcdf05500a1737db9616adda2b2cc979ee751d02`.
Regenerate combined conservation data from the new base where required. Run
fresh exact product evidence and package proof. Do not reuse the stopped
candidate receipt.

### Activated incident-bound successor preparation

Task `verification-slice-schema-editor-conservation-succession` starts from QA
`f3425613bc`. Preserve stopped verification candidate `384b8f3b39`, tree
`37260bda6d`, as an immutable remainder. Its ordered commits from that QA base
are `aa7aeacf`, `fce81692`, `2f7e1136`, `63d968b3`, `4eb56aac`, and
`384b8f3b`. Parked product candidate `5948806e52` remains unchanged and outside
this preparation.

The candidate's direct reachability, exact planning, compact refresh and check,
compact conservation, and authority-discovery checks pass. Its final changed
paths select only `verification_process:registry_inventory`, with 15 tasks
before package proof and no expansion cause.

The failed review-evidence receipt is
`tmp/verification-receipts/1891822-8497dea5-9ca1-4a62-a635-c124928cf637.json`
with SHA-256
`530811df57cad2b8c5bf041ad9495d71438c03b25a2d63b9baacfdf03cbedd91`.
It is bound to candidate
`4eb56aac2a1477bf5c2146a0895473d8cd0a0acd`, tree
`94f8b253015626312c9890e1024adc5f2b869b07`. It records 23 passes and one
failure in `acceptance-session:verification_process`. Package proof did not
start. The failure has digest
`8b8b14214d04b9e41fc10e6bdc5ac40ab78761bc6cb7524c6e37da038cafdaf4`.
Do not reuse this receipt as passing evidence.

The temporary Scenario 221 authority row made the run select the complete
legacy modular acceptance session. Unchanged Scenario 002 then required parent
verification commands that were outside the exact slice. Final commit
`384b8f3b39` restores the feature file to its QA-base bytes and keeps the
Scenario 221 authority only in ancestral commit
`2f7e1136812fd6df81b218d1c5b99d38f52c870e`. The next exact plan correctly
does not select the legacy session. Incident
`8f3ed16c-61e1-476f-b3c1-8c2aea39e78d` blocks that plan because no selected
task is yet declared as the successor to the failed session.

The bounded discovery declaration is complete:

| Field | Value |
|---|---|
| Intent | `verification-repair` |
| Repair task | `verification-slice-schema-editor-conservation-succession` |
| Repair family | `exact-acceptance-succession` |
| Repair boundary | `schema-editor-conservation-authority` |
| Repair defects | `missing-receipt-bound-compact-successor` |
| Discovery complete | `true` |

The discovery boundary contains only the failed receipt, its exact acceptance
task, the final candidate's exact plan, the existing receipt-bound succession
format, and the selected compact-conservation contract. No other defect was
observed in this boundary.

Use the existing receipt-bound task-succession format. Add one incident-specific
edge from source task digest
`48863bad1ff341949142b2df0e71b0e946c1b5f4a1805e473a41f6dc190487cf`
to selected destination task
`unit:test/verification-contracts/compact-conservation-contract-test.mjs`,
digest
`c29a363c012c3d73c36fa932fd87d8c427c4419fe2ddf36ebf44be16adeb7a89`.
Bind the edge to the exact incident, receipt, source commit, source tree, and
receipt-bound boundary digest
`8bdd86773bf6298a27ca1903ea5e04d19c95488109c1489ac1ceff76291a9a50`.

The successor is valid only because the final feature bytes equal the QA base,
the ancestral Scenario 221 row authorizes the exact changed contract leaf, and
the selected compact-conservation contract authenticates that history. It must
not become a generic successor for another `verification_process` acceptance
failure, another incident, another receipt, or an unchanged legacy scenario.

The preparation can change `verification/task-succession.json` and the direct
succession contract. If those exact changes alter compact conservation, refresh
only the affected compact record and its authenticated authority chain. Do not
change the evidence runner, planner, acceptance handler, product registry,
product source, product test, CSS, generated product, or product feature. Do not
add a waiver, a caller-asserted successor, or an all-runnable-pack checkpoint.

Focused evidence must prove all of these results:

1. the source receipt, candidate, tree, failed task identity, and failure remain
   exact and immutable;
2. the selected compact-conservation task is the only accepted destination;
3. a changed incident, receipt, lineage, source digest, destination digest, or
   boundary digest fails closed;
4. the final modular feature bytes equal QA base and the exact historical
   Scenario 221 authority remains authenticated;
5. the canonical changed-path plan selects only `verification_process`, its
   affected slices, their prerequisites, and package proof; and
6. one fresh evidence run passes the selected successor and every required
   task, then passes package proof.

After architect `qa-ready` review, integrate this preparation into QA. Then
reissue stable task
`verification-slice-side-panel-schema-editor-reachability-conservation` from
that exact QA head. Reapply and verify the conserved remainder
`f3425613bc..384b8f3b39`, refresh combined compact authority data where needed,
and run fresh exact evidence. Do not reuse the failed receipt or its partial
passes.

### Activated eligible-repair checkpoint base correction

Task `eligible-repair-checkpoint-base-correction` starts from exact QA
`bc34ee316d`. Product candidate `62224e30ac`, tree `203915a8a612`, is a parked
remainder. Do not merge it into this repair. It contains the requested shared
browser-session correction, and its direct three-case browser target and
planner ownership checks pass.

Review evidence is blocked by incident
`21a8e284-80b0-452c-a777-3943da251aa1`. The incident failure is bound to base
`bc34ee316d`, evidence task `side-panel-schema-editor-reachability`, failed
commit `0ee5229c30`, and
`unit:test/verification-registry-planner-modularization-acceptance-test.mjs`.
The failed review receipt is
`tmp/verification-receipts/2280235-8b8de017-d45d-4374-aca2-8da27df3b4f8.json`
with SHA-256
`1e573bc6b27599d7fb07d774c8769d4c5a4a2c19669585f67aaa674fe0699995`.

The eligible repair is correct in product cause and candidate identity, but its
checkpoint was recorded with intermediate base `0ee5229c30`. Repair-focused
receipt `tmp/verification-receipts/2295397-ce1770b6-087c-4715-9c05-dd735eeb94c5.json`,
SHA-256 `1d0316d6a2878ad60b03a9fb60dbf9856f7a8ef53cb61862bce3c3be2ca064bc`,
contains that incorrect binding. Fresh repair-focused receipt
`tmp/verification-receipts/2299894-0078a2e0-0171-480c-b795-e44107307351.json`,
SHA-256 `bd45917e45c016b7c2460f851dbf5e6504fbba65c6e98be50c8c639f03b632e9`,
passes the same causal regression from the required base. Persistence rejects
that correction because the eligible repair is immutable.

The bounded discovery declaration is complete:

| Field | Value |
|---|---|
| Intent | `verification-repair` |
| Repair task | `eligible-repair-checkpoint-base-correction` |
| Repair family | `eligible-repair-checkpoint-identity` |
| Repair boundary | `schema-editor-review-repair-checkpoint` |
| Repair defects | `unapproved-checkpoint-base-admitted`, `immutable-correct-base-revalidation-blocked` |
| Discovery complete | `true` |

The repair must produce these results:

1. A first eligible-repair proposal accepts only the base and evidence task in
   the incident's approved failure lineage.
2. An existing eligible repair with this exact malformed checkpoint can receive
   one append-only correction bound to the same incident, failure, candidate,
   tree, causal protocol, regression key, and evidence task.
3. The correction records both the rejected prior binding and the effective
   corrected binding. It does not overwrite or delete the old repair, its
   receipt, a commit, or incident history.
4. The correction accepts only `bc34ee316d` as the effective base and requires
   the fresh correct-base repair receipt. A different base, task, candidate,
   tree, failure, causal proof, regression, or receipt fails closed.
5. Normal evidence admission reads the corrected effective checkpoint and still
   requires the exact four-pack plan: `schema_relationship_tree`, `schemas`,
   `shell`, and `verification_process`.
6. Evidence from base `0ee5229c30` continues to fail before task launch because
   its one-pack changed-path authority cannot claim the four requested packs.

Change only the eligible-repair proposal, persistence, admission, and their
direct contracts as required. Do not change the product candidate, feature
contracts, product packs, task succession, package policy, terminal policy, or
the all-pack gate. Do not use a caller assertion, mutable replacement, incident
deletion, receipt deletion, or a wider test plan as the correction.

Use the exact verification-process tasks selected by the settled changed paths,
with property mode and package proof. After architect `qa-ready` integration,
apply the governed checkpoint correction, then reissue stable product task
`side-panel-schema-editor-reachability` from that exact QA head. Conserve the
product delta from `bc34ee316d..62224e30ac`, including the shared-session browser
repair, and run fresh exact four-pack product evidence. Do not reuse any stopped
receipt as passing evidence.

## Delivery and reporting

The implementation-and-review effort ceiling is 120 minutes. At 60 minutes,
report the open-editor geometry, active scroll owners, wheel and keyboard
results, close restoration, exact changed paths, planned packs and tasks,
forecast variance, failures, remaining work, confidence, and completion
forecast.

Use focused review-ready evidence with properties and package proof after the
candidate is stable. This feature does not authorize Gherkin mutation or the
terminal all-runnable-pack gate.

## Acceptance authority

- `features/data-layer-side-panel-schema-editor-reachability.feature`
- `features/data-layer-side-panel-schema-editor-reachability-runtime.feature`
