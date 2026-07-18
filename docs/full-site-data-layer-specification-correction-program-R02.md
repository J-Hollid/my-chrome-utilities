# Full-Site Data-Layer Specification Correction Program R02

## Authority and supersession

`full-site-data-layer-specification-workflow-assessment-R02.md` and `artifacts/schema-editor-walkthrough/R02/` are the primary authority for this correction. They supersede every R01 traceability or R03 verification claim that conflicts with the live R02 walkthrough. The R01 recommendations remain the intended product outcomes; the R01 traceability matrix and R03 report remain immutable historical records, not current completion evidence.

All existing reports and evidence are preserved unchanged and verified by before/after hashes. Builder implementation verification uses the next schema-editor round, `artifacts/schema-editor-walkthrough/R03/`, with the noncolliding report `docs/full-site-data-layer-specification-workflow-assessment-R03.md`. The required real side-panel workflow uses its next unused round, `artifacts/side-panel-walkthrough/R04/`, and `docs/side-panel-visual-walkthrough-recommendations-R04.md`, following `docs/side-panel-visual-walkthrough-workflow.md`, its report template, and the decision register. Existing schema-editor R01/R02 and side-panel R01/R02/R03 rounds must not be overwritten.

Status in this specification revision is **Specified — awaiting approval**. No feature in this document may be called implemented until its scenario-specific production-boundary evidence passes.

## Required delivery order

| Order | Phase | Vertical behavior slice | Feature files | Depends on | Stop/go exit |
| --- | --- | --- | --- | --- | --- |
| 01 | 0 | Canonical project/schema draft and zero-loss concurrency | `data-layer-canonical-project-schema-drafts.feature`; `-runtime.feature` | Existing project and schema migration inputs | **Go only if** both surfaces edit one revisioned draft; navigation, crash recovery, stale writers, migration, failed storage, assignment trust, and publication lose or invent zero data. |
| 02 | 0 core; 3 parity closure | One compiled evaluator for routing and validation | `data-layer-unified-specification-evaluation.feature`; `-runtime.feature` | Slice 01 canonical snapshot | **Core go:** compiler and published Live use one pure evaluator and Preview blocks unproven projects. **Final go after slices 07 and 09:** fixtures, preflight, release, preview, and Live return identical semantic evidence. |
| 03 | 1 core; 2 context bindings; 3 consumer closure | Requirement profiles compile to effective validation schemas | `data-layer-effective-schema-compilation.feature`; `-runtime.feature` | Slice 02 evaluator contract | **Core go:** exact Retail/Trade documents and provenance compile and Live consumes them. **Final go after slices 04, 06, 07, and 09:** every page/event/flow/step/fixture/release binding and consumer is visible. |
| 04 | 1–2 | Complete contextual entity editors | `data-layer-contextual-specification-editors.feature`; `-runtime.feature` | Slice 01 repository plus slice 02/03 core contracts | **Go only if** every first-class entity can be fully authored, reloaded, edited, duplicated, dependency-checked, and recovered through visible controls without raw IDs. |
| 05 | 1 | Genuine staged multi-format bulk authoring | `data-layer-staged-multiformat-bulk-authoring.feature`; `-runtime.feature` | Slice 03 requirements and slice 04 Profile editor | **Go only if** JSON, JSON Schema, spreadsheet/CSV, template, and paste stage visibly; row repair, multi-actions, one commit, one Undo, windowing, and the 2-minute gate work. |
| 06 | 2 | Correct temporal-flow execution | `data-layer-temporal-flow-execution-correction.feature`; `-runtime.feature` | Slice 02 evaluator core and slice 04 stable-reference editors | **Go only if** min/max, optional, branches, joins, transitions, entry/exit, correlation, timeout, ambiguity, failure, and completed-instance behavior execute correctly. |
| 07 | 3 | Production event and journey fixtures | `data-layer-production-fixture-execution.feature`; `-runtime.feature` | Slices 02, 03, and 06 | **Go only if** authored single events and journeys run through the exact Live evaluator and show exact expected differences; this closes fixture parity for slice 02. |
| 08 | 3 | Effective-requirement coverage | `data-layer-effective-requirement-coverage-correction.feature`; `-runtime.feature` | Slices 03, 06, and 07 | **Go only if** coverage is Page/Event/Flow-step × effective requirement, with origin, winner, fixture evidence, gap, waiver, field links, and real windowing. |
| 09 | 3 | Truthful preflight, release, documentation, and portability | `data-layer-truthful-preflight-release-correction.feature`; `-runtime.feature` | Slices 01–08 | **Go only if** production findings are actionable, a repaired tie clears the same gate, publication is atomic, and fresh import/reload is semantically identical; this closes preflight/release parity for slice 02. |
| 10 | 1–3 alongside owning slices | Operator orientation, responsive interaction, and accessibility | `data-layer-specification-builder-operator-usability.feature`; `-runtime.feature` | Contextual surfaces from slices 04–09 | **Go only if** every start path, environments, navigation, one-scroll responsive modes, keyboard operation, focus restoration, Releases, and the hidden-layout regression pass actual Chrome. |
| 11 | 3 terminal | Terminal greenfield Retail/Trade release | `data-layer-greenfield-retail-trade-production-release.feature`; `-runtime.feature` | All prior slice closures | **Go only if** a blank project is completed through rendered controls, actual Live selects distinct schemas for a byte-identical markerless event, targeted mutations fail their owning scenarios, and both new evidence rounds pass. |

Visual hierarchy, field-local errors, keyboard behavior, focus, recovery, and responsive layout are acceptance concerns in every affected slice. Slice 10 closes cross-cutting shell and navigation defects; it does not defer accessibility from earlier editors.

The implementation sequence has no circular acceptance dependency. Phase 0 first establishes the canonical repository and evaluator core while keeping unresolved projects visibly Preview and unpublishable. Phase 1 delivers the shell, contextual editors, and bulk authoring over those contracts. Phase 2 completes profile bindings and temporal execution. Phase 3 connects fixtures, coverage, preflight, release, and interchange to the already-shared evaluator, then closes the deferred parity scenarios from slices 02 and 03. No early slice is reported complete from constructed state while its deferred production consumers remain open.

## Domain-model decisions

### Canonical authoring state

- A `SpecificationProject` draft is the sole mutable authority for project-owned profiles, pages, groups, events, applicability, flows, fixtures, schema documents, assignments, and release metadata.
- The side panel and full-page workspace dispatch commands against the same canonical draft. They never synchronize independent schema copies.
- Every command carries the project revision and affected entity revision it was based on. A stale command cannot overwrite newer content.
- A conflict preserves the current canonical draft and the operator's unsaved command. The UI names the changed fields and offers reload, reapply, or a field-level merge; it never silently chooses a winner.
- Persistence commits one revisioned project envelope atomically. A failed write restores the exact prior persisted bytes while retaining the operator's pending command for retry.
- Published releases are immutable. Editing a release creates a new draft; unrelated project changes cannot mutate a published schema or its pinned assignment revision.

### Compiler, resolver, automaton, and validator

- One project compiler resolves stable references and emits an immutable executable plan containing page/event matchers, applicability ASTs, flow automata, ordered profile stacks, compiled effective validation schemas, fixture programs, and provenance indexes.
- One production evaluator accepts an observation plus session/flow state and returns candidates with rejection reasons, winner or tie, active flow/step, effective profiles, effective schema revision, validation issues, and provenance.
- Live capture, matcher preview, fixtures, coverage, preflight, and release review call this evaluator. Evidence records may report its result but are never an alternate routing input.
- Assignments reference `applicabilitySetId`, `schemaDraftId`, and version policy. They do not embed a second condition language.
- Runtime identity uses stable project, flow, step, page, event, applicability, profile, schema, and assignment IDs. Human names are labels only.

### Requirement compilation

- An effective contract is an explicitly ordered profile list: project baseline, page/group, event, flow, step, then environment exception.
- Each effective property/rule records every contributing origin, precedence position, override/disable decision, and release introduction.
- Compatible overlays merge deterministically. Incompatible types, Required/Forbidden combinations, empty allowed-value intersections, and incompatible rules are blockers; there is no silent last-write-wins.
- Compiled schema documents include structural parents, required arrays, allowed values, reusable and local rules, descriptions, examples, and provenance references. The same document revision is displayed in authoring and used by Live.

### Temporal semantics

- A flow step references page and event IDs and may reference applicability and profile IDs. Free-text references are not accepted.
- `minimum` is the earliest occurrence count at which a transition may leave the step. `maximum` is the greatest permitted count; it is not the required count.
- Optional steps may be skipped only along a valid transition. Branches have explicit entry edges and joins; required branches cannot be silently bypassed.
- Entry and exit conditions, transition predicates, timeouts, and failures are first-class. Invalid or ambiguous next states produce explainable failure rather than arbitrary advancement.
- The approved default correlation is one flow instance per browser-tab session with an optional configured transaction/session key. Same-tab navigation and extension reload preserve state; exit or timeout closes it; equal active instances block automatic selection.

### Fixtures, coverage, release, and interchange

- A single-event fixture stores context, payload/raw input, and exact expected winner, flow step, schema revision, issues, and result.
- A journey fixture stores ordered observations, correlation data, and per-step plus terminal expectations.
- Coverage coordinates Page × Event × Flow step × effective requirement. Each cell records applicability winner, profile origin, proving fixture, state, and optional reviewed waiver.
- Preflight consumes compiled-plan diagnostics, fixture outcomes, coverage, reference integrity, ambiguity, profile conflicts, revision pins, and compatibility issues. Every finding has a stable code and exact editable field target.
- A release snapshots the source project and executable plan atomically after preflight. Review shows structured requirement, routing, flow, fixture, coverage, compatibility, and impact diffs.
- Full-fidelity interchange round-trips draft/release identities, typed values, order, references, compiled semantics, and expected outcomes. Standard JSON Schema remains deliberately lossy with a versioned applicability/flow manifest.

## Contextual editor contract

| Entity | Required visible editor state |
| --- | --- |
| Profile | Full-width requirement grid; type, Required, Forbidden, allowed values, rules, documentation, examples, ordered composition, effective/local/provenance views. |
| Page | Environment, host/path/query/hash/SPA matcher, page groups, expected events, profiles, and applicability. |
| Page group | Membership or matcher, profiles, applicability, environment, and members/usage. |
| Event | Source, canonical event name, target, occurrence policy, profiles, and applicability. |
| Applicability Set | Nested All/Any/Not builder, named predicates, priority/fallback, plain-language summary, context/fixture tester, candidates and winner evidence. |
| Flow | Entry/exit, timeout/correlation, structured steps, stable selectors, editable transitions, branches/joins, profiles/applicability, and execution preview. |
| Fixture | Event or journey mode, context, observations, expected winner/step/schema/issues, required/optional release policy, and exact result. |
| Schema draft | Compiled effective document, local overrides, profiles, properties/rules, revision history, conflicts, and side-panel/full-page shared revision. |
| Assignment | Named schema/event/applicability selectors, version policy, readable summary, candidate/conflict preview, and Where used. |

Every entity supports Edit, Duplicate, dependency-aware Rename/Delete, Where used, field-local validation, cancel without mutation, and recovery after save failure. The inspector contains only selected-entity metadata and concise actions; wide editors use the center workspace.

## Migration and compatibility

- Migrate the current version-1 project and separately stored schema library into one revisioned project envelope without modifying the source payload until the new envelope is durably committed.
- If a project-owned schema and library schema share an ID but differ, preserve both sources, identify the newer revision, and require explicit merge/adoption. Never perform one-way replacement.
- Map embedded assignment conditions to named applicability sets and stable references. Blank, colliding, unpinned, or unresolved records remain quarantined with repair controls.
- Convert supported parent-schema chains into ordered profiles while preserving published historical revisions. Unsupported cycles or missing parents block migration with exact evidence.
- Convert flow name selectors to stable flow IDs only when unambiguous; collisions require operator repair.
- Validate and stage version-1 full-state imports before conversion. Failed migration/import leaves canonical and legacy bytes unchanged.
- Retain explicit compatibility access for supported schema libraries, reusable rules, captured-event workflows, and imports until the operator adopts them into a project.

## Retained Phase 0 regression gates

These previously approved behaviors remain mandatory under the canonical project model and must run at both their existing unit layer and scenario-specific production boundary. They are not superseded by the correction features.

| Retained behavior | Existing behavior/runtime features | Canonical-model requirement |
| --- | --- | --- |
| Edit a local rule in place | `data-layer-local-rule-editing.feature`; `-runtime.feature` | Edit the project-owned schema draft, preserve stable local identity and unrelated draft fields, and keep the published release immutable. |
| Navigate from an attached reusable rule to its Rule Library editor | local rule editing `006`; runtime counterpart | Preserve project/schema/property return context and never misrepresent it as a local rule editor. |
| Explicitly synchronize a changed reusable rule and publish reviewed schema revisions | `data-layer-reusable-rule-sync-publication.feature`; `-runtime.feature` | Use one canonical project transaction/release, block dirty consumers, and roll back all reviewed schemas on failure. No automatic mutation occurs. |
| Reuse Required-when across every property type | `data-layer-required-rule-type-independence.feature`; `-runtime.feature` | Compile one reusable rule identity into string, number, boolean, object, and array consequences while genuinely inapplicable rules remain unavailable. |

## Current DLSP traceability

| Recommendation | Phase | Correction slice and stable scenarios | Dependency | Current status |
| --- | --- | --- | --- | --- |
| DLSP-01 — State integrity and truthful UI | 0 | canonical drafts behavior `001–015`, runtime `001–016`; contextual editors `010–011`; retained Phase 0 gates | Canonical repository and migration | **Specified — awaiting approval; R02 failed.** |
| DLSP-02 — Full-page Specification Project workspace | 1 | contextual editors `001–013`; operator usability `001–013` | DLSP-01 plus compiler contracts | **Specified — awaiting approval; R02 partial.** |
| DLSP-03 — First-class pages, applicability, flows, steps, and releases | 1–3 | contextual editors `002–009`, `012–013`; temporal behavior `001–010`, runtime `001–011`; truthful release `004–010`, `012` | Canonical typed graph, compiler, repository | **Specified — awaiting approval; R02 partial primitive.** |
| DLSP-04 — Ordered profile composition | 1–2 | effective compilation behavior `001–007`, runtime `001–007`; contextual editors `001` | Unified evaluator core | **Specified — awaiting approval; R02 model-only.** |
| DLSP-05 — Durable drafts and atomic releases | 0 and 3 | canonical behavior `001–015`, runtime `001–016`; truthful release behavior `004–010`, runtime `004–012` | Repository, preflight, executable plan | **Specified — awaiting approval; R02 trust failure.** |
| DLSP-06 — Bulk-first authoring | 1 | staged bulk behavior `001–009`, runtime `001–008`; terminal `010`, runtime `008` | Profile editor and project transactions | **Specified — awaiting approval; R02 failed.** |
| DLSP-07 — Guided matcher builder and routing analysis | 2 | contextual editors `004`, `008`, `012`; runtime counterparts; unified evaluation `002`, `006` | Typed pages/events/flows and evaluator | **Specified — awaiting approval; R02 failed.** |
| DLSP-08 — Fixtures, coverage, and whole-spec preflight | 3 | fixture execution `001–007`; effective coverage `001–007`; truthful preflight `001–003` | Compiler, schemas, automaton | **Specified — awaiting approval; R02 failed.** |
| DLSP-09 — Navigation, global search, provenance, and impact | 1–3 | operator usability `002–006`, `011`; effective compilation `003`, `006`; coverage `005` | Stable graph and usage index | **Specified — awaiting approval; R02 partial.** |
| DLSP-10 — Full-fidelity interchange and staged merge | 3 | truthful release behavior `008–009`, runtime `007–009`; terminal behavior `008`, runtime `006` | Complete graph and migration registry | **Specified — awaiting approval; R02 partial.** |
| DLSP-11 — Documentation-export rescope | 1 and 3 | truthful release behavior `011–013`, runtime `011`, `013–014` | Released semantic projections | **Specified — awaiting approval; R02 partial/misleading.** |
| DLSP-12 — Responsive and accessible interaction system | Every phase | operator usability `003–013`; contextual editor recovery; bulk `008–009`; terminal behavior `011`, runtime `009`, `012` | Delivered with every owning editor | **Specified — awaiting approval; R02 failed.** |

## Decisive correction traceability

| Criterion | Phase | Stable scenario evidence | Dependency | Current status |
| --- | --- | --- | --- | --- |
| DC-01 — Entire complex project starts blank and is authored through visible controls | 1–3 | terminal behavior `001`; runtime `001`, `014–015` | Contextual editors and onboarding | Specified — awaiting approval |
| DC-02 — Retail and Trade share source, Purchase, URL, and a byte-identical markerless final observation | 2–3 | terminal behavior `001–002`; runtime `002` | Compiled automaton and evaluator | Specified — awaiting approval |
| DC-03 — Prior journeys select different actual Live schemas | 2–3 | unified runtime `007`; terminal runtime `002`, negative `011` | Flow state passed to Live evaluator | Specified — awaiting approval |
| DC-04 — Retail requires transaction ID, value, and currency | 1–3 | effective compilation `001`; runtime `001`; terminal behavior `003`, runtime `013` | Profile compiler | Specified — awaiting approval |
| DC-05 — Trade additionally requires account ID and purchase-order number | 1–3 | effective compilation `002`; runtime `002`; terminal behavior `003`, runtime `013` | Profile compiler | Specified — awaiting approval |
| DC-06 — Product is repeatable and Upsell is optional with correct branches/transitions | 2–3 | temporal correction `001–005`; terminal behavior `004`, runtime `003` | Stable flow automaton | Specified — awaiting approval |
| DC-07 — Requirements, origins, winner, step, coverage, and fixture evidence are visible | 2–3 | effective coverage `001–005`; terminal behavior `007`, runtime `005` | Compiler, evaluator, fixtures | Specified — awaiting approval |
| DC-08 — Deliberate tie blocks publication and visible repair clears it | 3 | truthful preflight `002`; terminal behavior `005`, runtime `004` | Matcher editor and same evaluator | Specified — awaiting approval |
| DC-09 — Passing and failing event and journey fixtures return exact results | 3 | fixture execution `001–006`; terminal behavior `006`, runtime `005` | Production evaluator and automaton | Specified — awaiting approval |
| DC-10 — Publication/export/fresh import/reload preserve complete semantics | 3 | truthful release `005–009`; terminal behavior `008`, runtime `006` | Atomic release and semantic interchange | Specified — awaiting approval |
| DC-11 — Cross-surface, stale-state, failure, navigation, rerender, and reload lose zero edits | 0–3 | canonical behavior `001–015`, runtime `001–016`; terminal behavior `009`, runtime `007` | Canonical repository | Specified — awaiting approval |
| DC-12 — Staged 100-row bulk repair, multi-action, one Commit, and one Undo work | 1 | staged bulk `002–009`; terminal behavior `010`, runtime `008` | Profile grid and transactions | Specified — awaiting approval |
| DC-13 — Exact-field issues and semantic search reach all consumers/releases | 1–3 | coverage `005`; operator usability `005`; terminal behavior `007` | Usage index and field deep links | Specified — awaiting approval |
| DC-14 — Complete workflow is keyboard-operable at every target width | Every phase | operator usability `007–009`; terminal behavior `011`, runtime `009` | Accessible controls and responsive modes | Specified — awaiting approval |
| DC-15 — Existing project/schema/rule/assignment data migrates or remains accessible | 0 | canonical drafts `007–012`; effective compilation `007`; retained rule gates | Migration staging and compatibility projection | Specified — awaiting approval |
| DC-16 — Flow-state removal fails its own actual-Chrome decisive scenario | 3 terminal | terminal runtime `011` | Scenario-specific negative production mutation | Specified — awaiting approval |

## Finding-to-delivery traceability

| Finding | R02 live result | Phase | Slice | Primary production seams | Scenario-specific evidence | Status |
| --- | --- | --- | --- | --- | --- | --- |
| R02-F01 | Side-panel property was overwritten by an unrelated Builder save; assignment filtering disagreed with its count and rows | 0 | 01 and 04 | repository and adapters — `src/data-layer-specification-project.ts`, `src/specification-builder.ts`, `src/side-panel.ts` | canonical behavior `001–015`, runtime `001–016`; contextual editors `011` | Specified — awaiting approval |
| R02-F02 | Project routing selected Retail while Live validation returned an assignment tie | 0 core; 3 closure | 02 | compiler/runtime/validator — `src/data-layer-specification-project.ts`, `src/data-layer-specification-runtime.ts`, `src/data-layer-schema-verification.ts`, `src/side-panel.ts` | unified evaluation `001–008`; terminal runtime `002`, `011` | Specified — awaiting approval |
| R02-F03 | Profiles were detached path/type lists and did not make fields Required in Live | 1–2 | 03 | profile and schema compilation — `src/data-layer-specification-project.ts`, `src/data-layer-schema-canonical-document.ts`, `src/data-layer-schema-verification.ts` | effective compilation behavior/runtime `001–007`; terminal runtime `002`, `013` | Specified — awaiting approval |
| R02-F04 | Profiles, Pages, Groups, Events, Applicability, Fixtures, and Schemas were Kind + Name shells | 1–2 | 04 | typed graph and editor registry — `src/data-layer-specification-project.ts`, `src/specification-builder.ts`, `specification-builder.html` | contextual editors behavior/runtime `001–013`; terminal runtime `001`, `014–015` | Specified — awaiting approval |
| R02-F05 | Bulk authoring committed `/path,type` immediately with no grid or multi-action | 1 | 05 | staging adapters/grid/transactions — `src/data-layer-specification-project.ts`, `src/specification-builder.ts` | staged bulk behavior `001–009`, runtime `001–008`; terminal behavior `010`, runtime `008` | Specified — awaiting approval |
| R02-F06 | Flow references were raw strings; min/max, branches, transitions, timeout, and correlation were incomplete | 2 | 06 | flow model and runtime state — `src/data-layer-specification-project.ts`, `src/data-layer-specification-runtime.ts`, `src/specification-builder.ts` | temporal behavior `001–010`, runtime `001–011`; terminal runtime `003`, `011` | Specified — awaiting approval |
| R02-F07 | Fixtures were name-only and journeys did not execute | 3 | 07 | fixture editor/evaluator — `src/data-layer-specification-project.ts`, `src/specification-builder.ts` | fixture execution behavior/runtime `001–007`; terminal runtime `005` | Specified — awaiting approval |
| R02-F08 | Coverage marked named entities covered without proving requirements | 3 | 08 | coverage index/matrix — `src/data-layer-specification-project.ts`, `src/specification-builder.ts` | effective coverage behavior/runtime `001–007`; terminal runtime `005`, `010` | Specified — awaiting approval |
| R02-F09 | Preflight/release were shallow and their blockers could not be repaired in place | 3 | 09 | diagnostics/release/interchange — `src/data-layer-specification-project.ts`, `src/specification-builder.ts` | truthful preflight/release behavior `001–013`, runtime `001–014`; terminal runtime `004–006` | Specified — awaiting approval |
| R02-F10 | Hidden creation view, stale inspector, non-opening search, inactive Releases navigation, nested scroll, weak keyboard/focus | 1–3 | 10 | Builder shell/navigation/focus — `src/specification-builder.ts`, `specification-builder.html`, `specification-builder.css` | operator usability behavior/runtime `001–013`; terminal runtime `009` | Specified — awaiting approval |
| R02-F11 | Prior acceptance used constructed state, raw IDs, shared handlers, and empty mutation manifests | 3 terminal | 11 | acceptance ownership — `acceptance/src/acceptance/steps/specification_project_program.clj`, `acceptance/src/acceptance/steps/support.clj`, `test/side-panel-component-layout-runtime-test.mjs` | terminal runtime `001–015`, especially flow-state negative `011` | Specified — awaiting approval |
| R02-F12 | Publish/export/import/reload semantic preservation was not established | 3 | 09 and 11 | release snapshots/import — `src/data-layer-specification-project.ts`, `src/specification-builder.ts` | truthful release runtime `007–009`; terminal runtime `004–006` | Specified — awaiting approval |
| R02-F13 | Documentation options implied Applicability, Flows, and Fixtures were included when only profile rows were emitted | 3 | 09 | documentation projection/clipboard — `src/data-layer-specification-project.ts`, `src/specification-builder.ts` | truthful release behavior `011–013`, runtime `011`, `013–014` | Specified — awaiting approval |
| R02-F14 | Builder offered no migration/adoption path for the existing schema library | 0–1 | 01 and 10 | migration/compatibility/onboarding — `src/data-layer-specification-project.ts`, `src/specification-builder.ts`, `src/side-panel.ts` | canonical behavior/runtime `007–012`; operator usability `001`, `012` | Specified — awaiting approval |

## Terminal go/no-go

The correction remains a no-go if any of these are absent:

- A blank project is authored entirely through rendered controls without direct storage manipulation, hand-authored project JSON, seeded rich entities, or raw-ID lookup.
- Retail and Trade share source, `purchase`, `/checkout/confirmation`, and a markerless final payload while prior journeys select different schemas in the visible Live validation result.
- Retail requires `transaction_id`, `value`, and `currency`; Trade additionally requires `account_id` and `purchase_order_number` in the actual compiled validation documents.
- Repeatable Product, optional Upsell, routing tie/repair, passing/failing event and journey fixtures, effective provenance, coverage, and release evidence are visible and editable.
- Publication, download, fresh import, reload, and re-export retain all stable IDs, revisions, typed values, order, references, semantics, and validation outcomes.
- Cross-surface edits, rerender, navigation, reload, stale commands, and simulated storage failure lose zero edits.
- The complete workflow passes keyboard-only at desktop and narrow widths.
- A negative build or mutation that removes flow-state evaluation makes the decisive actual-Chrome scenario fail and is killed by its dedicated test.
- Generated acceptance tests remain separate from unit/model tests, and every detailed runtime scenario has its own production-boundary implementation and evidence.

## Acceptance ownership and evidence rules

- Replace the current feature-list-wide cached observation with scenario-ID-specific runners and assertions. Low-level Chrome helpers may be shared; successful semantic observations may not be shared across unrelated scenarios.
- Generated acceptance tests call the owning scenario runner. Unit, property, and model tests remain separate evidence and cannot satisfy a runtime scenario.
- Greenfield runtime scenarios load the built unpacked extension from `chrome-extension://` in a clean profile and author through rendered controls. Serving the HTML over HTTP is component evidence only.
- Live scenarios use a real safe commerce tab, recorded tab/session identities, page-emitted events, the actual extension observer, Chrome runtime messaging, and rendered Live validation. Direct production-callback invocation, a replaced `globalThis.chrome`, and synthetic observer emitters are forbidden as runtime Live evidence.
- Direct project/schema storage injection, production serializer calls as test setup, raw-ID reads used to fill controls, and preconstructed rich entities are forbidden for greenfield authoring proof.
- Explicit migration inputs, repository fault injection, targeted production mutations, and a labelled benchmark import may use controlled setup only for the precondition they represent; they cannot prove operator creation of the seeded behavior.
- Each runtime evidence record includes scenario ID, build hash, extension ID and URL, clean-profile provenance, ordered operator actions, visible results, and relevant persisted-state, download, clipboard, focus, layout, or accessibility observations.
- A feature containing scenarios cannot pass with an empty mutation manifest. Every critical scenario must pass unmodified and kill its targeted production mutation through its own assertions.
- The decisive Live proof inspects rendered validation schema and issues after both journeys. The flow-routing evidence store alone is explicitly insufficient.

### Targeted production-mutation ownership

| Mutation | Owning scenario-specific production proof | Required killed outcome |
| --- | --- | --- |
| Restore stale last-write-wins | canonical runtime `003`; terminal runtime `007` | Newer and pending edits no longer coexist, so the owning conflict assertion fails. |
| Reintroduce schema-library overwrite or blank publication assignment | canonical runtime `001–002`, `013` | Cross-surface property or zero-assignment assertion fails. |
| Bypass the unified evaluator in Live or remove flow/step input | unified runtime `003`, `007`; terminal runtime `002`, `011` | Byte-identical final events tie or select the wrong schema. |
| Drop a Required profile contribution or compatible allowed-value narrowing | effective compilation runtime `001–002`, `007`; terminal runtime `013` | Exact Live issue or EUR/USD result fails. |
| Restore exact-maximum advancement or ignore branch/join/transition | temporal runtime `001–005`; terminal runtime `003` | Count, optional path, join, or invalid-transition assertion fails. |
| Trust declared fixture expectation or bypass production evaluation | fixture runtime `002`, `004`, `006`; terminal runtime `005` | Unexpected pass or Live-parity assertion fails. |
| Commit bulk input immediately, update only the first selection, or partially Undo | staged bulk runtime `002–004`, `007`; terminal runtime `008` | Pre-commit, 25-row, subtree, or exact-revision assertion fails. |
| Restore entity-presence coverage or fixed first-40 slicing | coverage runtime `001`, `003`, `006`; terminal runtime `010` | Missing semantic cell or off-screen row assertion fails. |
| Resolve ambiguity by last-write-wins or suppress its blocker | truthful preflight runtime `002`; terminal runtime `004` | Two-candidate blocker or repaired parity assertion fails. |
| Permit partial release write | truthful release runtime `005–006`; terminal runtime `006` | Exact prior bytes or single complete release assertion fails. |
| Drop flow order, fixture data, typed values, release identity, or stable references on interchange | truthful release runtime `008`; terminal runtime `006` | Independent semantic comparison fails. |
| Remove tree/dialog focus restoration or add a second responsive scroll owner | operator usability runtime `005`, `007–010`; terminal runtime `009` | Focus, return-state, computed-layout, or keyboard assertion fails. |

Each listed mutation must be run independently. An unrelated scenario failure does not count as killing it.

## Material assumptions and questions

The R02 assessment and previously approved flow-correlation decision settle the externally visible defaults. The documented commerce demo remains a separately prepared Windows environment that may require paired setup with the product owner; it is not a repository deliverable or an assumed fully automated fixture. Automated development may use a safe local commerce substitute, while terminal Live verification may use the paired Windows environment. Neither path relaxes the requirement to load the unpacked extension, author the project through rendered controls, and inspect visible Live validation results.

No unresolved product question currently warrants changing the behavior slices. The mandatory remaining decision is approval of this specification handoff before implementation begins.
