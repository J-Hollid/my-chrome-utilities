# Data-layer Page and Flow inherited-property selection R01

Status: proposed from the user-reported inherited-property exclusion defects on
2026-08-23; awaiting approval for coder handoff

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
from the effective Table and Tree, their counts, compilation, validation, and
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

## Development focus and QA impact

Development focus starts with the inherited-property selection model and composed
workspace UI for one Page and one Flow Page-instance. Direct checks prove staged
selection, review and cancel, sparse Apply, effective Table and Tree omission,
current-parent restoration, protected/dependency blockers, reload, and Undo.
Likely checks are `test/data-layer-composed-schema-workspace-test.mjs`,
`test/data-layer-flow-page-instance-test.mjs`, and the installed layered-schema
browser target.

QA impact is forecast as `layered_schema`, `flow_graph`, `flow_export`,
`live_flow_testing`, and `property_set_flow_sections`, with package proof. This
retains the shared consumers reached by the previously integrated exclusion
contract; the exact changed-path plan remains authoritative. Feature mode does
not authorize an all-runnable-pack checkpoint.

Likely existing shared integration surfaces and proposed ownership are:

| Source prefix or exact path | Proposed parent pack | Proposed subordinate verification slice | Exact consumers |
|---|---|---|---|
| `src/composed-schema/` and `src/data-layer-composed-schema*` | `layered_schema` | `layered_schema_inherited_property_selection` | Page effective-schema selection and rows, Flow Page-instance persistence and rows, `flow_graph` Page-frame contexts, `flow_export` selected-context rows, and `live_flow_testing` Page-branch validation |
| `src/data-layer-layered-schema-ui.ts` | `layered_schema` | `layered_schema_inherited_property_selection_hosts` | direct Page workspace and `flow_graph` Flow Page-instance editor host |
| proposed `src/composed-schema/inherited-property-selection/` | `layered_schema` | `layered_schema_inherited_property_selection` | `layered_schema` Page workspace, `flow_graph` Flow Page-instance workspace, `flow_export` effective rows, and `live_flow_testing` validation |
| `src/data-layer-selective-profile-inheritance-ui.ts` | `layered_schema` | `selective_profile_inheritance` | existing Shared Profile inheritance cards for Pages, Property Sets, and Events; use as interaction reference and preserve its behavior |

There is no stopped coherent product candidate. The coder must run governed
read-only intent classification from the exact current QA head before product
coding. A `coarse-boundary` result routes the mandatory independently reviewed
ownership-preparation stage. A bounded `granularity-assessment-required` or
`coarse-within-pack` result uses the documented judgment path and does not
automatically start preparation.

The implementation-and-review elapsed effort ceiling is four active hours. At
two active hours, report Page and Flow Page-instance selection behavior, Table
and Tree projection, current source paths, intent classification, exact packs and
tasks, forecast variance, failures, remaining work, confidence, and completion
forecast. Continue while the approved behavior and safety boundaries remain
unchanged and the completion path remains bounded.

## Acceptance mapping

- Layering 032 and runtime 032 prove first-class staged inheritance selection for
  Pages and Flow Page-instances, effective Table and Tree omission, contextual
  downstream scope, sparse persistence, source isolation, and safety blockers.
- Layering 034 and runtime 034 prove that exclusions remain discoverable outside
  the effective table, later parent additions stay dynamically inherited, and
  restoration uses the current parent definition with one Undo action.
