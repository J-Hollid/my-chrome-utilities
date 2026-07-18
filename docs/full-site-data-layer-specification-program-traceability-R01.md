# Full-Site Data-Layer Specification Program Traceability R01

## Authority and status

This matrix traces the proposed behavior program to `DLSP-01` through `DLSP-12` and the decisive acceptance criteria in `full-site-data-layer-specification-workflow-recommendations-R01.md`. The R01 report and every file under `artifacts/schema-editor-walkthrough/R01/` are immutable source evidence.

Terminal status values are:

- **Implemented and verified:** production behavior is present in the built extension and its stable model/runtime scenarios passed the coder, refactorer, and architect automated gates. This status does not imply completion of the separately prepared paired-Windows operator walkthrough.
- **Compatibility preserved:** an existing primitive remains available while the Specification Project provides the new authoring/release boundary.
- **Release blocker repaired:** an R01 trust defect is covered by production-boundary regression evidence.

## Delivered vertical behavior order

| Order | Phase | Vertical behavior slice | Behavior / runtime feature | Depends on | Slice exit evidence |
| --- | --- | --- | --- | --- | --- |
| 00A | 0 | Local and reusable rule editing with explicit revision synchronization | Existing approved `data-layer-local-rule-editing.feature` `001–006`, runtime `001–005`; `data-layer-reusable-rule-sync-publication.feature` `001–005`, runtime `001–004` | Current rule library and schema revision lifecycle | Local rules edit in place; reusable-rule edit navigation is direct; synchronization is an explicit reviewed draft-and-publish action |
| 00B | 0 | Type-independent reusable Required rules | Existing approved `data-layer-required-rule-type-independence.feature` / `-runtime.feature` | Slice 00A reusable-rule identity | One Required rule is reusable across every property data type while genuinely inapplicable rules remain blocked |
| 01 | 0 | Durable schema authoring and truthful publication | `data-layer-durable-authoring-drafts.feature` / `-runtime.feature` | Current schema draft primitives | Rerender, navigation, reload, restart, failure recovery, no invented assignment, Publish distinction |
| 02 | 0 | Truthful assignment lifecycle | `data-layer-truthful-assignment-lifecycle.feature` / `-runtime.feature` | Slice 01 draft boundary | One derived list state, stable IDs, real pins, lossless edits, inline paths, compatibility cleanup |
| 03 | 1 | Specification Project aggregate and legacy compatibility | `data-layer-specification-project-foundation.feature` / `-runtime.feature` | Phase 0 trust gate | Greenfield project, stable graph, transactions, migration/defer/recovery, side-panel companion |
| 04 | 1 | Full-page workspace and navigation | `data-layer-specification-workspace-navigation.feature` / `-runtime.feature` | Slice 03 stable project graph | Deep links, tree/workspace/inspector, state restoration, search/where-used, bounded rendering |
| 05 | 1 | Bulk requirement authoring | `data-layer-bulk-requirement-authoring.feature` / `-runtime.feature` | Slices 03–04 transactions and grid shell | Greenfield staged imports, 100-row commit, multi-select, subtrees, transactional Undo |
| 06 | 1 | Documentation-export rescope | `data-layer-documentation-export.feature` / `-runtime.feature` | Slice 04 owns Specification Builder name | Honest labels, responsive preview, clipboard fidelity, explicit lossiness |
| 07 | 2 | First-class page, group, and event catalog | `data-layer-page-event-catalog.feature` / `-runtime.feature` | Project graph and compatibility adapter | Named greenfield entities, references, dependency-safe edits and migration |
| 08 | 2 | Named applicability and routing evidence | `data-layer-named-applicability.feature` / `-runtime.feature` | Slice 07 context identities | Nested matchers, inline guidance, current/pasted tests, candidates/winner/tie/shadow/fallback |
| 09 | 2 | Ordered requirement-profile composition | `data-layer-requirement-profile-composition.feature` / `-runtime.feature` | Slice 07 identities; slice 08 contexts | Provenance, explicit precedence, conflicts, reorder impact, parent-chain migration |
| 10 | 2 | Structured temporal flows | `data-layer-temporal-flow-authoring.feature` / `-runtime.feature` | Slices 07–09 | Ordered/optional/repeatable/branched steps and markerless Retail/Trade state resolution |
| 11 | 3 | Greenfield fixtures, coverage, and preflight | `data-layer-project-fixtures-preflight.feature` / `-runtime.feature` | Complete Phase 2 graph and evaluators | Event/journey fixtures, matrix pivots, deep links, policy classes, ambiguity blocker |
| 12 | 3 | Atomic project release | `data-layer-atomic-project-release.feature` / `-runtime.feature` | Slice 11 release gates | Structured whole-project diff, all-or-nothing snapshot, recovery, restore-as-draft |
| 13 | 3 | Full-fidelity interchange and staged merge | `data-layer-project-interchange.feature` / `-runtime.feature` | Stable graph and release format | Semantic round trip, graph-wide collision resolution, rollback, lossy standard export plus manifest |
| 14 | 3 | Terminal Retail/Trade program acceptance | `data-layer-retail-trade-decisive-workflow.feature` / `-runtime.feature` | Slices 01–13 | Decisive end-to-end pass, migration, benchmark, keyboard pass, actual-extension visual evidence round |

## DLSP recommendation traceability

| Recommendation | Phase | Feature and stable scenarios | Dependency | Implementation status |
| --- | --- | --- | --- | --- |
| DLSP-01 — State integrity and truthful UI | 0 | `Data layer durable authoring drafts 001–008`; runtime `001–006`; `Data layer truthful assignment lifecycle 001–007`; runtime `001–005` | Existing schema/assignment storage; gate for all later slices | **Implemented and verified; release blocker repaired.** Working-draft assignments, stable pins/IDs, lossless edits, truthful list/search state, and distinct Publish actions passed production-browser verification. |
| DLSP-02 — Full-page Specification Project workspace | 1 | `Data layer Specification Project foundation 006`; runtime `004`; `Data layer Specification workspace navigation 001–007`; runtime `001–005` | DLSP-01, project aggregate | **Implemented and verified.** The built full-page workspace and side-panel companion expose bounded navigation, search, inspector context, restoration, and deep links. |
| DLSP-03 — First-class pages, applicability, flows, steps, releases | 1–3 | `Data layer Specification Project foundation 002`, runtime `001`; page/event catalog `001–006`, runtime `001–005`; named applicability `001–009`, runtime `001–006`; temporal flow authoring `001–009`, runtime `001–006`; atomic release `003`, runtime `003` | Project graph → catalogs → applicability/profiles → flows → release | **Implemented and verified; compatibility preserved.** First-class project entities coexist with schema assignments and replay compatibility paths. |
| DLSP-04 — Ordered profile composition | 2 | `Data layer requirement profile composition 001–007`; runtime `001–005`; decisive workflow `001`, `004` | First-class project contexts and stable profile IDs | **Implemented and verified; compatibility preserved.** Ordered composition, provenance, conflicts, and deterministic legacy parent-chain migration are covered. |
| DLSP-05 — Durable drafts and atomic releases | 0–3 | durable drafts `001–005`, `008`, runtime `001–004`, `006`; foundation `003`, runtime `003`; bulk `002–006`, runtime `002–005`; applicability `009`, runtime `006`; temporal flow `006`, runtime `005`; atomic release `001–007`, runtime `001–005` | Trust repair → project transactions → preflight | **Implemented and verified; release blocker repaired.** Project/schema writes roll back both exact prior byte strings on failure, and release publishes schema working drafts through the revision lifecycle. |
| DLSP-06 — Bulk-first authoring | 1 | `Data layer bulk requirement authoring 001–007`; runtime `001–005`; decisive workflow `009` | Durable project transactions, full-page virtual grid | **Implemented and verified.** Staging, 100-row commit, multi-selection, reusable subtrees, and one-transaction Undo passed. |
| DLSP-07 — Guided matcher builder and routing analysis | 2 | `Data layer named applicability 001–008`; runtime `001–005`; decisive workflow `005` | Page/event identities and project draft | **Implemented and verified.** Nested matching, actionable errors, fixture/current-context evidence, overlap, candidate, winner, tie, shadow, and fallback behavior are covered. |
| DLSP-08 — Fixtures, coverage, and preflight | 3 | `Data layer project fixtures and preflight 001–008`; runtime `001–005`; decisive workflow `004–006` | Pages/events/applicability/profiles/flows | **Implemented and verified.** Greenfield fixtures, bounded coverage, exact-field deep links, ambiguity analysis, and release blockers passed. |
| DLSP-09 — Navigation, global search, provenance, and impact | 1–3 | workspace navigation `001–009`, runtime `001–007`; profile composition `002`, `004–005`, runtime `001`, `003`; page/event catalog `003–006`, runtime `002–005`; preflight `004`, `008`, runtime `004–005` | Stable graph and project index | **Implemented and verified.** Project-wide search, Where used, origin/provenance, release consumers, and focused issue navigation passed. |
| DLSP-10 — Full-fidelity interchange and staged diff/merge | 3 | `Data layer project interchange 001–007`; runtime `001–006`; atomic release `003`, `006`; decisive workflow `007` | Complete graph, migration registry, releases | **Implemented and verified; compatibility preserved.** Full graph round-trip, collision review, rollback, and deliberately lossy JSON Schema plus companion manifest passed. |
| DLSP-11 — Rename and rescope Build specification | 1–3 | `Data layer documentation export 001–005`; runtime `001–004`; project interchange `006`; runtime `005` | Full-page Specification Builder ownership and final export metadata | **Implemented and verified; release blocker repaired.** Specification Builder names the project workspace; documentation export retains the table workflow with explicit loss metadata and clipboard fidelity. |
| DLSP-12 — Responsive and accessible interaction system | Every phase | durable drafts `006–007`, runtime `005`; workspace `005–009`, runtime `003–007`; bulk `007`, runtime `005`; documentation export `003`, `005`, runtime `003–004`; page/event `006`, runtime `005`; applicability `008`, runtime `005`; profile `007`, runtime `005`; flow `008`, runtime `005`; preflight `004`, `008`, runtime `004–005`; release `007`, runtime `005`; interchange `007`, runtime `006`; decisive `010`, runtime `004–006` | Delivered alongside each functional slice | **Implemented and verified at automated production/component boundaries; external walkthrough pending.** Keyboard/focus behavior, bounded rendering, and 360/520/720/1280 layouts passed deterministic browser-component verification. The paired-Windows actual-extension walkthrough remains incomplete in R04. |

## Decisive acceptance traceability

| Criterion | Phase | Feature and stable scenario | Dependency | Implementation status |
| --- | --- | --- | --- | --- |
| DA-01 — Define shared sitewide page/event envelope | 1–2 | `Data layer Retail and Trade decisive workflow 001`; runtime `001` | Project foundation, profiles, catalog | **Implemented and verified.** |
| DA-02 — Define Retail and Trade flows sharing Purchase and confirmation URL | 2 | decisive workflow `002`; temporal flow `003`; runtime temporal `002` | Pages/events, applicability, profiles, temporal evaluator | **Implemented and verified.** |
| DA-03 — Retail requires transaction_id, value, currency | 2 | decisive workflow `001` | Ordered profiles | **Implemented and verified.** |
| DA-04 — Trade additionally requires account_id and purchase_order_number | 2 | decisive workflow `001` | Ordered profiles | **Implemented and verified.** |
| DA-05 — Prior flow state distinguishes markerless final events | 2 | decisive workflow `002`; runtime decisive `001`; temporal runtime `002–004` | Flow-instance correlation and persistence | **Implemented and verified through the production callback adapter.** Registered production callbacks resolved different Retail and Trade winners from prior flow state; this is not relabelled as paired-Windows actual-extension evidence. |
| DA-06 — Optional Retail upsell and repeatable product step | 2 | decisive workflow `003`; temporal flow `001–002`; runtime temporal `001` | Structured flow model | **Implemented and verified.** |
| DA-07 — Effective requirement, origin, winner, and coverage visible | 2–3 | decisive workflow `004`; profile `002`; applicability `005`; preflight `004` | Profiles, applicability, coverage index | **Implemented and verified.** |
| DA-08 — Deliberately ambiguous matcher detected before release | 3 | decisive workflow `005`; preflight `006`; runtime preflight `003` | Applicability analyzer and release gate | **Implemented and verified.** |
| DA-09 — Passing and failing event/journey fixtures | 3 | decisive workflow `006`; fixtures/preflight `001–002`; runtime `001`, `003` | Temporal and validation evaluators | **Implemented and verified.** |
| DA-10 — Publish, export, reload with complete stable semantics | 3 | decisive workflow `007`; runtime decisive `001–002`; interchange runtime `001–002` | Atomic release and full-fidelity format | **Implemented and verified.** Stable identities and complete semantics survived release, export/import, and reload. |
| DA-S1 — Draft name/description/properties survive navigation/reload | 0 | decisive workflow `008`; durable drafts `001–002`; runtime `001–002` | Draft persistence | **Implemented and verified.** |
| DA-S2 — Paste at least 100 properties, review errors, commit/undo once | 1 | decisive workflow `009`; bulk `002`; runtime bulk `002` | Bulk staging and transactions | **Implemented and verified.** |
| DA-S3 — Apply Required to multi-selection once | 1 | decisive workflow `009`; bulk `003`; runtime bulk `003` | Bulk grid | **Implemented and verified.** |
| DA-S4 — Preflight issue reaches field within two actions | 1–3 | decisive workflow `010`; workspace `002`, runtime `001`; preflight `004`, runtime `004` | Deep-link index | **Implemented and verified.** |
| DA-S5 — Property-path search shows all users and releases | 1–3 | decisive workflow `010`; workspace `004`; runtime workspace `005` | Global project index | **Implemented and verified.** |
| DA-S6 — Core workflow completes keyboard-only | Every phase | decisive workflow `010`, runtime `005`; durable drafts `007`, runtime `005`; workspace `007–009`, runtime `004`, `006–007`; bulk `007`, runtime `005`; catalog `006`, runtime `005`; applicability `008`, runtime `005`; profile `007`, runtime `005`; flow `008`, runtime `005`; preflight `004`, runtime `004`; release `007`, runtime `005`; interchange `007`, runtime `006` | Accessible components in each slice | **Implemented and verified at deterministic component/runtime boundaries; external walkthrough pending.** Focus return and keyboard interactions pass automated gates, while the paired-Windows keyboard-only walkthrough remains outside this autonomous environment. |

## Terminal program gates

| Gate | Stable scenario evidence | Status |
| --- | --- | --- |
| Existing-user migration or explicit compatibility | foundation `004–005`; catalog `005`; profile `006`; decisive runtime `003` | **Passed.** Migration and compatibility scenarios preserve supported identities and semantic behavior. |
| Representative 500-property, 50-flow benchmark | workspace `006`; preflight `008`; decisive runtime `004` | **Passed in the deterministic browser-component harness.** Rendering remained bounded and the recorded interaction task stayed within the 100 ms limit. |
| Browser-sensitive storage, focus, layout, clipboard, download, and reload automation | Runtime scenario IDs enumerated in each DLSP row; documentation export runtime `002–004`; interchange runtime `001–006`; decisive runtime `001–006` | **Passed at production callback or deterministic component boundaries.** These automated results do not substitute for the separately prepared paired-Windows actual-extension walkthrough. |
| Actual-extension 360/520/720/full-page walkthrough and keyboard pass | `Data layer Retail and Trade decisive workflow runtime 005–006` plus R04 walkthrough procedure | **External verification pending.** R04 explicitly records that the paired-Windows actual-extension capture matrix was not produced in the autonomous environment. |
| Immutable R01 brief and evidence delivered downstream | First approved specification commit includes the authoritative report and exact `artifacts/schema-editor-walkthrough/R01/` tree | **Passed.** Delivered unchanged in specification commit `a58c9d1415`. |

The previously approved Phase 0 rule slices are committed in `1426e15` and `de5cfde`. They remain part of this program's implementation lineage and passed the coder, refactorer, architect, and terminal functional-delivery gates with the later slices.

## Terminal correction cycle 1

The first implementation lineage failed the architect's terminal functional-delivery gate. Its real browser boundary covered greenfield project creation, generic entity rows, global search, one bulk paste with Undo/Redo, basic preflight and release, bounded rendering, and reload. That subset was retained as a foundation while the subsequent production correction delivered and exercised every requirement below.

**Closed.** Coder correction `9035d428303f7be59ae988807be2625131a24fff`, refactor/property handoff `1f1cd3f839`, and architect terminal hardening `60207d292b` delivered and verified every outcome in this table.

| Missing production outcome | Required scenario evidence |
| --- | --- |
| Documentation export and actual clipboard fidelity, including deliberate loss metadata | documentation export `001–005`, runtime `001–004`; interchange `006`, runtime `005` |
| Truthful assignment and durable schema-draft integration with the project release lifecycle | durable drafts `001–008`, runtime `001–006`; truthful assignment lifecycle `001–007`, runtime `001–005` |
| Persisted temporal flow instances, transitions, occurrence constraints, and markerless Retail/Trade selection from prior state | temporal flow `001–009`, runtime `001–006`; decisive workflow `002–003`, runtime `001` |
| Structured whole-project release diff, recovery, restore-as-draft, and Publish versus Publish-and-close behavior | atomic release `001–007`, runtime `001–005` |
| Staged full-graph collision resolution, rollback, and semantic full-fidelity round trip | project interchange `001–007`, runtime `001–006`; decisive workflow `007`, runtime `002` |
| Coverage matrix, static ambiguity analysis, Where used, and issue deep links to exact fields | fixtures/preflight `001–008`, runtime `001–005`; workspace `002`, `004`, runtime `001`, `005` |
| Decisive keyboard-only and 500-property/50-flow automated performance evidence; paired-Windows actual-extension visual evidence remains external | decisive runtime `004–006`; R04 walkthrough report |

Passing generic acceptance handlers or naming these concepts in a collection is not completion evidence. Each runtime scenario must drive the production extension boundary, or the same production callback through a deterministic adapter, and assert browser storage, clipboard, focus, scrolling, computed layout, download content, or temporal results as applicable.

## Approved product assumptions

1. **Flow-instance correlation.** The approved default is one flow instance per browser-tab session, optionally correlated by an explicitly configured transaction/session variable. State survives same-tab navigation, extension reload, and crash recovery; explicit exit or configured timeout closes it; equal active instances block automatic selection.
2. **Release numbering.** Project releases use monotonically increasing immutable revisions; restoring an old release creates a new draft.
3. **Default preflight policy.** Semantic errors, unresolved ties, unreachable required branches, missing references/pins, and failing required fixtures block. Completeness warnings do not block unless project policy enables that gate.
4. **Legacy compatibility.** Migration creates or exposes a compatibility project preserving supported identities and behavior. Blank/colliding/unpinned records are reviewed or quarantined rather than silently repaired; historical snapshots remain immutable.
5. **Side-panel quick edits.** Documentation and bounded requirement corrections may edit the same project draft from the side panel. Structural composition, bulk, and flow changes deep-link to the workspace.
6. **Profile conflicts.** Ordered precedence resolves compatible overlays. Incompatible types, required/forbidden combinations, and empty allowed-value intersections remain explicit blockers rather than silent overwrite.
7. **Performance acceptance.** The fixed QA benchmark uses 500 properties and 50 flows, bounded virtualized DOM, a 100 ms maximum interaction task, and a 2 second workspace-interactive budget. Benchmark environment and measurements must be recorded with verification evidence.
8. **Visual evidence round.** An unrelated R02 evidence round already exists in the workspace and remains untouched. Post-implementation verification uses the next unused round, R03, under `artifacts/side-panel-walkthrough/R03/` with `docs/side-panel-visual-walkthrough-recommendations-R03.md`; R01 and R02 are never overwritten.

## Terminal verification record

- Specification lineage: `a58c9d1415` followed by correction specification `a144c4963e`.
- R02 correction lineage: specification `6650dbcffe`, coder `cac1845ac4`, conflict recovery `8e9c2df2cb`, refactorer `8110fea6da`, architect `1d6c8c26b7`, and terminal pack-ownership correction `7b983d7e50`.
- Generated Gherkin soft mutation: 579 of 579 mutants killed across the complete 50-feature program; zero survivors or errors.
- Property verification: 200 generated cases passed. Refactor verification: 243 tests and 1,300 assertions passed; maximum changed-adapter CRAP was 4.5.
- Direct acceptance packs: command palette, hotkeys, capture, event library, schemas, defects, replay, and shell all exited successfully.
- Automated visual/component evidence: `artifacts/schema-editor-walkthrough/R03/` and `docs/full-site-data-layer-specification-workflow-assessment-R03.md`.
- External walkthrough record: `docs/side-panel-visual-walkthrough-recommendations-R04.md`. The paired-Windows actual-extension and keyboard-only capture matrix is pending.
- Release status: every DLSP-01 through DLSP-12 production correction and decisive automated criterion is implemented and passes terminal gates. Full release verification remains conditional on the external paired-Windows operator walkthrough.

The documented demo is hosted on a separately prepared Windows machine and requires collaborative setup with the product owner, so reproducing it is outside the autonomous development environment. R03 used local deterministic adapters and component rendering to exercise production callbacks and the decisive event sequence. R04 preserves the remaining evidence gap: those results are not a substitute for the paired-Windows actual-extension walkthrough.
