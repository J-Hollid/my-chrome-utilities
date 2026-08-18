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

In the ordinary Flow route, the canvas occupies the complete remaining content
rectangle: its horizontal edges meet the route edges, its top follows the compact
toolbar, and its bottom reaches the viewport bottom. A fixed height, maximum
height, aspect ratio, or unused layout track cannot reduce that rectangle. In
Focus Canvas, the canvas occupies the complete browser viewport. Add, camera, and
Exit Focus controls overlay that surface and reserve none of its width or height.

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

Once a pointer resize starts on a Section handle, that gesture remains active while
the pointer moves outside the Section. Each outside move updates the visible bounds,
and releasing outside commits the displayed final bounds without requiring the
pointer to return to the Section.

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

Pan is direct and continuous in the ordinary workspace and Focus Canvas. An
unmodified primary drag from unoccupied canvas, Space plus primary drag from any
canvas point, middle-button drag, one-finger touch pan, and the labelled keyboard
pan command translate the rendered graph by the corresponding screen-space
distance. Ending and restarting a gesture continues from the current camera
without fitting or resetting zoom. Panning neither selects nor moves a graph item
and never writes canonical coordinates or history.

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

- Page: Rename in Flow, Add Event, Move, Connect, Duplicate, Details, Add visual or
  the saved visual's View/Edit/Replace/Remove commands, Open schema contribution,
  and Remove.
- Event: Move, Change Page, Duplicate, Details, Add visual or the saved visual's
  View/Edit/Replace/Remove commands, Open schema contribution, and Remove.
- Relationship: Edit documentation and Delete.
- Section: Rename, Move, Resize, Wrap selection, Remove Section, and Remove with
  contents.

A Section exposes its complete action set through a Section-specific context
menu. A secondary pointer action on the Section and the keyboard context-menu
command on a focused Section open that same menu. Choosing Rename, Remove
Section, or Remove with contents follows the existing rename, retained-content
removal, or reviewed destructive-removal behavior; opening or dismissing the
menu changes no Flow state.

During pointer relationship drawing, each eligible target port has an inclusive
24 CSS-pixel screen-space snap radius centered on the rendered port at every
canvas zoom. Entering that halo pins the live preview to the compatible semantic
port. Releasing anywhere in the acquired port halo creates the same relationship
as releasing on the exact port. Only the acquired port receives valid-target
emphasis, using an outline or shape change rather than color alone; its Page card
remains unchanged and is not a snap target. Accessible status names the Page,
port, and inferred relationship kind.

The source port still determines the only compatible target port. A direct hit
on a Page body outside its port halos, the source Page, an Event mini-card, or an
incompatible port remains invalid and cannot be promoted to a Page-level snap.
When eligible port halos compete, the nearest compatible port center wins, with
frontmost presentation order breaking an exact tie. Moving out of the acquired
port halo clears its target treatment and returns the preview to the pointer;
moving into another eligible port halo transfers both exactly once. Pointer start
does not preselect an arbitrary port. Keyboard connection mode retains its
deterministic spatial candidate. Escape or pointer cancellation clears all
transient connection state, restores source-port focus, and changes no Draft,
revision, canonical state, or Undo history.

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
| Canvas remains below growing controls or occupies only a small layout track | 001, 002, 020 | Ordinary canvas reaches every available route edge, Focus Canvas covers the viewport behind overlay controls, persistent chrome is constant, and the outer document does not scroll |
| Sections still behave as vertical schema lanes | 003, 004, 007, 014, 015 | Sections are arbitrary 2D, explicitly contain any Page, and remain schema-neutral |
| Contextual creation mutates reusable definitions | 002, 004, 005, 006, 010 | Add and edge-drop reuse canonical Pages and Events while creating stable Flow-local instances |
| Cards remain duplicated or visually overloaded | 013, 021, 025 | One compact semantic-zoom card projection retains readiness while Details owns full examples and repairs |
| Camera cannot be panned or changes project meaning | 016, 027 | Direct background, modified pointer, middle-button, touch, and keyboard pan work in ordinary and focused modes while pan, zoom, fit, and minimap remain UI state excluded from canonical data and Undo |
| Layout assistance rewrites semantics | 019 | Tidy is previewed, explicit, presentation-only, and undoable |
| Outline consumes space or becomes a second model | 018 | Closed Outline reserves no width and on-demand navigation uses the same stable graph |
| Direct manipulation loses keyboard access | 005, 012, 020, 023 | Pointer and keyboard routes have labelled focus, deterministic cancellation, and focus restoration |
| Fast Section resizing loses the active pointer outside its original bounds | 030 | The live resize follows an immediate outside move and release persists exactly those bounds without pointer re-entry |
| Relationship meaning drifts with routing | 009–012, 022, 023 | Semantic ports retain the three documentary kinds; Page-only topology and migrations remain stable |
| Relationship drawing misses a port or gives ambiguous target feedback | 028, 029 | A zoom-independent port snap radius pins the preview to the compatible semantic port, emphasizes exactly that port without color-only meaning while leaving its Page card unchanged, preserves invalid direct targets, and clears without a write |
| Existing occurrence and Page-instance semantics regress | 006, 008, 017, 024, 026 | Reuse, migration, sparse contributions, repeated instances, and Flow-specific names retain stable identity |
| Schema contribution return reintroduces an expanded card | Flow 013, 021, 025 and layered schema 021 | Readiness stays on cards while JSON, repairs, and restored deep detail live in contextual Details |
| Concept visuals overload the canvas, leak into canonical definitions, or lose portable references | Flow 034–037 and Portability 008 | Flow-local Page and Event attachments share validated project assets, retain contextual descriptions, use per-Flow display modes, open in an accessible viewer, and round-trip without transient view state |

## Scope and deferrals

This program covers the Flow route shell, Add palette, Section manipulation,
camera, minimap, semantic zoom, compact cards, contextual toolbars, Details,
Outline, Tidy, pointer and keyboard authoring, responsive containment, and the
state boundary between presentation and canonical project data.

It also covers one primary concept visual per Flow Page instance or Event
occurrence. The project owns deduplicated original raster assets; the Flow item
owns its asset reference, required description, optional caption, and optional
source reference. `Hidden`, `Badges`, and `Thumbnails` are independent per-Flow
view state. They never change canonical Page or Event definitions, graph
coordinates, topology, documentation freshness, or Undo history. Attachment,
replacement, removal, duplication, unreferenced-asset cleanup, and their Undo
behavior remain project commands.

It does not choose a canvas rendering library, add nested Sections, splice a Page
into an existing relationship, reconnect a relationship endpoint before metadata
retention semantics are approved, create canonical Page or Event definitions from
the canvas, infer journey meaning from coordinates, execute a Flow, replace the
canonical schema editor, change Property Set composition, or redesign downstream
Documentation and Live surfaces.

Concept-visual documentation generation, OCR, AI interpretation, redaction,
multiple-image galleries, crop or annotation tools, Figma synchronization,
remote-URL fetching, and built-in browser-tab capture are deferred. The operator
captures or exports an image externally and then pastes, chooses, or drops it in
the contextual Visual editor.

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

## Flow Section context-menu correction slice

The context-menu correction is accepted by directional Flow scenarios 003, 007,
014, and 020 and their runtime partners. Because it changes only Section
authoring presentation, its smallest focused checkpoint is:

```sh
node scripts/run-focused-acceptance.mjs --pack flow_graph
node scripts/package.mjs
```

The implementation-and-review expectation is 60 minutes from coder receipt to an
architect `qa-ready` candidate. By 30 minutes, the built extension is expected to
open the Section menu by secondary pointer action and keyboard, with Rename and
Remove Section routed through it in focused Flow evidence. Variance is reported
with its cause under the pilot's non-blocking timing policy; it does not by itself
stop safe, bounded work.

## Flow relationship snap-feedback slice

The relationship snap-feedback correction is accepted by directional Flow
scenarios 028 and 029 and their runtime partners. It changes only transient Flow
connection targeting and the resulting target-port hit area; relationship semantics,
canonical definitions, schema composition, empty-canvas creation, and keyboard
connection behavior remain governed by the existing contracts. Its smallest
focused checkpoint is:

```sh
node scripts/run-focused-acceptance.mjs --pack flow_graph
node scripts/package.mjs
```

The implementation-and-review expectation is 60 minutes from coder receipt to an
architect `qa-ready` candidate. At 30 minutes, report whether installed pointer
evidence has acquired and visibly identified compatible port targets at 25, 100,
and 200 percent zoom, plus the cause of any variance. Crossing either reporting
point is not an intervention gate; continue safe, bounded work unless scope or
safety requires new authority.

## Flow Section pointer-continuity correction slice

The pointer-continuity correction is accepted by directional Flow scenario 030
and its runtime partner. It changes only an already-started Section resize
gesture: moving or releasing outside the Section must remain part of that same
gesture. Section geometry constraints, keyboard resizing, containment, schema
meaning, relationship topology, and documentation order remain governed by the
existing contracts.

**Development focus:** `test/data-layer-flow-workspace-test.mjs` for the Section
pointer-gesture lifecycle, followed by the installed scenario-030 path in
`test/support/flow-workspace-r02-runtime.mjs`.

**QA impact:** the bounded `flow_graph` pack and package proof. The exact
checkpoint is:

```sh
node scripts/run-focused-acceptance.mjs --pack flow_graph
node scripts/package.mjs
```

**Scouting considerations:** advisory RepoWise inspection confirmed
`src/flow-graph/workspace-section-ui.ts` as the direct interaction surface and
identified `src/flow-graph/workspace-ui.ts`,
`test/data-layer-flow-workspace-test.mjs`, and
`test/support/flow-workspace-r02-runtime.mjs` as likely companions. The canonical
registry independently keeps the settled QA impact inside the
`flow_workspace_section_authoring` boundary and the `flow_graph` pack.

The implementation-and-review elapsed effort ceiling is 60 minutes from coder
receipt to an architect `qa-ready` candidate. At 30 minutes, report whether a
single installed pointer move and release outside the Section updates and saves
the expected bounds, the cause of any variance, remaining work, confidence, and
forecast. Continue bounded work by default; pause only under the pilot's scope,
repeated-failure, safety, or authority conditions.

## Flow Page placement geometry correction slice

The Page placement correction is accepted by directional Flow scenario 031 and
its runtime partner. A Page drag converts screen-space pointer travel to graph
space at the active camera zoom, so the Page remains under the same pointer
anchor before release and at the corresponding stored position after render.
This makes the usable Section interior below its visible label reachable and
prevents zoom-dependent snapping toward the prior position or past the lower
boundary. Section membership remains explicit: this correction does not infer
membership from Property composition, silently move sibling Pages, resize a
Section, or change relationship or schema meaning.

**Development focus:** the Page-frame pointer gesture in
`src/data-layer-flow-graph-ui.ts`, the existing camera-coordinate primitives in
`src/flow-graph/workspace.ts`, and focused geometry coverage in
`test/data-layer-flow-workspace-test.mjs`. Prefer a small tested graph-delta
primitive over adding another coordinate policy inside the already broad graph
builder. Installed proof belongs in
`test/support/flow-workspace-r02-runtime.mjs`, with scenario-031 evidence wired
through the Flow reporter and registry.

**QA impact:** the canonical changed-path plan for the shared Page-frame gesture
and camera primitive selects the bounded `flow_graph`, `flow_export`,
`live_flow_testing`, and `property_set_flow_sections` consumer set, followed by
package proof. The exact checkpoint is:

```sh
node scripts/run-focused-acceptance.mjs \
  --pack flow_graph \
  --pack flow_export \
  --pack live_flow_testing \
  --pack property_set_flow_sections
node scripts/package.mjs
```

**Scouting considerations:** revised RepoWise Trial 2 used the required
`--target` plus `--changed-file` risk query after a conditional index update. It
correctly surfaced `test/browser-packs/flow-graph.mjs` and, unlike Trial 1,
`verification/packs.json`; direct registry inspection still determines the
actual observation keys and changed-path scope. It did not surface the direct
Page-drag unit file or `test/support/flow-workspace-r02-runtime.mjs`, and its
coverage-less test-gap signal remained false. Its low-health signal for
`installFlowGraphBuilder` reinforced the small-helper development focus but did
not independently authorize QA. The settled changed-path preflight then selected
the exact four-pack consumer set above; this forecast miss confirms that likely
production paths should be planned canonically before handoff even when scouting
has already named downstream consumers. The refresh reported the current commit
range yet status and query metadata continued to identify the prior indexed
commit, so that inconsistency is recorded as advisory-tool friction rather than
a feature blocker.

The implementation-and-review elapsed effort ceiling is 60 minutes from coder
receipt to an architect `qa-ready` candidate. At 30 minutes, report measured
Cart position before release and after render at 50, 100, and 200 percent zoom,
including complete-card containment at the top and bottom examples, remaining
work, confidence, and forecast. Continue bounded work by default; pause only
under the pilot's scope, repeated-failure, safety, or authority conditions.

### Same-target reliability projection correction

The first governed review-evidence attempt exposed one product failure twice in
the same receipt. Both records belong to candidate `bea1ba70`, its exact tree,
`FLOW_WORKSPACE_AUTHORING_TARGET`, and the same offscreen Page-placement
assertion. Incident `509d8d6b` uses the canonical five-target Flow batch;
incident `ae7b70d3` uses an alias-filtered four-target prerequisite batch that
the checkpoint planner added beside it. The latter is not a second product
failure and is not an abandoned lineage. Its task identity differs because the
planner removed the full-program alias and the unrelated stylesheet-extraction
sibling while retaining the same diagnosed target.

Future checkpoints must prevent the duplication before execution. When
prerequisite closure produces browser batches with overlapping logical targets
or alias-only identity differences, prelaunch normalization resolves each
affected target to exactly one current canonical batch with the same registered
pack, program, session, capabilities, and target boundary. It rebinds every
prerequisite edge to those canonical tasks before authorization, so each target,
result, timing record, and evidence leaf executes exactly once. Missing or
ambiguous canonical targets, changed boundaries, and incompatible execution
inputs block rather than being silently deduplicated. This applies to subset,
superset, partial-overlap, and repartitioned batch shapes without treating their
unrelated sibling targets as causal evidence.

Reliability repair planning must also handle the two existing records without
waiting for another user disposition or inventing registry history. When an
incident diagnoses one browser target, its source task is bound by the governed
source receipt and failure-commit registry, exactly one current canonical
browser task contains the target, and the historical and current target-boundary
digests are identical, the planner records a deterministic same-target
projection to the current task. The immutable source identity remains in the
incident. The projection supplies only the execution identity for the diagnosed
target and does not declare that different target boundaries are equivalent.

Missing, ambiguous, unbound, or changed target boundaries still block. Do not
delete, rewrite, merge, abandon, or silently resolve either incident; do not
weaken causal regression or review-evidence requirements. Each incident receives
its own repair-focused protocol proof on the corrected descendant, after which
one fresh review-evidence checkpoint and package proof may defer both unresolved
obligations to master integration under the existing feature-mode contract. No
all-20 checkpoint is authorized in feature mode.

**Development focus:** keep the correction within checkpoint prerequisite
normalization, `scripts/verification-task-succession.mjs`, and their exact
process tests. Reuse the existing task-plan, launch-authorization, and
repair-receipt validators; do not change incident fingerprints, store
persistence, terminal resolution, or product behavior. The historical and
current `FLOW_WORKSPACE_AUTHORING_TARGET` boundaries for this case both digest to
`d4dda1a04a965ee6f30c386ae7f9f25400e5a31466522ab1e6183f2a0206d084`.

**QA impact:** the correction adds the `shell` owner of task-succession policy to
the already required four Flow packs. After both incident-focused proofs, the
single review-evidence checkpoint is:

```sh
node scripts/run-focused-acceptance.mjs \
  --pack flow_graph \
  --pack flow_export \
  --pack live_flow_testing \
  --pack property_set_flow_sections \
  --pack shell \
  --property \
  --changed-since <approved-correction-commit> \
  --prepare-evidence flow-page-placement-geometry
```

This bounded five-pack plan is the approved throughput correction, not a new
product slice or authority to widen shared verification semantics further.

## Flow contextual action consistency slice

Directional Flow scenario 032 and its runtime partner define one interaction
hierarchy for Sections, Pages, Events, and relationships. Focus only navigates;
primary click, Enter, or Space selects; and commands open only after an explicit
menu invocation. Each selected item exposes a labelled Actions menu button, and
secondary click, Shift+F10, the Context Menu key, and that button all open the
same complete command set. A menu never opens merely because an item receives
focus, and relationship selection no longer opens its editor or transfers focus
automatically.

The command surface is a menu, not an editor. It contains the item's existing
commands, puts the destructive command last, and sends editor commands such as
Rename, Details, or Edit documentation to a separate contextual surface. Escape
returns focus to the invoking item or Actions button. Opening, moving through,
or dismissing a menu cannot write a Draft, revision, canonical value, or Undo
entry. This slice does not alter command meaning, selection persistence, graph
topology, schema meaning, Page containment, relationship ports, or drag
gestures, and it does not require a long-press gesture that could conflict with
canvas dragging.

**Development focus:** consolidate the item-menu invocation, placement, ARIA,
and focus lifecycle behind a small Flow workspace boundary used by
`src/flow-graph/workspace-ui.ts`, `src/flow-graph/workspace-section-ui.ts`, and
`src/data-layer-flow-graph-ui.ts`. Keep item-specific command construction with
its existing owner. Direct characterization belongs in
`test/data-layer-flow-workspace-test.mjs`; installed pointer, keyboard, command
parity, viewport containment, focus restoration, and state-invariance proof
belongs in `test/support/flow-workspace-r02-runtime.mjs`, with scenario-032
evidence wired through the Flow browser pack, reporter, and registry.

**QA impact:** canonical planning for the three likely production paths selects
the bounded `flow_graph`, `flow_export`, `live_flow_testing`, and
`property_set_flow_sections` consumer set: 51 focused tasks with properties,
followed by package proof. The review-ready checkpoint is:

```sh
node scripts/run-focused-acceptance.mjs \
  --pack flow_graph \
  --pack flow_export \
  --pack live_flow_testing \
  --pack property_set_flow_sections \
  --property \
  --changed-since <approved-specification-commit> \
  --prepare-evidence flow-context-action-consistency
node scripts/package.mjs
```

**Scouting considerations:** RepoWise Trial 3's PR-mode risk query reinforced
the direct Flow workspace unit, installed runtime, and browser-pack companions,
and its hotspot signals support extracting the shared menu lifecycle rather than
growing either broad installer. Ordinary inspection had already found those
files, so scouting changed neither development focus nor QA impact. The query
also reported downstream semantic consumers that this presentation-only slice
does not change, declared test gaps despite naming the direct tests as historical
co-change partners, and returned the old indexed commit after a successful
conditional refresh. The refresh again created untracked VS Code integration
files; they were removed. These are advisory-tool defects, not feature blockers.

The implementation-and-review elapsed effort ceiling is 120 minutes from coder
receipt to an architect `qa-ready` candidate. At 60 minutes, report whether
installed Section, Page, Event, and relationship items remain inert on focus and
whether one pointer and one keyboard route open the same command set with correct
focus restoration. Include any variance cause, remaining work, confidence, and
forecast; continue bounded work under the QA pilot unless product scope, safety,
or authority changes.

## Flow wheel and laptop-pinch zoom slice

Directional Flow scenario 033 and its runtime partner make the camera respond to
vertical mouse-wheel input over visible canvas content in both the main workspace
and Focus Canvas. Wheel-up zooms in and wheel-down zooms out, with the graph point
beneath the pointer remaining anchored. Browser-delivered laptop trackpad pinch
signals follow the same pointer-anchored path. Each accepted signal updates the
visible percentage, consumes the event so that the outer document does not move,
and respects the existing 25-to-200-percent manual limits.

The camera does not intercept wheel input over a Flow contextual menu or editor,
outside the canvas, or when the event has no vertical delta. Those inputs retain
native scrolling. Touch pinch and visible camera controls remain available. The
camera gesture cannot move focus or selection and remains project-scoped UI
state: graph-item coordinates, Draft, revision, canonical project state, and
Undo history do not change.

**Development focus:** keep the production change in
`src/flow-graph/workspace-camera-ui.ts`, with direct input-policy and camera
characterization in `test/data-layer-flow-workspace-test.mjs`. Prove installed
mouse-wheel and browser pinch-modifier direction, pointer anchoring, event
consumption, excluded targets, limits, both workspace modes, and state invariance
through the existing `FLOW_WORKSPACE_CONTROLS_TARGET` boundary in
`test/support/flow-workspace-r02-runtime.mjs`. Wire scenario-033 evidence through
the existing Flow browser pack, reporter, and registry rather than creating a new
pack or target.

**QA impact:** canonical planning for the production camera path selects only
the bounded `flow_graph` pack: 18 focused tasks with properties, followed by
package proof. The review-ready checkpoint is:

```sh
node scripts/run-focused-acceptance.mjs \
  --pack flow_graph \
  --property \
  --changed-since <approved-specification-commit> \
  --prepare-evidence flow-wheel-and-trackpad-pinch-zoom
node scripts/package.mjs
```

**RepoWise Trial 4 baseline:** ordinary inspection identified the production
camera owner, its direct unit companion, the installed controls target, and the
existing Flow evidence wiring before coder work. Per the approved trial change,
the specifier did not run RepoWise. After the coder has identified and touched
the implementation files, they must run one advisory RepoWise checkpoint after
the first coherent committed green candidate and before preparing evidence, then
report whether its change-aware findings altered implementation, tests, review
focus, or QA impact; the architect records the result. This is another Flow
sample, so even a useful result cannot establish value across non-Flow features.

The implementation-and-review elapsed effort ceiling is 60 minutes from coder
receipt to an architect `qa-ready` candidate. At 30 minutes, report whether both
unmodified wheel and browser-delivered laptop pinch change scale in the expected
direction while preserving the pointer anchor, and whether contextual surfaces
retain native scrolling. Include any variance cause, remaining work, confidence,
and forecast; continue bounded work under the QA pilot unless product scope,
safety, or authority changes.

## Flow Page and Event concept-visual slice

Directional Flow scenarios 034–037, their runtime partners, and project
Portability scenario 008 define one primary concept visual for each Flow-local
Page instance or Event occurrence. `Add visual` opens a separate contextual
editor; image paste is deliberately scoped to that editor rather than intercepted
globally by the canvas. Paste, file choice, and file drop stage a validated original
preview before Save. Description is required; caption and source reference are
optional. Save, replace, remove, duplication, cleanup, and Undo are attachment
commands and do not mutate reusable Page or Event definitions.

The project asset registry stores each original image once by stable identity
and content digest. Attachments retain independent contextual metadata, so one
image may describe different Page or Event states. PNG, JPEG, and WebP are
accepted. SVG and animated GIF are excluded. The limits are 5 MiB per source
image, 4096 pixels on either side, and 16 megapixels. Available durable storage is
preflighted instead of applying the former fixed 25 MiB project aggregate. File
type, signature, decoding, dimensions, and limits are validated before Save; a
rejected replacement preserves the saved attachment and creates no orphan asset
or history entry. The scalable body-store and archive boundary are defined by
`docs/flow-concept-visual-asset-storage-portability-R01.md`.

The per-Flow visual-display modes are `Hidden`, `Badges`, and `Thumbnails`, with
`Badges` as the first-open default. Badges preserve compact graph geometry.
Thumbnails use a fixed 16-to-10 viewport containing the complete image; their
presentation bounds and Page relationship anchors follow the preview without
rewriting stored coordinates or invoking Tidy. Distant semantic zoom substitutes
badges for pixels. Clicking a badge or thumbnail, or using `View visual` while
Hidden, opens a modal Fit and 100-percent viewer with current-scale, zoom, pan,
deterministic focus containment, Escape close, and focus return.

Project export stores one asset copy and every Flow-local reference plus its
description, caption, and source reference. Import-as-new remaps the project-owned
asset identity and both attachment references. Camera, selection, viewer state,
and visual-display mode remain excluded from portable project data. This slice
does not generate documentation from images.

**Development focus:** begin with a focused semantic asset-and-attachment test,
the Flow workspace unit coverage in `test/data-layer-flow-workspace-test.mjs`,
and installed scenarios 034–037 in
`test/support/flow-workspace-r02-runtime.mjs`. Reuse the existing documentation
logo's file-signature, decode, and aspect-fit lessons through a generic raster
boundary rather than coupling Flow storage to the branding theme or its smaller
logo limit. Add project-portability coverage only after the direct attachment and
viewer loop is green.

**QA impact:** ordinary inspection initially forecast the bounded `flow_graph`,
`project_management`, `flow_export`, `live_flow_testing`, and
`property_set_flow_sections` consumer set. The settled candidate also repairs
the non-vacuous Flow and project-management acceptance contracts and their
registry-derived terminal-task accounting in shell-owned test paths. Exact
changed-path planning therefore includes `shell`.

The bounded cleanup repair additionally ensures that removing a whole Flow
prunes visual assets referenced only by its owned graph, retains an asset still
referenced by another Flow, and lets the same Undo restore the graph,
attachments, and asset records. That behavior belongs in the canonical project
entity lifecycle already exercised by the approved Flow-removal contract. Its
declared dependant propagation adds `durable_project_repository`,
`guided_test_cases`, `layered_schema`, and `project_event_transport`. Those four
packs are authorized as the only additional consumer closure; the exact review
set is ten packs. This preserves the lifecycle and acceptance contracts as
evidence rather than weakening, relocating, reverting, or silently omitting
them. The expected review-ready form is:

```sh
node scripts/run-focused-acceptance.mjs \
  --pack flow_graph \
  --pack project_management \
  --pack flow_export \
  --pack live_flow_testing \
  --pack property_set_flow_sections \
  --pack shell \
  --pack durable_project_repository \
  --pack guided_test_cases \
  --pack layered_schema \
  --pack project_event_transport \
  --property \
  --changed-since <approved-specification-commit> \
  --prepare-evidence flow-concept-visuals
node scripts/package.mjs
```

The receipt and every later handoff must use the canonical task name
`flow-concept-visuals`; evidence recorded under another Flow task is stale and
ineligible. Dependency closure and package proof remain required. Any expansion
beyond these ten packs is a blocking scope change and does not authorize an
all-20 checkpoint.

**RepoWise Trial 4 baseline:** before coder work, ordinary inspection identified
the Flow graph model and workspace renderers, the documentation-logo validation
pattern, Flow workspace unit and installed-runtime companions, project
portability pair, downstream Flow consumers, and the verification registry. The
specifier did not run a speculative RepoWise scan. Once the coder has one coherent
committed candidate with direct checks green, and before review evidence, the
coder runs the approved telemetry-disabled actual-diff checkpoint with its
two-minute ceiling and reports any relevant untouched file, false positive,
scope change, generated artifact, time cost, and improved/neutral/impeded
judgment. RepoWise unavailability cannot block implementation or handoff.

The implementation-and-review elapsed effort ceiling is 180 minutes from coder
receipt to an architect `qa-ready` candidate. At 90 minutes, report whether both a
Page and Event can save and reopen a pasted or chosen image, whether badges and
the accessible viewer work, whether one shared asset remains deduplicated, the
cause of any variance, remaining validation and portability work, confidence,
and forecast. Continue bounded work under the QA pilot unless product scope,
safety, or authority changes.

## Flow concept-visual viewer refinement slice

Directional Flow scenarios 038–042 and their runtime partners refine only the
installed concept-visual viewer. They preserve the attachment, asset,
portability, visual-display, and cleanup behavior of scenarios 034–037. Viewer
state remains transient and cannot change the Flow camera, selection, project
bytes, Draft, revision, or Undo history.

The modal uses fixed viewer chrome around a scrollbar-free image canvas. Its
visible heading and Close control remain above a toolbar containing Fit, 100
percent, Zoom out, the actual displayed scale, and Zoom in. The canvas consumes
the remaining bounded space at wide and 360-pixel viewports. Description,
Caption, and Source reference remain available without entering the transformed
image surface or displacing the fixed controls. Fit centers and contains the
complete image without enlarging it beyond intrinsic size; 100 percent maps one
image pixel to one CSS pixel.

Buttons and `+`, `-`, `0`, and `1` provide explicit zoom routes. Modified wheel
and pinch input zoom around the pointer or gesture midpoint rather than the
image's top-left corner. The actual scale stays between Fit and 400 percent.
Mouse drag and one-finger drag move the image directly; two-axis trackpad,
arrow-key, and four labelled directional-button routes pan the viewport. Pan is
bounded on both axes, keeps each non-overflowing axis centered, exposes no empty
canvas, and presents no dialog or canvas scrollbars. The directional buttons are
the single-click alternative to dragging required by the product's accessible
input boundary.

Close, Escape, and a press-and-release wholly on the dim backdrop close the
viewer and return focus to the exact invoker. A pointer gesture that begins
inside the viewer and ends on the backdrop does not close it. The named modal,
contained Tab order, visible close control, inert background, and focus return
continue to follow the WAI-ARIA modal-dialog pattern. The backdrop behavior
follows the HTML dialog light-dismiss endpoint rule rather than treating any
pointer release outside the image as a dismissal.

This contract applies the convergent interaction patterns documented by the
WAI-ARIA modal-dialog pattern, WCAG 2.2 pointer and dragging guidance, the HTML
dialog light-dismiss model, and the established fixed-control, anchored zoom,
bounded pan, and keyboard routes exposed by PhotoSwipe and OpenSeadragon. It does
not add a gallery, image editing, rotation, download, full-screen mode,
navigation between attachments, persistent viewer state, or another viewer
dependency.

**Development focus:** begin in
`src/flow-graph/concept-visual-ui.ts`, its direct viewer characterization in
`test/data-layer-flow-workspace-test.mjs`, and installed scenarios 038–042 in
`test/support/flow-workspace-r02-runtime.mjs`. Prove fixed control containment at
360 by 800 and 1440 by 900, actual-scale reporting, pointer-anchored zoom,
two-axis bounded pan, scrollbar absence, every close route, focus return, and
the project-state boundary before expanding to the settled QA plan. Keep viewer
styling narrowly scoped; a required Studio stylesheet change remains part of
this approved slice rather than an unrelated branding redesign.

**QA impact:** ordinary inspection forecasts the bounded `flow_graph` and
`shell` packs because the Flow component owns the behavior while the current
global Studio dialog overflow is a shell-owned stylesheet boundary. Exact
changed-path planning remains authoritative and may remove `shell` if the final
candidate changes no shell-owned path, but it may not omit a selected owner to
preserve the forecast. The expected review-ready form is:

```sh
node scripts/run-focused-acceptance.mjs \
  --pack flow_graph \
  --pack shell \
  --property \
  --changed-since <approved-specification-commit> \
  --prepare-evidence flow-concept-visual-viewer-refinement
node scripts/package.mjs
```

The canonical task name is `flow-concept-visual-viewer-refinement`. This feature
mode slice does not authorize the all-20 gate. Routine RepoWise scouting remains
stopped; no RepoWise checkpoint belongs in this handoff.

The implementation-and-review elapsed effort ceiling is 120 minutes from coder
receipt to an architect `qa-ready` candidate. At 60 minutes, report whether the
fixed controls and scrollbar-free Fit view work at both declared viewports,
whether pointer-anchored zoom and both-axis pan are green through at least one
direct and one alternative route, whether backdrop dismissal preserves exact
focus return and state, the cause of any variance, remaining work, confidence,
and forecast. Continue bounded work under the QA pilot unless product scope,
safety, or authority changes.

## Flow click and drag-ownership correction slice

Directional Flow scenarios 043–045 and their runtime partners correct the
pointer-event ownership shared by draggable Page instances, free and
Page-contained Event occurrences, their contextual menus, and controls projected
into Details. The correction preserves the command hierarchy, Page and Event
dragging, selection, camera, derived examples, and contextual-surface model
defined by the earlier scenarios.

An item drag is a deliberate primary-pointer gesture. A primary mouse press and
release whose total screen-space travel stays within 3 CSS pixels remains an
activation and cannot translate an item, invoke a move command, enter Saving, or
create project history. Secondary-pointer input never starts an item drag. Its
complete native press, context-menu, and release sequence leaves one contextual
menu open with deterministic focus and no canonical write. Existing keyboard
menu invocation and deliberate primary-pointer dragging remain unchanged.

Interactive controls inside Details own their complete pointer sequence. Inputs,
buttons, links, and disclosures cannot donate their press or release to the
draggable Page or Event projection that supplied the detail content. A
noncommitting interaction changes only focus or disclosure state. A committing
control performs its named command exactly once, then retains focus on its
logical rendered replacement. In either case Details remains open at its current
scroll position, and no unrelated position, topology, Draft, revision, or Undo
change occurs. This slice does not redesign Details, rename readiness states,
change JSON derivation, or alter any command's domain meaning.

**Development focus:** begin with the shared pointer-start and drag-completion
policy in `src/data-layer-flow-graph-ui.ts` and the Details projection lifecycle
in `src/flow-graph/workspace-ui.ts`. Direct characterization belongs in
`test/data-layer-flow-workspace-test.mjs`. Installed proof belongs in
`test/support/flow-workspace-r02-runtime.mjs` and must use browser-delivered
mouse input for the full press/menu/release order rather than calling
`HTMLElement.click()` or dispatching an isolated `contextmenu` event. Reuse the
existing `FLOW_WORKSPACE_CONTROLS_TARGET`, Flow browser reporter, and registry;
do not create another pack or browser target.

**QA impact:** ordinary inspection forecasts the bounded `flow_graph`,
`flow_export`, `live_flow_testing`, and `property_set_flow_sections` consumer set
because the shared Flow renderer and contextual workspace are used by those
installed projections. Exact changed-path planning remains authoritative. The
expected review-ready checkpoint is:

```sh
node scripts/run-focused-acceptance.mjs \
  --pack flow_graph \
  --pack flow_export \
  --pack live_flow_testing \
  --pack property_set_flow_sections \
  --property \
  --changed-since <approved-specification-commit> \
  --prepare-evidence flow-pointer-click-ownership
node scripts/package.mjs
```

The canonical task name is `flow-pointer-click-ownership`. This feature-mode
slice does not authorize the all-20 gate. Routine RepoWise scouting remains
stopped and is not part of the handoff.

The implementation-and-review elapsed effort ceiling is 120 minutes from coder
receipt to an architect `qa-ready` candidate. At 60 minutes, report whether
browser-delivered primary clicks avoid move saves, secondary click leaves the
nested-Event menu open after release, and Page and Event Details controls retain
their action and focus. Include any variance cause, remaining work, confidence,
and forecast; continue bounded work under the QA pilot unless product scope,
safety, or authority changes.

## Flow instance schema route-lifecycle correction slice

Directional Flow scenario 046 and its runtime partner make the Page-instance and
Event-occurrence schema editor explicitly owned by the Flow route that opened
it. This corrects the stale transient state observed when an operator uses
ordinary project navigation instead of the editor's Return to Flow control.

Opening an instance contribution records its originating Flow and stable
contributor identity. If project navigation no longer addresses that same Flow,
the editor closes before the destination settles and discards its transient
graph selection, contributor scope, return focus, and Flow-return restoration
state. The destination route then owns the main workspace and focus. This rule
applies to top-level collections including Applicability and Shared Profiles,
Project overview, Documentation, another Flow, project search, and entity
creation or removal routes.

Return to Flow remains a distinct intentional action. While the operator stays
inside the originating Flow editor, it continues to restore the recorded canvas
viewport, selection, contextual Details disclosure, scroll, and exact invoker
focus. An ordinary departure does not apply that restoration to an unrelated
destination. Navigating back to the original Flow without reloading must allow
the same Page-instance or Event-occurrence contribution to open again under its
stable identity.

The existing Initialize the canonical contribution before editing message
remains valid for a directly addressed canonical contributor that genuinely has
no initialized contribution. It must not be used as a fallback for a stale Flow
selection after route departure. Route cleanup performs no canonical
initialization, project command, save, revision change, or Undo entry. This
slice does not redesign project navigation, change composed-schema authoring,
or alter canonical contribution semantics.

**Development focus:** begin with the transient `graphSelection`,
`graphSelectionScope`, `returnFocus`, and `flowReturn` lifecycle in
`src/data-layer-layered-schema-ui.ts` and its ordering relative to
`renderWorkspace()` in `src/specification-builder.ts`. Prefer one explicit
route-reconciliation boundary that runs for every project route, including the
profile-workspace branch that currently skips the layered editor's ordinary
render call. Do not repair this by changing or hiding the initialization
message. Direct lifecycle characterization belongs in the layered-schema UI
tests; installed proof belongs beside Flow runtime 045 in
`test/support/flow-workspace-r02-runtime.mjs` and must activate real project-tree
controls, reopen the original Flow without page reload, and verify both Page and
Event contributors.

**QA impact:** ordinary inspection forecasts the bounded `flow_graph` and
`layered_schema` packs because the defect crosses the Flow contributor editor
and layered-schema route lifecycle. Exact changed-path planning remains
authoritative and may add an owning navigation pack if the implementation must
change a separately owned route boundary. The expected review-ready checkpoint
is:

```sh
node scripts/run-focused-acceptance.mjs \
  --pack flow_graph \
  --pack layered_schema \
  --property \
  --changed-since <approved-specification-commit> \
  --prepare-evidence flow-instance-schema-route-lifecycle
node scripts/package.mjs
```

The canonical task name is `flow-instance-schema-route-lifecycle`. This
feature-mode slice does not authorize the all-20 gate. Routine RepoWise scouting
remains stopped and is not part of the handoff.

The implementation-and-review elapsed effort ceiling is 120 minutes from coder
receipt to an architect `qa-ready` candidate. At 60 minutes, report whether
Applicability and Shared Profiles render directly after Page and Event editor
departure, whether returning and reopening works without reload, whether the
initialization fallback remains correctly scoped, the cause of any variance,
remaining work, confidence, and forecast. Continue bounded work under the QA
pilot unless product scope, safety, or authority changes.

## Flow Page-instance and Event-occurrence schema-editor scrolling correction slice

Directional Flow scenario 047 and its runtime partner require the schema
contribution editor opened for a Flow Page instance or Event occurrence to be a
vertically scrollable workspace. Scenario 046 establishes that this editor is
owned by the originating Flow route; this slice makes every schema property and
its final Return to Flow action reachable when that route is taller than the
available viewport.

The visible schema-editor route has exactly one vertical scroll owner. Repeated
downward wheel or keyboard input reaches Return to Flow, and reverse input
returns to the first schema property control. The outer document is not a
substitute scroll surface. Scrolling does not move the hidden Flow camera,
change the stable Page-instance or Event-occurrence contributor, save schema
content, advance the Draft revision, or create an Undo entry. This requirement
does not change schema composition, property authoring, or Return to Flow's
existing restoration behavior.

**Development focus:** begin with the active-route layout boundary between
`src/flow-graph/flow-workspace-shell.css`, `layered-schema.css`, and the
`#workspace-content` / `#layered-schema-editor-host` visibility transitions in
`src/data-layer-layered-schema-ui.ts`. The Flow-shell rules must constrain the
visible canvas workspace without leaving the visible schema-editor route unable
to scroll after the canvas becomes hidden. Prefer a single editor-route scroll
owner over nested document, pane, and editor scrollbars. Direct stylesheet and
route-layout characterization belongs beside
`test/flow-stylesheet-extraction-test.mjs`; installed wheel and Page Down proof
for both contributor scopes belongs in
`test/support/flow-workspace-r02-runtime.mjs` beside runtime 046 and in the Flow
browser-pack mapping.

**QA impact:** ordinary inspection forecasts the bounded `flow_graph` and
`layered_schema` packs because the defect crosses the Flow shell bridge and the
shared schema-editor host. Likely shared integration surfaces are
`src/flow-graph/flow-workspace-shell.css`, owned by parent pack `flow_graph` as a
shell bridge consumed by `shell`, and `src/data-layer-layered-schema-ui.ts` plus
the shell-owned `layered-schema.css`, consumed by parent pack `layered_schema`.
The existing `layered_schema_composition` source prefix covers the layered
schema TypeScript surface; no new source prefix is proposed. The coder must run
read-only ownership intent before product coding, and exact changed-path
preflight remains authoritative if the stylesheet change adds the `shell` pack.
The expected review-ready checkpoint is:

```sh
node scripts/run-focused-acceptance.mjs \
  --pack flow_graph \
  --pack layered_schema \
  --property \
  --changed-since <approved-specification-commit> \
  --prepare-evidence flow-instance-schema-editor-scrolling
node scripts/package.mjs
```

The canonical task name is `flow-instance-schema-editor-scrolling`. This
feature-mode slice does not authorize the all-20 gate. Routine RepoWise scouting
remains stopped and is not part of the handoff.

The implementation-and-review elapsed effort ceiling is 120 minutes from coder
receipt to an architect `qa-ready` candidate. At 60 minutes, report Page-instance
and Event-occurrence schema-editor overflow geometry, the single active scroll
owner, wheel and keyboard results, Return to Flow reachability, outer-document
and camera conservation, current exact packs and tasks, any forecast variance,
failures, remaining work, confidence, and forecast. Continue bounded work under
the QA pilot unless product scope, safety, or authority changes.

### Ownership-readiness pause and automatic verification-slice preparation

The coder's read-only intent from QA `28e7b2dded` returned
`granularity-assessment-required` before product coding. The broad
`src/data-layer-layered-schema-ui.ts` path currently selects six packs and 156
tasks through the propagating `layered_schema_composition` boundary, including
unrelated `flow_export`, `live_flow_testing`, and
`property_set_flow_sections` families. No coherent scrolling implementation was
created, so there is no product commit to merge, preserve, or forward.

Under the standing granularity-ratchet authority, task
`verification-slice-flow-instance-schema-editor-scrolling` now starts from that
exact QA head. It may extract the Flow-launched editor-host route presentation
to `src/layered-schema/flow-editor-route-layout.ts`, register it as
`layered_schema_flow_editor_route` under parent `layered_schema` with
`flow_graph` as its exact consumer, and record an `integrated-seam` disposition
for the broad source path. If the extraction cannot truthfully exclude general
schema composition, it records a reviewed `parent-fallback` instead. The
complete preparation contract, conservation requirements, six-pack starting
forecast, and 120-minute effort boundary are recorded in
`docs/qa-verification-granularity-ratchet-R01.md`.

The preparation implements no scrolling behavior and does not alter scenario
047. After its architect `qa-ready` candidate reaches QA, reissue stable product
task `flow-instance-schema-editor-scrolling` from that exact head without
another user decision. Fresh product intent and exact preflight remain
authoritative, and no feature-mode role may run the all-20 gate.

The preparation is now QA-integrated at `4daea21df0`. The reviewed extraction
places only the Flow editor-route layout lifecycle in
`src/layered-schema/flow-editor-route-layout.ts`, registers the exact
`layered_schema_flow_editor_route` slice with its `flow_graph` consumer, and
records the `integrated-seam` disposition for the former broad intent path.
Conservative review passed 183 focused tasks across the original six-pack set,
including properties and package proof, without an all-20 run. Scenario 047 and
scroll overflow remain intentionally unimplemented. No slice quarantine is
active; the original product task is therefore ready for automatic reissue from
the exact documentation scorecard descendant of this integration.

### Settled scrolling correction

The product correction is QA-integrated at `736823be2d` from exact reissue base
`7b31239615`. The visible `#layered-schema-editor-host` is now the one contained
vertical route scroll owner and resets to its upper limit whenever a Flow schema
route opens. Installed scenario-047 evidence uses repeated wheel input for a
Page instance and Page Down/Page Up for an Event occurrence. It reaches the
final Return to Flow control, returns to the first schema-property control, and
conserves document scroll, Flow camera, contributor ID and scope, canonical
project bytes, Draft revision, persistence state, and Undo depth. Scenario 046
continues to prove ordinary route departure and Return-to-Flow restoration.

The exact final plan selected `flow_graph`, `layered_schema`, and `shell` and
passed 147 focused tasks with properties, installed browser evidence, acceptance
sessions, package proof, and no all-20 run. The resumed product cycle took
2 hours 20 minutes 18 seconds from reissue to architect `qa-ready`, exceeding
the 120-minute estimate by 20 minutes 18 seconds. Evidence ownership, tall
fixture compatibility, and runtime-leaf conservation were repaired within the
same product scope before the final proof. No unresolved product failure or
terminal incident remains. This is QA integration only; cumulative promotion to
`master` still requires explicit user direction and one frozen all-20 release
gate.
