# Data-layer canvas-first Flow authoring correction program R01

## Authority

This correction program is the current authority for the active directional Flow
graph checkpoint. It replaces the form-first interpretation of
`data-layer-directional-flow-specification-graph` while preserving the approved
documentary model, stable-reference model, Page Group membership and schema-
inheritance rules, independent per-Event schema validation, and manual journey-
expectation boundary.

The following earlier clauses are explicitly superseded:

- a per-occurrence relationship form is not the sole relationship-authoring path;
- relationship creation and editing do not require the Inspector;
- Page Group selection and ordering do not live only in a Flow Inspector form; and
- `Context`, `Shipping`, `Payment`, and `Merge` are not semantic or fallback lanes.

## Corrective outcome

The Flow workspace behaves as a graphical specification editor. An operator selects
and orders existing Page Groups to define top-to-bottom horizontal lane bands,
places Page components left to right or in vertical branches inside eligible bands
or transient free-page edge regions, positions reusable context-setting and
interaction Events freely inside Page frames, and draws directed relationships
between visible Page-frame and Event-occurrence ports. Event nodes present a
read-only JSON example derived from the effective occurrence schema rather than a
separate copied payload.

The Inspector is optional secondary detail. The complete graph can be created,
connected, documented, persisted, reloaded, and reopened while it is closed.

## Confirmed implementation failures

The installed implementation contradicts the intended model in eight production
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
5. A grouped Page is rejected when placed outside a named lane, even though free
   placement is documentary and must not change Page Group membership or schema
   inheritance.
6. Relationship targets are limited to Event occurrences, preventing Page-to-Page,
   Page-to-Event, and Event-to-Page documentation.
7. Event occurrences are forced into a list rather than retaining freely authored,
   side-by-side positions within an expanding Page frame.
8. Event nodes do not expose a trustworthy JSON example assembled from the
   effective occurrence schema and its configured examples.

The earlier acceptance contract also contained contradictory requirements that
allowed these failures to pass. The correction revises the existing feature pair
rather than adding an overlapping feature whose older scenarios would remain valid.

## Product model

### Page Groups define lanes

A Flow stores an ordered list of stable Page Group references. The current Page
Group names are rendered as horizontal lane bands in top-to-bottom order. Page
positions inside a band are operator-authored presentation coordinates, not a
semantic sequence or identity.

An empty Flow has no lanes until the operator selects Page Groups. There is no
default lane list. Removing a lane containing Page frames is blocked until the
operator moves or removes those frames.

### Pages define frames and context

A grouped Page may be added to any selected lane whose Page Group is in its ordered
membership stack. If several memberships are selected as lanes, each is a valid
target and the operator chooses the frame's placement group. A Page frame may move
between eligible lanes while retaining its identity, contents, relationships, and
effective schema. An ineligible target is rejected and deep-links to membership
editing. The Flow cannot silently rewrite the Page contract.

Page membership order and Flow lane order are independent. Membership order controls
general-to-specific schema composition; Flow lane order controls documentary canvas
layout; the frame's placement-group reference records which eligible lane contains
that instance. Reordering memberships never moves a frame, and moving a frame never
reorders memberships or changes which applicable Page Group rules compile.

A Page may be placed before the first lane or after the last lane whether or not it
has Page Group memberships. These are compact free-page regions, not lanes. When no
Page is being dragged and no frame occupies an edge, no large ungrouped background
is rendered. Dragging a Page beyond either lane boundary reveals narrow
`Place before lanes` and `Place after lanes` affordances; the target beneath the
pointer expands only enough to make the drop clear.

A dropped free frame stores `before-lanes` or `after-lanes` plus presentation
coordinates and Page identity without a placement-group or context-binding
reference. Its Page retains every ordered Page Group membership and the same
effective schema contribution stack. Existing free frames may move between the two
sides or return to an eligible named lane because placement is documentary layout,
not membership. An ineligible named-lane drop remains rejected and deep-links to
membership editing; an edge-region drop does not require membership repair.

Within a named horizontal band, Pages may be positioned left to right and above or
below one another to express a main route, alternative branch, and merge. The band
expands vertically around authored coordinates. It does not snap Pages into fixed
columns or turn them into a vertical list.

The Page frame is the Page context. It can be created before any Event is added.
Page applicability and production assignment rules determine whether an observation
belongs to that Page; the Flow graph does not introduce another validation selector.

### Events define reusable Page-contained components

The Events catalog provides searchable predefined context-setting and interaction
Events. Dropping or keyboard-inserting either role into a Page frame creates the
same kind of distinct Page-contained occurrence with stable Page-frame and Event
references. A context-setting occurrence may document a trigger such as initial
load or SPA route change. Its role and trigger explain the specification; they do
not choose the production validation target.

The same Event may be reused in multiple frames without duplicating or mutating its
definition or schema. No Event insertion, Page placement, compiler, export, or
assignment path requires a separate Page-context binding. Legacy binding-backed
graph occurrences migrate to direct Event references with their role and trigger
preserved; no parallel binding model remains editable or authoritative.

An Event occurrence cannot be moved into another Page frame or Page Group. To use
it elsewhere, the operator inserts the predefined Event again.

Event occurrences retain free coordinates inside their Page frame and may appear
side by side. The Page frame expands to contain them. A pointer or keyboard move
that crosses the Page-frame boundary returns the Event to its last valid position
without a canonical write.

### Event nodes derive effective JSON examples

An Event node shows the Event name and may expand a read-only formatted JSON example
assembled on demand from the canonical effective occurrence schema. The contribution
order is Shared Profile, applicable ordered Page Groups, Page, Flow Page instance,
Event, then Event occurrence. For each property, the most-specific configured
example or expected value wins; object paths are assembled as nested JSON and
forbidden properties are omitted. The derivation never invents a value and never
persists a copied JSON payload.

The node reports `Complete` only when every required effective property has a valid
configured example. A missing required example produces `Incomplete` and is listed
outside the JSON; a value that violates its effective type or rule produces
`Invalid`; an unresolved inherited-schema conflict produces `Blocked`. Each issue
uses the exact property path and offers `Edit examples` to the corresponding
canonical schema-instance field. Displayed values expose effective-source
provenance, so the operator can distinguish inherited and occurrence-specific data.

### Relationships are drawn topology

Each Page frame and Event occurrence exposes labelled input and output ports.
Pointer drawing begins at an output port, shows a live directed preview, identifies
valid and invalid targets, and commits only when released over a valid input port.
Escape, empty canvas, the source node, and incompatible targets cancel without a
partial record.

The first release supports Page-to-Page context progression, Page-to-Event expected
activity within a Page, Event-to-Page progression to the next Page, and Event-to-
Event interaction progression. Relationships therefore persist a typed stable
source endpoint and typed stable target endpoint, each referencing either a Page
frame or Event occurrence.

The new edge defaults to expected-next and opens an inline popover for expected-
next, alternative, parallel, or merge; group; label; plain-language documentation
condition; and expectation. Parallel branches and merges are included in the first
release.

Keyboard connection mode starts from a focused output port, moves a target indicator
between eligible inputs, commits with Enter, cancels with Escape, and restores focus
deterministically.

Relationships persist stable typed endpoints, kind, and relationship identities.
Drawing never creates or modifies executable Flow steps or transitions.

## Workspace responsibilities

The main Flow workspace owns:

- searchable Page Groups, Pages, and Events catalogs;
- Page Group selection, ordering, and guarded removal;
- Page-frame insertion and transient before-lanes and after-lanes free-page targets;
- context-setting and interaction Event insertion through one occurrence model;
- free Page and Event positioning within their respective containment boundaries;
- Page-frame and Event-occurrence connection ports and drawing;
- effective-schema-derived Event JSON examples and repair links;
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
Group, Page, or Event updates rendered labels without rewriting graph topology.
Reload preserves:

- ordered Page Group references;
- Page-frame containment;
- free Page-frame before-lanes or after-lanes region and coordinates;
- Event occurrence references, roles, and documentary triggers;
- Page-frame and Event-occurrence presentation coordinates;
- selected item and viewport where applicable; and
- relationship identity, endpoints, kind, group, label, condition, and expectation.

Invalid drops, Event cross-boundary movement, cancelled connections, guarded lane
removal, and removal of an in-use Page membership are no-op commands: project bytes
and revision do not change.

## Accessibility and alternative operation

Every pointer operation has a keyboard route. Catalog components are searchable and
keyboard-insertable. Ports are labelled with source or target Page or Event names.
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

Each Event occurrence continues to resolve its canonical effective schema
independently. Its displayed JSON is a derived example, not a stored schema or
payload copy. `Complete` describes example completeness against that occurrence
schema; it does not prove that the Event fired or that the Flow ran. No graph
interaction claims full-flow validation.

Project-wide documentation export, temporal execution, fixtures, coverage, release,
and Live remain outside this correction cycle.

## Delivery phases

### Phase A — remove contradictory ownership

Move documentary controls out of the Inspector, remove fixed lane constants and
fallbacks, migrate legacy context-binding records to direct Event occurrences, and
make the three main-workspace catalogs authoritative.

### Phase B — catalog and containment authoring

Implement Page Group lane selection/order, horizontal-band Page layout, free edge
placement for grouped and ungrouped Pages without membership mutation, multi-
membership named-lane eligibility, side-by-side reusable Event insertion,
assignment-owned Page resolution, legacy binding migration, and guarded movement.

### Phase C — graphical relationship authoring

Implement typed Page-frame and Event-occurrence connection ports, all four endpoint
combinations, live pointer preview, target validity, atomic commit and cancel,
inline relationship popovers, parallel and merge editing, and edge selection.

### Phase D — keyboard, persistence, and terminal proof

Implement keyboard connection mode, deterministic focus, graph/outline selection,
rename/reload stability, schema-editor return, derived Event JSON status and repair,
and the fresh-flow installed-extension exercise.

## Finding-to-feature traceability

`Flow NNN` refers to
`features/data-layer-directional-flow-specification-graph.feature` and its paired
runtime feature.

| ID | Finding or decision | Feature and scenario | Visible behavior | Production boundary | Required evidence | Phase | Terminal pass condition |
|---|---|---|---|---|---|---|---|
| F01 | Graph interfacing is still Inspector-first | Flow 001 | Catalogs, canvas, outline, and all graph actions remain usable with Inspector closed | Builder routing and Flow UI composition | Installed DOM ancestry and closed-Inspector actions | A | Inspector contains no documentary creation form |
| F02 | Components are not coherently selectable | Flow 001 | Page Groups, Pages, and Events are separate searchable main-workspace catalogs | Catalog projections and command routing | Rendered catalogs using production collections | A, B | Operator can begin a Flow without the global entity or Inspector form |
| F03 | Swimlanes remain hardcoded | Flow 002 | Empty Flow has no lanes; selected Page Groups exclusively define ordered lanes | Flow repository and lane projection | Stored stable references and rendered lane labels | A, B | No Context, Shipping, Payment, Merge, or other fallback exists |
| F04 | Lane ordering is hidden in Inspector | Flow 003 | Main-workspace reorder produces top-to-bottom horizontal bands and guards removal | Lane commands and revision store | Order change, measured band order, and blocked removal evidence | B | Reordering changes projection without identity changes |
| F05 | Pages need Page Group-aware insertion | Flow 004 | Page search, owner labels, valid-lane insert, invalid-lane repair | Page membership resolver and frame command | Stable IDs and no-op rejection | B | A Page cannot be inserted into a group outside its memberships |
| F06 | Page itself is context and assignment already resolves applicability | Flow 005; Layering 007 | Context-setting Events use ordinary Page-contained occurrences with role and trigger | Event occurrence command, assignment resolver, and legacy migration | Direct Page-frame and Event references, assignment evidence, absent binding state | B, D | No Page or Event action requires or consults a context binding |
| F07 | Interaction Events must be reusable components | Flow 006 | Drag and keyboard insertion into Page frames | Event catalog and occurrence command | Same Event ID, distinct occurrence IDs | B | Reuse does not duplicate the Event or schema |
| F08 | Free Pages are rendered as one permanent lane after all Page Groups | Flow 007 | Transient left and right edge targets create compact frames without Event prerequisites | Free-frame command, edge-target UI, and layout projection | Target geometry, stored region and coordinates, absent placement-group and binding IDs | B | No free-page pseudo-lane, empty lane-sized background, or binding prerequisite remains |
| F09 | Events cannot be laid out side by side | Flow 008 | Free Event positions expand the owning Page and reject boundary crossing | Pointer/keyboard layout adapter, Page geometry, and repository | Distinct coordinates after reload and unchanged revision on rejection | B | Events retain authored positions inside their Page without semantic mutation |
| F10 | Relationships are limited to Event-to-Event | Flow 009 | Page-to-Page, Page-to-Event, Event-to-Page, and Event-to-Event drawing | Pointer adapter, typed endpoint model, SVG renderer, and relationship command | Actual pointer events and one canonical relationship for each endpoint combination | C | Every supported endpoint combination is created without source/target form submission |
| F11 | Cancelled drawing can leave unsafe state | Flow 010 | Invalid targets and Escape remove preview with no write | Connection state machine and transaction boundary | Byte-identical project and absent partial record | C | Every invalid or cancelled gesture is atomic no-op |
| F12 | Parallel branches belong in first release | Flow 011 | Two Parallel edges and two Merge edges edited inline | Relationship model and graph/outline renderer | Exact endpoints, kind, group, labels, conditions | C | Branch/merge topology persists without execution claim |
| F13 | Drawing requires a keyboard equivalent | Flow 012 | Port connection mode, target navigation, popover focus, edge focus | Keyboard state machine and focus adapter | Focus sequence and one stored relationship | D | Complete connection needs neither pointer nor Inspector |
| F14 | Inspector should complement the canvas | Flow 013 | Inline node actions; optional details; schema editor round trip | Selection routing and workspace restoration | Closed-Inspector actions plus restored node/viewport | A, D | No exclusive graph command appears only in Inspector |
| F15 | Renames and reload can corrupt human projections | Flow 014 | New names with unchanged IDs, coordinates, topology, and meaning | Catalog subscriptions, repository, renderer | Before/after stable references and reload evidence | D | Renames change labels only |
| F16 | Isolated tests can mask the wrong interface | Flow 015 | Fresh branching Flow built entirely through installed main-workspace controls | Built extension, production storage, Flow UI, and effective-schema example projection | End-to-end control trace, typed canonical records, coordinates, and derived JSON | D | Terminal result has horizontal bands, mixed endpoints, free Events, derived JSON, and no binding model or forbidden state |
| F17 | Grouped Pages cannot use free entry or exit placement | Flow 016 | Pointer and keyboard move grouped or ungrouped frames between edge regions and eligible lanes | Layout command, membership stack, schema compiler, focus adapter, and reload projection | Stable identities and memberships, absent free placement group, unchanged effective schema, restored focus and sides | B, D | Edge placement changes presentation only and never weakens membership or schema inheritance |
| F18 | Existing binding-backed projects must not preserve a parallel model | Flow 017 | Human migration review converts referenced legacy records to direct Event occurrences with one Undo | Project migration, occurrence repository, and relationship store | Stable identities and endpoints, direct Event role and trigger, absent legacy keys | A, D | Migrated canonical state contains no contextEventBindings or contextBindingId |
| F19 | A multi-group Page may use any applicable selected lane | Flow 018 | All eligible targets identify valid; pointer and keyboard placement preserve semantic state | Lane eligibility resolver, Page-frame command, and canvas projection | Target states, placement reference, stable membership/schema/content identities, and rejected write evidence | B, D | Moving between eligible lanes changes only frame placement and coordinates |
| F20 | Membership edits must not orphan Flow frames or move them implicitly | Flow 019 | Reorder leaves placement stable; in-use removal blocks with named repairs | Membership command, frame dependency index, impact review, and Undo | Stable lane after reorder, byte-identical rejection, reassigned frame, affected-output feedback | B, D | Membership removal cannot leave a frame in an ineligible lane |
| F21 | Flow lanes and branches use the wrong geometry | Flow 020 | Page Group lanes are top-to-bottom horizontal bands containing left-to-right Pages and vertical branches | Canvas layout projection, coordinate persistence, and edge router | Measured band geometry, authored Page coordinates, split/merge edges, and reload evidence | B, C, D | Checkout renders the authored main route and upper branch without fixed columns or vertical-list normalization |
| F22 | Event nodes lack schema-informed JSON examples | Flow 021 | Expandable read-only JSON, effective provenance, status, and exact repair links | Canonical schema compiler, example resolver, validator, and Flow projection | Parsed nested JSON, source map, missing/invalid paths, no stored payload copy, and live update | D | Complete, Incomplete, Invalid, and Blocked states truthfully reflect the effective occurrence schema |

## Terminal acceptance

The correction passes only when the behavior and runtime features parse and
dry-check with no findings, the focused `flow_graph` pack executes the runtime
scenarios through the built extension, and packaging consumes that same build.

Terminal evidence must prove a fresh Flow can be completed with the Inspector
closed. It must also prove that free Pages use transient left and right edge targets
rather than a permanent ungrouped lane, and that Page context comes from assignment
rules while every Event role uses direct Page containment. A grouped Page must use
either free edge region without losing membership or inherited schema, and a multi-
membership Page must move between eligible selected lanes without changing its
membership order or effective schema. The installed graph must prove horizontal
lane bands, left-to-right Pages, a vertical alternative branch, all four typed
endpoint combinations, side-by-side Events, and an effective-schema-derived Event
JSON example with truthful status and repair. Ineligible named-lane placement and
unsafe membership removal remain no-op commands. A component-only canvas, direct
repository injection, pre-created edges, form-submitted source and target, fixed
lane constants, stored example payload, binding-backed validation, or assertions
over source strings cannot satisfy the runtime feature.
