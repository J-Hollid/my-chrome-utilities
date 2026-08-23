# Data layer compact reorderable editor controls R01

Status: schema projection, no-op, and compact-handle presentation corrections
QA-integrated through `4d5c420f`; reorderable item row-composition correction
approved on 2026-08-23

Prepared: 2026-08-19

## Outcome

Ordered editor items use one compact handle and one movement menu instead of a
persistent pair of Move earlier and Move later buttons. The handle owns that menu
when the item has no existing actions menu; otherwise the one existing menu owns
the movement actions. Pointer users can drag a flat item directly; touch,
keyboard, speech, switch, and other single-pointer users can perform the same move
from the menu without dragging.

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
- [Google's Material icon
  set](https://github.com/google/material-design-icons) maintains conventional
  `drag_indicator` and `drag_handle` vector symbols on pixel-aligned icon grids.
  This product uses a self-contained inline SVG grip rather than a generated
  bitmap, external web font, or font-dependent Unicode symbol.
- [WAI-ARIA Authoring Practices menu-button
  guidance](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/examples/menu-button-links/)
  supplies the expected button, menu, focus, Escape, Home, End, and arrow-key
  interactions. Native HTML remains preferred where it supplies the required
  semantics.
- [WCAG 2.2 Understanding 2.5.8 Target Size
  (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum)
  requires a 24 by 24 CSS-pixel target or sufficient spacing. This product uses
  a 44 by 44 CSS-pixel minimum for the persistent reorder handle because
  the editors are routinely operated at narrow and touch viewports.
- [Apple drag-and-drop guidance](https://developer.apple.com/design/human-interface-guidelines/drag-and-drop)
  recommends making a completed drag reversible. Every reorder therefore uses
  the editor's existing undo history or an equivalent staged Undo move action.

The specification deliberately does not adopt deprecated `aria-grabbed`, a
custom keyboard drag mode, or an entire interactive row as the drag source.

## Interaction contract

Every actionable reorderable item shows one always-visible drag handle. When the
item has no existing actions menu, the handle is the one menu button named
`Reorder <item>, position <n> of <count>`. When the item already has an actions
menu, that existing menu contains the movement outcomes and the handle adds no
second menu button or tab stop. Activating the movement menu opens a compact menu
with Move to first, Move one position earlier, Move one position later, Move to
last, and Move… actions. Boundary actions remain visible but disabled so the menu
does not jump as positions change. Move… opens a destination dialog for an exact
before-or-after placement.

An item is actionable reorderable only when it has at least one legal destination
in the complete order. When no legal destination exists, the surface renders no
Reorder trigger, drag handle, movement menu, or drop target for that item. A
persistent trigger whose complete movement menu is disabled is prohibited.

Dragging starts only from the handle. A visible insertion indicator identifies
the exact before-or-after result. Clicking, selecting text in, or operating the
checkbox, input, select, disclosure, link, or primary action inside the same
item cannot begin a drag or change order. A cancelled or invalid drop changes
nothing.

After a successful move, focus returns to the same stable movement-menu trigger in its
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

## Approved schema projection and no-op correction

Stable task name: `schema-reorder-control-scope-correction`.

The canonical and composed schema Table views are editing projections, not
structural drag surfaces. Their first intrinsic-width Property editor cell keeps
exactly its existing Property actions button. No Reorder trigger appears in any
Table cell, and no movement control is relocated into Path, Source, State,
Inheritance, or another data column. Path retains the complete friendly path and
the combined width established by the schema-table contract. Every remaining
heading, cell allocation, inline editor, provenance value, validation state, and
focused-editor route remains unchanged.

Canonical Tree and focused Structure editors remain the structural reorder
surfaces. An inherited property has no Reorder affordance until Override here
establishes local structural identity. A locally owned property shows one Reorder
handle only when it has at least one legal structural destination; that handle is
the sole drag source and the item's one movement menu offers at least one enabled
movement action.
Ownership, legal sibling and parent boundaries, review, persistence, and Undo
continue to follow the existing schema-authoring contracts.

Page Property composition remains an ordered application surface. With zero or
one applied Property Set it shows no Reorder trigger, menu, drag handle, or drop
target. With two or more applications, every application has one compact Reorder
trigger, at least one enabled legal movement action, and direct drag from that
trigger. Boundary actions may remain visible and disabled while another movement
action is enabled. Every requested move still opens the existing impact review
before persistence and follows the existing confirmation, command, focus,
announcement, reload, and Undo rules.

This correction changes presentation and interaction eligibility only. It adds
no data-model, storage-format, domain-command, ordering-rule, or ownership change.

### Correction development focus and QA impact

The coder must first run governed read-only ownership intent classification from
the current QA head. A `coarse-boundary` result requires independently reviewed
ownership preparation. `granularity-assessment-required` and
`coarse-within-pack` require recorded judgment and do not automatically start
preparation. No new source prefix is proposed.

Likely existing integration surfaces and proposed verification topology are:

| Existing source path or prefix | Proposed parent pack | Proposed subordinate slice | Exact consumers |
|---|---|---|---|
| `src/canonical-schema-focused/navigator-rows.ts` and `src/data-layer-composed-schema-workspace-rows.ts` | `layered_schema` | `schema_authoring_reorder_adapters` | canonical Table and Tree projections, composed Table projection, and their focused-editor routes |
| `src/canonical-schema-focused/structure.ts` and `src/data-layer-composed-schema-workspace-focused-sections.ts` | `layered_schema` | `schema_authoring_reorder_adapters` | canonical and composed focused Structure editors |
| `src/data-layer-property-set-flow-section-ui.ts` | `property_set_flow_sections` | `property_set_application_reorder_adapter` | Page Property composition application rows and impact review |
| `src/reorderable-editor/` | `shell` | `shared_reorderable_editor_controls` | only the schema-authoring and Property Set application adapters above, and only if the no-legal-destination rule requires a shared-primitive change |

Direct development checks focus on exact schema Table DOM and column allocation,
inherited versus locally owned structural controls, singleton and multi-application
Property composition, enabled legal menu movement, drag initiation, and unchanged
impact review. The QA impact forecast is `layered_schema` and
`property_set_flow_sections`, plus `shell` only if the shared primitive changes.
The exact changed-path plan is authoritative and feature mode does not run the
all-pack gate.

The correction implementation-and-review effort ceiling is four active hours. At
two active hours, report Table projection restoration, inherited and local
ownership states, singleton and multi-application results, the exact planned
packs, focused failures, forecast variance, remaining work, confidence, and
completion forecast. Continue by default while these approved boundaries remain
unchanged and a credible bounded path exists.

## Approved compact-handle presentation correction

Stable task name: `compact-reorder-handle-presentation`.

Every legitimate reorder handle uses one always-visible vertical six-dot grip
drawn as a self-contained inline SVG. The visible grip is 16 by 16 CSS pixels,
uses `currentColor`, is hidden from the accessibility tree, and contains no
visible Reorder text. It is not a generated bitmap, external image, web-font
glyph, emoji, or font-dependent Unicode character.

The grip is centered in a square 44 by 44 CSS-pixel pointer target. The target is
placed at the leading edge and centered on the row, card, tree item, block, or
configured-column heading that it orders. It has fixed square geometry, zero
text-driven padding, no permanent filled surface, border, or shadow at rest, and
does not wrap or increase the host's block size beyond the larger of 44 CSS
pixels and the host's existing content. Hover supplies a clear surface change,
focus retains the product's strong visible ring, and an available pointer drag
uses grab and grabbing cursors. Forced-color and product-theme rendering retain
the grip and focus indication.

When an item has no existing actions menu, the 44-pixel grip target is its one
native movement-menu button. The button retains the complete accessible name,
expanded state, controlled-menu relationship, keyboard behavior, and drag
ownership from the existing contract. When an item already has a More, Property
actions, or equivalent actions menu, the grip is a non-button drag affordance,
adds no focus stop, and that one existing menu owns the same movement actions.
Direct Open, Remove, checkbox, field, or other non-menu controls do not count as
an existing actions menu and do not displace the grip menu button.

The presentation correction changes no movement outcome, legal destination,
filter behavior, ownership rule, impact review, focus restoration, announcement,
persistence, or Undo behavior.

### Compact-handle development focus and QA impact

The coder must first run governed read-only ownership intent classification from
the current QA head. A `coarse-boundary` result requires independently reviewed
ownership preparation. `granularity-assessment-required` and
`coarse-within-pack` require recorded judgment and do not automatically start
preparation. No new source prefix or image asset is proposed.

Likely existing integration surfaces and proposed verification topology are:

| Existing source path or prefix | Proposed parent pack | Proposed subordinate slice | Exact consumers |
|---|---|---|---|
| `src/reorderable-editor/` | `shell` | `shared_reorderable_editor_controls` | every legitimate reorder adapter in `defects`, `flow_export`, `layered_schema`, `property_set_flow_sections`, and `schemas` |
| `side-panel.css`, `side-panel-brand.css`, `specification-builder.css`, `specification-builder-brand.css`, and `schema-authoring-brand.css` | `shell` | `shared_reorderable_editor_controls` | side-panel and Studio row, card, tree, block, and configured-heading hosts, only where host styles must stop overriding the shared handle contract |
| existing consumer renderers listed under the original Development focus | their existing parent packs | their existing reorder-adapter slices | menu ownership integration only for items that already have a More, Property actions, or equivalent actions menu |

Direct development checks focus on inline-SVG identity, 16-pixel visible geometry,
44-pixel pointer geometry, centerline alignment, resting and interactive states,
theme and forced-color visibility, absence of visible text and wrapping, and
exactly one movement-menu button per item. The QA impact forecast is `shell`,
`defects`, `flow_export`, `layered_schema`, `property_set_flow_sections`, and
`schemas`. The exact changed-path plan is authoritative and feature mode does
not run the all-pack gate.

The presentation implementation-and-review effort ceiling is six active hours.
At three active hours, report the shared handle geometry and states, side-panel
and Studio host alignment, existing-menu integration, exact planned packs,
focused failures, forecast variance, remaining work, confidence, and completion
forecast. Continue by default while these approved boundaries remain unchanged
and a credible bounded path exists.

## Approved reorderable item row-composition correction

Stable task name: `reorderable-item-row-composition-correction`.

The Selected matrix column order exposes a shared composition defect rather than
a matrix-specific control defect. Its ordered-list marker and 44-pixel grip form
one visual line while the enhanced checkbox label forms a second line. The same
`renderOrderedChoices` adapter builds selected Flow contexts, Flow property rows,
matrix columns, and Site Profile columns, so all four consumers inherit the same
failure mode. Other migrated reorder consumers combine the shared control with
block labels, paragraphs, nested fields, action groups, or responsive grid
changes and therefore require the same explicit host-layout audit.

Current frontend guidance supports a single-item row with a leading handle,
flexible primary content, and optional trailing action rather than a standalone
handle band:

- [Atlassian drag-and-drop design
  guidance](https://atlassian.design/components/pragmatic-drag-and-drop/design-guidelines/)
  keeps an always-visible leading handle beside the item's content and models a
  list item as fixed leading content, flexible identity, and trailing action.
- [Primer drag-and-drop
  guidance](https://primer.style/accessibility/patterns/drag-and-drop/)
  treats one-dimensional reordering as a sortable list with a conventional
  six-dot grab affordance and equivalent input methods.
- [Apple lists and tables
  guidance](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables)
  treats text choices and reordering as row-based list behavior.
- [WCAG technique
  G219](https://www.w3.org/WAI/WCAG22/Techniques/general/G219.html) and
  [Understanding target size
  minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
  preserve a non-drag movement path and at least a 24-pixel target. The existing
  44 by 44 target and menu remain the stronger product contract.

### Row-composition contract

One logical reorder item has one primary visual row. When an ordered list shows a
visible ordinal, that ordinal, the 44 by 44 grip target, and the item's primary
identity or choice control occupy the same row band. The host reserves a fixed
44-pixel leading control column, a flexible `minmax(0, 1fr)`-equivalent content
column, and an optional intrinsic trailing-action column. The implementation may
use an equivalent host primitive rather than literal grid declarations, but the
measured result must be the same.

Long identity text, checkbox labels, and field content wrap inside the flexible
content column. Secondary fields, descriptions, nested children, and action
groups may continue below the primary row when their existing design requires
it, but subsequent content aligns to the content column and cannot strand the
grip or ordinal in a standalone full-width row. At 1280 and 360 CSS pixels, the
grip and primary identity have overlapping block-axis geometry, the host height
is not the additive height of a handle row plus a content row, and the document
has no horizontal overflow.

List, listitem, heading, field, label, and group semantics remain native or
equivalent. The visible ordinal is not removed merely to hide the defect. The
existing grip SVG, 44-pixel target, menu ownership, drag ownership, focus and
announcement behavior, legal destinations, inclusion, values, ordering scope,
persistence, impact review, and Undo remain unchanged. The whole item body does
not become draggable and the pointer target does not shrink.

This must be a shared host-composition contract or a small set of shape-specific
host contracts. A selector that repairs only Matrix columns, an absolute
positioning offset, or a presentation-only test fixture is insufficient.

### Broad consumer audit

The correction covers every consumer in the original migration inventory. The
following source-level audit identifies the required evidence and the known
risk, without presuming that every already-conforming host needs a product-code
change:

| Consumer family | Included hosts | Required row evidence |
|---|---|---|
| Shared Documentation ordered choices | selected Flow contexts, Flow property rows, Selected matrix column order, and Site Profile columns | Repair the confirmed shared adapter defect; marker when present, grip, checkbox, and label share the primary row |
| Other Documentation flat rows | Flow export property, metadata, and context columns; Documentation Set content choices and concepts | Grip and first choice or editable identity share the primary row; wrapping stays in the content column |
| Documentation hierarchical and responsive rows | Documentation outline and Rich template block tree | Responsive rules cannot collapse the grip into its own track; nested children remain aligned and hierarchy semantics remain intact |
| Schema and composition rows | canonical and composed structure, composed allowed values, Page Property Set applications, Page Group memberships, assignment predicates, guided arrays, and configured specification headings | Grip shares the first row with the item identity or first primary control while existing secondary fields and actions retain their layout |
| Defect reproduction rows | manual reproduction steps | Preserve the existing explicit 44-pixel-plus-flexible-content layout as the reference host and regression control |

The installed aggregate must enumerate each migrated consumer and record its own
host and primary-content geometry. It cannot reuse only the defect-reproduction
presentation samples as evidence for “every migrated installed surface.” An
already-conforming consumer may produce evidence without a source edit; a
nonconforming consumer must use the shared or shape-specific row contract.

The primary regression opens Selected matrix column order with multiple selected
Page and Event contexts at both 1280 and 360 CSS pixels. Geometry proves the
ordinal, grip target, checkbox, and label form one compact item row; specifically,
the grip and enhanced choice label overlap on the block axis and the grip does not
end before the label begins. Reordering one column and deselecting another must
still update only the existing staged order and inclusion state, with unrelated
Documentation Set, source, theme, preview, and publication bytes unchanged.

### Row-composition development focus and QA impact

The coder must first run governed read-only ownership intent classification from
the current QA head. A `coarse-boundary` result requires independently reviewed
ownership preparation. `granularity-assessment-required` and
`coarse-within-pack` require recorded judgment and do not automatically start
preparation. No data-model, repository, or new source-prefix change is proposed.

Likely existing integration surfaces and proposed verification topology are:

| Existing source path or prefix | Proposed parent pack | Proposed subordinate slice | Exact consumers |
|---|---|---|---|
| `src/reorderable-editor/` and shared host styles | `shell` | `shared_reorderable_editor_controls` | reusable row composition, without changing the handle or interaction contract |
| `src/project-documentation/` and `src/data-layer-flow-table-documentation-export-ui.ts` | `flow_export` | `documentation_reorder_adapters` | every Documentation ordered-choice, flat-row, outline, and Rich-block consumer |
| `src/canonical-schema-focused/`, `src/composed-schema/`, and composed-workspace renderers | `layered_schema` | `schema_authoring_reorder_adapters` | structural rows and allowed-value rows |
| `src/data-layer-property-set-flow-section-ui.ts` | `property_set_flow_sections` | `property_set_application_reorder_adapter` | application rows and existing impact review |
| `src/data-layer-page-group-membership.ts`, schema-assignment renderers, and specification builders | `schemas` and `layered_schema` as planned by ownership | existing reorder-adapter slices | memberships, predicates, guided arrays, and configured headings |
| `src/data-layer-defect-report-reproduction-controls.ts` | `defects` | `defect_reproduction_reorder_adapter` | existing conforming reference geometry |

Direct development checks begin with the shared row primitive and the four
`renderOrderedChoices` consumers, then exercise every audited consumer's actual
host at wide and constrained widths. Evidence covers block-axis overlap,
centerline alignment, content-column wrapping, host height, overflow, target size,
semantics, movement and inclusion isolation, menu and drag operation, focus,
announcement, persistence, impact review where applicable, and Undo.

The QA impact forecast is `shell`, `defects`, `flow_export`, `layered_schema`,
`property_set_flow_sections`, and `schemas`, plus properties, package proof, and
every selected shared-component and consumer expansion. The exact changed-path
plan is authoritative; feature mode does not run the all-20 gate.

The correction implementation-and-review effort ceiling is eight active hours.
At four active hours, report the shared row contract, the four ordered-choice
results, the remaining consumer audit, per-consumer installed geometry, exact
planned packs, focused failures, forecast variance, remaining work, confidence,
and completion forecast. Continue by default while these approved boundaries
remain unchanged and a credible bounded path exists.

## Exclusions

This feature does not add cross-list transfer, multi-item drag, free spatial
movement, automatic ordering, persistence-format changes, new domain commands,
or a general-purpose UI framework. It does not make an entire interactive row
draggable, rely on keyboard access as the only drag alternative, reorder hidden
items relative to a filtered subset, or bypass an existing impact review. It
does not promote accumulated QA work to `master`.
