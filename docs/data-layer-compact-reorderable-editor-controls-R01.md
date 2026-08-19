# Data layer compact reorderable editor controls R01

Status: approved for immediate QA implementation on 2026-08-19

Prepared: 2026-08-19

## Outcome

Ordered editor items use one compact control instead of a persistent pair of
Move earlier and Move later buttons. The control is both the visible drag handle
and the button that opens an accessible movement menu. Pointer users can drag a
flat item directly; touch, keyboard, speech, switch, and other single-pointer
users can perform the same move from the menu without dragging.

The pattern removes duplicated row chrome without making drag the only way to
reorder. It applies to ordered rows that also contain a checkbox, text input,
select, primary button, editable fieldset, or other interactive content. The
row body and its primary controls never become accidental drag targets.

## Research basis

The selected pattern follows current primary guidance:

- [WCAG 2.2 Understanding 2.5.7 Dragging
  Movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements)
  requires every dragging operation to have an equivalent single-pointer
  alternative that does not require dragging; keyboard support alone is not
  that alternative.
- [Atlassian drag-and-drop accessibility
  guidance](https://atlassian.design/components/pragmatic-drag-and-drop/accessibility-guidelines/)
  recommends one action-menu trigger per draggable entity, meaningful names,
  live announcements containing the item and old and new positions, and focus
  restoration to the original trigger.
- [Atlassian drag-and-drop design
  guidance](https://atlassian.design/components/pragmatic-drag-and-drop/design-guidelines)
  recommends an always-visible handle for primary reordering, restricting the
  drag target to that handle when the item contains interactive controls, a
  before-or-after drop indicator, one handle menu when movement is the only row
  action, and a Move dialog for trees.
- [WAI-ARIA Authoring Practices menu-button
  guidance](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/examples/menu-button-links/)
  supplies the expected button, menu, focus, Escape, Home, End, and arrow-key
  interactions. Native HTML remains preferred where it supplies the required
  semantics.
- [WCAG 2.2 Understanding 2.5.8 Target Size
  (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum)
  requires a 24 by 24 CSS-pixel target or sufficient spacing. This product uses
  a 44 by 44 CSS-pixel minimum for the sole persistent reorder trigger because
  the editors are routinely operated at narrow and touch viewports.
- [Apple drag-and-drop guidance](https://developer.apple.com/design/human-interface-guidelines/drag-and-drop)
  recommends making a completed drag reversible. Every reorder therefore uses
  the editor's existing undo history or an equivalent staged Undo move action.

The specification deliberately does not adopt deprecated `aria-grabbed`, a
custom keyboard drag mode, or an entire interactive row as the drag source.

## Interaction contract

Every reorderable item shows one always-visible handle/menu button named
`Reorder <item>, position <n> of <count>`. Activating the button opens a compact
menu with Move to first, Move one position earlier, Move one position later,
Move to last, and Move… actions. Boundary actions remain visible but disabled so
the menu does not jump as positions change. Move… opens a destination dialog
for an exact before-or-after placement.

Dragging starts only from the handle. A visible insertion indicator identifies
the exact before-or-after result. Clicking, selecting text in, or operating the
checkbox, input, select, disclosure, link, or primary action inside the same
item cannot begin a drag or change order. A cancelled or invalid drop changes
nothing.

After a successful move, focus returns to the same stable item trigger in its
new position. A polite status message names the item and its old and new
positions. The move is reversible through the surface's normal project Undo or,
for an unsaved local draft, an Undo move action that restores the exact previous
draft order.

An active filter makes direct drag unavailable because hidden items make a
relative drop ambiguous. The Reorder menu remains available. Move… states the
item's position in the complete order and presents the complete unfiltered
destination sequence; applying or cancelling the dialog retains the filter.

Simple flat lists permit direct drag and menu movement within their existing
ordering scope. Segment-constrained lists, such as defect reproduction steps,
show only legal destinations inside the segment. Hierarchical structures permit
direct drag only among visible siblings. Their Move… dialog identifies the
destination parent and exact before-or-after sibling, excludes the moving item's
own descendants, and preserves a visible moved item after completion.

Reordering never changes inclusion, field values, identity, validation, or
domain ownership. It follows the surface's existing persistence rule:

- local configuration remains staged until its existing owning save;
- a durable ordinary move creates one reversible project command; and
- Page Group membership and Property Set application moves retain their existing
  impact preview and confirmation before persistence.

## Migration inventory

The correction covers the current paired positional controls, including
directional column controls with the same redundant pattern:

| Pack | Ordered surface | Item content and preserved rule |
|---|---|---|
| `defects` | manual reproduction steps | step text, add, adjust, remove, and pathname-segment boundary |
| `flow_export` | Flow documentation property columns | inclusion checkbox and full property order |
| `flow_export` | Flow documentation metadata columns | inclusion checkbox and selected-column order |
| `flow_export` | Flow documentation context columns | inclusion checkbox, editable step label, and context order |
| `flow_export` | Documentation Set content choices | inclusion checkbox and configured section order |
| `flow_export` | Documentation concepts | inclusion checkbox and concept order |
| `flow_export` | Documentation section outline | section selection and selected-section order |
| `flow_export` | Rich template block tree | block selection and sibling or parent placement |
| `layered_schema` | canonical and composed property structure | structural ownership, sibling placement, and parent placement |
| `layered_schema` | composed allowed values | editable typed value and draft order |
| `property_set_flow_sections` | Page Property Set applications | applicability, provenance, open/remove actions, and impact review |
| `schemas` | assignment data-condition predicates | path, type, operator, comparison, and group order |
| `schemas` | guided array items | nested item fields, removal, and array order |
| `schemas` | specification table columns | visible column and configured column order |
| `schemas` and `layered_schema` | Page Group memberships | open/remove actions, composition order, and impact preview |

Free-position Flow canvas movement, connection gestures, tab order, and ordinary
navigation menus are outside this feature. Their spatial interaction is not the
paired list-ordering pattern being replaced.

## Development focus and QA impact

Stable task name: `compact-reorderable-editor-controls`.

Build one framework-free browser presentation primitive for flat ordered items,
movement menus, destination dialogs, live feedback, focus restoration, and
drag/drop placement. Consumer adapters supply stable item identities, complete
order, legal destinations, labels, commit callbacks, and optional impact-review
callbacks. Domain commands and storage formats remain owned by their current
packs.

Likely existing integration surfaces and the proposed verification topology are:

| Proposed source path or prefix | Proposed parent pack | Proposed subordinate slice | Exact consumers |
|---|---|---|---|
| `src/reorderable-editor/` | `shell` | `shared_reorderable_editor_controls` | `defects/defect_reproduction_reorder_adapter`, `flow_export/documentation_reorder_adapters`, `layered_schema/schema_authoring_reorder_adapters`, `property_set_flow_sections/property_set_application_reorder_adapter`, and `schemas/schema_builder_reorder_adapters` |
| `src/data-layer-defect-report-reproduction-controls.ts` | `defects` | `defect_reproduction_reorder_adapter` | manual reproduction composer and unified defect builder |
| `src/data-layer-flow-table-documentation-export-ui.ts` and `src/project-documentation/` | `flow_export` | `documentation_reorder_adapters` | Flow table documentation, Documentation Set Build and outline, concept ordering, and Rich template blocks |
| `src/canonical-schema-focused/`, `src/composed-schema/`, and `src/data-layer-composed-schema-workspace-focused-sections.ts` | `layered_schema` | `schema_authoring_reorder_adapters` | canonical and composed structure editors and composed allowed-value editor |
| `src/data-layer-property-set-flow-section-ui.ts` | `property_set_flow_sections` | `property_set_application_reorder_adapter` | Page Property Set applications and their impact review |
| `src/data-layer-schema-assignment-data-conditions-ui.ts`, `src/data-layer-schema-specification-builder-ui.ts`, and `src/specification-builder.ts` | `schemas` | `schema_builder_reorder_adapters` | assignment conditions, configured table columns, and guided arrays |

Page Group membership presentation is a likely shared `schemas` and
`layered_schema` integration surface whose production renderer must be located
by read-only intent inspection rather than guessed from its domain command file.
The coder must run governed read-only ownership intent classification from the
current QA head before product coding. A `coarse-boundary` result requires
independently reviewed ownership preparation. `granularity-assessment-required`
and `coarse-within-pack` require recorded judgment and do not automatically
start preparation.

Forecast focused evidence covers `shell`, `defects`, `flow_export`,
`layered_schema`, `property_set_flow_sections`, `schemas`, every selected
consumer and shared-component expansion, properties, installed browser adapters,
and package proof. The exact changed-path plan is authoritative; feature mode
does not run the all-20 gate.

Direct development checks should cover the shared primitive independently, then
the existing focused tests and browser adapters for each changed consumer. The
installed browser evidence exercises mouse drag, touch-equivalent single-click
menu operation, keyboard menu and dialog operation, screen-reader semantics,
focus after rerender, filtered full-order placement, 360-pixel reflow, undo, and
the unchanged consequential review paths.

The implementation-and-review effort ceiling is fourteen active hours. At seven
active hours, report the shared primitive, completed adapters, filtered and tree
dialogs, focus and announcement behavior, consequential reviews, exact planned
packs, forecast variance, remaining work, confidence, and completion forecast.
Continue by default while the approved interaction and domain-preservation
boundaries remain unchanged and a credible bounded path exists.

## Exclusions

This feature does not add cross-list transfer, multi-item drag, free spatial
movement, automatic ordering, persistence-format changes, new domain commands,
or a general-purpose UI framework. It does not make an entire interactive row
draggable, rely on keyboard access as the only drag alternative, reorder hidden
items relative to a filtered subset, or bypass an existing impact review. It
does not promote accumulated QA work to `master`.
