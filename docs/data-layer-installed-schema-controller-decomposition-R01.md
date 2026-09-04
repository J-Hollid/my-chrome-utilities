# Data Layer installed Schema controller decomposition R01

## Status and authority

The user requested a complete phased decomposition plan on 2026-09-04 after
review of the Schema editor reachability ownership slice. The user approved
this completed specification and its ordered Stage A, B, and C orchestration on
2026-09-04. Stage A coder handoff is authorized. Later stages start only from
the accepted QA result of the preceding stage.

The delivery uses QA feature-integration mode. It starts from exact QA commit
`46fb68e1e4`. It does not request promotion to `master` and does not authorize
an all-runnable-pack feature gate.

Stable program name: `schema-controller-decomposition`.

## Diagnosed problem

`src/data-layer-installed/schemas/index.ts` is 3,683 lines and 350,542 bytes at
the planning base. It has about 234 function declarations or function values.
It contains editor routing, relationship-tree presentation, library and draft
state, persistence, revisions, property authoring, rules, assignments,
validation, guided continuation, canonical editing, DOM binding, and lifecycle
disposal.

The current registry assigns the complete file to
`schemas:schema_editor_reachability`. A plan-only change to this file selects
the nine-task reachability plan. It does not select
`unit:test/data-layer-installed/schemas-controller-test.mjs` or the other
Schema behaviors in the same file. This can give an unrelated future Schema
change too little evidence.

The opposite fallback is also expensive. A normal unsliced Schema source can
select the complete `schemas` dependant closure and hundreds of tasks. The
program must therefore correct unsafe narrow ownership first, create stable
behavior modules, and activate narrow ownership only after those modules and
their direct tests exist on QA.

The existing controller test is also a decomposition target. At the planning
base, `test/data-layer-installed/schemas-controller-test.mjs` is 1,186 lines
and 104,681 bytes. Source extraction without matching test extraction would
leave test ownership coarse.

## Outcome

At completion:

- `src/data-layer-installed/schemas/index.ts` is a thin public composition root;
- one module owns each mutable value, render cycle, listener set, subscription,
  asynchronous generation, and dialog lifecycle;
- controllers communicate through narrow typed commands and read-only
  projections, not one shared mutable context object;
- the current public `createSchemasInstalledController` entry and
  `SchemasInstalledPorts` remain compatible;
- every moved assertion has one direct owner and the remaining composition test
  checks only public assembly, mount order, public operations, and disposal;
- the reachability slice owns only dedicated reachability and route files;
- future changes to one stable module select its direct tests and exact
  consumers; and
- direct changes to an unfinished or multi-purpose controller retain the
  conservative parent closure.

The completion target for `index.ts` is no more than 500 source lines. This is
a diagnostic limit, not authority to compress unrelated behavior onto long
lines. A controller source or test file must have one behavior family. A file
that exceeds 700 source lines requires further separation or an architect
finding that its content is one cohesive boundary.

## Preserved behavior

This program changes structure only. It preserves:

- all visible Schema Library, editor, property, rule, assignment, validation,
  guidance, revision, import, export, and canonical-editor behavior;
- every DOM id, accessible name and relation, focus result, scroll result,
  keyboard result, status, warning, and dialog result;
- every storage namespace and key, serialized schema and rule value, project
  revision, schema revision, pending draft, command, Undo and Redo result;
- all current durable-save settlement, retry, reject, download, subscription,
  stale-work, and disposal behavior;
- every public port and installed Data Layer consumer; and
- all registered product and verification tasks, acceptance contracts, browser
  targets, package inputs, and terminal obligations.

A UI change, new capability, storage migration, port removal, behavior change,
evidence deletion, or permission change needs a separate user-approved
specification.

## Target architecture

`index.ts` owns only public types, controller construction, narrow port wiring,
mount order, public method projection, and aggregate disposal. It does not own
domain state or DOM behavior.

| Proposed module | One owned purpose |
|---|---|
| `lifecycle.ts` | Listener and subscription registration, lifecycle generation, idempotent mount, and idempotent disposal support |
| `editor-route-controller.ts` | Editor route entry, close, invoking reference, focus return, outer scroll return, and reachability coordination |
| `relationship-tree-controller.ts` | Tree projection, query, filter, expansion, keyboard navigation, selected reference, and view-state persistence |
| `library-controller.ts` | Schema library, active draft, revision review, import, export, deletion, and durable library settlement |
| `property-controller.ts` | Property rows, selection, manual property, documentation, copy, removal, specific index, focus return, and Undo |
| `rule-controller.ts` | Local and reusable rules, picker state, promotion, synchronization, and rule review dialogs |
| `assignment-controller.ts` | Assignment editing, condition editing, conflict presentation, and assignment review state |
| `validation-controller.ts` | Validation records, recheck, evaluation results, and validation-record actions |
| `guided-validation-controller.ts` | Guided validation, captured continuation, live declaration, allowed-value expansion, and project routing |
| `canonical-editor-controller.ts` | Compact canonical projection, commands, overlays, history, settlement, retry, Undo, Redo, and canonical editor disposal |

Exact filenames can change during implementation when the boundary meaning is
unchanged. Combining two rows requires an architect finding that their mutable
state, lifecycle, and test ownership are one cohesive boundary. A generic
`schema-context.ts` that holds all mutable state is prohibited.

Each controller owns its DOM queries or receives a small typed element group.
One central DOM map with elements for every controller is prohibited. Each
controller receives only the callbacks and values that it uses. A controller
does not import another controller's internal file.

## Test architecture

Move the existing controller assertions into direct contracts that mirror the
source boundaries:

| Direct contract | Primary observation |
|---|---|
| `test/data-layer-installed/schemas/lifecycle-test.mjs` | duplicate mount prevention, listener cleanup, stale work, and repeated disposal |
| `test/data-layer-installed/schemas/editor-route-controller-test.mjs` | all editor entries, close, focus, scroll, and reachability coordination |
| `test/data-layer-installed/schemas/relationship-tree-controller-test.mjs` | filtering, expansion, keyboard movement, rows, and stored view state |
| `test/data-layer-installed/schemas/library-controller-test.mjs` | draft and revision lifecycle, import, export, deletion, persistence, and recovery |
| `test/data-layer-installed/schemas/property-controller-test.mjs` | property authoring, copy, removal, documentation, specific index, focus, and Undo |
| `test/data-layer-installed/schemas/rule-controller-test.mjs` | rule actions, legality, promotion, synchronization, and dialog lifecycle |
| `test/data-layer-installed/schemas/assignment-controller-test.mjs` | assignment and condition actions, conflicts, identity, and review lifecycle |
| `test/data-layer-installed/schemas/validation-controller-test.mjs` | records, recheck, evaluation results, stale work, and record actions |
| `test/data-layer-installed/schemas/guided-validation-controller-test.mjs` | guidance, continuation, declaration, expansion, and project routing |
| `test/data-layer-installed/schemas/canonical-editor-controller-test.mjs` | canonical commands, overlays, history, settlement, retry, Undo, Redo, and disposal |
| `test/data-layer-installed/schemas-composition-test.mjs` | public facade, construction, mount order, injected ports, public operations, and aggregate disposal |

Shared test support can contain a small fake DOM primitive or a focused fixture
builder. It cannot contain the assertions or mutable scenario state for every
controller. Each assertion moves once. Do not copy all old assertions into new
files while retaining them in the old test. Remove the moved section in the
same commit. Delete the old controller test only after its final composition
assertions move to the new composition test.

Existing domain, property, acceptance, and browser tests remain registered and
unchanged unless an import path or static ownership assertion must follow a
moved implementation. Moving a test is not authority to weaken or replace its
assertion.

## Phased delivery model

The program has three QA-integrated stages. The middle product stage has eight
internal implementation phases on one candidate. This design pays the broad
Schema conservation cost once for the coherent decomposition instead of after
every extraction.

### Stage A — ownership fail-safe

Task: `schema-controller-ownership-safety`.

1. Remove `src/data-layer-installed/schemas/index.ts` from
   `schemas:schema_editor_reachability`.
2. Keep the dedicated reachability source, style, unit, browser, feature, and
   handler paths in their current exact slices.
3. Make an `index.ts` change use the existing conservative Schemas parent
   ownership until Stage C activates its thin composition slice.
4. Add the focused assertion to the existing Schemas ownership contract. Do not
   add a temporary feature-named executable test.
5. Regenerate only required manifests, registry output, migration identity, and
   compact conservation data.
6. Run exact plan-only preflight, the required registry and ownership evidence,
   property mode, and package proof. Do not run an all-runnable-pack gate.

This stage changes verification ownership only. It cannot change product source,
generated product, product tests, product Gherkin, or acceptance handlers.

After architect `qa-ready` integration, the specifier automatically starts
Stage B from that exact QA head.

Effort ceiling: two hours. Report at one hour with exact paths, selected packs
and tasks, failures, remaining work, confidence, and forecast.

### Stage B — behavior-preserving product decomposition

Stable task: `schema-controller-decomposition`.

Stage B is one product candidate with ordered internal commits. Every internal
phase must build and pass its direct changed tests before the next phase starts.
Intermediate commits do not enter QA and do not receive a complete parent-pack
evidence run.

#### Phase 1 — inventory and lifecycle foundation

- Record the exact state, listener, subscription, timer or generation, DOM,
  public operation, and test-assertion owner for every later boundary.
- Add the narrow lifecycle support and direct lifecycle test.
- Freeze the public entry, port shape, installed consumer calls, and controller
  result shape.
- Do not introduce a general mutable context or a second public Schema entry.

#### Phase 2 — editor route and relationship tree

- Move editor entry and close coordination, reachability calls, invoking
  reference, focus return, and scroll return to the route controller.
- Move tree projection, query, filter, expansion, keyboard movement, and view
  persistence to the relationship-tree controller.
- Keep the existing core relationship-tree module and its pack ownership
  unchanged.
- Move only the corresponding old controller assertions to the two direct
  contracts.

#### Phase 3 — library, draft, revision, and persistence

- Move library state, active schema and draft selection, persistence queue,
  revision review, import, export, deletion, publication, and recovery handling.
- Preserve serialized bytes, ordering, version increments, pending state,
  durable acknowledgements, and status text.
- Move the matching test assertions and keep the public controller result
  compatible.

#### Phase 4 — property authoring

- Move property presentation, selection, manual authoring, documentation, copy,
  removal, specific-index review, focus return, and Undo.
- Preserve action legality, focus restoration, sparse edits, and all existing
  dialog cleanup.

#### Phase 5 — rule and assignment authoring

- Move reusable and local rule state, picker state, promotion,
  synchronization, and rule reviews to the rule controller.
- Move assignment state, condition editing, conflicts, and assignment reviews
  to the assignment controller.
- Preserve rule identity, assignment identity, action legality, library bytes,
  sparse edits, and dialog cleanup.

#### Phase 6 — validation and guided workflows

- Move validation records, recheck, guided continuation, live declaration, and
  allowed-value expansion into separate validation and guided-validation
  controllers.
- Preserve late-completion guards and the current coordination ports to
  Capture, Projects, assurance, guided tests, and live tests.

#### Phase 7 — compact canonical editing

- Move canonical projection, commands, overlays, history, persistence
  settlement, retry, Undo, Redo, and disposal to the canonical controller.
- If UI state and durable settlement cannot remain one cohesive file within the
  diagnostic limit, separate `canonical-settlement.ts` behind the controller.
- Preserve the canonical table-editor port and every command and history result.

#### Phase 8 — thin composition cutover and test settlement

- Reduce `index.ts` to public types, narrow controller construction, port wiring,
  mount order, public operation projection, and aggregate disposal.
- Move its final assertions to `schemas-composition-test.mjs`.
- Prove that each mutable value, listener, subscription, and asynchronous
  generation has one owner.
- Prove that every old assertion has one surviving registered owner.
- Run TypeScript build and all new direct Schema controller tests together.
- Run the existing Schema browser and acceptance boundaries once on the coherent
  final product tree before evidence production.

After Phase 8, run fresh exact changed-path preflight. The forecast is the
complete conservative `schemas` parent and dependant closure plus the direct
`schema_relationship_tree` reachability consumer when selected. At the planning
base, a representative broad Schema plan has about 504 tasks across `schemas`,
`defects`, `live_flow_testing`, `project_assurance_severity`,
`guided_test_cases`, and `shell`; the exact candidate plan is authoritative.
This one conservative run is proportionate because Stage B can affect every
installed Schema behavior. Run declared properties and package proof. Do not
run an all-runnable-pack feature gate.

Effort ceiling: twelve hours from coder receipt to architect `qa-ready`. Report
at four and eight hours with completed phases, current line and responsibility
distribution, moved and remaining assertion groups, direct test status, exact
plan forecast, failures, remaining work, confidence, and completion forecast.

After architect `qa-ready` integration, the specifier automatically starts
Stage C from that exact QA head.

### Stage C — stable slice activation

Task: `schema-controller-slice-activation`.

Stage C changes verification ownership only. It uses the stable product modules
and direct tests already present on QA. It does not create a temporary executable
ownership test and does not change product behavior.

Proposed ownership is:

| Proposed source prefix | Parent pack | Proposed subordinate slice | Proposed exact consumers |
|---|---|---|---|
| `src/data-layer-installed/schemas/index.ts` | `schemas` | `schemas_installed_composition` | `defects:side_panel_installed_controller_consumer`, `project_assurance_severity:side_panel_installed_controller_consumer`, `guided_test_cases:side_panel_installed_controller_consumer`, and `shell:side_panel_installed_controller_consumer` |
| `src/data-layer-installed/schemas/editor-route-controller` | `schemas` | `schema_editor_reachability` | `schema_relationship_tree:schema_editor_return` |
| `src/data-layer-installed/schemas/relationship-tree-controller` | `schemas` | `schema_relationship_tree_view` | parent `schema_relationship_tree` until a direct consumer slice is proved |
| `src/data-layer-installed/schemas/library-controller` | `schemas` | `schema_library_lifecycle` | `defects`, `project_assurance_severity`, `guided_test_cases`, and `shell` only where Phase 1 inventory proves use |
| `src/data-layer-installed/schemas/property-controller` | `schemas` | `schema_property_authoring` | no external consumer unless Phase 1 inventory proves one |
| `src/data-layer-installed/schemas/rule-controller` | `schemas` | `schema_rule_authoring` | no external consumer unless Phase 1 inventory proves one |
| `src/data-layer-installed/schemas/assignment-controller` | `schemas` | `schema_assignment_authoring` | no external consumer unless Phase 1 inventory proves one |
| `src/data-layer-installed/schemas/validation-controller` | `schemas` | `schema_validation_records` | exact Capture, assurance, or live-test consumers proved by installed ports |
| `src/data-layer-installed/schemas/guided-validation-controller` | `schemas` | `schema_guided_validation` | exact Capture, Project, assurance, guided-test, or live-test consumers proved by installed ports |
| `src/data-layer-installed/schemas/canonical-editor-controller` | `schemas` | `schema_canonical_editing` | exact canonical or layered-schema consumer proved by installed ports |

The Phase 1 inventory and final static import, callback, and runtime evidence are
authoritative. A proposed consumer can be removed only with direct negative
evidence. An unproved or shared boundary uses the parent fallback. No slice can
claim two behavior families only to reduce task count.

Each slice declares its direct source, direct test, required acceptance or
browser observation, prerequisites, observable boundary, and exact consumers.
Property mode selects only a property task declared by that slice. A slice with
no property-level behavior records zero property tasks without disabling
property mode.

Stage C must prove:

1. complete parent-pack task closures are conserved;
2. every current and historical source path has one owner;
3. direct changes to each extracted module select its direct task and exact
   consumers;
4. unrelated Schema tasks and unrelated product packs are absent from each
   narrow plan;
5. `index.ts` is eligible for narrow composition ownership because it contains
   composition only;
6. a missing, duplicate, conflicting, or unobservable declaration falls back to
   the parent closure;
7. current/base historical planning cannot use the new slice to narrow Stage C's
   own evidence; and
8. registry, conservation, property-mode, and package proof pass without an
   all-runnable-pack gate.

Effort ceiling: four hours. Report at two hours with exact slice map, direct
tasks, consumers, fallback cases, selected packs and tasks, failures, remaining
work, confidence, and forecast.

## Development focus and QA impact

Development checks are phase-local:

- build after a public type or import change;
- the direct controller test after each extraction;
- the composition test after port or mount-order changes;
- the reachability unit and browser test after route or tree-return changes;
- the existing exact domain test only when its assertion moves or its import path
  changes; and
- no complete Schema browser or acceptance session until the coherent Stage B
  product tree is ready.

QA impact is stage-wide and conservative:

- Stage A: registry inventory, Schemas ownership, current/base conservation,
  properties as planned, and package proof;
- Stage B: the exact full Schema controller and dependant closure, direct
  relationship-tree return evidence when selected, properties, installed
  browser and acceptance evidence, and package proof; and
- Stage C: registry inventory, exact new slice contracts, current/base
  conservation, properties as planned, and package proof.

The canonical exact plan can add a bounded affected owner or consumer. Record
the variance and continue. Stop for user direction only when the plan becomes
all-runnable-pack, ownership is unavailable, product behavior must change, a
new permission or migration is required, or the source cannot be separated
without one new multi-purpose controller.

## Phase orchestration

Approval of this program authorizes the specifier to:

1. commit this specification and send Stage A to the coder;
2. integrate Stage A only after ordinary coder, refactorer, architect, and
   specifier review with exact review-ready evidence;
3. send Stage B automatically from the accepted Stage A QA head;
4. integrate Stage B only after the coherent product tree and its conservative
   exact evidence pass;
5. send Stage C automatically from the accepted Stage B QA head; and
6. close the program after Stage C QA integration and a plan-only scorecard.

Do not queue Stage B or Stage C at the same time as an earlier stage. Their exact
bases and evidence depend on the accepted prior QA result. Do not promote the
accumulated QA line to `master` without a separate user request.

## Failure policy

Repair a phase-local build or direct-test failure inside the same declared
boundary. Run the failed direct check and its prerequisites before the next
phase. Do not start complete evidence while a known failure remains.

One bounded repair covers all same-family defects found during the required
discovery pass. Record an unrelated defect as a follow-up. Stop instead of
expanding when:

- preserved behavior, storage bytes, public ports, permissions, or product
  requirements must change;
- an extraction creates a new shared mutable state container;
- two controllers must write the same state;
- the same causal boundary fails again after one focused repair and replacement
  evidence run;
- required evidence would be removed or weakened;
- exact ownership is unavailable; or
- the exact feature plan becomes all-runnable-pack.

Slow execution, a larger bounded exact task count, or extra passed tests do not
invalidate a product candidate. A missing or failed required task, stale receipt,
unowned path, or mismatched candidate identity remains blocking.

## Completion scorecard

At completion report:

- source lines and responsibilities remaining in `index.ts`;
- module and direct-test line counts;
- assertions moved, retained, and removed with reasons;
- exact source-to-slice-to-task-to-consumer mapping;
- plan-only task counts for each new module and for `index.ts`;
- Stage A, B, and C role and verification elapsed times;
- failures, repairs, superseded candidates, and reruns;
- QA commit identities for all three stages; and
- a continue, adjust, or stop recommendation before another Schema ownership
  slice is added.
