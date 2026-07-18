# Full-Site Data-Layer Specification Flow Graph MVP R01

## Authority and status

Authority order for this focused correction is:

1. the product-owner decisions recorded in this cycle on 2026-07-18;
2. `full-site-data-layer-specification-workflow-assessment-R04.md`;
3. `artifacts/schema-editor-walkthrough/R04/README.md` and every R04 screenshot;
4. `full-site-data-layer-specification-correction-program-R04.md`; and
5. `full-site-data-layer-specification-program-traceability-R01.md` as architectural context.

For Flow purpose, temporal execution, journey evidence, Flow coverage, and Live Flow-state output, this specification supersedes the earlier assessment remedy and R04 correction program. The R04 installed-extension findings remain authoritative evidence of product defects; only their executable-Flow remedy is replaced.

All other R04 corrections remain required, including canonical persistence, revision-safe cross-surface commands, complete schema compilation and validation, deterministic named Assignments, immutable published validation, side-panel and standalone capability parity, operator guidance, rich bulk authoring, responsive behavior, keyboard operation, and exact provenance.

Status is **Specified — awaiting approval**. No commit or coder handoff occurs until the user explicitly approves this specification and handoff.

## Product outcome

The product enables an operator to:

1. define reusable Base, Page, Event, Profile, and occurrence-specific data-layer expectations;
2. arrange Event occurrences in a readable directional graph across Pages and variants;
3. document context changes, expected ordering, occurrence obligation and multiplicity, alternatives, parallel expectations, and merges;
4. inspect the exact effective schema and provenance for every Event occurrence;
5. make every automatically validated Event occurrence selectable by one deterministic named Assignment using current observable inputs;
6. export developer-ready Confluence and Spreadsheet documentation from the same canonical revision; and
7. inspect independent per-event validation results in Event Test, captured observations, and Live.

The product label is:

> **Specification Flow — Event payloads are validated automatically; sequence and occurrence expectations are checked manually.**

The graph organizes and composes the specification. It is not an MVP journey automaton.

## MVP boundary

| In the MVP | Outside the MVP |
| --- | --- |
| Directional Specification Flow graph | Automatic journey traversal |
| Context-setting and interaction Event occurrences | Inferring Page context from a previously observed Event |
| Expected-next, alternative, parallel, and merge relationships plus node-owned obligation and multiplicity | Runtime transition, fork-token, join-wait, or occurrence enforcement |
| Static Page-context resolution for schema composition | Flow instances, correlation keys, and timeout state |
| Base + Page + Event + Profile + occurrence composition | Using Flow name, node, predecessor, or checklist state as a hidden Assignment predicate |
| Assignment-backed independent Event validation | Automatic missing-Event, wrong-order, or whole-journey verdicts |
| Positive and negative single-Event validation cases | Ordered journey Fixtures as release proof |
| Specification and Assignment completeness | Runtime Flow-path coverage |
| Human Seen, Not seen, Not applicable, actual-count, and notes | Inferring human journey judgment from captured traffic |
| Immutable published documentation and per-event validation plan | Draft changes altering Live |

An existing temporal evaluator may remain isolated as post-MVP technical work. It is not enabled, surfaced, required, or represented as successful MVP behavior.

## One project, two truthful projections

One revisioned `SpecificationProject` remains the mutable authority. It produces two content-addressed projections:

```text
Canonical Specification Project
        |
        +-- Documentation projection
        |     graph + outline + Page contexts + Event occurrences
        |     + relationships + manual checklist + export layout
        |
        +-- Per-event validation projection
              observable matchers + named Assignments
              + effective schemas + Profiles + provenance
```

Both projections use the same Page, Event, Profile, effective-schema, Assignment, revision, release, and provenance identities. They may not maintain copied schema files, shadow graph records, schema-owned legacy Assignments, or separately rendered counts.

Graph topology affects documentation, Where used, context composition, and checklist generation. Graph topology is excluded from per-event runtime selection and validation. Layout affects documentation presentation only and is excluded from the validation-plan identity.

## Canonical concepts

| Concept | Purpose | MVP behavior |
| --- | --- | --- |
| Base requirements | Common data-layer envelope | Lowest composition layer for applicable Event occurrences. |
| Page | Reusable route or screen context | Provides Page requirements and observable Assignment selectors. |
| Event | Reusable emitted Event contract | Owns shared name, payload expectations, examples, and Where used. |
| Event-occurrence node | One documented use of an Event | References one stable Event and one resolved stable Page; owns required, optional, conditional, or informational obligation and human-readable multiplicity; may add a narrow occurrence refinement. |
| Context-setting Event | Documents a Page or screen change | The reusable Event definition declares the role independently of emitted Event name; occurrences establish authoring context, not runtime temporal state. |
| Interaction Event | Documents an Event within a Page | Stores its resolved Page reference so independent validation never depends on observing a predecessor. |
| Profile | Reusable variant requirements | Supplies Sitewide, Retail, Trade, environment, or other named refinements. |
| Documented relationship | Human topology expectation | Owns only expected-next, alternative, parallel, or merge topology. The same stable edge appears in canvas, outline, checklist, Confluence, and Spreadsheet; it never executes in MVP. |
| Assignment | Observable routing rule | Selects one published effective schema from current source, target, URL, Event, payload, environment, or explicitly available session inputs. |
| Event validation case | Positive or negative single-Event example | Runs the production Assignment and schema validator without Flow-state prerequisites. |
| Manual checklist row | Human journey judgment | Records Seen, Not seen, Not applicable, actual count, tester, time, and notes without becoming validation evidence. |

Human selectors display names while stable references persist. Rename never changes identity. Page and Event definitions remain shared and unscoped until an operator explicitly applies a named Profile or Applicability rule.

## Directional graph behavior

### Primary and equivalent views

At desktop widths, the directional graph is the primary Flow view. A synchronized outline is an equal canonical editor, not a generated read-only summary. Every node, relationship, context, requirement entry point, diagnostic, and selection is operable through the outline without dragging.

At 360 CSS px, one active outline, inspector, schema, checklist, or export pane owns one vertical scroll. The complete Flow and requirement editor remain operable by keyboard. Switching views preserves exact node, field, focus, scroll, revision, and return context.

### Nodes and context

- Every executable payload contract remains a shared Event definition.
- Every graph Event occurrence has its own stable node identity and references one stable Event.
- Each reusable Event definition explicitly declares context-setting or interaction role. Every occurrence inherits that role; changing it previews every affected occurrence. `page_view`, `virtual_page_view`, `checkout_step_view`, or another Event name may be context-setting, and the name itself has no special behavior.
- A context-setting occurrence selects a Page and establishes a default authoring context for new occurrences in its branch.
- Each interaction occurrence persists its resolved Page reference. Context inheritance is never left as runtime inference.
- Moving an occurrence between Pages previews effective-schema, Assignment, documentation, and stale-evidence consequences before commit.
- At a merge of different Page contexts, a later interaction must select a Page explicitly or follow a new context-setting occurrence.

### Relationships and parallel expectations

The canonical relationship kinds are topology only:

| Kind | Human meaning |
| --- | --- |
| Expected next | The developer or tester normally expects the target after the source. |
| Alternative | The target belongs to one documented alternative. |
| Parallel | Branches are independently expected and may be observed in either order. |
| Merge | Documentary continuation after alternative or parallel branches. |

Each Event-occurrence node, independently of its incoming or outgoing relationships, owns exactly one obligation (`required`, `optional`, `conditional`, or `informational`) and a human-readable multiplicity such as `exactly 1`, `0 or 1`, or `1 through 10`. An optional or repeated-looking connector imported from an older project is rejected for guided repair or normalized only after an impact preview moves that meaning onto the target node. A derived loop or optional badge may visualize node metadata, but it is not another semantic relationship record.

A documented relationship owns stable source and target node references, topology kind, alternative/parallel group, label, optional plain-language condition, and manual meaning. Its condition is documentation text, not a matcher/query tree and not runtime input.

Parallel branches are included in the first release. Each branch retains its own authoring Page context. Changing context in one branch never changes its peer. A documentary merge never creates runtime tokens or waits for branch completion.

Static integrity checking reports missing Events, dangling relationships, orphaned required occurrences, unresolved Page context, missing effective schemas, and missing or ambiguous Assignments. It never turns those diagnostics into a captured-journey Pass or Fail result.

### Layout and Figma continuation

Coordinates, lanes, grouping, colors, collapse state, viewport, and locked reference artwork are revisioned presentation data. Moving artwork or a node increments only the presentation revision and does not stale schema-validation evidence.

The MVP accepts a sanitized Figma-exported SVG as a locked, replaceable reference backdrop. Artwork pixels, labels, and connector geometry create no semantic record. The source filename, import time, replacement history, alignment, visibility, and attribution are presentation metadata and survive reload. A malformed or unsupported replacement leaves the prior backdrop unchanged. Scripts, handlers, links, fonts, and external resources are removed or made inert before rendering. Canonical nodes and relationships exist only after explicit reviewed tracing.

Documentation export has an **Include reference artwork** option that defaults off. Enabling it previews source attribution and security treatment and embeds only the sanitized inert artwork; the canonical diagram and text alternative are always exported independently. Direct `.fig` parsing, computer-vision inference, a Figma API connection, and a companion Figma plugin are post-MVP.

## Effective Event schema composition

The effective schema for an Event occurrence composes in this fixed order:

```text
Base -> Page -> shared Event -> ordered Profiles -> occurrence refinement
```

An occurrence refinement is a narrow overlay, not a copied Event schema. The UI distinguishes **Edit shared Event** from **Refine this occurrence** and previews every affected node, Assignment, validation case, documentation section, and release before commit.

The compiler preserves structural containers and children regardless of authoring order. It enforces scalar and nested types, required and forbidden presence, exact and allowed values, cardinality, conditional rules, current side-panel rule capabilities, descriptions, examples, severity, and provenance.

Compatible narrowing composes deterministically. Incompatible types, Required versus Forbidden, disjoint allowed values, and incompatible rules block the occurrence with both human origins and exact values. Silent last-write-wins is prohibited.

Graph inspectors, effective-schema preview, Event validation plan, Confluence output, and Spreadsheet output contain identical effective paths, values, schema revision, and provenance.

Bulk authoring entered from a node uses the existing full rich editor. It remains locked to the selected contributing Profile or occurrence refinement and base revision, with staged repair, row exclusion, complete columns, paging, file and spreadsheet input, atomic commit, and one-step Undo/Redo. No lightweight graph-local schema table is permitted.

## Automatic validation readiness

Every Event-occurrence node displays exactly one status, calculated statically from the selected project revision without requiring a captured observation. Precedence is top to bottom:

1. **Schema blocked** — composition cannot produce an effective schema; this also blocks Documentation only because documentation still requires a contract.
2. **Documentation only** — composition succeeds and the operator explicitly accepted that this occurrence makes no automatic-validation claim.
3. **Ambiguous Assignment** — at least two enabled selected-draft compiled Assignment versions tie at equal winning priority in any region, or different Assignment versions win different regions so the occurrence has no single named Assignment.
4. **No Assignment** — no enabled selected-draft Assignment covers that declared matcher domain.
5. **Draft only** — one compiled selected-draft Assignment version covers the whole domain, but that content/revision identity or the effective-contract identity is absent from or differs from the published validation plan. Stable Assignment identity alone is insufficient because it survives matcher and priority edits.
6. **Ready** — one compiled Assignment version covers the whole domain and that same content/revision identity and effective-contract identity are in the current published validation plan.

The declared matcher domain is the visible intersection of the occurrence's Event/source/target, resolved Page route selectors, environment, applicable Profile/Applicability constraints, and any explicitly authored observable scope; it is not inferred from example traffic. The UI renders that domain in plain language and lets the operator test values against it.

The deterministic check partitions the whole declared domain, not one convenient example payload. Any equal-winning-priority region or different winning Assignment across regions produces Ambiguous Assignment; otherwise any uncovered region produces No Assignment. `Draft only` or `Ready` requires the same compiled Assignment version to be the provable winner in every region. Lower-priority overlap is allowed only when the precedence policy has that one winner. Human candidate names, content revisions, matching and rejected predicate evidence, uncovered/tied/split region, blocking reason, and one direct repair action are shown for every non-ready automatic state.

New Event occurrences default to **Automatic validation required**. Publication therefore requires a deterministic selected-draft Assignment and effective schema; either `Draft only` or `Ready` is configuration-ready for publication. `Draft only` becomes `Ready` only after that exact plan is published. The operator may instead change the occurrence to **Documentation only** after an impact review names the affected node, Assignment blocker, Live claim, checklist, export, release, and undo action. Documentation-only occurrences still require an effective schema for developer documentation, remain visibly labelled in the graph, outline, checklist, Confluence, and Spreadsheet, and never imply automatic payload validation. Changing back to Automatic validation required restores the applicable Assignment blocker until configuration-ready.

The graph can help create or reuse an Assignment through named selectors. It may not add Flow name, node, documented predecessor, graph position, or checklist state as a hidden predicate.

If Retail and Trade share Page and Event definitions but require different schemas, they need an observable discriminator such as route variable `channel`, hostname, source, payload field, environment, or an explicitly available session value. If every observable input is identical, resolution returns a tie. Prior graph expectations never break it.

## Per-event validation

Event Test runs the explicitly selected content-addressed draft or published validation projection so required cases can prove a first release. Captured validation and Live run only the immutable published projection. When the same immutable projection and observation are selected, Event Test, capture details, and Live retain one serialized `EventValidationResult` identity and structure; only channel-specific presentation fields may differ. An `EventValidationResult` contains:

- observed Event identity and normalized observable context;
- Assignment candidates and predicate evidence;
- winner or tie;
- rejected candidates and reasons;
- effective Profiles and schema revision;
- exact issues with path, code, severity, expected, actual, and provenance; and
- selected content-addressed validation-projection identity; and
- immutable published release identity when the selected projection is published.

It contains no authoritative Flow, current node, transition outcome, temporal occurrence verdict, branch token, join state, or journey verdict. Where used may link to possible documented occurrences and must label them non-authoritative.

A Purchase captured before its expected predecessor is still independently validated. Eleven valid Product view payloads remain eleven valid payloads even when the checklist documents an expected range of 1 through 10.

Attaching an observation to a documented occurrence is a manual organizational action. It preserves the immutable observation and validation result and changes only the occurrence association and checklist-run record.

An `EventValidationCase` is a named, revisioned single-observation input with observable context, expected winner or tie, expected valid/invalid outcome, exact expected issues or absence of issues, requirement level, and last production result. Its result records the case revision, compiled Assignment content revision, effective-contract/schema revision, validation-plan revision, and production runner version. A required empty case is `Blocked`; a required case whose actual winner/tie, validity, or issues differ from its assertions is `Failing`; a required positive or negative case whose assertions and dependencies match is `Passing`. Any result whose recorded dependency identity differs from the selected compilation is `Stale`; a required stale case blocks until rerun. An optional absent case is `Not run` and is not a release blocker. A negative case that receives its exact expected issue is Passing evidence, not a validation failure.

## Manual tester expectations

Every Event occurrence may document:

- trigger and implementation note;
- required, optional, conditional, or informational expectation;
- expected frequency in human-readable text;
- alternative or parallel group;
- developer note, tester note, and examples; and
- manual status, actual count, tester, time, and observation attachments.

Manual status begins **Not checked**. Only an explicit tester action records Seen, Not seen, or Not applicable and the actual count. Automatic statuses are limited to Valid payload, Invalid payload, No Assignment, Ambiguous Assignment, and Schema blocked.

The published project stores an immutable checklist template. Actual testing occurs in a separately revisioned `ChecklistRun` that references one draft or published specification snapshot and records tester identity, deterministic recorded time, statuses, actual counts, notes, and observation associations. Updating a run never mutates the project revision, validation-plan identity, release, or developer-document snapshot. A run export is explicitly labelled execution evidence and can never be confused with the blank specification checklist.

Manual state never becomes schema evidence, never manufactures coverage, and never becomes a journey Pass. Missing manual observation does not block publication by default. A project may mark individual Event validation cases required; an empty or assertion-mismatched required case blocks, but absence of journey execution does not.

Automated SwarmForge acceptance proves controls, persistence, labels, exports, independent validation, and the absence of false temporal claims. It does not role-play human judgment or substitute agents for owner-managed Windows testing.

## Developer documentation

Every documentation representation identifies project, Flow, Draft or Published status, project or release revision, validation-plan revision where applicable, generated time, and omissions.

Complete Confluence output contains:

1. purpose and metadata banner;
2. directional diagram and text alternative;
3. legend stating that relationship and multiplicity expectations are manually checked;
4. Page/context sections;
5. Event-occurrence inventory;
6. documented relationships;
7. effective schema tables;
8. named Assignment summaries;
9. valid and invalid single-Event examples;
10. manual tester checklist; and
11. provenance, Where used, traceability, and glossary.

Spreadsheet output contains named tables or sheets:

1. `Overview`
2. `Nodes`
3. `Events`
4. `Relationships`
5. `Pages`
6. `Effective requirements`
7. `Assignments`
8. `Examples`
9. `Tester checklist`
10. `Traceability`

The fixed minimum columns are:

| Table | Required columns |
| --- | --- |
| `Overview` | `Field`, `Value`; required rows identify Project, Flow, Purpose, Status, Project revision, Release revision, Validation-plan revision, Released at, Generated at, MVP boundary, Omissions, and Reference artwork state |
| `Nodes` | Node key, Flow key/name, Node name, Event key/name, Role, Page key/name, Obligation, Expected minimum/maximum, Frequency note, Trigger, Profile keys, Effective contract key, Assignment key, Readiness, Developer note, Tester note |
| `Events` | Event key/name, Emitted name, Source, Validation target, Role, Description, Shared requirement keys, Example keys, Used-by node keys |
| `Relationships` | Relationship key, Flow key, Source node key, Kind, Group, Label, Condition, Target node key, Human expectation |
| `Pages` | Page key/name, Route or matcher summary, Requirement keys, Profile keys, Context node keys, Used-by node keys |
| `Effective requirements` | Requirement key, Contract/node/Page/Event keys, Path, Presence, Type, Exact value, Allowed values, Condition or rule, Severity, Example, Description, Comments, Winning origin, Complete provenance, Schema revision |
| `Assignments` | Assignment key/name, Event key, Source/target/URL/payload/environment/session matchers, Validation target, Observable matcher summary, Priority, Version policy, Contract key, Schema revision, Readiness, Candidate outcome, Rejected-candidate reasons |
| `Examples` | Example key, Event case, Node/contract keys, Outcome kind, Observable context, Payload, Expected Assignment outcome, Expected issue codes, Requirement level, Case revision, Result Assignment content revision, Result contract/schema revision, Result validation-plan revision, Runner version, Current status, Description |
| `Tester checklist` | Checklist/Flow/node keys, Page/Event names, Trigger, Obligation, Expected minimum/maximum, Frequency note, Relationship group/expectation, Manual status, Actual count, Tester, Tested at, Notes, Observation links, Validation status |
| `Traceability` | Export key, Entity kind, Human name, Project revision, Release identity, Source keys, Used-by keys, Provenance summary |

Stable short export keys such as `event-E001`, `node-N001`, and `edge-R001` persist across renames and disambiguate identical display names without exposing raw storage UUIDs. Display names remain separate. In the decisive example, Retail and Trade each produce context-setting and interaction rows, share one Purchase Event row, retain distinct Purchase node keys, show their exact route-channel Assignments, and enumerate every effective requirement and provenance row.

The selected snapshot fixes every semantic record and its project, release, and validation-plan identities. `Generated at` records the act of rendering and is excluded from semantic-equivalence comparison; a released snapshot's `Released at` remains immutable. Re-exporting the same release may therefore have a different Generated at value but must parse to the same semantic tables, keys, order, and released identity.

Preview, copied Confluence output, downloaded Spreadsheet output, and their accessibility text derive from one selected revision. Omitting graph, schema, Assignment, provenance, or tester semantics produces an explicit lossy warning. Full-fidelity project JSON remains the only MVP round-trip format.

## Side panel and standalone workspace

The standalone Builder and side panel are complementary views of the same canonical project:

- The standalone Builder provides the wide graph, outline, broad composition, complete rich requirement editor, documentation dossier, and release workflow.
- The side panel retains every existing rich schema and table capability, validates captured Events, attaches observations to named occurrences, shows checklist context, and opens the exact graph node or requirement.
- Either surface can adopt a saved schema into the project, inspect source lineage, and synchronize a reviewed revision without recreating it.
- Captured validation can continue into a named Event validation case, Profile requirements, or a manual occurrence attachment without clipboard transfer, raw IDs, or duplicate records.
- Both surfaces subscribe to Page, Event, node, relationship, Profile, Assignment, Event-case, checklist-run, schema, and release changes and update or visibly pause an open editor at the canonical command boundary.
- Both surfaces expose the same nested Assignment query builder, including `All`, `Any`, and `Not` groups, observable source/target/URL/Event/payload/environment/session predicates, priority, overlap testing, and human-readable summaries. The builder edits or creates the named Applicability Set referenced by the Assignment; it never embeds or copies a second condition tree into the Assignment.
- Every specification command carries project and entity base revisions. Disjoint stale commands may merge; overlapping changes require visible resolution. A ChecklistRun command instead carries its run base revision and immutable referenced-snapshot identity. A stale surface never writes a whole collection snapshot or turns a run edit into a project edit.

## Compilation, release, and Live

One content-addressed `ProjectCompilationResult`, identified visibly as for example `compile:7K3M`, is consumed unchanged by preflight, review, and publication. Review displays that identity; any specification command after review that affects the documentation or validation projection—including exported layout—invalidates it and requires a new preflight. ChecklistRun commands do not. Publication refuses a different, rebuilt, or stale result. It blocks:

- malformed or dangling canonical references;
- unresolved Page context needed for composition;
- effective-schema compiler failure;
- missing effective schema for any Event occurrence, including Documentation only;
- an uncovered or equal-winning-priority matcher-domain region for an occurrence marked Automatic validation required; and
- an empty, stale, or assertion-mismatched required Event validation case.

It does not block for unobserved ordering, occurrence, alternative, parallel, merge, or complete-journey behavior. Manual checklist rows remain visible as Not checked.

A release snapshots both the documentation projection and per-event validation projection. Live consumes only the immutable published per-event validation projection. Draft graph, schema, or Assignment edits do not alter Live until a new compilation result passes the same review and publication gate.

Before target discovery or observation, Live requests the current target origin through a deliberate **Request access** action. Onboarding identifies the exact origin, data read, purpose, persistence, revocation path, and read scope before the browser prompt. Denial reads and captures nothing and preserves retry guidance. Broad **Browse all tabs** access is a separate expert action with its wider scope explained before its own prompt; it is never a hidden prerequisite for the terminal workflow.

## Delivery phases

| Phase | Slice | Exit condition |
| ---: | --- | --- |
| 0 | Scope and canonical migration | Temporal Flow fields are classified as documentary or post-MVP; one node/relationship graph and one Assignment collection remain. |
| 1 | Graph and equivalent outline | Context/interaction nodes, node obligation/multiplicity, expected-next/alternative/parallel/merge relationships, static integrity, persistence, Undo/Redo, and Figma backdrop work without a shadow model. |
| 2 | Effective schemas and Assignment readiness | Every occurrence resolves exact composition/provenance and reports Schema blocked, Documentation only, Ambiguous Assignment, No Assignment, Draft only, or Ready by fixed precedence. |
| 3 | Independent Event validation and manual checklist | Event Test, captured observations, and Live agree; manual states remain explicit and non-authoritative. |
| 4 | Documentation and release | Confluence, Spreadsheet, preflight, review, publication, and published Live use one selected revision and truthful boundaries. |
| Terminal | Retail/Trade installed-extension workflow | A fresh project produces two documentary Flows, effective contracts, deterministic observable Assignments, equivalent exports, independent Live results, and no false journey verdict. |

## Feature ownership

| Feature | Responsibility |
| --- | --- |
| `data-layer-directional-flow-specification-graph` behavior/runtime | Canonical graph, context roles, node obligation/multiplicity, documentary topology including parallel branches, static integrity, Figma backdrop, persistence, concurrency, responsive and keyboard behavior, truthful boundary. |
| `data-layer-flow-effective-schema-assignment` behavior/runtime | Layer composition, shared versus local edits, conflicts, Assignment readiness, independent validation, exact issues, draft isolation, rich-table parity. |
| `data-layer-flow-documentation-export` behavior/runtime | Complete Confluence and Spreadsheet contracts, relationship disclaimers, snapshot identity, parity, lossy warnings, responsive preview, JSON round-trip boundary. |
| `data-layer-flow-manual-test-expectations` behavior/runtime | Manual expectation fields, checklist states, observation attachment, counts, no automatic temporal inference, publication policy. |
| `data-layer-flow-specification-terminal-workflow` behavior/runtime | Terminal greenfield Retail/Trade actual-extension proof, indistinguishable-input tie, and origin-first permission onboarding. |

Existing canonical persistence, schema compiler, rule catalog, Assignment, release, focus, and rich-table features remain supporting specifications where they do not depend on temporal Flow state.

## Existing-specification reconciliation

| Existing specification | MVP disposition |
| --- | --- |
| `data-layer-temporal-flow-authoring` behavior/runtime | Replaced for MVP authoring by the directional graph feature. Stable references, persistence, Undo/Redo, stale-editor safety, and accessibility are retained. Prior-state selection, correlation, timeout, runtime occurrences, and journey claims are post-MVP. |
| `data-layer-temporal-flow-execution-correction` behavior/runtime | Entire temporal execution contract is post-MVP. Stable-reference and stale-editor regressions are transplanted into the new graph features. |
| `data-layer-greenfield-retail-trade-production-release` behavior/runtime | Flow-specific terminal claims are replaced by the new terminal feature. Canonical authoring, schema validation, release isolation, concurrency, bulk authoring, parity, and accessibility remain supporting behavior. |
| `data-layer-retail-trade-decisive-workflow` | Prior-Flow routing, automaton, journey Fixture, and Flow-coverage claims are replaced. Shared entities, composition, persistence, bulk, navigation, and release portability remain. |
| `data-layer-unified-specification-evaluation` behavior/runtime | Active Flow, current step, state transition, and prior-journey routing are removed from the MVP result. Assignment candidates, winner/tie, effective schema, Profiles, issues, provenance, and release remain. |
| `data-layer-live-guided-workflow` | Permission onboarding, assignment repair, issue explanation, and published-release guidance remain. Active Flow/step guidance becomes a non-authoritative link to possible documented occurrences. |
| `data-layer-effective-requirement-coverage-correction` behavior/runtime | Archived. Requirement and traceability rows enumerate each documented occurrence's effective contract and any linked Event cases without calling that journey coverage. Specification/Assignment completeness replaces runtime Flow coverage. |
| `data-layer-production-fixture-execution` and `data-layer-project-fixtures-preflight` behavior/runtime | Single-Event validation cases remain. Ordered journey, transition, occurrence, prior-state, and state-transition assertions are post-MVP. |
| `data-layer-truthful-preflight-release-correction` behavior/runtime | Same-result release gate remains with new static/schema/Assignment/required-Event-case blockers. Missing temporal journey evidence is not a blocker. |
| `data-layer-named-applicability` behavior/runtime | Observable matcher, overlap, stable selector, and keyboard behavior remain. Flow state and Flow-step predicates are not MVP runtime inputs. |
| `data-layer-requirement-profile-composition` and `data-layer-effective-schema-compilation` behavior/runtime | Composition and validation remain; Flow/step precedence becomes occurrence refinement, and Event Test replaces journey Fixture parity. |
| `data-layer-contextual-specification-editors` behavior/runtime | Flow editor fields become purpose, context/interaction nodes, documentary relationships, Profiles, Assignments, notes, and layout. Timeout, correlation, and Journey Fixture controls are post-MVP. |
| `data-layer-documentation-export` behavior/runtime | Property-table behavior remains and is extended by the complete Flow dossier; selecting Flows must emit real graph semantics rather than only suppressing a warning. |
| `data-layer-schema-specification-builder*`, `data-layer-canonical-project-schema-drafts*`, `data-layer-workflow-focus-management` | Preserved and reused directly for rich-table parity, command revisions, adoption/continuation, accessibility, and focus. |

The superseded temporal features are stored outside active `features/` discovery under `docs/post-mvp-features/`. They are historical/post-MVP design records, not active MVP acceptance obligations and not evidence that the new Flow product purpose requires or promises temporal execution. The first coder slice must remove their old verification-pack entries and handlers, register all ten active behavior/runtime replacements, and restore pack validation before any MVP acceptance run.

## Finding-to-feature traceability

| ID | Finding or acceptance gate | Feature and scenario | Externally visible behavior | Production boundary | Required evidence | Phase | Terminal pass condition |
| --- | --- | --- | --- | --- | --- | ---: | --- |
| FSG-01 | One canonical graph | Directional graph `001`; runtime `001` | Canvas and outline show the same named nodes and edges after reload. | Graph commands → repository → installed views | Structural identity comparison | 1 | No shadow diagram or copied Event exists. |
| FSG-02 | Context role is not Event-name magic | Directional graph `002`, `018`; runtime `002`, `013` | Any named Event can be explicitly context-setting; role changes preview every affected occurrence; `pageview` is not special. | Event editor → canonical Event/occurrence projections | Three emitted names and four-occurrence impact comparison | 1 | Saved reusable role alone determines authoring behavior without changing identities. |
| FSG-02A | Multiple SPA contexts | Directional graph `014`; runtime `010` | One context-setting Event is reused by Checkout and Confirmation occurrences within one SPA document. | Event/node editor → canonical references | Same-Event, different-Page identity comparison | 1 | Interaction occurrences store the intended Page without pageload or temporal state. |
| FSG-03 | Interaction Page is deterministic | Directional graph `003`, `007`; composition `004` | Every occurrence resolves a named Page and ambiguous merges deep-link to repair. | Graph context resolver → compiler | Move, cancel, confirm, divergent merge | 1–2 | No runtime predecessor is needed to know the Page. |
| FSG-04 | Shared Event reuse | Directional graph `004`; composition `002–003`; runtime composition `001` | Retail and Trade occurrences reuse Purchase while retaining distinct overlays. | Canonical references → compiler | Identity and schema comparison | 1–2 | One Event definition, two occurrence identities, no copied schema. |
| FSG-05 | Documentary topology and node-expectation fidelity | Directional graph `005–006`, `015–016`; runtime `003`; documentation `004` | Expected-next, alternative, parallel, and merge edges plus node obligation/multiplicity agree everywhere. | Graph projection → outline/checklist/export | Cross-representation record comparison and legacy-edge repair | 1–4 | No representation drops, duplicates, or reinterprets an expectation. |
| FSG-06 | Parallel branches in first release | Directional graph `006–007`; documentation `004`; manual `007` | Branch-local contexts and manual expectations are clear; merge ambiguity repairs are exact. | Graph/editor/export/checklist | Parallel graph and divergent-context examples | 1–4 | Parallel documentation works without tokens or join status. |
| FSG-07 | Static graph integrity | Directional graph `008`; runtime `014` | Named nodes receive missing Event, dangling edge, orphan, context, or Assignment diagnostics. | Static project compiler → editor router | One behavior and installed-boundary example per diagnostic | 1–2 | Repair opens exact entity; no journey verdict appears. |
| FSG-08 | Figma is reference, not authority | Directional graph `009`; Documentation `008–009`; runtime graph `005` | Artwork imports, reloads, replaces, removes, and optionally exports without creating semantics. | File safety input → backdrop storage/export → graph commands | Lifecycle, sanitizer, and before/after canonical comparison | 1–4 | Pixels, scripts, links, and geometry never mutate semantics or execute. |
| FSG-09 | Safe persistence and concurrency | Directional graph `010`; runtime `006–007` | Disjoint edits coexist; overlaps resolve; stale controls cannot mutate another Flow. | Builder/side panel commands → repository | Both edit orders and stale overlap | 1–terminal | No update is lost or applied to the wrong Flow. |
| FSG-10 | Responsive and keyboard equivalence | Directional graph `011`; runtime `008`; terminal `001` | Graph/outline parity, one narrow pane/scroll owner, exact focus, no drag-only action. | Installed DOM/CSS/focus callbacks | 360/720/1280 keyboard transcripts | every | Complete authoring/export works without pointer or clipping. |
| FSG-11 | Truthful MVP label | Directional graph `012`; runtime `004` | Automatic payload versus manual journey boundary is always visible. | Graph, checklist, export, Live UI | Text and absence assertions | every | No Flow Pass/Fail, active step, transition outcome, temporal occurrence verdict, branch token, or join-state claim. |
| FSG-11A | Guided graph entry | Directional graph `013`; runtime `009` | Empty Flow explains concepts, prerequisites, examples, default validation mode, and one next action. | Installed empty state and routing | Fresh project text/action record | 1 | Operator can begin without internal collection knowledge. |
| FSG-12 | Exact layered composition | Composition `001–005`; runtime `001` | Base, Page, Event, Profile, and occurrence requirements and conflicts are visible with provenance. | Canonical compiler → inspector/plan/export | Retail/Trade path and conflict matrices | 2 | Displayed, validation, and exported schemas agree exactly. |
| FSG-13 | Assignment readiness per node | Composition `006–007`, `012–014`; runtime `002–003`, `008–010` | Every node reports Schema blocked, Documentation only, Ambiguous Assignment, No Assignment, Draft only, or Ready by fixed precedence. | Compiler and matcher-domain analyzer → graph | Whole-domain winner, split-domain winner, tie, uncovered region, content revision, repair, opt-out, and identical-input evidence | 2–terminal | Only configuration-ready or explicit documentation-only nodes can publish; graph state never breaks a tie. |
| FSG-14 | Complete per-event validation and cases | Composition `008–009`, `015`; runtime `004`, `011` | Type, enum, forbidden, required, and conditional issues contain exact values and provenance; cases report Blocked, Failing, Passing, Stale, or Not run truthfully. | Observer/Event Test → Assignment → validator → issue UI | Positive/negative payload matrix and case-state matrix | 2–3 | Each defect produces its exact issue independent of prior Events; an empty case never passes. |
| FSG-15 | Correct evidence staleness | Composition `010`, `015`; Documentation `013`; runtime composition `005`, `011`, documentation `012` | Schema, matcher, case, and plan changes stale dependency-bound results; layout and labels do not. | Dependency index → case gate/draft/release/export views | Dependency-identity and presentation-change matrix | 2–4 | An old required result cannot remain Passing or publishable. |
| FSG-16 | Full rich authoring parity | Composition `011`, `016`; runtime `007`, `010` | Node entry uses the same rich editor, bulk tools, nested query builder, and outputs on both surfaces. | Shared requirement/Assignment editors → canonical commands | Row/query/config/output parity | 2–terminal | No lightweight graph schema editor or side-panel capability loss. |
| FSG-17 | Complete developer dossier | Documentation `001–005`, `010–013`, `015–020`; runtime `001–003`, `007–008`, `012`, `014` | Diagram, fixed-column tables, schemas, Assignments, examples, provenance, checklist, and freshness identities agree with stable export keys. | Selected snapshot → Confluence/Spreadsheet renderers | Parsed Retail/Trade row-level semantic equality | 4 | Developers receive every selected semantic category without UUIDs, ambiguous rows, or unqualified stale results. |
| FSG-18 | Immutable snapshot and loss truth | Documentation `006–013`, `021`; runtime `005–012` | Draft/release identity is stamped; later edits do not mutate output; omissions, artwork state, and stale results are explicit. | Draft/release repository → exporters/interchange | Metadata, revision, semantic-equivalence, sanitizer, freshness, and round-trip comparisons | 4 | No mixed revision, unsafe asset, or misleading round-trip claim. |
| FSG-19 | Manual judgment remains manual | Manual `001–004`, `009–011`; runtime `001`, `003`, `006–008` | Tester fields and observation attachments persist in a revision-safe ChecklistRun pinned to one snapshot. | Checklist-run commands → observation association | Status/count, attach/remove, draft pin, both edit orders, stale overlap | 3 | Only explicit tester actions change manual state; a run never rebases itself or mutates its referenced snapshot. |
| FSG-20 | No temporal inference | Manual `005–008`; runtime graph `004`, manual `002`, `004–005`, `009` | Unexpected order, 11 observations, missing branch, and Not checked state create no Flow result. | Observer/validator/checklist/preflight | Four negative regressions | 3–4 | Payloads validate independently; manual state remains truthful. |
| FSG-21 | One release gate and Live isolation | Composition `010`; Atomic release `008`; Manual `008`; Terminal `001`; runtime composition `005`, atomic `006` | One compilation result drives review/publication; Live stays on the published plan. | Compiler → preflight/review/publish → Live | Unchanged result identity, invalidation, and draft/release comparison | 4–terminal | Draft changes cannot alter Live; no temporal evidence gate. |
| FSG-22 | Terminal Retail/Trade workflow | Terminal `001`; runtime `001` | Fresh UI builds, documents, exports, publishes, and independently validates both variants. | Built installed extension and real permitted target | Source-aware action/result record | terminal | Complete workflow succeeds without storage injection or false journey claims. |
| FSG-23 | Indistinguishable contexts tie | Terminal `002`; runtime `002` | Human candidate names and evidence show a tie; graph expectations do not route. | Published Assignment resolver → actual Live | Real identical-observable observation | terminal | No arbitrary or prior-Flow winner is selected. |
| FSG-24 | Origin-first permission onboarding | Live guided workflow `005`; Terminal `003`; runtime terminal `003` | Exact-origin access is explained and explicitly requested; denial reads nothing; broad all-tabs access remains separate. | Installed onboarding → production Chrome permission API → observer eligibility | Rendered scope text, deny/grant outcomes, observer and messaging state | 3–terminal | Observation starts only after the reviewed origin grant and no broad permission is hidden or assumed. |

## Complete R04 finding-to-feature reconciliation

Feature labels below refer to the active behavior/runtime pairs listed under Feature ownership. Supporting feature names are written explicitly. An acceptance gate marked **replaced** preserves the R04 defect to prevent but changes the remedy to the owner-approved documentary-Flow MVP.

### Recommendations

| ID | Disposition and feature/scenario | Externally visible behavior | Production boundary | Required evidence | Phase | Terminal pass condition |
| --- | --- | --- | --- | --- | ---: | --- |
| R04-T01 | Retained — Graph `001`; Canonical drafts `016`, `018`; runtime counterparts | Canvas, outline, editors, counts, compiler, documentation, release, and Live use canonical identities. | Command repository → projections/consumers | Named identity/count comparison after reload and migration | 0–terminal | No shadow record contributes a row, schema, candidate, or result. |
| R04-T02 | Retained — Canonical drafts `003`, `016–017`; Graph `010`; runtime `003`, `006`, `017` | Base-revision patches merge disjoint edits and visibly resolve overlaps. | Builder/side panel → canonical repository | Both save orders and one overlapping-field conflict | 0–terminal | Neither surface loses or replaces newer data. |
| R04-T03 | Replaced — Composition `017`; Documentation `014`; Atomic release `008`; runtime composition `013`, documentation `013`, atomic `006` | One complete Event result spans Test/capture/Live; one compile identity spans preflight/review/publish. | Compiler/evaluator → assurance/release/Live | Content-addressed structural result comparison and `compile:7K3M` identity | 2–terminal | No reduced, rebuilt, legacy, mutable-draft, or temporal result is authoritative. |
| R04-T04 | Retained — Composition `010`; Atomic release `006`, `008`; runtime composition `005` | Draft previews change while published documentation and Live remain immutable. | Draft/release selector → exporters/Live | Same release output and observation before and after draft edit | 2–terminal | Live changes only after the reviewed new plan publishes. |
| R04-T05 | Retained/strengthened — Composition `001–005`, `008`, `011`, `016–017`; Effective compilation `009–013`; Schema container `008–009`; runtime counterparts | Parent/child paths and every offered rule compile, validate, and show exact provenance on both surfaces. | Rich editors → compiler/validator → result/export | Constraint matrix, full rule catalog, lifecycle, issue objects, rich-grid parity, nested query | 2–terminal | No side-panel capability is downgraded or presence-only validated. |
| R04-M01 | Retained — Graph `001–004`; Named applicability `011`; Composition `006`; runtime | Human selectors persist stable Page, Event, Profile, schema, node, and Assignment references. | Editors → serializer → compiler/resolver | Rename/reload and selected-reference comparisons | 1–terminal | No raw ID or name-string runtime join is required. |
| R04-M02 | Retained — Graph `004`, `014`; Page/Event catalog `004`; Terminal `001` | Shared Pages and Events remain unscoped until explicit Profile or Applicability selection. | Catalog → graph/composition | One Event identity reused across Retail/Trade and SPA Pages | 1–terminal | No Flow silently owns or duplicates a shared entity. |
| R04-M03 | Replaced — Graph `005–007`, `015–016`; Documentation `004`; Manual `001`, `007`; runtime | Four topology kinds and node-owned obligation/multiplicity agree in every documentary view. | Graph repository → canvas/outline/checklist/export | Cross-representation IDs plus legacy-edge normalization | 1–4 | No second edge value or runtime transition model can disagree. |
| R04-M04 | Retained — Named applicability `004–006`, `012`; Composition `007`, `014`; runtime | Matcher tests show human candidates, predicate evidence, priority, overlap, shadow, and tie. | Query builder → production matcher-domain analyzer | Deliberate route success and equal-priority overlap | 2–terminal | An unresolved domain overlap has no winner and deep-links to repair. |
| R04-M05 | Replaced — Composition `008`, `015`; Contextual editors `006`; Canonical drafts `021`; Documentation `013`; runtime counterparts | Guided positive/negative single-Event cases carry inputs, named destinations, exact assertions, and explicit freshness; empty required cases are Blocked. | Observation continuation/Event-case editor → production Assignment/validator | Empty, assertion mismatch, expected negative issue, optional empty, captured continuation, stale export | 2–4 | Empty evidence never Passes; exact negative evidence can Pass; stale evidence never appears current. |
| R04-M06 | Replaced — Atomic release `002`, `008`; Composition `012–015`; Manual `008`; runtime | One gate blocks named references, exact compiler failures, readiness ambiguity, and required-case failures—not missing journeys. | Compilation result → preflight/review/publish | Same compiler or evidence blocker and result identity on all three surfaces | 4 | Review and publication cannot disagree for unchanged input. |
| R04-G01 | Retained — Operator usability `002`, `015`; Graph `013`; runtime `014`, `009` | Task entries, progress, blockers, and one explained next action guide a fresh project. | Builder Overview/empty state → router | Fresh-profile text, action, and resulting entity | 1 | Beginning requires no collection or source knowledge. |
| R04-G02 | Retained — Operator usability `014`, `020`; Graph `013` | Every core entity has purpose, example, prerequisites, Used by, distinction, and worked example. | Contextual guidance/empty states | Content and navigation record for each entity kind | 1 | Concepts and Retail/Trade relationships are self-explanatory. |
| R04-G03 | Retained with new consequence — Operator usability `016`; Graph `003`, `009`; Composition `003–004`, `013`; runtime | Before/after messages name entities, draft/published scope, documentation and per-event effects, stale evidence, revision, and Undo. | Command impact service → confirmation/status | Confirm/cancel diffs for node, schema, Assignment, release | 1–4 | Messages match canonical effects and never invent temporal runtime impact. |
| R04-G04 | Retained — same scenarios as G03 plus Contextual editors `009` | Dependency reviews use human names and enumerate every consumer before consequential changes. | Dependency index/compiler preview → editors | Rename/delete/move/composition previews | 1–4 | Cancel changes nothing; confirm changes only reviewed entities. |
| R04-G05 | Retained — Operator usability `005`, `017`; Graph `007–008`; Composition `005`, `012`; runtime | Empty, blocked, and failed states explain cause and focus one exact named repair field. | Diagnostics → deep-link/focus router | URL, label, focus, Back restoration | 1–4 | Repair is reachable without an unexplained raw identity. |
| R04-G06 | Owner exclusion — no blocking scenario; automated controls remain covered by Terminal runtime `001` | Product records explicit tester actions but claims no real-person or agent role-play outcome. | Owner-managed Windows evaluation outside SwarmForge | None for recommendation completion | outside | Not a terminal pass condition. |
| R04-O01 | Retained — Canonical drafts `019–020`; Operator usability `021`; runtime `019–020`, `018` | Either surface adopts and later synchronizes a saved schema with lineage and reviewed diff. | Schema Library → canonical project command → compiler | Both entry surfaces, one compiled copy, Used by, sync diff | 0–2 | No recreation or parallel executable library source. |
| R04-O02 | Revised — Canonical drafts `021–022`; Operator usability `021`; runtime `021–022`, `018` | Captured validation continues by name to an Event case, Profile requirements, or manual occurrence attachment. | Observation/result → canonical command → destination editor | Identity, assertions, destination, revision, return context | 1–3 | No clipboard, import/export, raw ID, or copied result. |
| R04-O03 | Retained — Composition `011`, `016`; schema builder `008` and customization `011`; runtime composition `007`, `010` and supporting runtime | Standalone and side panel expose the same rich rows, nested query builder, customization, and outputs. | Shared production editors/derivation → both surfaces | DOM/configuration/query/output structural comparison and both save orders | 1–terminal | Standalone is never a lighter parallel table or query model. |
| R04-P101 | Retained — Operator usability `002`, `015`; runtime `002`, `014` | Persistent Overview shows sequence, completion, blockers, and Continue. | Builder Overview | Empty and partially complete projects | 1 | Exactly one truthful next action is recommended. |
| R04-P102 | Retained — Operator usability `018` | Toolbar groups Validate, Release, More, and one contextual primary action. | Builder toolbar | Desktop/narrow rendered actions | 1 | Primary action follows selected task. |
| R04-P103 | Retained — Operator usability `004`, `018`; Contextual editors `010`; runtime | Inspector contains only selected-entity controls; stale disclosures become inert. | Selection/render lifecycle | Flow-to-Page switch and accessibility tree | 1 | No unrelated global form remains actionable. |
| R04-P104 | Retained — Composition `001–005`; Schema container `008–009`; runtime | Actual effective schema, conflicts, values, and complete provenance are visible. | Compiler → inspector/plan/export | Displayed/executable structural comparison | 2 | Preview exactly equals the contract production validates. |
| R04-P105 | Replaced — Graph `001`, `003`, `006–007`, `010–011`, `015–017`; runtime `006–008`, `011–012` | Event-occurrence nodes and relationships edit in place; stale mounted controls are rejected. | Graph/outline commands → repository | Retail-to-Trade stale action, keyboard edit, context repair | 1 | No stale control mutates another Flow or node. |
| R04-P106 | Retained — staged multiformat bulk authoring `001–010`; runtime `001–009`; Composition `011` | Exclusion, complete columns, paging, files/spreadsheets, layer/base lock, atomic commit, Undo/Redo remain. | Input adapters → staging → canonical patch | Large import, fault, stale base, one Undo/Redo | 1–2 | Commit is atomic and locked to reviewed Profile/revision. |
| R04-P107 | Retained — Graph `011`, `017`; Operator usability `007–009`, `017`; Focus `007–008`; runtime graph `008`, `012` | One narrow pane/scroll owner, complete editor, tree keys, labelled controls, and exact focus work. | Installed DOM/CSS/focus callbacks | 360/720/1280 keyboard transcripts and computed layout | every | No required control is clipped, pointer-only, or focus-ambiguous. |

### Acceptance gates

| ID | Disposition and feature/scenario | Externally visible behavior | Production boundary | Required evidence | Phase | Terminal pass condition |
| --- | --- | --- | --- | --- | ---: | --- |
| R04-A01 | Owner exclusion matching G06 | No measured human or blind-agent usability claim gates delivery. | Optional owner Windows exercise | None required | outside | Not a terminal condition. |
| R04-A02 | Retained — Operator usability `015`; Graph `013`; runtime | Fresh Overview names next action, reason, and unlocked result. | Installed empty state/router | Visible text and resulting record | 1 | No internal knowledge is required. |
| R04-A03 | Retained — Operator usability `016`; runtime `016` | Consequences and completion feedback are exact and undoable. | Commands/release UI | Preview/message versus canonical diff | 1–4 | Every consequential action reports its real scope. |
| R04-A04 | Retained — Operator usability `001`, `012`; Terminal `001`; runtime terminal `001` | A blank project is created and completed through rendered controls. | Clean installed profile → canonical repository | Ordered UI actions/reload; no project import | 1–terminal | No storage injection or preconstructed project participates. |
| R04-A05 | Retained — Graph `004`, `014`; Terminal `001` | Retail and Trade reuse shared Purchase and Pages by stable reference. | Graph/catalog → compiler | Identity equality and Where used | 1–terminal | One shared definition serves both variants. |
| R04-A06 | Replaced — Graph `005–007`, `015`; Terminal `001`; runtime graph `003`, `011` | Two documentary Flows include optional nodes and parallel branches with branch-local Page context. | Graph repository → projections | Graph/outline/checklist/export equivalence | 1–terminal | Branch documentation is complete without execution claims. |
| R04-A07 | Retained — Composition `001–005`; runtime `001` | Base/Page/Event/Profile/occurrence contracts and provenance compile for Retail/Trade. | Compiler → inspector/plan/export | Exact path/origin/schema comparison | 2–terminal | Visible and validated contracts match. |
| R04-A08 | Retained — Assignment lifecycle `008`; Canonical drafts runtime `018` | Visible Assignment rows equal compiler candidates. | Assignment view → compiler | Stable identity/count comparison | 0–2 | No legacy clone contributes. |
| R04-A09 | Replaced — Composition `006–007`, `014`; Terminal `002`; runtime | Observable route selectors yield Retail/Trade winners; indistinguishable inputs tie. | Assignment resolver → Event result/Live | Route-channel observations plus identical-input observation | 2–terminal | Flow name or predecessor never routes. |
| R04-A10 | Replaced — Composition `008`, `015`; Documentation `013`; runtime composition `004`, `011`, documentation `012` | Positive and negative Event cases show exact assertion differences and freshness identities. | Event-case editor → production validator/export | Rule matrix, expected-negative case, and current/stale records | 2–4 | Every required case has truthful status, issues, and freshness. |
| R04-A11 | Replaced — Composition `015`; runtime `011` | Empty required Event case is Blocked; optional empty case is Not run. | Event-case release gate | Required/optional empty cases | 2–4 | Empty never Passes or creates evidence. |
| R04-A12 | Retained — Composition `008`, `017`; runtime `004`, `013` | Type, enum, forbidden, required, and conditional issues show exact path/code/severity/expected/actual/origin. | Assignment → validator → Event result/UI | Independently authored expected issue matrix | 2–terminal | Every constraint produces the exact structured issue. |
| R04-A13 | Retained — Named applicability `006`, `012`; Composition `014`; runtime | Equal-priority overlap shows both names/evidence and focuses exact matcher. | Matcher analyzer → editor router | Deliberate domain tie | 2–4 | Release remains blocked until repaired or explicitly documentation-only. |
| R04-A14 | Replaced — Composition `012–015`; Documentation `003–005`, `015–020`; Manual `008`; runtime documentation `014` | Flow-scoped specification completeness reports every occurrence contract, readiness, required case, and traceability link; it makes no journey-coverage claim. | Compiler/dependency index → map/export/preflight | Retail/Trade node/requirement/Assignment/case matrix and exact nonzero counts | 2–4 | Apparently complete project cannot show zero rows; zero journey evidence is not fabricated. |
| R04-A15 | Retained with new blockers — Atomic release `002`, `008–009`; runtime `002`, `006–007` | Preflight, review, and publish consume one content-addressed result and first release shows all introduced semantics. | Compile result → review/publication | `compile:7K3M`, empty-baseline first-release diff, stale-after-edit | 4 | Unchanged input cannot pass one gate and fail another. |
| R04-A16 | Retained — Canonical drafts `017`; Graph `010`; runtime canonical `017`, graph `006` | Both cross-surface edit orders preserve every intended command; overlap resolves. | Two installed pages → repository/subscriptions | Both orders and one field conflict | 0–terminal | Each change survives exactly once. |
| R04-A17 | Replaced — Composition `017`; Documentation `014`; Terminal `001`, `003`; runtime composition `013`, documentation `013`, terminal `001`, `003` | Real Live shows the published complete Event result after explicit origin access; Test, capture, and Live share its content-addressed identity and omit temporal state. | Permission API and real page → observer → Chrome messaging → Live | Origin deny/grant plus Retail/Trade context, interaction, Purchase observations, and structural result equality | 3–terminal | Live exactly renders the published EventValidationResult and observes no page before access. |
| R04-A18 | Retained — Composition `010`; runtime `005`; Atomic release `008` | Unpublished schema/Assignment/graph changes do not alter Live. | Published-plan selection | Same observation under release before/after draft | 3–terminal | Only a newly published compile result changes behavior. |
| R04-A19 | Retained — Graph `011`, `017`; Operator usability `017`; runtime graph `008`, `012`, terminal `001` | Full workflow works at 360px and by keyboard with exact error/focus restoration. | Installed DOM/CSS/accessibility | Computed geometry and source-aware keyboard actions | every | No pointer, clipping, second scroll owner, or focus loss. |
| R04-A20 | Retained/revised — Canonical drafts `019–022`; Operator usability `021`; runtime | Saved schema, observation, Event case/Profile/manual attachment, exact field, base revision, and Back context cross surfaces. | Side panel ↔ canonical commands ↔ Builder | Both-direction continuation records | 0–terminal | No manual transfer, duplication, or capability loss. |
| R04-A21 | Retained — Composition `011`, `016`; schema builder/customization supporting scenarios; runtime composition `007`, `010` | Standalone and side panel expose the same complete rich table and nested query capabilities. | Shared production component → both installed surfaces | Same-source row/control/query/configuration/output comparison | 1–terminal | Standalone output is capability-equivalent. |

## Decisive regressions

The implementation cannot satisfy this specification if:

- graph and outline differ;
- an Event name implicitly changes context role;
- an interaction occurrence lacks a stable Page and relies on prior observation state;
- Retail and Trade duplicate the shared Purchase schema;
- editing one branch silently changes its parallel peer context;
- canvas, checklist, Confluence, or Spreadsheet drops or reinterprets topology, obligation, or multiplicity;
- optionality or repetition is authored independently on an edge and target node;
- imported artwork creates semantic records without review;
- moving a node stales schema evidence;
- a Flow label, node, predecessor, or checklist state breaks an Assignment tie;
- a captured Event is not schema-validated because an expected predecessor was absent;
- a valid eleventh payload produces a temporal-occurrence or schema issue;
- an absent parallel branch creates a runtime join or journey failure;
- manual Not checked is displayed as Passed;
- an effective schema, Assignment, issue, or provenance differs between graph, Event Test, Live, and documentation for the same release;
- Confluence and Spreadsheet outputs mix revisions, omit a required fixed column or row, expose raw IDs, or silently omit selected semantics;
- the standalone graph opens a lighter schema editor than the side panel;
- a stale side-panel or Builder save loses or misapplies a graph or schema edit; or
- Live uses draft, legacy, or temporal-Flow state rather than the published Assignment-backed validation plan.

## Settled decisions and assumptions

1. Flow is a directional documentation and schema-composition workspace.
2. A graph node is an Event occurrence referencing one reusable Event definition.
3. Context-setting role belongs to the reusable Event definition and is independent of emitted Event name; each occurrence supplies its Page binding.
4. Every interaction occurrence stores a stable resolved Page; context inheritance is an authoring aid, not runtime state.
5. Expected-next, alternative, parallel, and merge relationships are documentary topology in MVP; each node is the sole owner of obligation and multiplicity.
6. Parallel branches ship in the first release and retain branch-local authoring context.
7. Full Flow validation, temporal state, correlation, timeouts, transition enforcement, occurrence enforcement, and runtime fork/join are post-MVP.
8. Runtime routing uses current observable Assignment predicates only.
9. Every automatically validated occurrence needs one deterministic named Assignment; indistinguishable candidates tie. New occurrences default to Automatic validation required, while Documentation only is an explicit visibly labelled exception.
10. Live validates one observation against the immutable published per-event plan and makes no Flow verdict.
11. Manual testing is recorded but never inferred or simulated by Codex agents.
12. Missing manual journey evidence does not block publication by default. A project may explicitly require individual Event validation cases.
13. Sanitized Figma-exported artwork is a non-semantic backdrop in MVP, omitted from exports by default; structured Figma import and plugins are post-MVP.
14. Confluence and Spreadsheet outputs are documentation snapshots; project JSON is the round-trip format.
15. The side panel loses no current rich schema, query-builder, or table capability. The standalone Builder uses the same canonical rich editor.
16. Existing R04 canonical correctness, compilation, validation, concurrency, release isolation, guidance, responsive, keyboard, and accessibility corrections remain required.

## Non-blocking packaging decisions

These choices do not alter the specified semantics and may be settled during implementation review:

- Spreadsheet delivery may be an `.xlsx` workbook or a bundle of named spreadsheet-compatible tables, provided the required named tables and cross-links are preserved.
- Confluence delivery may use copy-ready rich HTML plus an image/SVG asset or a downloadable package; direct Confluence API publication is not required.
- The first backdrop input must support Figma-exported SVG. PNG and PDF are desirable adapters when they preserve the same non-semantic boundary.

## Approval and handoff

After explicit approval, the specifier commits only the specification changes with the required `By specifier.` byline, sends the normal file-based `git_handoff` to the coder, and preserves the task name through coder, refactorer, architect, and terminal acceptance. No coder handoff is authorized by agreement with the design discussion alone; approval must follow review of these resulting files.
