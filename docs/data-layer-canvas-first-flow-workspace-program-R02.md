# Data-layer canvas-first Flow workspace program R02

## Authority

This program revises the existing directional Flow graph contract pair:

- `features/data-layer-directional-flow-specification-graph.feature`
- `features/data-layer-directional-flow-specification-graph-runtime.feature`

It also revises scenario 021 in the active layered-schema behavior/runtime pair so
Open schema contribution returns to contextual Details rather than restoring an
expanded or duplicate Flow card.

It is later authority than
`docs/data-layer-canvas-first-flow-authoring-correction-program-R01.md` for Flow
workspace layout, catalogs, Page placement, Section presentation, card detail,
camera behavior, Outline behavior, and contextual graph actions. It incorporates
the later Property Set and Flow Section separation contract rather than preserving
R01's Page Group lane model.

R01 remains historical rationale for the documentary graph, Page and Event
occurrence model, relationship semantics, derived example compilation, stable
identity, and Inspector-independent authoring where this program does not replace
those behaviors.

## Product intent

The Flow editor exists to let an operator understand and author a documentary
journey spatially. The journey's Pages, contained interaction Events, alternative
branches, merges, readiness, and gaps should be legible before the operator opens
deep configuration.

The canvas is therefore the workspace, not an output below a growing collection
of forms. Project growth may increase searchable content and graph extent, but it
must not increase persistent chrome or push the canvas below the initial viewport.

## Problems corrected

The current renderer mounts Section geometry forms, Page placement controls,
relationship endpoint selects, duplicate Page-frame cards, a fixed canvas, and a
permanent outline in the main document flow. As Sections, Pages, and Events grow,
those controls consume the route before the operator reaches the graph. New
Sections also default to one vertical stack, so presentation cannot naturally show
side-by-side phases such as Sales followed by Checkout. The stored viewport has a
zoom value but the installed canvas offers no camera interaction.

The active specifications also retain obsolete Page Group catalog and lane clauses
that contradict the later approved Section model. Leaving those clauses in a
second feature would preserve two incompatible acceptance authorities. This cycle
therefore revises the existing pair and retains its stable scenario indices.

## Workspace contract

### Canvas-first shell

Opening a Flow displays a bounded canvas inside the initial viewport at both 360px
and desktop widths. One compact Flow toolbar and viewport controls are the only
persistent graph chrome. Outline and Details start closed and reserve no space.
Project navigation follows its remembered visibility. Focus Canvas temporarily
hides project chrome and restores that remembered state on exit.

The outer document does not become the graph's scroll surface. Graph movement and
scale stay inside the canvas viewport. Opening Add, Outline, or Details keeps the
surface within the current viewport and restores invoking focus when it closes.

### Constant Add surface

One searchable Add palette opens at the operator's canvas invocation point. It
offers New Section plus existing canonical Pages and Events. The visible result
window is bounded, so a project with hundreds of definitions has the same closed
toolbar footprint as a small project.

Choosing a Page creates one distinct Flow Page instance at the chosen position.
Choosing an Event while a Page is selected, dropping it on a Page, or using the
keyboard creates one contained occurrence. Add does not create or edit canonical
Page or Event definitions; those lifecycle routes remain in their project
collections.

### Two-dimensional Sections

A Section is an optional Flow-owned presentation container with stable identity,
name, bounds, presentation order, and explicit Page-instance membership. Operators
may draw a Section, create one around a selection, rename it inline, move it, and
resize it anywhere in two dimensions. Sections may sit beside, above, or below one
another. Nested Sections are deferred.

Moving a Section moves its contained Pages by the same offset. Resizing changes
only bounds and never silently captures or releases a Page. Any Page may be placed
inside any Section or outside all Sections regardless of Property composition.
Relationships may cross Section boundaries.

Default Section removal retains its Page instances at the same canvas positions
outside every Section. Remove with contents is a separate destructive action with
named impact review. Both operations are one Flow-local Undo command. Section
geometry, membership, names, and order never contribute schema, validation,
provenance, Assignment targets, relationship meaning, or documentation order.

### Camera and spatial assistance

The canvas supports internal pan, zoom toward the pointer or gesture focus, visible
zoom percentage, Zoom in, Zoom out, 100 percent, Fit Flow, Fit selection, and a
toggleable minimap. A returning Flow restores its camera from project-scoped UI
state; a new Flow fits its initial content.

Manual zoom is bounded between 25 and 200 percent. Fit Flow may use a lower scale
when required to include the complete graph bounds. Camera, selection,
project-navigation visibility, open surfaces, semantic-detail level, and minimap
visibility are view state. They do not change canonical graph coordinates, Saved
Draft bytes, portable project data, Flow revisions, or Undo history.

Tidy is explicit assistance, never an automatic normalization. It previews either
horizontal or vertical placement for a selection or Section. Cancel is a no-op;
confirm applies one undoable presentation command. Tidy may reroute rendered edges
but cannot change endpoints, relationship kinds, containment, schema meaning, or
documentation order.

### Compact Page and Event cards

The canvas has one representation of each Page instance. A compact Page card makes
its Flow-specific name primary, its canonical Page source secondary, and its
Complete, Incomplete, Invalid, or Blocked readiness visible. Contained Events are
compact mini-cards with name, optional trigger, and readiness. The separate
pre-canvas Page-frame list is removed.

The visual treatment is restrained: one thin Page header, one flat content surface,
one boundary, and no stack of nested panel shadows. Sections use a low-emphasis
tinted boundary with their label on the edge. Selection, focus, and readiness keep
accessible contrast and do not rely on tint alone.

Semantic zoom simplifies inner Event detail at distant scale while retaining Page
identity and readiness. At normal scale, Event mini-cards are visible. Selecting a
Page or Event exposes a screen-sized contextual toolbar that does not scale with
the graph. Ports appear only on Page hover, focus, or selection; Event occurrences
remain portless.

Full derived JSON, contributor provenance, missing or invalid paths, and exact
repair routes live in optional contextual Details. Opening them never expands a
card, moves neighboring graph items, or stores a copied payload. Details owns no
exclusive topology command.

### Contextual graph authoring

The selected object determines available actions:

- Page: Rename in Flow, Add Event, Connect, Duplicate, Details, Open schema
  contribution, and Remove.
- Event: Move, Change Page, Duplicate, Details, Open schema contribution, and
  Remove.
- Relationship: Edit documentation and Delete.
- Section: Rename, Move, Resize, Wrap selection, Remove Section, and Remove with
  contents.

Dragging a Page connection to empty canvas opens existing-Page search at the
release point. Choosing a Page atomically creates its Flow instance and the
relationship. The compatible target port is chosen deterministically from the
source port: right uses target left, top uses target bottom, and bottom uses target
top. Cancelling creates neither. Canonical Page creation is not offered from this
path.

Only Page instances are relationship endpoints. Right to left infers
`expected_next`, top to bottom infers `alternative`, and bottom to top infers
`merge`; routing geometry does not change that meaning. All other port pairs are
invalid. Labels remain optional, Parallel remains migrated to Alternative, and the
graph makes no execution claim.

### On-demand Outline and accessibility

Outline is a collapsible alternative projection of the same graph, organized as
Sections, contained Pages, contained Events, Outside Sections, and relationships.
Search activation pans to, reveals, selects, and focuses the exact canvas item.
Canvas and Outline share stable identities and selection rather than duplicating
state.

Skip to canvas, deterministic focus traversal, spatial graph navigation, keyboard
connection mode, keyboard Add and contextual actions, Escape cancellation, and
focus restoration cover every pointer route. Hover-only controls also appear on
focus. Accessible state names object type, Flow and source Page identity,
readiness, containment, relationship endpoints, and invalid targets without
depending on color.

At 360px, transient surfaces use contained overlay or sheet presentations while
the canvas remains internally pannable. At desktop width, they may use bounded
drawers. Neither layout may introduce outer horizontal or vertical overflow.

## Preserved domain behavior

- The Flow remains a documentary journey rather than executable automation.
- A Page frame is its context-setting observed Page event; interaction Events are
  reusable Page-contained occurrences.
- Repeated Page insertions create distinct stable Flow Page-instance and schema-
  contributor identities with optional Flow-specific names.
- Event occurrences retain free positions, stable identity, trigger, sparse
  contribution, configured examples, and identity-preserving Page reassignment.
- Effective examples remain derived from canonical schema contributions and expose
  Complete, Incomplete, Invalid, and Blocked without copied JSON.
- Relationship endpoints and kinds, not coordinates or Sections, determine
  documentation topology and guided-testing choices.
- Property Sets, not Sections, participate in Page schema composition.
- Migration, portability, Draft status, stale documentation, and page-scoped Undo
  retain their existing truthfulness and stable-identity guarantees.

## Explicit supersession

This cycle removes the following R01 expectations from current acceptance:

- permanent Page Group, Page, and Event catalogs beside the canvas;
- selected Page Group lane order and top-to-bottom horizontal lane bands;
- Page placement eligibility derived from Page Group membership;
- before-lanes and after-lanes edge regions;
- raw coordinate, placement, and relationship endpoint forms before the canvas;
- a permanently allocated synchronized Outline;
- expanded Page or Event JSON inside canvas-card geometry; and
- cancellation as the only result of dropping a valid Page connection on empty
  canvas.

The later Property Set and Flow Section migration remains authoritative for
upgrading stored Page Group fields. This cycle does not introduce a second legacy
migration or restore Page Groups to Flow authoring.

## Acceptance mapping

| Risk | Scenarios | Required result |
|---|---|---|
| Canvas remains below growing controls | 001, 002, 020 | Canvas is initially visible, persistent chrome is constant, and the outer document does not scroll |
| Sections still behave as vertical schema lanes | 003, 004, 007, 014, 015 | Sections are arbitrary 2D, explicitly contain any Page, and remain schema-neutral |
| Contextual creation mutates reusable definitions | 002, 004, 005, 006, 010 | Add and edge-drop reuse canonical Pages and Events while creating stable Flow-local instances |
| Cards remain duplicated or visually overloaded | 013, 021, 025 | One compact semantic-zoom card projection retains readiness while Details owns full examples and repairs |
| Camera state changes project meaning | 016 | Pan, zoom, fit, and minimap are per-Flow UI state excluded from canonical data and Undo |
| Layout assistance rewrites semantics | 019 | Tidy is previewed, explicit, presentation-only, and undoable |
| Outline consumes space or becomes a second model | 018 | Closed Outline reserves no width and on-demand navigation uses the same stable graph |
| Direct manipulation loses keyboard access | 005, 012, 020, 023 | Pointer and keyboard routes have labelled focus, deterministic cancellation, and focus restoration |
| Relationship meaning drifts with routing | 009–012, 022, 023 | Semantic ports retain the three documentary kinds; Page-only topology and migrations remain stable |
| Existing occurrence and Page-instance semantics regress | 006, 008, 017, 024, 026 | Reuse, migration, sparse contributions, repeated instances, and Flow-specific names retain stable identity |
| Schema contribution return reintroduces an expanded card | Flow 013, 021, 025 and layered schema 021 | Readiness stays on cards while JSON, repairs, and restored deep detail live in contextual Details |

## Scope and deferrals

This program covers the Flow route shell, Add palette, Section manipulation,
camera, minimap, semantic zoom, compact cards, contextual toolbars, Details,
Outline, Tidy, pointer and keyboard authoring, responsive containment, and the
state boundary between presentation and canonical project data.

It does not choose a canvas rendering library, add nested Sections, splice a Page
into an existing relationship, reconnect a relationship endpoint before metadata
retention semantics are approved, create canonical Page or Event definitions from
the canvas, infer journey meaning from coordinates, execute a Flow, replace the
canonical schema editor, change Property Set composition, or redesign downstream
Documentation and Live surfaces.

## Verification boundary

The exact checkpoint combines `flow_graph` with `layered_schema` because this cycle
revises the active schema-contribution return route as well as the directional Flow
pair. It may use the approved Section model as a shared dependency, but it must not
reactivate Page Group lane acceptance or execute unrelated suites. The checkpoint
sequence is:

```sh
node scripts/run-focused-acceptance.mjs --pack flow_graph --pack layered_schema
node scripts/package.mjs
```
