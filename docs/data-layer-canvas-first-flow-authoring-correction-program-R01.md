# Data-layer canvas-first Flow authoring correction program R01

## Authority

This correction program is the current authority for the active directional Flow
graph checkpoint. It replaces the form-first interpretation of
`data-layer-directional-flow-specification-graph` while preserving the approved
documentary model, stable-reference model, Page Group containment rules, independent
per-Event schema validation, and manual journey-expectation boundary.

The following earlier clauses are explicitly superseded:

- a per-occurrence relationship form is not the sole relationship-authoring path;
- relationship creation and editing do not require the Inspector;
- Page Group selection and ordering do not live only in a Flow Inspector form; and
- `Context`, `Shipping`, `Payment`, and `Merge` are not semantic or fallback lanes.

## Corrective outcome

The Flow workspace behaves as a graphical specification editor. An operator selects
and orders existing Page Groups to define lanes, places Page components into their
valid lanes or transient free-page edge regions, places bound context events and reusable
interaction Events inside Page frames, positions them freely within their valid
containment, and draws directed relationships between visible ports.

The Inspector is optional secondary detail. The complete graph can be created,
connected, documented, persisted, reloaded, and reopened while it is closed.

## Confirmed implementation failures

The installed implementation contradicts the intended model in four production
boundaries:

1. Documentary add and edit forms are moved into `#project-inspector`, so the
   canvas is not the primary authoring surface.
2. A constant lane list defines Context, Shipping, Payment, and Merge and is used
   by fallback placement, movement, and outline controls even when Page Groups are
   available.
3. Relationships are authored with source and target selects. Rendered SVG edges
   have no connection ports or pointer-drawing gesture.
4. The main palette contains Page and Event buttons but no Page Group catalog;
   lane choice and ordering are injected into the Inspector.

The earlier acceptance contract also contained contradictory requirements that
allowed these failures to pass. The correction revises the existing feature pair
rather than adding an overlapping feature whose older scenarios would remain valid.

## Product model

### Page Groups define lanes

A Flow stores an ordered list of stable Page Group references. The current Page
Group names are rendered as lanes in that order. Horizontal positions are a view
projection of the order, not semantic identity.

An empty Flow has no lanes until the operator selects Page Groups. There is no
default lane list. Removing a lane containing Page frames is blocked until the
operator moves or removes those frames.

### Pages define frames and context

A grouped Page may be added only to the lane for its actual Page Group membership.
Dragging a Page into another group is rejected and deep-links to membership editing.
The Flow cannot silently rewrite the Page contract.

A Page without Page Group membership may be placed before the first lane or after
the last lane. These are compact free-page regions, not lanes. When no free Page is
being dragged and no frame occupies an edge, no large ungrouped background is
rendered. Dragging an eligible Page beyond either lane boundary reveals narrow
`Place before lanes` and `Place after lanes` affordances; the target beneath the
pointer expands only enough to make the drop clear.

A dropped free frame stores `before-lanes` or `after-lanes` plus presentation
coordinates, Page identity, and context-binding identity without an invented Page
Group. Existing free frames may move between the two sides because side placement
is documentary layout, not membership. A grouped Page cannot leave its lane through
an edge target and instead receives a link to membership editing.

A Page frame exposes its Page-owned context-event bindings. Each binding includes
the Event reference and trigger purpose, such as initial load or SPA route change.
Creating a Page-context occurrence stores the binding reference; it does not infer
context from an Event name or copy the Event schema.

### Events define reusable interaction components

The Events catalog provides searchable predefined Events. Dropping or keyboard-
inserting an Event into a Page frame creates a distinct occurrence that retains the
Event reference and Page containment. The same Event may be reused in multiple
frames without duplicating or mutating its definition or schema.

An Event occurrence cannot be moved into another Page frame or Page Group. To use
it elsewhere, the operator inserts the predefined Event again.

### Relationships are drawn topology

Each occurrence exposes labelled input and output ports. Pointer drawing begins at
an output port, shows a live directed preview, identifies valid and invalid targets,
and commits only when released over a valid input port. Escape, empty canvas, the
source node, and incompatible targets cancel without a partial record.

The new edge defaults to expected-next and opens an inline popover for expected-
next, alternative, parallel, or merge; group; label; plain-language documentation
condition; and expectation. Parallel branches and merges are included in the first
release.

Keyboard connection mode starts from a focused output port, moves a target indicator
between eligible inputs, commits with Enter, cancels with Escape, and restores focus
deterministically.

Relationships persist stable source occurrence, target occurrence, kind, and
relationship identities. Drawing never creates or modifies executable Flow steps or
transitions.

## Workspace responsibilities

The main Flow workspace owns:

- searchable Page Groups, Pages, and Events catalogs;
- Page Group selection, ordering, and guarded removal;
- Page-frame insertion and transient before-lanes and after-lanes free-page targets;
- Page-context and interaction Event insertion;
- free positioning within containment;
- connection ports and drawing;
- inline graph actions and relationship editing; and
- the synchronized outline.

Selecting a node exposes inline Move, Connect, Duplicate occurrence, Remove, and
Open schema contribution actions. Opening the canonical schema editor replaces the
main workspace temporarily; returning restores the selected graph item and viewport.

The optional Inspector may show contextual details, provenance, or extended
metadata. Closing it cannot remove or disable a graph command. It contains no source,
target, fixed-lane, or documentary occurrence-creation form.

Structured executable Flow authoring remains a separately labelled Advanced
capability and never shares documentary occurrence or relationship records.

## Persistence and safety

All catalogs use human names while persisting stable references. Renaming a Page
Group, Page, Event, or binding updates rendered labels without rewriting graph
topology. Reload preserves:

- ordered Page Group references;
- Page-frame containment;
- free Page-frame before-lanes or after-lanes region and coordinates;
- binding and Event references;
- presentation coordinates;
- selected item and viewport where applicable; and
- relationship identity, endpoints, kind, group, label, condition, and expectation.

Invalid drops, cross-boundary movement, cancelled connections, and guarded lane
removal are no-op commands: project bytes and revision do not change.

## Accessibility and alternative operation

Every pointer operation has a keyboard route. Catalog components are searchable and
keyboard-insertable. Ports are labelled with source or target occurrence names.
Connection mode announces the current target and validity. Saving an inline popover
returns focus to the edge; cancelling returns focus to the source. Graph and outline
select the same stable item.

The outline is a synchronized alternative projection, not a second model. It may
edit relationship meaning and occurrence documentation, but it does not reintroduce
fixed-lane or source/target forms.

## Assurance boundary

The graph documents expected topology, optionality, multiplicity, parallel branches,
merges, and conditions for human review and developer communication. It does not
validate that a sequence or branch executed.

Each Event occurrence continues to resolve its canonical Event schema independently.
No Flow occurrence stores a schema copy. No graph interaction claims full-flow
validation.

Project-wide documentation export, temporal execution, fixtures, coverage, release,
and Live remain outside this correction cycle.

## Delivery phases

### Phase A — remove contradictory ownership

Move documentary controls out of the Inspector, remove fixed lane constants and
fallbacks, and make the three main-workspace catalogs authoritative.

### Phase B — catalog and containment authoring

Implement Page Group lane selection/order, grouped and ungrouped Page frames,
Page-owned context bindings, reusable Event insertion, and guarded movement.

### Phase C — graphical relationship authoring

Implement connection ports, live pointer preview, target validity, atomic commit and
cancel, inline relationship popovers, parallel and merge editing, and edge selection.

### Phase D — keyboard, persistence, and terminal proof

Implement keyboard connection mode, deterministic focus, graph/outline selection,
rename/reload stability, schema-editor return, and the fresh-flow installed-extension
exercise.

## Finding-to-feature traceability

`Flow NNN` refers to
`features/data-layer-directional-flow-specification-graph.feature` and its paired
runtime feature.

| ID | Finding or decision | Feature and scenario | Visible behavior | Production boundary | Required evidence | Phase | Terminal pass condition |
|---|---|---|---|---|---|---|---|
| F01 | Graph interfacing is still Inspector-first | Flow 001 | Catalogs, canvas, outline, and all graph actions remain usable with Inspector closed | Builder routing and Flow UI composition | Installed DOM ancestry and closed-Inspector actions | A | Inspector contains no documentary creation form |
| F02 | Components are not coherently selectable | Flow 001 | Page Groups, Pages, and Events are separate searchable main-workspace catalogs | Catalog projections and command routing | Rendered catalogs using production collections | A, B | Operator can begin a Flow without the global entity or Inspector form |
| F03 | Swimlanes remain hardcoded | Flow 002 | Empty Flow has no lanes; selected Page Groups exclusively define ordered lanes | Flow repository and lane projection | Stored stable references and rendered lane labels | A, B | No Context, Shipping, Payment, Merge, or other fallback exists |
| F04 | Lane ordering is hidden in Inspector | Flow 003 | Main-workspace reorder and guarded removal | Lane commands and revision store | Order change plus blocked removal evidence | B | Reordering changes projection without identity changes |
| F05 | Pages need Page Group-aware insertion | Flow 004 | Page search, owner labels, valid-lane insert, invalid-lane repair | Page membership resolver and frame command | Stable IDs and no-op rejection | B | A Page cannot be inserted into the wrong group |
| F06 | Page context may have multiple setting Events | Flow 005 | Page frame offers binding names and trigger purposes | Page context-binding repository | Two stored binding references and no role/schema copy | B | Initial load and SPA bindings coexist distinctly |
| F07 | Interaction Events must be reusable components | Flow 006 | Drag and keyboard insertion into Page frames | Event catalog and occurrence command | Same Event ID, distinct occurrence IDs | B | Reuse does not duplicate the Event or schema |
| F08 | Free Pages are rendered as one permanent lane after all Page Groups | Flow 007 | Transient left and right edge targets create compact frames that sandwich lanes | Free-frame command, edge-target UI, and layout projection | Target geometry, stored region and coordinates, absent Page Group ID | B | No free-page pseudo-lane or empty lane-sized background remains |
| F09 | Freehand layout must respect contracts | Flow 008 | Free positioning inside frame; cross-boundary rejection | Pointer/keyboard layout adapter and repository | Coordinates after reload and unchanged revision on rejection | B | Movement never mutates Page membership |
| F10 | Relationships are not drawable | Flow 009 | Output-to-input drag, preview, target highlight, atomic edge | Pointer adapter, SVG renderer, relationship command | Actual pointer events, temporary edge, stored relationship | C | Edge is created without source/target form submission |
| F11 | Cancelled drawing can leave unsafe state | Flow 010 | Invalid targets and Escape remove preview with no write | Connection state machine and transaction boundary | Byte-identical project and absent partial record | C | Every invalid or cancelled gesture is atomic no-op |
| F12 | Parallel branches belong in first release | Flow 011 | Two Parallel edges and two Merge edges edited inline | Relationship model and graph/outline renderer | Exact endpoints, kind, group, labels, conditions | C | Branch/merge topology persists without execution claim |
| F13 | Drawing requires a keyboard equivalent | Flow 012 | Port connection mode, target navigation, popover focus, edge focus | Keyboard state machine and focus adapter | Focus sequence and one stored relationship | D | Complete connection needs neither pointer nor Inspector |
| F14 | Inspector should complement the canvas | Flow 013 | Inline node actions; optional details; schema editor round trip | Selection routing and workspace restoration | Closed-Inspector actions plus restored node/viewport | A, D | No exclusive graph command appears only in Inspector |
| F15 | Renames and reload can corrupt human projections | Flow 014 | New names with unchanged IDs, coordinates, topology, and meaning | Catalog subscriptions, repository, renderer | Before/after stable references and reload evidence | D | Renames change labels only |
| F16 | Isolated tests can mask the wrong interface | Flow 015 | Fresh Flow built entirely through installed main-workspace controls | Built extension, production storage, Flow UI | End-to-end control trace and canonical records | D | Terminal result has derived lanes, frames, nodes, edges, and no forbidden state |
| F17 | Free frames need two-sided movement without weakening membership | Flow 016 | Pointer and keyboard move free frames between sides while grouped Pages remain contained | Layout command, membership guard, focus adapter, reload projection | Stable identities, unchanged rejection revision, restored focus and sides | B, D | Edge region changes presentation only and never enters lane order |

## Terminal acceptance

The correction passes only when the behavior and runtime features parse and
dry-check with no findings, the focused `flow_graph` pack executes the runtime
scenarios through the built extension, and packaging consumes that same build.

Terminal evidence must prove a fresh Flow can be completed with the Inspector
closed. It must also prove that free Pages use transient left and right edge targets
rather than a permanent ungrouped lane. A component-only canvas, direct repository
injection, pre-created edges, form-submitted source and target, fixed lane constants,
or assertions over source strings cannot satisfy the runtime feature.
