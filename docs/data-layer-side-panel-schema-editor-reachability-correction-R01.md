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
