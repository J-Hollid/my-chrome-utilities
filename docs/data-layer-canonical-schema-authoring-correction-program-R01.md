# Data-layer canonical schema authoring correction program R01

## Decision and authority

This program is the current authority for rich schema authoring and layered
effective-schema composition in the active data-layer scope. It refines and, where
necessary, supersedes the first implementation of
`data-layer-layered-schema-constraints`. The directional Flow graph remains active;
this program changes how schema definitions are authored and composed, not the
graph's documentary purpose.

The product shall have one canonical schema-document model and one authoring
language. Shared Profiles, Page Groups, Pages, Events, Flow Page instances, and
Event occurrences use the same property and rule capabilities. Their entity type
determines applicability and provenance, not which validation features they may
author.

This program does not reactivate the archived full-site R02/R04 release program.
Fixtures, coverage, preflight, release, Live, temporal journey enforcement, and
project-wide documentation export remain outside the active slice. Flow sequence
expectations remain for people to inspect; automatic assurance remains per-Event
schema selection and validation.

## Corrective outcome

An operator can create or adopt a complete schema in Shared Profiles, edit the
same schema from the wide Builder workspace or compact side panel, refine it at
each applicable Page or Event context, inspect the effective result and its
provenance, export the selected context for developers, and validate observed
Events against that result.

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
- downstream entity types expose a separate, thinner constraint form.

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

## One authoring language at every layer

Every contributor opens the same editor core and emits the same property-scoped
commands:

1. Shared Profiles provide reusable generic or purpose-specific schemas. A profile
   may be broad, such as Sitewide, or specific, such as Opened Article.
2. A Page Group contributes rules to the Pages and Page instances that belong to
   it.
3. A Page inherits applicable profiles and its Page Group, then contributes its
   own refinements to every instance of that Page.
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

## Composition branches

The Page and Event branches are independent until an Event occurrence is placed in
a Page context:

```text
applicable Shared Profiles -> Page Group -> Page -> Flow Page instance
                           \-> Event ----------------> Event occurrence
                                                    /
                         effective Event occurrence
```

An Event occurrence outside Page containment compiles only applicable Shared
Profiles, Event, and occurrence contributions. An Event occurrence inside a Flow
Page instance combines both branches. The Page or Page instance is itself the
context; a context-setting role or trigger on an Event occurrence is documentation
metadata and creates no separate binding or composition path. Page or Page Group
membership is never invented for an Event, and moving a canvas occurrence cannot
alter its containing Page or Page Group contract.

More-specific contributions may narrow inherited allowed values, add compatible
rules, or replace a definition explicitly declared overridable. They may not
silently change a type, widen an allowed universe, relax required, or re-enable a
forbidden property. Incompatible Page-branch and Event-branch definitions are
parallel conflicts: neither branch wins because of storage order or entity type.
An explicit contextual resolution must reference the definitions it resolves.

When multiple Shared Profiles contribute to one context, they are parallel peers
unless an explicit relationship says otherwise. Conflicts block compilation; list
order is not precedence.

## Wide workspace, table, and side panel

The proven side-panel schema editor supplies the interaction model. The Builder
uses the same editor core and command handlers in a layout suited to the larger
viewport:

- a profile or contributor header with Draft state, lineage, save state, revision
  comparison, Undo, and Redo;
- a searchable, filterable property navigator;
- a selected-property editor with the complete side-panel capability set; and
- effective documentation, validation state, impact, and provenance.

Property search is transient editor state, not a canonical command. Typing,
mid-string editing, clearing, and input-method composition update only the navigator
results. The same connected search control retains focus, value, caret, selection,
and composing text until the operator deliberately moves focus. This behavior is
shared by every contributor kind in Builder, Flow workspace, and side panel at wide
and 360px widths.

Tree and Table are synchronized projections of the same canonical revision and
selection. The Table preserves hierarchy and supports the complete property
lifecycle. Common information is visible in columns; expanding a row opens the same
full editor rather than a reduced substitute. An edit in any projection appears in
the others immediately.

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
5. Replace all editable legacy representations in one atomic project revision.
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
context-setting roles and triggers explain documentary intent but cannot alter the
assignment winner or validation schema.

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
and deterministic atomic migration.

### Phase B — rich shared editor

Deliver contextual creation, structural nested authoring, type and presence
controls, allowed values, rich rules, documentation, examples, search, filtering,
revision comparison, and synchronized Tree and Table views in the wide workspace
and compact side panel.

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
| C05 | Builder lacks side-panel parity | Authoring 005 | Wide navigator, selected-property editor, effective preview, optional JSON | Shared editor core and command bus | Same actions and command results in both surfaces | B | Every supported side-panel edit succeeds in Builder |
| C06 | Paths and nesting require free text | Authoring 006 | Structural root/child actions and generated paths survive rename | Property tree and reference resolver | Generated paths and stable IDs after rename/reload | A, B | Nested properties require no typed pointer and references remain valid |
| C07 | Type is unconstrained free text | Authoring 007 | Valid type and item-type selectors with impact review | Schema command validation | Stored typed definition and destructive confirmation | B | An invalid free-text type cannot be stored |
| C08 | Presence lacks conditional required/forbidden | Authoring 008 | Required, Required when, Forbidden, Forbidden when with property selectors | Condition AST and compiler | Structured conditions and compiled outcomes | B, C | All four modes compile without raw expressions |
| C09 | Allowed values use an inferior free-text field | Authoring 009 | Labelled repeatable typed values, removal, and keyboard reorder | Typed value command model | Separate stored values and rendered inputs | B | Commas or JSON text are not used as the canonical value set |
| C10 | Rules use free text instead of the rich builder | Authoring 009 | Type-aware picker, conditions, severity, messages, reusable rules | Rule AST and reusable-rule resolver | Stored structured rule and compiler output | B, C | Every supported side-panel rule is authorable in Builder |
| C11 | Documentation and examples are incomplete | Authoring 010 | Display text, description, comments, allowed/custom/blank typed examples | Documentation model and renderer | Reloaded typed values and inert rendering | B | Documentation fields and selection method survive reload |
| C12 | Table is lighter than the side panel | Authoring 011 | Hierarchical synchronized table with common columns and full expanded editor | Tree/Table view models over one revision | Cross-view edits and selection evidence | B | No schema operation requires leaving Table for a different model |
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
| C24 | Flow should not force rich editing into Inspector | Layering 010 | Compact summary opens full main editor and restores canvas state | Flow selection routing and shared editor | Selection, viewport, and save-impact evidence | B, C | Full schema editing occurs in main workspace without losing Flow context |
| C25 | MVP assurance is per-Event, not full-Flow validation | Layering 011 | Positive and negative exact-value results with no sequence claim | Assignment and per-Event validator | Exact issue tuple and unified result | D | Invalid 3a fails expected 3b while valid 3b passes |
| C26 | Developers need the effective values for a concrete occurrence | Layering 012 | Complete selected-context export plus positive and negative validation | Compiler, exporter, validator | Export, provenance, and issue collection | D, E | Summer article occurrence is documented and validated from one compiled schema |
| C27 | Complete specifications need richer queries without losing side-panel behavior | Authoring 014 | Nested All, Any, and Not groups with selectors, typed operators, and matcher evidence | Shared predicate AST, rule compiler, applicability matcher | Persisted predicate tree plus positive and negative tests | B, D | Conditions require no raw expression and invalid branches focus exact controls |
| C28 | Canonical property search drops focus after each character | Authoring 015–016 | Continuous typing, caret editing, composition, and clearing retain search focus on every contributor surface | Shared canonical editor renderer, navigator projection, and focus adapter | Per-event active element and selection offsets, filtered rows, unchanged revision and storage | B, E | A multi-character query completes without refocusing and search emits no canonical command |

## Terminal acceptance

The program passes only when all four active feature files parse and dry-check with
no findings, the focused `layered_schema` acceptance pack passes against the built
extension, and packaging consumes that same built output. The terminal evidence must
show:

- one adopted project schema, one property identity, and one revision across
  Builder, Table, side panel, reload, compilation, and validation;
- the same rich controls at all contributor levels;
- uninterrupted canonical property search with deterministic caret and composition behavior;
- exact Page-branch, Event-branch, and combined-occurrence provenance;
- blocked unsafe weakening and parallel conflicts;
- explainable automatic, manual, and Documentation-only activation; and
- a developer export and per-Event validation result that make no full-Flow claim.
