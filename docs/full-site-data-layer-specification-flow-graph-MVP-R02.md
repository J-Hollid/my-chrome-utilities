# Full-Site Data-Layer Specification Flow Graph MVP R02

## Authority and status

This revision is governed, in order, by:

1. the product-owner course correction recorded on 2026-07-19;
2. the Flow Graph product decisions recorded on 2026-07-18 and 2026-07-19; and
3. the R04 assessment and correction documents only as evidence and architectural context where they directly affect this MVP.

This cycle does not complete, replace, or make the full R04 correction program a dependency of the Flow Graph MVP. Earlier claims that all R04 findings, release gates, Live changes, and installed-route scenarios block this feature are superseded.

Status is **Respecified — awaiting explicit approval**. The in-progress coder lineage has been audited separately into a safe mechanical checkpoint and later selective candidates. No additional implementation handoff is authorized until this reduced specification is approved.

## Product outcome

Specification Flow gives an operator one readable place to map a data-layer design across Pages and Events, define the expected payload at every documented Event occurrence, and produce developer-ready documentation.

The operator can:

1. create context-setting and ordinary Event occurrences through human Page and Event names;
2. arrange them as a directional graph with alternatives, parallel branches, and merges;
3. reuse Base, Page, Event, and Profile requirements while adding a narrow occurrence refinement;
4. inspect the exact effective schema and provenance for each occurrence;
5. connect an occurrence to the existing Assignment-backed per-event validator;
6. test positive and negative Event payloads without executing the journey;
7. export the same saved revision for Confluence, spreadsheets, and structured interchange; and
8. continue the same work from Builder and side panel without copying schemas or losing edits.

The persistent product statement is:

> Event payloads are validated independently through Assignments. Sequence, branch, and occurrence expectations are checked manually.

## MVP boundary

| Included | Explicitly deferred |
| --- | --- |
| Directional graph and keyboard-operable synchronized outline | Executable journey traversal or full-Flow runtime validation |
| Context-setting and interaction Event occurrences | Correlation, timeouts, current step, transition execution, fork tokens, or join state |
| Expected-next, alternative, parallel, and merge relationships | Automatic missing-Event, wrong-order, branch, multiplicity, or journey verdicts |
| Node-owned obligation, multiplicity, trigger, and developer/tester notes | Journey coverage or a new checklist-run product |
| Stable human-selected Page and Event references | Hidden routing by Flow name, predecessor, graph position, or manual state |
| Base, Page, Event, ordered Profile, and occurrence composition | General schema-engine hardening unrelated to the decisive Flow contract |
| Existing Assignment-backed per-event validation | Wholesale preflight, release, permission, or Live redesign |
| Confluence-ready, spreadsheet, and full-project JSON export | Direct Figma import, SVG backdrop, Figma API, or Figma plugin |
| Canonical save, reload, and focused Builder/side-panel integration | Exhaustive R04 route matrices, first-time-user role-play, or full-site Retail/Trade release acceptance |

An operator may manually recreate a design seen in Figma. Importing or tracing Figma artwork is not an MVP acceptance condition.

## One canonical project

One revisioned Specification Project owns the Page, Event, Profile, schema, Assignment, Flow, occurrence, relationship, example, layout, and provenance records.

It supplies two projections:

    Documentation projection
      graph, outline, manual expectations, and export records

    Per-event validation projection
      observable Assignment matching, effective schemas, issues, and provenance

Both projections use the same stable Page, Event, Profile, schema, Assignment, occurrence, and revision identities. Neither projection may create a copied Event schema, embedded Assignment query tree, schema-owned Assignment clone, or shadow graph.

Graph topology affects documentation and authoring context. It is not input to Assignment resolution or payload validation. Layout changes affect presentation only.

## Canonical concepts

| Concept | MVP purpose |
| --- | --- |
| Base requirements | Common structural and payload expectations. |
| Page | Reusable route or screen definition with observable matching and Page requirements. |
| Event | Reusable emitted Event contract. Its definition explicitly declares context-setting or interaction role independently of emitted name. |
| Event occurrence | One documented use of an Event. It references one stable Event and resolved Page, and owns obligation, multiplicity, trigger, notes, Profiles, and any occurrence refinement. |
| Profile | Reusable named refinement such as Sitewide, Retail, or Trade. |
| Relationship | Directed documentary topology: expected next, alternative, parallel, or merge. |
| Assignment | Existing observable rule that selects one effective Event schema. It references named canonical entities through stable identities. |
| Event example | Positive or negative single-Event input with expected Assignment and validation outcome. |

Human selectors show names and disambiguating context. Raw storage identifiers are not required for authoring. Renames update labels without changing references.

## Graph authoring

The canvas is an editor, not a static diagram. Visible controls create nodes, connect directed relationships, and reposition nodes. Direction arrows distinguish source from target, and saved node coordinates or lanes survive reload. The synchronized outline offers the same semantic operations without dragging; changing layout never changes schema or validation semantics.

### Nodes and Page context

A context-setting Event occurrence selects a Page and establishes the default authoring context for following occurrences in its branch. The Event name has no special behavior: page_view can be interaction and route_view can be context-setting.

Every interaction occurrence persists its resolved Page reference. Runtime observation history is never required to infer its Page.

The same context-setting Event can be reused for multiple SPA Pages. Each occurrence keeps its own Page reference while retaining the shared Event reference.

At a parallel split, each branch owns its authoring Page context. Changing one branch never changes a peer. After a merge of different Page contexts, a following interaction must select a Page or follow another context-setting occurrence.

### Relationships and expectations

Each relationship stores stable source and target occurrence references, kind, group, label, optional plain-language condition, and human meaning.

The allowed kinds are:

| Kind | Meaning |
| --- | --- |
| Expected next | The target is normally expected after the source. |
| Alternative | The target belongs to one documented alternative. |
| Parallel | Branches are independently expected and may be observed in either order. |
| Merge | Documentation continues after alternatives or parallel branches. |

A condition is documentation text, not an executable query.

Each occurrence, rather than an edge, owns one obligation and multiplicity. The initial values are required, optional, conditional, or informational and a human-readable count such as exactly 1, 0 or 1, or 1 through 10.

Graph and outline edit the same records. Every semantic graph action is available through the outline without dragging. Arrow, Home, and End navigate the outline without mutating data.

### Guidance and diagnostics

A blank Flow explains both Event roles, shared references, Page context, schema layers, Assignment-backed validation, the manual journey boundary, and one next action.

Diagnostics use human names and focus the exact occurrence, relationship, Page selector, schema requirement, or Assignment predicate. They cover missing Event references, dangling relationships, ambiguous post-merge Page context, schema conflicts, no Assignment, and Assignment ambiguity. They never produce a Flow Pass or Fail result.

## Effective schema and provenance

The effective schema for an occurrence composes in this fixed order:

    Base -> Page -> shared Event -> ordered Profiles -> occurrence refinement

An occurrence refinement is an overlay, not a copied Event schema. The editor distinguishes Edit shared Event from Refine this occurrence and previews affected occurrences, Assignments, examples, and documentation.

The decisive Flow contract requires:

- object containers and child paths to compile together;
- object and scalar array-item paths such as /products/* and /tags/* to remain visible and executable;
- scalar and nested types;
- required and forbidden presence;
- exact and allowed values;
- the authored conditional rule used by the example;
- descriptions, examples, severity, and provenance; and
- deterministic conflict handling for incompatible types, presence, allowed values, and authored rules.

A conflict blocks the occurrence and names both origins and incompatible values. Silent last-write-wins is prohibited.

Compatible narrowing records every ordered contribution, its authored value, and the composition decision. For example, Event currency GBP or EUR or USD, Retail currency GBP or EUR, and an occurrence currency GBP compile to GBP with all three sources and narrowing decisions visible. An array item requirement retains its item path, type, enum or exact value, rule, and provenance in both the effective contract and validation result.

Graph inspector, effective-schema view, per-event validation input, and exports show the same paths, values, schema revision, winning origin, and complete provenance.

The authoring status is one of Schema blocked, No Assignment, Ambiguous Assignment, Assigned, or Documentation only. These are editing aids, not release or Live states.

## Assignment-backed per-event validation

The MVP reuses the existing Assignment matcher and per-event schema validator. It does not introduce a Flow evaluator.

An Assignment created from an occurrence uses human Page, Event, Profile, and contract selectors while persisting stable references. Its executable predicates may use current observable Page, URL, source, Event, target, payload, environment, and explicitly available session inputs.

Page resolution is canonical across Page-aware authoring status, Assignment candidate priority, the Assignment editor, saved Event examples, matcher tests, and captured per-event validation:

- selected Page identities resolve through their observable Page matchers;
- every Page field and operator offered by Builder or side panel—Environment, Host, Path, Query, Hash, and SPA route using supported exact, glob, regular-expression, or named-route-template forms—compiles into one typed resolver or is rejected before Save;
- the resolver emits one normalized Page-resolution semantic identity, Page name and identity, normalized fields, route variables, candidate outcome, expected and actual evidence, and repair targets;
- a disjoint occurrence Page and Assignment Page remain unmatchable and never become a global scope;
- multiple matching Page definitions produce ambiguity and no Assignment winner;
- a supplied Page identity must agree with observable inputs and cannot bypass matching; missing observable inputs remain unresolved and dangling Page references block with a named repair;
- Page-aware priority cannot let a higher-priority candidate on another Page shadow the matching Page, and equal-priority candidates on disjoint Pages do not form a tie;
- changing executable Page matcher semantics or introducing an overlapping Page changes the Page-resolution semantic identity, while a display-name-only rename does not; and
- results name the Pages, candidates, predicate evidence, and direct repair.

Flow name, occurrence identity, predecessor, graph position, relationship, obligation, multiplicity, and tester state never select a schema.

A single-Event result identifies the tested input, selected Assignment or tie, rejected candidates, effective schema revision, issues, and provenance. Each issue contains exact path, code, severity, expected, actual, and origin.

Positive and negative Event examples run through that same Assignment and validator. The decisive negative set proves type, enum, forbidden-field, required-field, scalar array-item, and the authored conditional rule: when /customer/type equals business, /ecommerce/purchase_order_number is required. Empty or journey-ordered fixtures are not part of this MVP.

An Event can validate successfully when it appears before a documented predecessor, appears more often than documented, or appears while a parallel branch is absent. Those differences remain manual expectations and create no Flow verdict.

The existing product policy for choosing a draft or published per-event validation plan remains unchanged by this MVP. Every result must identify the plan or schema revision it actually used. No Test, release, or Live parity redesign is specified here.

## Builder and side panel integration

Builder is the primary wide graph and documentation workspace. The side panel is not required to reproduce the full canvas; it must show the selected occurrence context and open the exact graph destination.

Both surfaces operate on the same canonical project and support these continuations:

1. A saved side-panel schema can be adopted into Base, Page, Event, Profile, or occurrence scope by human name.
2. Adoption creates one project-owned schema with source lineage. Later library changes are offered as a reviewed synchronization and never silently alter the project.
3. Opening requirements from the graph uses the complete rich editor. Builder retains the nested properties, typed rules, conditions, examples, descriptions, severity, table customization, Spreadsheet output, and Rich table output already available in the side panel.
4. Both surfaces use the same nested All, Any, and Not Applicability query tree, Page and Event selectors, matcher summary, test result, priority, and overlap result.
5. A captured side-panel validation issue opens the exact project, occurrence, Assignment, schema revision, path, and provenance in Builder. Back restores the captured Event context.
6. Both surfaces subscribe to canonical changes.

Every command carries project and entity base revisions. Disjoint patches may merge. An overlapping stale patch requires visible resolution. A stale surface never overwrites a complete schema or project collection.

Changing a requirement never rewrites an earlier captured validation result. The old result stays pinned to its recorded schema revision and is labelled Stale; only an explicit rerun creates a result for the changed revision.

## Developer documentation

Confluence-ready output contains:

- project, Flow, saved revision, and generated time;
- directional diagram and text alternative;
- Base, Page, Event, Profile, occurrence, and relationship inventories;
- the manual journey-boundary legend;
- authored requirements and effective contracts;
- effective requirements with complete provenance;
- named Assignment summaries;
- positive and negative Event examples; and
- developer and tester expectations.

Spreadsheet output contains fixed Overview, Bases, Pages, Events, Profiles, Authored requirements, Occurrences, Relationships, Effective contracts, Effective requirements, Assignments, and Examples tables. Exact columns are specified in data-layer-flow-documentation-export.feature. Every exported key resolves to exactly one row in one of those tables.

Stable readable export keys persist across renames and disambiguate duplicate display names without exposing raw storage identifiers. Every cross-link resolves to one record.

All documentation formats derive from one selected saved revision. Omitting graph relationships, effective schemas, Assignments, or provenance produces an explicit lossy warning.

Full project JSON is the structured round-trip format. Confluence-ready and Spreadsheet outputs are documentation formats and are not represented as lossless imports.

## Delivery phases

| Phase | Slice | Exit condition |
| ---: | --- | --- |
| 1 | Canonical graph | Context and interaction occurrences, stable Page/Event references, four relationship kinds, parallel branch context, outline, guidance, save, and reload work from one model. |
| 2 | Effective occurrence contract | Five-layer composition, exact provenance, conflicts, named Page-aware Assignments, and positive/negative per-event validation work without Flow runtime state. |
| 3 | Cross-surface integration and export | Saved schemas, full rich editors, query trees, captured validation, concurrency, Confluence-ready content, Spreadsheet tables, and project JSON use one revision. |
| Terminal | Focused installed-extension workflow | One small parallel Flow is authored through visible controls, compiled, validated per Event, exported, reloaded, and continued from both surfaces. |

No phase contains preflight, publication, Live redesign, permission onboarding, journey coverage, or full-site Retail/Trade release acceptance.

## Feature ownership

| Feature | Responsibility |
| --- | --- |
| data-layer-directional-flow-specification-graph behavior/runtime | Stable graph, roles, Page context, topology, parallel branches, manual boundary, outline, guidance, persistence. |
| data-layer-flow-effective-schema-assignment behavior/runtime | Five-layer composition, provenance, conflicts, Page-aware named Assignments, exact per-event validation, no Flow verdict. |
| data-layer-flow-cross-surface-integration behavior/runtime | Schema adoption, rich-editor and query parity, validation continuation, revision-safe concurrent commands. |
| data-layer-flow-documentation-export behavior/runtime | Confluence-ready, Spreadsheet, and JSON contracts, stable keys, revision consistency, loss warnings. |
| data-layer-flow-specification-terminal-workflow behavior/runtime | One focused actual-extension proof without full-site release or source-blind usability claims. |

Existing R04, release, Live, fixture, coverage, and executable-journey features remain separate specifications and are unchanged by this correction. They are not acceptance dependencies for this Flow Graph task and are not evidence that this editor executes journeys.

## Flow-MVP traceability

| ID | Outcome | Feature and scenario | Externally visible behavior | Production boundary | Required evidence | Phase | Terminal pass condition |
| --- | --- | --- | --- | --- | --- | ---: | --- |
| FG-01 | Canonical nodes and roles | Graph 001-003, 009; runtime 001-002, 005 | Human selectors create reusable context and interaction occurrences that survive reload. | Canvas and outline controls -> project repository -> graph and outline | Stable identity, rename, reuse, coordinates, direction, reload, and empty-state comparisons | 1 | One record per Page, Event, and occurrence; emitted name has no magic and the canvas is an editor. |
| FG-02 | Directed topology and parallel context | Graph 004-006; runtime 001-003 | Four relationship kinds and node expectations agree while parallel Page contexts remain independent. | Graph commands -> documentation projections | Cross-view record equality, saved direction, branch isolation, and installed ambiguous-merge repair | 1 | No copied edge meaning, peer-context mutation, or runtime branch state. |
| FG-03 | Manual boundary and keyboard outline | Graph 007-008; runtime 003-004 | Product explains manual journey expectations and provides a non-drag editor. | Installed graph, outline, and result UI | Labels, absence checks, keyboard action and focus record | 1 | No Flow verdict or pointer-only semantic action. |
| FG-04 | Effective schema and provenance | Schema 001-003, 015-016; runtime 001, 012-014 | Five layers compile to one exact inspectable contract or a named conflict. | Canonical compiler -> inspector, validator input, export | Parent-child, compatible narrowing, scalar array-item, conflict, path, value, and ordered provenance comparisons | 2 | Visible and consumed effective contracts are structurally equal with no partial conflict result, dropped contribution, or item path. |
| FG-05 | Named Page-aware Assignment | Schema 004-006, 009-013; runtime 002, 005-010 | Named selectors persist stable references; one Page resolver drives status, matcher tests, examples, and captured validation. | Page resolver -> Assignment matcher -> authoring and validation callers | Matcher grammar, every Page qualifier, disjoint and overlapping Pages, priority, rename, missing context, dangling reference, winner, rejection, and tie cases | 2 | Flow state and supplied IDs never route; missing, ambiguous, disjoint, or dangling Page context fails closed. |
| FG-06 | Exact per-event validation | Schema 007-008, 014, 016; runtime 003-004, 011, 013 | Positive and negative payloads return exact issues independently of journey differences. | Assignment -> effective schema validator -> result UI | Type, enum, exact, forbidden, required, conditional, scalar-item, order, count, and absent-branch cases | 2 | Every payload issue is exact and no journey issue is invented. |
| FG-07 | Complementary surfaces | Cross-surface 001-006; runtime 001-005 | Saved schemas, rich tables, query trees, captured validation, and edits continue without copying or loss. | Installed side panel and Builder -> command repository and subscriptions | Both save orders, exact revisions, overlap conflict, immutable prior result, lineage, same-editor, and navigation comparisons | 3 | No reduced editor, parallel schema, copied query, whole-collection overwrite, or lost update. |
| FG-08 | Developer exports | Documentation 001-006; runtime 001-003 | Three formats agree on the selected revision; JSON round-trips and documentation loss is explicit. | Saved project -> production exporters/importer | Parsed tables, diagram/text, stable keys and resolvable cross-links for every entity and contract, provenance, revision, and round-trip equality | 3 | Confluence and Spreadsheet are complete documentation with no dangling links; JSON is lossless interchange. |
| FG-09 | Focused installed workflow | Terminal 001; runtime 001 | A small parallel Flow is authored, compiled, tested, exported, reloaded, and continued in both surfaces. | Built installed extension and production controls | Source-aware action/result record with no storage injection or replaced API | Terminal | The complete narrowed workflow passes without release, Live, journey, or blind-agent claims. |

## Decisive regressions

The MVP cannot pass while:

- the canvas is a static projection, cannot create or connect nodes, or loses saved positions and edge direction on reload;
- graph and outline render different nodes or relationships;
- emitted Event name implicitly sets Page context;
- an interaction occurrence relies on a previously observed Event instead of a stored Page;
- parallel branch Page changes leak into a peer branch;
- optionality or multiplicity exists separately on both a node and edge;
- a parent-child schema crashes or visible and consumed schemas differ;
- compatible Event, Profile, and occurrence narrowing loses an authored contribution or uses silent last-write-wins;
- a scalar array item requirement such as /tags/* disappears from compilation, validation, or export;
- shared Event requirements are copied into occurrence-owned schema files;
- a disjoint Page intersection is treated as an unscoped Assignment;
- Page overlap, missing observable Page inputs, a dangling Page reference, caller-provided Page identity, or graph topology selects an arbitrary Assignment;
- type, enum, exact-value, forbidden, required, or conditional validation returns only a presence check or omits exact provenance;
- unexpected order, count, or an absent branch creates a Flow verdict;
- a side-panel saved schema cannot be adopted by name into the project;
- Builder opens a lighter requirement table or query builder than the side panel;
- captured validation cannot open its exact graph occurrence and requirement;
- editing a requirement silently rewrites an earlier captured validation result instead of preserving and marking it Stale;
- a stale side-panel save erases newer graph or schema data;
- Confluence-ready and Spreadsheet outputs disagree with the selected effective schema or topology, or contain a dangling exported cross-link; or
- a documentation export is presented as lossless structured interchange.

## Recommended integration decisions for approval

1. **Full canvas stays in Builder.** The side panel retains all current schema, table, Assignment, and validation capabilities, shows occurrence context, and deep-links to the graph; it does not duplicate the full canvas.
2. **Schema Library adoption is explicit and lineage-preserving.** A saved schema becomes one project-owned canonical revision. Library updates require reviewed synchronization.
3. **Page identity is a stable reference backed by one observable matcher.** Editor tests and captured per-event validation use the same Page resolver; supplied IDs cannot assert a contradictory Page.
4. **Existing draft/published validation policy is unchanged.** This MVP identifies the plan used but adds no release or Live gate.
5. **Manual testing remains documentation.** Obligation, multiplicity, trigger, and tester notes export with the Flow; revisioned ChecklistRun execution is deferred.
6. **Project JSON is the structured interchange contract.** Confluence-ready and Spreadsheet outputs optimize developer communication and disclose loss.
7. **Direct Figma ingestion is deferred.** The graph supports manually reproducing a Figma design; reference-artwork import can be a later, separately accepted slice.
8. **Automated acceptance is source-aware.** It proves production controls and boundaries without pretending to measure unassisted first-time humans. Owner-managed Windows evaluation remains outside this cycle.

## Approval and handoff

After explicit approval, the specifier commits only the reconciled specification changes with the required By specifier. byline and sends the normal file-based SwarmForge handoff. The implementation handoff must target this reduced acceptance set and the independently approved safe checkpoint rather than the earlier R04 matrix.
