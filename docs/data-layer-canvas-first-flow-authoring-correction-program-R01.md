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
- `Context`, `Shipping`, `Payment`, and `Merge` are not semantic or fallback lanes;
- relationship kind is inferred from the connected port pair rather than chosen in
  a relationship editor; and
- Parallel is not a separate relationship kind from Alternative.

## Corrective outcome

The Flow workspace behaves as a graphical specification editor. An operator selects
and orders existing Page Groups to define top-to-bottom horizontal lane bands,
places context-setting Page-event components left to right or in vertical branches inside eligible bands
or transient free-page edge regions, positions reusable interaction Events freely
inside context-setting Page frames, and draws directed relationships between visible
left, right, top, and bottom Page-frame ports.
The connected port pair determines whether the relationship is expected_next,
alternative, or merge, and every relationship may remain unlabelled. Event nodes
present a read-only JSON example derived from the effective occurrence schema
rather than a separate copied payload.

The Inspector is optional secondary detail. The complete graph can be created,
connected, documented, persisted, reloaded, and reopened while it is closed.

## Confirmed implementation failures

The installed implementation contradicts the intended model in ten production
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
6. Relationship authoring is not restricted to Page-frame topology.
7. Event occurrences are forced into a list rather than retaining freely authored,
   side-by-side positions within an expanding Page frame.
8. Page frames do not expose the derived JSON example already available for Event
   occurrences.
9. Event occurrence controls do not provide an explicit containing Page-frame
   selection with impact review and identity-preserving reassignment.
10. Event occurrences expose relationship ports even though containment expresses
    their Page context and only Pages define Flow topology.

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

Adding a Page never consumes or disables its catalog entry. Every insertion creates
a new Flow Page instance, including repeated insertions into the same Flow and lane.
Those instances share the stable Page and eligible placement-group references but
own distinct frame and schema-contributor identities. Each composes Shared Profile,
ordered Page Groups, Page, and Flow Page instance in that order, stores only sparse
local facets, and supports the canonical `Override here` and `Reset to parents`
behavior. Editing one instance cannot mutate the Page or a sibling instance.
Relationships, outline entries, effective compilation, and selected-Flow
documentation use frame identity so repeated Page instances remain independent
branch contexts with different effective values.

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

The Page frame is both the Page context and the context-setting event itself. A Page
definition owns its observed event identity, such as `pageview`, independently of
the Events catalog. The Page frame can therefore validate and document that event
before any interaction Event is added, and it never requires a nested `pageview`
occurrence. Page applicability and production assignment rules determine whether an
observation belongs to that Page; the Flow graph does not introduce another
validation selector.

A Page frame may expand a read-only JSON example derived from Shared Profile,
applicable ordered Page Groups, Page, and Flow Page-instance contributions. It uses
the same Complete, Incomplete, Invalid, and Blocked readiness states, configured
example precedence, nested-object assembly, forbidden-property omission,
provenance, and exact repair links as an Event occurrence example. No copied JSON
payload is stored.

### Events define reusable Page-contained components

The Events catalog provides only searchable predefined interaction Events such as
`button_click`. Every Page frame is a context-setting event and every contained
Event occurrence is an interaction, so Event
creation, Event editing, catalog insertion, occurrence detail, and storage expose
no documentary role selector or value. An optional Event trigger may describe
click, submission, or another interaction, but it does not change those fixed
semantics or choose the production validation target.

Pointer activation inserts an Event into the selected Page frame, pointer drag may
drop it directly on a visible canvas Page frame, and keyboard activation inserts it
into the selected Page frame. Each successful route creates one distinct occurrence
that immediately appears in the canvas and synchronized outline.

The same Event may be reused in multiple frames without duplicating or mutating its
definition or schema. A Page's context-setting event identity is not an Event
occurrence or Events-catalog definition. No Event insertion, Page placement, compiler, export, or
assignment path requires a separate Page-context binding. Legacy binding-backed
Page context identities migrate onto their Pages, while genuine interaction
occurrences migrate to direct Event references with optional triggers preserved and
documentary role fields removed. No parallel binding or role model remains editable
or authoritative.

Every occurrence editor identifies exactly one containing Page frame by human name
and stable frame identity. Changing that Page first previews the effective-schema
branch change. Confirmation preserves the occurrence identity, reusable Event
reference, optional trigger, sparse occurrence contribution, configured examples,
and position intent while updating its containing frame and recompiling against the
new Page-instance branch. The old and new Pages, reusable Event, sibling
occurrences, and Page relationships are not mutated.

Event occurrences retain free coordinates inside their Page frame and may appear
side by side. The Page frame expands to contain them. A pointer or keyboard move
that crosses the Page-frame boundary returns the Event to its last valid position
without a canonical write.

### Page and Event nodes derive effective JSON examples

Each Page frame may expand the effective JSON for its context-setting Page event. An Event node shows the
Event name and may expand a read-only formatted JSON example
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

### Page relationships are drawn topology

Each Page frame exposes labelled left, right, top, and bottom ports. Event
occurrences expose no relationship port or Connect action. Pointer drawing begins
at a Page source port, shows a live directed preview, identifies valid and invalid
Page targets, and commits only when released over the matching Page target port.
Escape, empty canvas, the source node, and incompatible targets cancel without a
partial record.

Relationships persist stable source and target Page-frame identities. Event
availability is expressed by containment within a Page, not an edge.
No Event-relationship migration is introduced because the production project model
contains no Event relationships.

Relationship kind is derived from the ordered port pair:

| Source port | Target port | Persisted kind |
|---|---|---|
| right | left | `expected_next` |
| top | bottom | `alternative` |
| bottom | top | `merge` |

Every other port pairing is invalid and commits no relationship. The inline
popover provides optional label, group, plain-language documentation condition,
and expectation fields but no relationship-kind selector. An empty label is valid,
persists as absent, and renders no placeholder label on the edge. Alternative is
the only branching kind: Parallel is neither offered nor persisted as a distinct
choice. Existing Parallel relationships migrate to Alternative while retaining
their stable identity, Page-frame endpoints, group, optional label, condition,
expectation, and geometry.

Selecting an edge opens the same inline popover with a visible
`Delete relationship` button. Activating it removes exactly that relationship from
the graph and synchronized outline in one Draft command; it does not remove or
rewrite either endpoint or another relationship. The action requires no Inspector
or second confirmation because the result offers one page-scoped Undo that restores
the original relationship identity and complete metadata. A labelled relationship's
button name includes its label plus its human source and target names. An unlabelled
relationship uses its human source and target names, never raw IDs.

Keyboard connection mode starts from a focused source port, moves a target indicator
between eligible inputs, commits with Enter, cancels with Escape, and restores focus
deterministically.

Relationships persist stable Page-frame endpoints, kind, and relationship identities.
Drawing never creates or modifies executable Flow steps or transitions.

## Workspace responsibilities

The main Flow workspace owns:

- searchable Page Groups, Pages, and Events catalogs;
- Page Group selection, ordering, and guarded removal;
- repeatable Page-instance insertion and transient before-lanes and after-lanes
  free-page targets;
- pointer, canvas-drop, and keyboard interaction-Event insertion into Page frames;
- free Page and Event positioning within their respective containment boundaries;
- Page-frame left, right, top, and bottom ports, port-pair kind inference, and
  drawing;
- explicit occurrence Page selection and identity-preserving reassignment;
- effective-schema-derived Page and Event JSON examples and repair links;
- inline graph actions, relationship editing, and relationship deletion; and
- the synchronized outline.

Selecting a Page exposes Move, Connect, Remove, and Open schema contribution.
Selecting an Event occurrence exposes Move within Page, Change Page, Duplicate
occurrence, Remove, and Open schema contribution without Connect. Opening the
canonical schema editor replaces the main workspace temporarily; returning restores
the selected graph item and viewport.

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
- Page-frame identities, shared Page references, containment, and sparse instance
  schema contributions;
- free Page-frame before-lanes or after-lanes region and coordinates;
- Event occurrence references and optional documentary triggers without role fields;
- Page-frame and Event-occurrence presentation coordinates;
- selected item and viewport where applicable; and
- relationship identity, endpoints, inferred kind, group, optional label,
  condition, and expectation.

Invalid drops, Event cross-boundary movement, cancelled connections, guarded lane
removal, and removal of an in-use Page membership are no-op commands: project bytes
and revision do not change.

Relationship deletion removes one stable relationship record, advances the Draft,
invalidates documentation derived from the changed graph topology, and leaves Page
frames, Event occurrences, endpoints, and unrelated relationships unchanged. Undo
restores the same relationship identity, ports, inferred kind, group, optional
label, condition, and expectation.

## Accessibility and alternative operation

Every pointer operation has a keyboard route. Catalog components are searchable and
keyboard-insertable. Ports are labelled with source or target Page names.
Connection mode announces the current target and validity. Saving an inline popover
returns focus to the edge; cancelling returns focus to the source. Graph and outline
select the same stable item.

The Delete relationship button is keyboard-operable. After deletion focus returns
to the human source endpoint; after Undo it returns to the restored edge.

The outline is a synchronized alternative projection, not a second model. It may
edit relationship meaning and occurrence documentation, but it does not reintroduce
fixed-lane or source/target forms.

## Assurance boundary

The graph documents expected topology, optionality, multiplicity, alternative
branches, merges, and conditions for human review and developer communication. It
does not validate that a sequence or branch executed.

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
fallbacks, migrate legacy Page context identities onto Pages and genuine interaction
records to direct Event occurrences, and make the three main-workspace catalogs
authoritative.

### Phase B — catalog and containment authoring

Implement Page Group lane selection/order, horizontal-band Page layout, free edge
placement for grouped and ungrouped Pages without membership mutation, multi-
membership named-lane eligibility, side-by-side reusable Event insertion through
pointer activation, canvas drop, and keyboard activation, assignment-owned Page
resolution, legacy binding and role migration, and guarded movement.

### Phase C — graphical relationship authoring

Implement Page-frame ports on all four sides, live pointer preview, target validity,
atomic commit and cancel, deterministic expected_next, alternative, and merge
inference, optional labels, inline relationship popovers without kind selection,
edge selection, exact relationship deletion, focus restoration, and page-scoped
Undo.

### Phase D — keyboard, persistence, and terminal proof

Implement keyboard connection mode, deterministic focus, graph/outline selection,
rename/reload stability, schema-editor return, derived Page and Event JSON status
and repair, and the fresh-flow installed-extension exercise.

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
| F06 | A Page is the context-setting event and Events-tab items are interactions | Flow 004, 005; Layering 007 | Every Page owns its observed context-event identity while every contained Event is an interaction, with no nested pageview occurrence or role selector | Page and Event editors, catalog and occurrence commands, assignment resolver, and migration | Page pageview identity, three interaction insertion routes, direct Page-frame and Event references, absent role and binding state | B, D | Page selection validates its context event while pointer activation, canvas drop, and keyboard activation add only interaction Events |
| F07 | Interaction Events must be reusable components | Flow 006 | Visible canvas and outline projection for repeated insertion into Page frames | Event catalog and occurrence command | Same Event ID, distinct occurrence IDs, two rendered targets | B | Reuse does not duplicate the Event or schema and each insertion is immediately visible |
| F08 | Free Pages are rendered as one permanent lane after all Page Groups | Flow 007 | Transient left and right edge targets create compact frames without Event prerequisites | Free-frame command, edge-target UI, and layout projection | Target geometry, stored region and coordinates, absent placement-group and binding IDs | B | No free-page pseudo-lane, empty lane-sized background, or binding prerequisite remains |
| F09 | Events need explicit Page containment and reassignment | Flow 008 | Free Event positions plus an impact-reviewed Page selector preserve occurrence identity while changing containment | Occurrence editor, Page geometry, compiler, and repository | Distinct coordinates, changed frame ID, stable occurrence and contribution IDs, and recomposed schema | B | Page reassignment changes containment and effective Page branch without recreating the occurrence |
| F10 | Only Pages define topology | Flow 009 | Page-to-Page drawing through left, right, top, and bottom ports while Events expose no ports | Pointer adapter, Page endpoint model, SVG renderer, and relationship command | Actual pointer events, all three valid port pairs, Page endpoint records, and absent Event ports | C | Every Page port combination infers expected_next, alternative, or merge and no Event can be an endpoint |
| F11 | Cancelled drawing can leave unsafe state | Flow 010 | Invalid targets and Escape remove preview with no write | Connection state machine and transaction boundary | Byte-identical project and absent partial record | C | Every invalid or cancelled gesture is atomic no-op |
| F12 | Branch kind and labels require unnecessary manual choices | Flow 011, 022 | Top-to-bottom ports infer Alternative, bottom-to-top ports infer Merge, labels may remain absent, and legacy Parallel becomes Alternative | Relationship model, migration, and graph/outline renderer | Exact endpoints, inferred kinds, optional label, absent kind selector, and migrated legacy records | C | Alternative/merge topology persists without a required label, distinct Parallel kind, or execution claim |
| F13 | Drawing requires a keyboard equivalent | Flow 012 | Port connection mode, target navigation, popover focus, edge focus | Keyboard state machine and focus adapter | Focus sequence and one stored relationship | D | Complete connection needs neither pointer nor Inspector |
| F14 | Inspector should complement the canvas | Flow 013 | Inline node actions; optional details; schema editor round trip | Selection routing and workspace restoration | Closed-Inspector actions plus restored node/viewport | A, D | No exclusive graph command appears only in Inspector |
| F15 | Renames and reload can corrupt human projections | Flow 014 | New names with unchanged IDs, coordinates, topology, and meaning | Catalog subscriptions, repository, renderer | Before/after stable references and reload evidence | D | Renames change labels only |
| F16 | Isolated tests can mask the wrong interface | Flow 015 | Fresh branching Flow built entirely through installed main-workspace controls | Built extension, production storage, Flow UI, and effective-schema example projection | End-to-end control trace, Page relationships, coordinates, and Page/Event derived JSON | D | Terminal result has horizontal bands, Page endpoints, free Events, both derived examples, and no binding model or forbidden state |
| F17 | Grouped Pages cannot use free entry or exit placement | Flow 016 | Pointer and keyboard move grouped or ungrouped frames between edge regions and eligible lanes | Layout command, membership stack, schema compiler, focus adapter, and reload projection | Stable identities and memberships, absent free placement group, unchanged effective schema, restored focus and sides | B, D | Edge placement changes presentation only and never weakens membership or schema inheritance |
| F18 | Existing binding-backed projects must not preserve a parallel model | Flow 017 | Human migration review moves context-event identity onto the Page and converts genuine interactions to direct Event occurrences with one Undo | Project migration plus Page, Event, and occurrence repositories | Page pageview identity, stable interaction identities, containment, retained triggers, absent binding and role keys | A, D | Migrated state has no nested pageview occurrence, contextEventBindings, contextBindingId, or documentary role field |
| F19 | A multi-group Page may use any applicable selected lane | Flow 018 | All eligible targets identify valid; pointer and keyboard placement preserve semantic state | Lane eligibility resolver, Page-frame command, and canvas projection | Target states, placement reference, stable membership/schema/content identities, and rejected write evidence | B, D | Moving between eligible lanes changes only frame placement and coordinates |
| F20 | Membership edits must not orphan Flow frames or move them implicitly | Flow 019 | Reorder leaves placement stable; in-use removal blocks with named repairs | Membership command, frame dependency index, impact review, and Undo | Stable lane after reorder, byte-identical rejection, reassigned frame, affected-output feedback | B, D | Membership removal cannot leave a frame in an ineligible lane |
| F21 | Flow lanes and branches use the wrong geometry | Flow 020 | Page Group lanes are top-to-bottom horizontal bands containing left-to-right Pages and vertical branches | Canvas layout projection, coordinate persistence, and edge router | Measured band geometry, authored Page coordinates, split/merge edges, and reload evidence | B, C, D | Checkout renders the authored main route and upper branch without fixed columns or vertical-list normalization |
| F22 | Event nodes lack schema-informed JSON examples | Flow 021 | Expandable read-only JSON, effective provenance, status, and exact repair links | Canonical schema compiler, example resolver, validator, and Flow projection | Parsed nested JSON, source map, missing/invalid paths, no stored payload copy, and live update | D | Complete, Incomplete, Invalid, and Blocked states truthfully reflect the effective occurrence schema |
| F23 | Relationships cannot be deleted from the canvas | Flow 023 | A named Delete relationship button removes one selected labelled or unlabelled edge and offers identity-preserving Undo | Inline popover, relationship command, graph and outline projections, Draft history, and export staleness | Button accessibility name, exact removed ID, unchanged endpoint and unrelated hashes, focus sequence, stale export, and restored relationship | C, D | One button activation deletes only the selected relationship and one Undo restores it exactly without Inspector access |
| F24 | Reusing a Page collapses alternative branch endpoints | Flow 024 | Every catalog insertion creates an independent Page instance with shared Page inheritance and sparse local overrides | Page catalog, frame command, canonical hierarchy editor, relationship endpoints, outline, compiler, and selected-Flow documentation | Three frame and contributor IDs sharing one Page ID, distinct relationship targets, isolated effective values, parent reset, and rendered contexts | B, C, D | Three Confirmation instances retain independent branch values without duplicating or mutating the Confirmation Page |
| F25 | Page frames lack derived JSON examples | Flow 025 | Expandable Page-instance JSON uses the same provenance, readiness, and repair semantics as occurrence JSON | Canonical compiler, example resolver, validator, and Page-frame projection | Parsed Page JSON, source map, missing and invalid paths, no stored payload copy, and live repair | D | Page and Event nodes truthfully derive their respective effective examples |

## Terminal acceptance

The correction passes only when the behavior and runtime features parse and
dry-check with no findings, the focused `flow_graph` pack executes the runtime
scenarios through the built extension, and packaging consumes that same build.

Terminal evidence must prove a fresh Flow can be completed with the Inspector
closed. It must also prove each Page is its own context-setting event, no `pageview`
is materialized as a nested Event occurrence, and Events-catalog items are
interactions. Free Pages use transient left and right edge targets rather than a
permanent ungrouped lane, and Page context comes from assignment rules while every
Event occurrence is an interaction with no role field. Pointer
activation, pointer drop on the visible canvas frame, and keyboard activation must
each add an Event and update canvas plus outline. A grouped Page must use
either free edge region without losing membership or inherited schema, and a multi-
membership Page must move between eligible selected lanes without changing its
membership order or effective schema. The installed graph must prove horizontal
lane bands, left-to-right Pages, a vertical alternative branch, Page-frame
relationships, Page ports on all four sides, deterministic port-pair relationship
kinds, optional labels, labelled and unlabelled relationship deletion with exact
Undo, three repeated Page instances with isolated schema overrides and relationship
endpoints, side-by-side Events, impact-reviewed occurrence Page reassignment, and
effective-schema-derived Page and Event JSON examples with truthful status and
repair. Ineligible named-lane placement and unsafe
membership removal remain no-op commands. A component-only canvas, direct repository
injection, pre-created edges, form-submitted source and target, fixed lane constants,
manual relationship-kind selector, required relationship label, distinct Parallel kind,
Inspector-only deletion, stored example payload, binding-backed validation, or
assertions over source strings cannot satisfy the runtime feature.
