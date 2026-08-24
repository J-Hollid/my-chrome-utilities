# Data-layer Page and Flow inherited-property selection R01

Status: QA-integrated at `d51e55fa7c` after exact focused review evidence for
291 tasks; layered schema projection and inheritance-card consistency correction
QA-integrated in combined candidate `119c25ef7a` on 2026-08-24 after exact
six-pack/200-task review-ready evidence; its exact task identity was independently
confirmed on the same tree by a second six-pack/200-task review-ready record;
cumulative promotion to `master` remains a separate user decision

Stable task name: `page-flow-inherited-property-selection`

## Authority and outcome

This correction refines the active canonical authoring and layered-schema
contracts under
`docs/data-layer-canonical-schema-authoring-correction-program-R01.md`. It
supersedes only the exclusion-control placement and effective-row presentation
in `docs/data-layer-layered-schema-editing-repairs-R01.md`, revises Layering
scenario 032 and its runtime partner, and adds Layering scenario 034 with its
runtime partner.

Pages and Flow Page-instances expose inherited-property selection before their
effective schema Table. The interaction follows the established selective Shared
Profile pattern used by Property Sets: a compact summary opens one searchable,
filterable selection tree with checkboxes, counts, review, cancel, and apply
actions. An operator does not open a property row or its Definition form merely
to exclude an inherited property.

This is interaction parity, not a change from dynamic contextual inheritance to
a fixed Shared Profile recipe. All currently applicable parent properties are
included by default. Only explicit deselections are stored, and a later parent
addition remains inherited unless the operator explicitly deselects it.

## Selection and effective-table behavior

The control composes the complete applicable parent stack before presenting
choices. Each stable effective property appears once even when several Shared
Profiles, Property Sets, or Page contributors participate. Source and route
provenance remain available, while concept and structural nodes provide the same
selected, unselected, and mixed selection states as selective Shared Profile
inheritance.

Selection changes are staged. Review identifies selected properties and
descendants, affected compiled contexts, stale outputs, runtime consequences,
and one Undo action while the Draft and effective Table remain unchanged. Apply
stores one contributor-scoped command. Cancel stores nothing.

After Apply, an explicitly deselected property and its descendants are absent
from the effective Table, its counts, compilation, validation, and
downstream Page-branch projections. The deselected property remains visible and
unchecked only in inherited-property selection so the operator can restore it.
Reselecting it removes the sparse exclusion and recompiles the current parent
definition rather than restoring a copied snapshot.

A Page exclusion applies to that Page and every downstream Flow Page-instance
branch. A Flow Page-instance exclusion applies only to that instance and the
contained Event occurrences that inherit its Page branch. Source contributors,
other Pages, sibling instances, independently contributed Event-branch
properties, unrelated local facets, and Published state remain unchanged.

## Safety and persistence

Apply stores sparse exclusions by stable property identity and never copies a
parent definition. Excluding a property also removes any same-contributor sparse
facets for that property in the same reviewed command. Reload preserves the
selection. Undo restores the preceding contributor selection without reverting a
later parent edit.

A protected invariant or a property required by a surviving dependency cannot be
deselected. Its selection control remains selected and identifies the exact
blocker, source, and existing repair route. These blockers do not hide or disable
selection for ordinary inherited properties.

## Boundaries

This correction does not change Property Set selective Shared Profile recipe
semantics, Page Property Set application order, parent precedence, local facet
editing, source documents, Event or Event-occurrence authoring, publication,
validation meaning, or project portability. It adds no source-property deletion,
path-only tombstone, copied parent snapshot, second schema table, or parallel Flow
editor. Existing Allowed values and Example reconciliation in Layering 033 remains
unchanged.

## Layered schema projection and inheritance-card consistency correction

Stable task name: `layered-schema-inheritance-card-consistency`

Every layered schema editor has one authoritative property Table. Remove the
read-only `Compiled layered property tree` and its duplicate path controls from
Shared Profile, Page, Property Set, Event, Flow Page-instance, and
Event-occurrence schema workspaces. The Table remains the complete editable
projection and retains filtering, sorting, full paths, provenance, conflict
state, local-versus-effective distinctions, and property actions. Schema counts,
activation, validation, and developer export controls remain available where
they apply; only the redundant property list is removed from those tools.

Page and Flow Page-instance inherited-property selection uses the same compact
`profile-inheritance-card` interaction established for Property Set inheritance.
The card precedes the effective Table, shows the Inherited properties summary and
selected/total counts, and keeps its selection workspace collapsed behind Edit
selection. Once opened, it supplies the same searchable filters, paged disclosure
tree, checked, unchecked, mixed, focused, and expanded states, descendant counts,
property details, provenance, sticky Review/Cancel/Apply actions, keyboard tree
navigation, focus restoration, responsive layout, and non-colour selection cues.
The separate simplified inherited-property selector and a complete inherited
property table are not presented.

This is shared interaction, not shared persistence policy. Page and Flow
Page-instance cards continue to compose their complete current parent stack,
select newly applicable parent properties by default, and store only sparse
stable-identity exclusions. They retain their existing Page/downstream and
instance/occurrence scope, protected-property and dependency blockers,
current-parent restoration, staged review, Cancel, Apply, reload, and Undo
semantics. Property Set recipe membership and the existing inheritance cards for
Pages, Property Sets, and Events remain unchanged. Recipe-only source controls,
including Starting point and Copy selection from, do not appear on the contextual
aggregate Page or Flow Page-instance card because it has no single recipe source.

The correction changes no schema model, contributor precedence, compiler result,
stored selection meaning, publication, validation meaning, documentation, export,
or runtime observation. One shared card interaction may accept the contextual
selection model through an adapter, but a second reduced interaction contract is
not retained.

## Development focus and QA impact

Development focus starts with the inherited-property selection model and composed
workspace UI for one Page and one Flow Page-instance. Direct checks prove staged
selection, review and cancel, sparse Apply, effective Table omission,
current-parent restoration, protected/dependency blockers, reload, and Undo.
For this correction, direct checks additionally prove that every listed schema
host has one Table and no compiled property tree, and that Page and Flow
Page-instance mount the same inheritance-card interaction without changing their
contextual persistence model. Likely checks are
`test/data-layer-composed-schema-workspace-test.mjs`,
`test/data-layer-flow-page-instance-test.mjs`,
`test/data-layer-selective-profile-inheritance-test.mjs`,
`test/browser-packs/layered-schema.mjs`, and
`test/browser-packs/selective-profile-inheritance.mjs`.

QA impact is forecast as `layered_schema`, `flow_graph`, `flow_export`,
`live_flow_testing`, and `property_set_flow_sections`, with package proof. This
retains the shared consumers reached by the previously integrated exclusion
contract; the exact changed-path plan remains authoritative. Feature mode does
not authorize an all-runnable-pack checkpoint.

Likely existing shared integration surfaces and proposed ownership are:

| Source prefix or exact path | Proposed parent pack | Proposed subordinate verification slice | Exact consumers |
|---|---|---|---|
| `src/composed-schema/` and `src/data-layer-composed-schema-workspace-ui.ts` | `layered_schema` | `layered_schema_composition` | Page, Property Set, Event, Flow Page-instance, and Event-occurrence Tables; Page and Flow contextual selection; `flow_graph`, `flow_export`, and `live_flow_testing` composed-schema consumers |
| `src/composed-schema/inherited-property-selection/` | `layered_schema` | `layered_schema_composition` | retain the Page and Flow contextual selection model and sparse exclusion adapter; do not retain a separate reduced UI contract |
| `src/data-layer-layered-schema-ui.ts` | `layered_schema` | `layered_schema_composition` | Shared Profile layered editor and common Page, Property Set, Event, Flow Page-instance, and Event-occurrence runtime tools; remove only the duplicate property list |
| `src/data-layer-selective-profile-inheritance-ui.ts` | `layered_schema` | `selective_profile_inheritance` | installed inheritance-card interaction for Pages, Property Sets, and Events and the shared Page/Flow interaction boundary; preserve existing recipe behavior |

There is no stopped coherent product candidate. The coder must run governed
read-only intent classification from the exact current QA head before product
coding. A `coarse-boundary` result routes the mandatory independently reviewed
ownership-preparation stage. A bounded `granularity-assessment-required` or
`coarse-within-pack` result uses the documented judgment path and does not
automatically start preparation.

The implementation-and-review elapsed effort ceiling for the correction is eight
active hours. At four active hours, report Page and Flow Page-instance card
parity, all-host Table-only projection, current source paths, intent
classification, exact packs and tasks, forecast variance, failures, remaining
work, confidence, and completion forecast. Continue while the approved behavior
and safety boundaries remain unchanged and the completion path remains bounded.

## Acceptance mapping

- Layering 032 and runtime 032 prove first-class staged inheritance selection for
  Pages and Flow Page-instances, effective Table omission, contextual
  downstream scope, sparse persistence, source isolation, and safety blockers.
- Layering 034 and runtime 034 prove that exclusions remain discoverable outside
  the effective table, later parent additions stay dynamically inherited, and
  restoration uses the current parent definition with one Undo action.
- Layering 035 and runtime 035 prove one authoritative editable Table and no
  duplicate compiled property tree across all six layered schema hosts while
  preserving the remaining schema tools and all domain state.
- Layering 036 and runtime 036 prove exact inheritance-card interaction parity
  for Page and Flow Page-instance, absence of the simplified parallel selector,
  and retention of contextual sparse-exclusion persistence and safety behavior.
