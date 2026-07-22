# Data-layer canonical schema authoring correction program R01

## Decision and authority

This program is the current authority for rich schema authoring and layered
effective-schema composition in the active data-layer scope. It refines and, where
necessary, supersedes the first implementation of
`data-layer-layered-schema-constraints`. The directional Flow graph remains active;
this program changes how schema definitions are authored and composed, not the
graph's documentary purpose.

The product shall have one canonical schema-document model, one in-panel Schema
editor, and one authoring language. Shared Profiles, Page Groups, Pages, Events,
Flow Page instances, and Event occurrences use the same property and rule
capabilities. Their entity type determines applicability, inheritance, and
provenance, not their storage shape, editor type, or validation features.

This program does not reactivate the archived full-site R02/R04 release program.
Fixtures, coverage, preflight, release, Live, temporal journey enforcement, and
project-wide documentation export remain outside the active slice. Flow sequence
expectations remain for people to inspect; automatic assurance remains per-Event
schema selection and validation.

## Corrective outcome

An operator can create or adopt a complete schema, find every saved schema and
project contributor through one side-panel Schema list, edit the selected record in
the established in-panel editor or its parity-complete standalone projection,
refine it at each applicable Page or Event context, inspect inherited and effective
results with provenance, export the selected context for developers, and validate
observed Events against that result.

The implementation cannot satisfy this program with a lightweight requirements
grid, a free-text path overlay, a disconnected structured draft, a contributor-
specific rule subset, raw identifiers, direct storage injection, or a component
that is not connected to the production repository, compiler, assignment resolver,
and validator.

## Observed defect and root cause

The current Shared Profile experience misses the intended base-schema model:

- its overview has no contextual creation action;
- its Builder form is substantially less capable than the existing side-panel
  schema editor;
- nested paths and property types are authored as free text;
- required, forbidden, allowed values, rules, documentation, and examples lack the
  side-panel interactions;
- a saved schema can be adopted without becoming the one project schema edited and
  compiled everywhere; and
- downstream entity types expose a separate, thinner constraint form; and
- the side panel can mount a second Shared Profile or composed-schema editor beside
  the established Schema editor, splitting the schema list and control surface.

The implementation currently permits three editable profile representations:
lightweight `requirements`, a `structuredSchema` or `structuredDraft`, and
path-based `schemaConstraints`. Independent commands can update different stores,
so rendered rows, adopted schemas, and compiler input can diverge. The correction
is a model replacement, not an additional synchronization adapter between those
representations.

## Canonical schema document

Each project-owned schema contribution is a revisioned tree. A property node has a
stable identity that does not change when its display name, parent, order, or
generated path changes. The canonical document records:

- name, generated path, parent, order, and scalar, object, array, and item types;
- unconditional and conditional required or forbidden presence;
- typed allowed values and type-aware validation rules, including regular
  expressions, ranges, cardinality, conditions, severity, messages, and reusable
  rule references;
- display text, description, comments, typed example, and whether the example was
  selected from allowed values, custom, or blank;
- contributor, applicability, source lineage, local revision, authoring provenance,
  and explicit override or conflict-resolution references; and
- compilation state, issues, and effective provenance as derived output.

Paths are projections of tree structure. Adding a child or moving or renaming a
node generates the path. Operators do not need to construct JSON Pointer text to
create a valid nested property. Stable identities, rather than generated paths,
anchor rules, conditions, documentation, selection, references, and Undo.

`requirements`, if retained for compatibility or reporting, is a read-only
projection of the canonical tree. It is never an independently writable schema.
Advanced JSON may be a round-trip-safe optional view, but it cannot be the only
route to any supported property or rule.

Conditional presence, conditional validation, and applicability use one advanced
predicate builder. It supports nested All, Any, and Not groups, stable human-name
property selectors, type-compatible operators and values, and matching tests that
identify satisfied and failed branches. A broken reference or incompatible value
blocks the exact predicate control; operators do not need to write raw query text.

## Creation and saved-schema adoption

The Shared Profiles overview owns `Add Shared Profile` and `Add saved schema to
project` as visible contextual actions. A blank profile starts with one empty tree
and recommends adding a root property.

Adoption clones the selected saved revision into one project-owned draft while
preserving source identity, source revision, and adoption provenance. The Saved
Schema Library source remains unchanged. Builder, side panel, table, compiler, and
validator all refer to the project draft's identity and revision. Later project
edits do not mutate the library source, and source updates do not silently rewrite
the project draft.

Adoption is lossless across the Saved Schema's source representations. Property
documentation stored separately from its JSON document maps to the canonical
property documentation facets. Unconditional attached `exact-value` and
`allowed-values` rules supply the effective Expected value and typed Allowed values
shown by the canonical Table. An attached conditional `required` rule supplies
Required when presence and its structured condition. Every mapped facet retains
its rule identity, revision, enabled state, severity, optional issue message, and
provenance. Tree, Table, side panel, compiler, and validator consume that same
adopted property without manual re-entry or a repair migration, and reload does not
erase the mapped facets.

## One authoring language at every layer

Every contributor opens the same editor core and emits the same property-scoped
commands:

1. Shared Profiles provide reusable generic or purpose-specific schemas. A profile
   may be broad, such as Sitewide, or specific, such as Opened Article.
2. Page Groups contribute rules to Pages through each Page's ordered membership
   stack.
3. A Page inherits applicable profiles and every applicable Page Group from general
   to specific membership order, then contributes its own refinements to every
   instance of that Page.
4. A Flow Page instance contributes refinements only inside that particular Flow
   context.
5. An Event inherits applicable profiles and contributes its reusable Event
   definition independently of Page Group membership.
6. An Event occurrence contributes refinements only to that occurrence.

For example, Opened Article can define the reusable `event` and `article_name`
properties; Article Opened can document or narrow the Event; and its Summer article
occurrence can require `article_name` to equal `Summer sale`.

The contextual scope controls where a definition participates. It does not replace
the property editor with entity-specific columns or free-text rules.

A Shared Profile is a role played by a canonical schema contribution. It is not a
second schema-document type and does not own a Shared-Profile-specific editor.
Inheritance and composition belong to the canonical model: stable contributor
references identify parents, sparse local facets record differences, and effective,
shadowed, conflicting, and provenance values are derived for every editor surface.

## Composition branches

The Page and Event branches are independent until an Event occurrence is placed in
a Page context:

```text
applicable Shared Profiles -> ordered Page Group stack -> Page -> Flow Page instance
                           \-> Event ------------------------------> Event occurrence
                                                                  /
                               effective Event occurrence
```

An Event occurrence outside Page containment compiles only applicable Shared
Profiles, Event, and occurrence contributions. An Event occurrence inside a Flow
Page instance combines both branches. The Page or Page instance is itself the
context, and every Event occurrence is an interaction. Optional trigger text is
documentation metadata and creates no separate role, binding, or composition path.
Page or Page Group membership is never invented for an Event, and moving a canvas
occurrence cannot alter its containing Page or Page Group contract.

More-specific contributions may narrow inherited allowed values, add compatible
rules, or explicitly replace an ordinary inherited expectation at the same
property facet. The editor records that replacement as a sparse local override and
shows the shadowed parent definitions. It may not silently change a type, widen an
allowed universe, relax required, re-enable a forbidden property, or defeat an
explicit inherited invariant. Incompatible Page-branch and Event-branch
definitions are parallel conflicts: neither branch wins because of storage order
or entity type. An explicit contextual resolution must reference the definitions
and facets it resolves.

When multiple Shared Profiles contribute to one context, they are parallel peers
unless an explicit relationship says otherwise. Conflicts block compilation; list
order is not precedence.

## Ordered Page Group membership

A Page owns one ordered list of stable Page Group references. The order reads from
general to specific and is an explicit schema-composition contract. Page Group
member lists are derived projections and cannot become a competing editable source.
Duplicate or unknown memberships are rejected.

Migration preserves any existing Page-owned order, appends memberships found only
in legacy Page Group member lists using stable Page Group collection order, and
requires human confirmation. Missing references block the atomic migration; one
Undo restores both legacy sources.

The Page editor exposes a visible `Add to Page Group` action and the same action in
its context menu. Its searchable picker uses human names and shows purpose,
applicability, and prospective rule impact. The resulting `Page Group rule stack`
supports pointer and keyboard reordering, removal, direct group navigation, and an
effective contribution or conflict summary for every row.

Only memberships applicable to the selected observation participate in compilation;
inactive memberships remain visible in exclusion evidence and active groups retain
their relative Page-defined order. A later applicable group may narrow or explicitly
replace an earlier overridable definition under the same legality rules used at
other layers. Order cannot legalize a type change, widening, required relaxation,
forbidden re-enablement, unresolved conflict, or overlapping applicability. Those
conditions block with exact Page Group provenance and repair actions.

Before membership reorder or removal, impact review names changed effective
properties, affected Page instances and compiled targets, stale exports or evidence,
Draft status, and Undo. Removing a membership currently used as a Flow frame's
placement group is blocked until the frame moves to another eligible membership or
is removed.

## One in-panel Schema list and editor

The pre-existing in-panel Schema editor remains the sole schema editing surface in
the side panel. One Schema list reaches saved library schemas and project
contributors, grouped by Shared, Page Groups, Pages, Events, Flow instances, and
Occurrences. Each entry exposes a human name, role, scope, lineage, revision, and
Draft or saved state. Filtering or selecting a group changes which canonical record
the regular editor displays; it never mounts a second editor beside it.

This requirement has a fixed presentation direction. The existing compact
side-panel renderer remains the side-panel editor: its schema header, property
filter and sort, complete property tree, assisted nested-property creation,
type selector, conditional presence controls, typed allowed-value builder, rich
rule builder, documentation and example controls, and property lifecycle actions
must remain usable in their panel-oriented layout. A canonical model adapter may
replace its persistence internals, but the Builder/standalone canonical editor or
wide table must not be mounted inside the established side-panel form. Parity is
not satisfied by hiding the established controls and embedding the project editor
in the narrower viewport.

The same property navigator, structural actions, type controls, conditional
presence, typed allowed values, rich rules, documentation, examples, impact review,
revision comparison, Undo, and Redo remain available regardless of contributor
role. Selecting a Shared Profile changes the header, scope, inheritance, and
provenance context only. The panel must not render an adjacent Shared Profile
editor, requirements grid, composed-schema form, duplicate property controls, or a
separate list backed by another representation.

Inherited definitions appear inside this regular editor. An inherited row refers
to its stable parent contributor and derived effective result; `Override here`
stores only the current contributor's changed facets, while `Reset to parents`
deletes those facets and recompiles from live parents. Neither display nor reset
copies parent properties, effective values, or a composed snapshot into the child.

## Standalone parity and wide composed-schema table

The proven side-panel schema editor supplies the interaction model. The Builder
and standalone entity workspaces use the same canonical command model and provide
the same operations through a layout suited to the larger viewport. They do not
require the side panel and standalone workspace to share one rendered DOM tree:

- a profile or contributor header with Draft state, lineage, save state, revision
  comparison, Undo, and Redo;
- a searchable, filterable property navigator;
- a rich composed-schema table that keeps every effective property visible;
- inline editing for common type, presence, expectation, allowed-value,
  documentation, example, and row operations;
- expandable row detail for complete condition, rule, provenance, impact, and
  other complex side-panel capabilities; and
- effective documentation, validation state, impact, and provenance.

Property search is transient editor state, not a canonical command. Typing,
mid-string editing, clearing, and input-method composition update only the navigator
results. The same connected search control retains focus, value, caret, selection,
and composing text until the operator deliberately moves focus. This behavior is
shared by every contributor kind in Builder, Flow workspace, and side panel at wide
and 360px widths.

Tree and Table are synchronized projections of the same canonical Saved Draft and
selection. The Table preserves hierarchy and supports the complete property
lifecycle. Its wide layout exposes property, path, type, presence, expected or
allowed values, conditions, rules, documentation, example, source, local state,
validation state, and actions. Expanding one row mounts its complete complex
builders beneath that row without unmounting the other property rows or navigating
to a separate one-property screen. An edit in any projection appears in the others
immediately. At 360px the same table becomes compact rows with stacked expandable
detail, one vertical scroll owner, no horizontal page scroll, and deterministic
focus restoration.

Parity means every purpose-built operation in the established in-panel editor is
available in the standalone workspace and emits the same property-scoped command.
It does not require identical geometry: the side panel may use a compact tree and
stacked property details while the standalone workspace uses a wide multi-row
table. Nested structural authoring, scalar and container types, array item types,
all presence modes, allowed values, regular expressions, ranges, cardinality,
conditions, reusable rules, documentation, examples, property lifecycle actions,
impact review, and page-scoped Undo/Redo must round-trip both directions without raw JSON or a
surface-specific stored schema.

## Direct Page and Page Group schema workspaces

Opening a Page or Page Group from its overview routes directly to its complete
main-workspace configuration. The workspace combines applicability and membership
configuration with an `Effective schema at <name>` table. Every row shows the full
parent contribution stack, the contributor's sparse local contribution, the
effective definition, shadowed definitions, conflicts, validation state, and exact
provenance. The Inspector is only an optional contextual summary and link to this
same workspace; it neither owns the editor nor mounts a parallel schema model.

An inherited row offers `Override here`. Saving changes only the selected property
facets at the current contributor and leaves all other facets inherited. A locally
adjusted inherited row offers `Reset to parents`; confirmation deletes the sparse
local contribution and immediately recompiles from the current parents rather than
copying a parent value into local storage. A local-only property instead offers
`Remove local property`. Both actions preview changed effective values, affected
instances, stale outputs, Draft status, runtime consequences, and one Undo action.

Adding a Page Group to a Page always commits the ordered stable membership as a
Draft configuration change and then recompiles the Page. A Page's explicit local
facet resolves an ordinary difference on that same facet, remains effective, and
produces a non-blocking warning with shadowed-parent provenance. The warning does
not force the operator to discard either the membership or the intentional Page
override. A parent difference not covered by a local facet, an illegal type or
allowed-universe change, or an inherited invariant remains visibly unresolved and
marks the effective schema `Blocked`. That readiness blocker prevents validation
and developer export from claiming the Page is ready, but it does not roll back the
membership edit or make the Page configuration inaccessible. Repairs link directly
to a permitted local override, the contributing Page Group definition, or removal
of the membership.

The Flow Inspector remains contextual and compact. It shows useful inherited,
local, effective, conflict, and activation counts and opens the full editor in the
main workspace. Returning to Flow restores selection and viewport.

## Persistence and migration

Every edit is a command-scoped patch with a base revision. Builder and side panel
subscribe to the same canonical repository. A stale command is rebased, rejected,
or presented for visible resolution at its affected property; it never replaces the
complete collection from an old snapshot.

On first open after upgrade, a profile containing legacy requirements, structured
drafts, or path constraints receives a deterministic migration review:

1. Generate stable property nodes and paths from all legacy material.
2. Collapse semantically identical definitions into one node while retaining all
   source provenance.
3. Surface incompatible definitions at the generated property path.
4. Require resolution before commit.
5. Replace all editable legacy representations in one atomic Saved Draft transaction.
6. Make one Undo restore the complete pre-migration project state.

No data is discarded merely because it came from a superseded representation.

## Selection, export, and validation boundary

An effective schema target may be selected by matcher-driven applicability, an
explicit human-readable Flow/Page/Event selection, or marked Documentation only.
Stable references are persisted beneath those controls. Matcher tests expose failed
predicates and overlapping candidates; equal-priority ambiguity blocks automatic
selection.

For an observed data-layer Event, the assignment resolver uses the observed Event
identity and Page applicability evidence such as URL, pathname, `page_name`, or
other authored predicates. It does not require a Flow context-binding record. Flow
Page context and optional Event triggers may explain documentary intent, but no
Event role can be selected or stored and neither can alter the assignment winner or
validation schema.

The selected-context developer export shows the complete effective property tree,
inherited and local differences, conditions, documentation, examples, activation,
and provenance. Documentation-only targets compile and export but do not enter
automatic or manual validation indexes.

Per-Event validation consumes the exact compiled target and reports path, code,
severity, expected value, actual value, schema revision, and provenance. It does not
claim that a Flow sequence, branch, or expected occurrence was completed.

## Production boundaries and required evidence

Presentation scenarios define what the operator can see and do. Their paired
runtime scenarios must exercise the built extension through actual controls and
prove the corresponding repository, migration, compiler, assignment, export, and
validator effects. Passing an isolated component, mocked parallel model, direct
storage fixture, or raw-ID route is insufficient.

Required evidence comprises:

- rendered control and focus evidence for creation and rich editing;
- canonical persisted document and stable-reference evidence after reload;
- source-library immutability and adoption-lineage evidence;
- migration transaction and atomic Undo evidence;
- synchronized Builder, Table, and side-panel revision evidence;
- compiler output and property-level provenance for Page, Event, and combined
  branches;
- matcher winner, rejection, and ambiguity evidence;
- selected-context export evidence; and
- positive and negative production per-Event validation results.

Agent role-playing without source knowledge and facilitated Windows usability are
not automated acceptance gates for this cycle. The product owner may perform a
separate Windows walkthrough after delivery.

## Delivery phases

### Phase A — canonical model and migration

Replace the three editable representations with one schema document, stable
property identities, adoption lineage, command patches, revision subscriptions,
deterministic atomic schema migration, and atomic reconciliation of Page-owned and
Page-Group-owned legacy membership.

### Phase B — rich shared editor

Deliver contextual creation, structural nested authoring, type and presence
controls, allowed values, rich rules, documentation, examples, search, filtering,
revision comparison, ordered Page Group membership controls, direct Page and Page
Group composed-schema workspaces, one grouped in-panel Schema list, one established
panel editor, and synchronized Tree and parity-complete rich multi-row Table views
in the wide workspace.

### Phase C — uniform contributors and compiler

Use the same contribution commands for every layer; implement Page and Event
branches, contextual composition, invariants, explicit overrides, parallel conflict
handling, and exact provenance.

### Phase D — assignment, export, and per-Event validation

Connect applicability, manual selection, Documentation-only behavior,
selected-context export, and exact per-Event validation to the canonical compiled
target.

### Phase E — installed terminal proof

Run the behavior and runtime contracts through the focused acceptance pack and
package the same built extension. The terminal examples must survive reload and
cannot substitute direct state injection for operator actions.

## Finding-to-feature traceability

`Authoring NNN` refers to
`features/data-layer-canonical-shared-profile-schema-authoring.feature` and its
paired runtime feature. `Layering NNN` refers to
`features/data-layer-layered-schema-constraints.feature` and its paired runtime
feature.

| ID | Finding or decision | Feature and scenario | Externally visible behavior | Production boundary | Required evidence | Phase | Terminal pass condition |
|---|---|---|---|---|---|---|---|
| C01 | Shared Profiles overview lacks creation | Authoring 001 | Contextual Add Shared Profile and Add saved schema actions with purpose guidance | Builder routing and project commands | Rendered controls and created entity | B | A profile is created without the global entity form |
| C02 | Blank profiles create competing models | Authoring 002 | One empty tree and one next action; no editable grid, path list, or parallel draft | Canonical repository | Persisted shape and rendered workspace | A, B | Exactly one editable schema document exists |
| C03 | Saved schemas are disconnected from projects | Authoring 003 | Adoption opens a project-owned complete schema and preserves library source | Library adapter, adoption command, repository | Structural equality, lineage, source bytes | A | Every surface and compiler reads the adopted draft identity |
| C04 | Legacy requirements, drafts, and constraints diverge | Authoring 004 | Review, conflicts, atomic migration, one-step Undo | Migration and transaction store | Before/after documents and Undo restoration | A | No editable legacy representation remains and no content is lost |
| C05 | Builder lacks side-panel parity | Authoring 005 | Wide navigator, complete schema table, expandable row detail, effective preview, optional JSON | Shared editor core and command bus | Same actions and command results in both surfaces | B | Every supported side-panel edit succeeds in Builder |
| C06 | Paths and nesting require free text | Authoring 006 | Structural root/child actions and generated paths survive rename | Property tree and reference resolver | Generated paths and stable IDs after rename/reload | A, B | Nested properties require no typed pointer and references remain valid |
| C07 | Type is unconstrained free text | Authoring 007 | Valid type and item-type selectors with impact review | Schema command validation | Stored typed definition and destructive confirmation | B | An invalid free-text type cannot be stored |
| C08 | Presence lacks conditional required/forbidden | Authoring 008 | Required, Required when, Forbidden, Forbidden when with property selectors | Condition AST and compiler | Structured conditions and compiled outcomes | B, C | All four modes compile without raw expressions |
| C09 | Allowed values use an inferior free-text field | Authoring 009 | Labelled repeatable typed values, removal, and keyboard reorder | Typed value command model | Separate stored values and rendered inputs | B | Commas or JSON text are not used as the canonical value set |
| C10 | Rules use free text instead of the rich builder | Authoring 009 | Type-aware picker, conditions, severity, messages, reusable rules | Rule AST and reusable-rule resolver | Stored structured rule and compiler output | B, C | Every supported side-panel rule is authorable in Builder |
| C11 | Documentation and examples are incomplete | Authoring 010 | Display text, description, comments, allowed/custom/blank typed examples | Documentation model and renderer | Reloaded typed values and inert rendering | B | Documentation fields and selection method survive reload |
| C12 | Table is lighter than the side panel | Authoring 011 | Hierarchical synchronized multi-row table with inline common edits and complete expanded builders | Tree/Table view models over one revision | Concurrent visible rows, cross-view edits, and mounted-state evidence | B | No schema operation requires a separate one-property screen or a different model |
| C13 | Builder and side panel can lose updates | Authoring 012 | Subscriptions plus visible property-scoped stale-write handling | Revisioned command repository | Concurrent revisions and final canonical document | A | A stale save cannot overwrite a newer unrelated edit |
| C14 | End-to-end rich editing could still use parallel state | Authoring 013 | Adopt, nest, condition, constrain, document, table-edit, side-edit, reload, compile | All authoring and compiler boundaries | Installed terminal trace and persisted identity | E | One property definition is identical across every surface and compiler |
| C15 | Contributor types have different authoring capabilities | Layering 001 | Identical schema actions for all six contributor kinds | Editor core, command schema, repository | Scenario-outline parity through actual controls | B, C | Contributor type changes only scope and provenance |
| C16 | Page hierarchy needs predictable refinements | Layering 002 | Sitewide to Page Group to Page to Page-instance composition | Effective-schema compiler | Values and provenance inside and outside instance | C | Instance value 3b does not mutate Page value 3a |
| C17 | Event definitions must be reusable and Page-Group independent | Layering 003 | Event-specific Shared Profile, Event refinement, occurrence value | Profile attachment and Event compiler branch | Contained and uncontained Event outputs | C | Uncontained Event has no invented Page Group contribution |
| C18 | Page and Event branches need one effective occurrence | Layering 004 | Combined property tree; parallel conflicts block; explicit resolution | Branch merge and conflict resolver | Blocking result and resolved provenance | C | Neither branch can silently win an incompatibility |
| C19 | Override legality must protect inherited contracts | Layering 005 | Deterministic narrowing, invariant, condition, and named replacement rules | Compiler legality matrix | One result per example row | C | All unsafe weakenings block with explanation |
| C20 | Contextual grouping must not become different schema models | Layering 006 | Exact Page Group, Page, Event, instance, and occurrence reach | Scope resolver and stable-reference store | Inclusion/exclusion and storage evidence | C | Each target receives exactly its contextual contributors |
| C21 | Automatic applicability and Page context must be explainable | Layering 007 | Human predicates select Page and Event context without a Flow binding | Matcher and assignment resolver | Winner, rejected candidates, overlap evidence, and absent binding lookup | D | Equal-priority overlap cannot silently select a target and no context binding can change the result |
| C22 | Schemas may be manually assigned | Layering 008 | Human Flow/Page/Event selection uses stable target | Manual assignment resolver | Unified result and stable target identity | D | Manual validation does not claim an automatic winner |
| C23 | Schemas may exist for documentation only | Layering 009 | Complete export without validation registration | Compiler, exporter, assignment index | Export and absent index entry | D | Documentation-only content creates no runtime ambiguity |
| C24 | Flow should not force rich editing into Inspector | Layering 010 | Compact optional summary opens the same full main editor and restores canvas state | Flow selection routing and shared editor | Selection, viewport, and save-impact evidence | B, C | Inspector owns no exclusive or parallel schema editor |
| C25 | MVP assurance is per-Event, not full-Flow validation | Layering 011 | Positive and negative exact-value results with no sequence claim | Assignment and per-Event validator | Exact issue tuple and unified result | D | Invalid 3a fails expected 3b while valid 3b passes |
| C26 | Developers need the effective values for a concrete occurrence | Layering 012 | Complete selected-context export plus positive and negative validation | Compiler, exporter, validator | Export, provenance, and issue collection | D, E | Summer article occurrence is documented and validated from one compiled schema |
| C27 | Complete specifications need richer queries without losing side-panel behavior | Authoring 014 | Nested All, Any, and Not groups with selectors, typed operators, and matcher evidence | Shared predicate AST, rule compiler, applicability matcher | Persisted predicate tree plus positive and negative tests | B, D | Conditions require no raw expression and invalid branches focus exact controls |
| C28 | Canonical property search drops focus after each character | Authoring 015–016 | Continuous typing, caret editing, composition, and clearing retain search focus on every contributor surface | Shared canonical editor renderer, navigator projection, and focus adapter | Per-event active element and selection offsets, filtered rows, unchanged revision and storage | B, E | A multi-character query completes without refocusing and search emits no canonical command |
| C29 | Pages need multiple ordered Page Group memberships | Layering 013 | Searchable Add to Page Group and an accessible ordered rule stack | Page membership command, Page editor, and derived group member projection | Stable ordered references, focus restoration, impact preview, and absent duplicate source | B, C | Page owns one general-to-specific membership list and group members derive from it |
| C30 | Membership order must refine without hiding unsafe conflicts | Layering 014 | Applicable groups compose in relative order with exclusion and conflict explanations | Applicability matcher, Page-branch compiler, and legality matrix | Retail and Trade outputs, excluded contributors, blocking issues, and overlap evidence | C, D | Order selects no ambiguous group and cannot legalize an unsafe override |
| C31 | Existing Page and Page Group membership sources may diverge | Layering 015 | Human migration review preserves Page order and appends group-only membership | Membership migration, project transaction store, and derived member projection | Proposed ordered union, missing-reference blocker, canonical Saved Draft, and page-scoped Undo restoration | A | No membership is lost and only the Page-owned ordered list remains editable |
| C32 | Page and Page Group schema editing is hidden behind Inspector interaction | Layering 016 | Direct entity routes show complete configuration and composed effective-schema rows | Builder routing, shared editor, and effective-schema compiler | Route ancestry, mounted rows, contribution stacks, and absent parallel editor | B, C | Overview-to-entity editing never requires the Inspector |
| C33 | Page-local overrides must remain intentional and reversible as parents change | Layering 017 | Local facet wins ordinary parent differences, warns, and can reset to live parents | Sparse contribution commands and Page-branch compiler | Local facet storage, shadowed provenance, reset impact, recompilation, and Undo | B, C | Reset deletes the local contribution and never copies a parent snapshot |
| C34 | Adding a Page Group must preserve configuration even when compilation needs repair | Layering 018 | Membership commits as Draft while uncovered or invariant conflicts block readiness with direct repairs | Membership transaction, legality matrix, validator, and exporter | Committed stable membership, blocked facets, provenance, and readiness state | C, D | No membership is lost, and no blocked effective schema is reported ready |
| C35 | Complete composed-schema editing must remain operable at 360px | Layering 019 | Compact rows and stacked complete detail use one vertical scroll owner | Responsive shared editor and focus adapter | Width, overflow, mounted rows, controls, and focus restoration | B, E | Every property and schema action remains reachable without horizontal page scrolling |
| C36 | Shared Profiles incorrectly mount a second side-panel schema editor | Authoring 017 | One grouped Schema list selects every role into the established editor region | Side-panel routing, schema list projection, and shared editor host | One editor landmark, grouped entries, reused controls, and absent adjacent forms | B, E | Selecting Shared Profile leaves exactly one in-panel schema editor mounted |
| C37 | Inheritance is treated as a standalone composed-view concern | Authoring 018 | The regular panel editor shows parent stacks and stores sparse overrides and resets | Canonical contributor graph, property command bus, compiler, and validator | Stable parent references, sparse child bytes, two-surface result, and absent snapshots | A, C, E | Panel, standalone, compiler, and validator derive one effective property without copying a parent |
| C38 | Standalone controls can be thinner or different from the established panel editor | Authoring 019 | Representative rich operations round-trip in both directions through purpose-built controls | Shared editor core, command schema, repository subscriptions, and responsive projections | Control availability, command identity, revision equality, canonical bytes, and rendered results | B, E | Every supported panel operation succeeds standalone with the same canonical result and no raw-JSON substitute |
| C39 | Parity was inverted by mounting the standalone/project editor inside the side panel | Authoring 020 | The panel retains its compact established editor while standalone uses a wide table over the same canonical commands | Surface-specific renderers, canonical command adapter, repository subscriptions, and responsive layout | Installed side-panel and standalone landmarks, complete control inventories, no nested project editor, command identity, revision equality, and 360px measurements | B, E | The side panel remains fully usable with its established compact controls and the standalone workspace independently provides complete parity |
| C40 | Saved-schema adoption drops separate documentation and rule-derived values | Authoring 021 and 022 | Adoption immediately projects property documentation, exact and allowed rule values, and conditional required presence into the canonical Table | Saved-schema adoption adapter, canonical property mapper, Table projection, compiler, validator, and repository | Three rule forms, rendered documentation, value, presence, and condition cells, retained optional metadata, compiled outcomes, reload, provenance, and source hash | A, B, C, E | Adopted Shared Profile rows show source documentation and all mapped rule facets without re-entry while the Saved Schema remains unchanged |

## Terminal acceptance

The program passes only when all four active feature files parse and dry-check with
no findings, the focused `layered_schema` acceptance pack passes against the built
extension, and packaging consumes that same built output. The terminal evidence must
show:

- one adopted project schema, one property identity, and one revision across
  Builder, Table, side panel, reload, compilation, and validation;
- lossless adoption of separately stored property documentation and attached exact-
  value, allowed-values, or conditional required rule projections into the canonical
  Table without source mutation or manual repair;
- one grouped side-panel Schema list and exactly one established in-panel editor
  region for saved schemas and every contributor role;
- native inheritance in that editor through stable parent references, sparse local
  facets, effective provenance, and reset without copied parent snapshots;
- bidirectional standalone parity for structural, type, presence, value, rule,
  documentation, example, lifecycle, impact, and page-scoped Undo/Redo operations;
- the same rich controls at all contributor levels;
- direct Page and Page Group composed-schema workspaces with all effective rows
  visible, field-level provenance, inline edits, and expandable complex builders;
- Page-local ordinary overrides that warn rather than disappear when a parent is
  added, sparse reset-to-parent behavior, and readiness blocking for uncovered or
  invariant conflicts;
- the complete composed-schema editor at 360px with one vertical scroll owner and
  deterministic row focus restoration;
- uninterrupted canonical property search with deterministic caret and composition behavior;
- ordered multi-Page-Group compilation with guarded refinement and exact provenance;
- exact Page-branch, Event-branch, and combined-occurrence provenance;
- blocked unsafe weakening and parallel conflicts;
- explainable automatic, manual, and Documentation-only activation; and
- a developer export and per-Event validation result that make no full-Flow claim.
