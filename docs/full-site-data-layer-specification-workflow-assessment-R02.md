# Full-Site Data-Layer Specification Workflow: Post-Implementation Assessment R02

## Executive assessment

The implementation is a meaningful information-architecture prototype, but it is **not ready for an operator to author or publish a real complex multiflow data-layer specification**.

The strongest improvement is structural: the product now exposes a dedicated full-page **Specification Builder** with visible collections for profiles, pages, page groups, events, applicability, flows, fixtures, schema drafts, assignments, and releases. Breadcrumbs, project autosave state, a three-pane layout, Undo/Redo, preflight, coverage, release, documentation, and interchange actions make the intended product model much easier to discover than the R01 side-panel-only workflow.

The live walkthrough nevertheless reached a hard boundary almost immediately. Most collections can be created only by **Kind + Name**. The operator cannot define page routes, event identities, profile composition, applicability matchers, fixture payloads or journeys, or effective validation requirements. Flow steps accept raw free-text references rather than selectable project entities. Schema drafts contain metadata only, while actual schema properties remain in the old side-panel editor.

Most critically, the two authoring surfaces are not synchronized safely. In the walkthrough I:

1. Created `Retail confirmation schema` in Specification Builder.
2. Opened it in the side-panel Schema Library.
3. Added `/ecommerce/transaction_id` through the visible property editor; the editor showed `2 of 2 properties` because it also created the `ecommerce` object.
4. Made one unrelated Specification Builder change.
5. Reloaded the side panel.
6. Reopened the Retail schema and found `0 of 0 properties`.

This is a reproduced silent overwrite of valid operator work, not a theoretical risk. It fails the R01 zero-lost-edits trust gate and is an unconditional release blocker.

There is a second release-blocking semantic split. The Specification Project resolver can select the Retail assignment from prior flow state, but the live schema validator uses a different assignment model and ignores the project `condition`. A production-module probe returned:

```text
projectRoutingWinner: Retail route
liveValidationState: Assignment error
```

Therefore the current product can record that the Retail journey won while actual Live validation still sees Retail and Trade as an equal-priority tie. Requirement profiles are likewise not compiled into the validation document. The tool currently records the intended nouns without executing the intended contract.

**Product decision:** no-go for production specification authoring, multiflow validation, or project publication. The build is useful as an internal workspace and interaction prototype only.

## Review context

| Field | Value |
| --- | --- |
| Review round | R02 post-implementation verification |
| Date | 18 July 2026 |
| Audited revision | `3e20b40fa2a3ea93326c39df42ab422f5a495907` on `master` |
| Browser | The previously opened, updated unpacked extension in the user's Chrome debug QA session |
| Browser access | Confirmed before testing: both side-panel and full-page extension targets were reachable |
| Side-panel viewport | Actual 360px extension side panel |
| Full-page viewport | Actual 2243 × 1231 CSS pixels |
| Supplementary responsive widths | Emulated 720 × 1000 and 360 × 900 on the actual full-page target |
| Starting state | Two R01 schemas in the Schema Library; no Specification Project |
| Method | Greenfield authoring through rendered controls, visual screenshots, keyboard/responsive probes, reload checks, source review, and production-module probes |
| Storage seeding | None. Project state was created through the UI; no project JSON or local-storage fixture was injected |
| Evidence directory | [artifacts/schema-editor-walkthrough/R02](../artifacts/schema-editor-walkthrough/R02/) |

The in-app browser automation bootstrap was unavailable in this environment, so the walkthrough used the already-running local Chrome debug target requested by the user. This did not reduce evidence fidelity: all screenshots and interactions came from the updated unpacked extension itself.

## Scenario exercised

The walkthrough used the same decisive domain problem as R01:

- One sitewide event envelope.
- A Retail checkout flow and a Trade checkout flow.
- Both finish with `purchase` on checkout confirmation.
- Retail confirmation requires `transaction_id`, `value`, and `currency`.
- Trade confirmation additionally requires `account_id` and `purchase_order_number`.
- Retail includes a repeatable Product step and an optional Upsell branch.
- The final event should be distinguishable from prior journey state, not a required funnel marker in the final payload.
- Passing and failing fixtures, applicability analysis, coverage, and release review should prove the specification before publication.

The live project contained:

- Three profiles: Sitewide, Retail confirmation, and Trade confirmation.
- Two pages and one page group.
- Two events.
- Two named applicability sets.
- Two flows, with three Retail steps and two Trade steps.
- Two fixtures plus one temporary synchronization probe that was removed with Undo.
- Two schema drafts.
- Two assignments.

## Outcome scorecard

| Dimension | Score | Assessment |
| --- | ---: | --- |
| Initial mental model | 6/10 | The project tree and full-page workspace expose the right high-level nouns. |
| Greenfield onboarding | 3/10 | Only “Create blank project” is offered; there is no template, import-first, migration/adoption, or guided next step. |
| Requirement authoring | 2/10 | Bulk paste accepts only path and type, commits immediately, and renders no resulting property grid. |
| Page/event catalog | 1/10 | Pages, groups, and events are name-only through production UI. |
| Applicability authoring | 1/10 | Applicability sets are name-only and default to matching everything; there is no matcher editor or test bench. |
| Flow authoring | 3/10 | Ordered steps, optionality, bounds, and transition text exist, but references are raw strings and runtime semantics are incomplete. |
| Validation-schema authoring | 1/10 | Builder schemas are metadata-only; the separate editor can be silently overwritten by later builder saves. |
| Fixtures and validation | 1/10 | Fixtures are name-only and cannot contain payloads, journeys, expected winners, or expected issues. |
| Preflight and coverage | 3/10 | Simple ambiguity and fixture-status checks exist, but coverage is a flat entity-presence list and issues are not repairable in place. |
| Navigation and orientation | 4/10 | Tree, breadcrumbs, selection, and global search help; stale inspector state, UUID-heavy rows, scroll jumps, and non-opening search results undermine them. |
| Visual design | 4/10 | Consistent basic chrome and 44px controls, but weak action hierarchy, excessive empty space, a cramped inspector, and multiple scroll owners. |
| Trust and release safety | 0/10 | Cross-surface property loss was reproduced; flow routing and live validation disagree. |
| Overall production readiness | **2/10** | Appropriate only as an internal prototype until the P0 gates below pass. |

## Visual walkthrough

### 1. Enter from the existing Schema Library

The updated side panel adds **Open Specification Builder** and distinguishes documentation export from project authoring. This is a useful and understandable bridge.

However, the two existing R01 schemas remain in the old library and opening the builder offers no migration, compatibility-project adoption, or selection of the current schema/site context. The operator must create a disconnected blank project and infer how the old schemas relate to it.

Evidence: [01 — side-panel bridge and existing schemas](../artifacts/schema-editor-walkthrough/R02/01-360-schema-workspace-migrated.png).

### 2. Create a greenfield project

The creation screen asks for project name, description, and site. It is clean and low effort, but occupies a very narrow card in a full-page surface and provides only one route: **Create blank project**.

Missing start choices:

- Start from a recommended commerce template.
- Import a full-fidelity project.
- Import JSON Schema, JSON example, CSV, or spreadsheet.
- Adopt or migrate the four schemas already visible in the side panel.
- Configure Production and Staging before authoring.

Evidence: [02 — blank-project creation](../artifacts/schema-editor-walkthrough/R02/02-fullpage-create-project.png).

### 3. Orient in the empty workspace

The post-create workspace is the strongest part of the implementation:

- A persistent project tree exposes the intended domain model.
- The breadcrumb shows project and current collection/entity.
- Autosave state is visible.
- Undo, Redo, preflight, coverage, release, documentation, full-state export, standard export, and import are visible.
- Center workspace and right inspector establish a scalable desktop pattern.

The first view still has no overview, progress checklist, recommended next action, project switcher, environment selector, or explanation of how Profiles → Pages/Events → Applicability → Flows → Schemas → Assignments fit together. Every toolbar action has almost equal visual weight, while the raw draft UUID dominates the header.

Evidence: [03 — empty full-page workspace](../artifacts/schema-editor-walkthrough/R02/03-fullpage-empty-project.png).

### 4. Add the first profile and encounter a scroll jump

After the first authoring action, the workspace moved below a large blank region. The hidden project-creation screen still occupies approximately one viewport of layout because `#project-empty { display:grid }` overrides native `[hidden]` behavior in `specification-builder.css:1`.

This is not cosmetic. It causes apparent disappearance and reappearance of the working context after renders, preflight, coverage, and dialog actions. It directly increases the “where did my work go?” risk the redesign was meant to remove.

Evidence: [04 — first-action scroll/orientation jump](../artifacts/schema-editor-walkthrough/R02/04-fullpage-profile-added-scroll-jump.png).

### 5. Bulk-author the sitewide profile

The new bulk disclosure is directionally correct, but the production behavior is much smaller than its label implies:

- Input format is only `/path,type` per line.
- The textarea is approximately 134 × 45 pixels in the inspector.
- There is no staged grid.
- There are no documentation, example, Required, Forbidden, allowed-value, rule, severity, or profile-composition columns.
- There is no JSON example, JSON Schema, spreadsheet, or template import.
- **Review and commit properties** commits immediately; there is no review screen.
- After commit, the resulting requirements are not displayed as rows or a property tree.

The valid paste reported “Committed 5 properties in one transaction,” which is useful transaction feedback, but the operator cannot visually verify the saved contract.

Evidence: [05 — bulk input](../artifacts/schema-editor-walkthrough/R02/05-fullpage-bulk-property-input.png), [06 — immediate commit](../artifacts/schema-editor-walkthrough/R02/06-fullpage-bulk-properties-committed.png), [07 — three profiles with no visible requirements](../artifacts/schema-editor-walkthrough/R02/07-fullpage-three-profiles.png).

### 6. Create pages, events, and applicability

Pages, page groups, events, applicability sets, and fixtures all use the same **Kind + Name** form. Selecting `Checkout confirmation` does not reveal URL/path matching, environment, page-group membership, expected events, profiles, or applicability. Selecting `Retail purchase context` exposes no condition builder, priority, test input, candidate list, winner, or ambiguity explanation.

The inspector also leaks context across entity types:

- Selecting a Page left **Fixture** selected in the Kind field.
- The Bulk property disclosure remained visible for a Page and still contained the Trade profile paste.
- Selecting an Applicability Set showed the same stale profile content.

This makes the inspector look stateful while it is actually a collection of global forms. Operators cannot reliably tell which controls edit the selected entity.

Evidence: [08 — selected Page with name-only semantics and stale inspector](../artifacts/schema-editor-walkthrough/R02/08-fullpage-page-name-only.png), [09 — selected Applicability Set with no matcher editor](../artifacts/schema-editor-walkthrough/R02/09-fullpage-applicability-name-only.png).

### 7. Build Retail and Trade flows

The structured flow editor is a genuine improvement over hand-editing project JSON. It can append named steps, minimum/maximum occurrences, optionality, a branch label, and transition labels, then reorder or remove steps.

For the Retail flow the walkthrough added:

1. Product browsing, 1–10 occurrences.
2. Optional upsell, branch `upsell`.
3. Retail confirmation.

For Trade it added Account and Confirmation steps.

The authoring experience is still unsafe and difficult:

- Page and Event references are free-text inputs, not searchable project selectors.
- The form accepted names and nonexistent values such as `Upsell offer` without warning.
- The operator must recover raw IDs from UUID-heavy list metadata if runtime identity is expected.
- There are no Profile or Applicability Set attachments.
- There are no entry/exit conditions, timeout, correlation key, branch/join validation, or flow preview.
- Existing steps can move or be removed, but not directly edited.
- A repeatable 1–10 step is implemented as “remain until 10,” not “advance after at least 1.”
- Branch and transition values are stored but not executed by the runtime.

Visually, the entire long form and wrapped step controls are placed in a narrow inspector with its own scrollbar, while most of the center workspace is empty.

Evidence: [10 — Retail structured flow editor](../artifacts/schema-editor-walkthrough/R02/10-fullpage-retail-flow-steps.png).

### 8. Create validation-schema drafts

The Integrated schema draft form asks for Name, stable schema ID, current published revision, and description. It creates durable project rows for Retail and Trade.

It cannot author the schema itself:

- No properties.
- No required fields.
- No rules, documentation, examples, or effective profile composition.
- No link from a profile to the schema draft.
- No indication that the operator must return to the side panel to build the validation contract.

Selecting the Retail schema row continued to show the expanded Trade flow-step form, another example of inspector state bleeding between entities.

Evidence: [11 — metadata-only schema drafts and stale flow editor](../artifacts/schema-editor-walkthrough/R02/11-fullpage-schema-drafts-metadata-only.png).

### 9. Create Retail and Trade assignments

The new assignment editor improves on R01 in several ways:

- Saved assignment rows and a count are visible.
- IDs are stable.
- A pinned revision is explicit.
- Retail and Trade conditions can be represented as one required predicate plus one excluded predicate.
- Saved assignments appear in the project tree and Where-used count.

It remains a second, incompatible applicability language:

- Schema, source, and event are raw text rather than project selectors.
- The condition is hard-coded to one All + Not shape.
- It cannot reference a named Applicability Set.
- It has no host, URL, page, environment, flow, or step builder.
- Default `/funnel_id = retail` and `NOT /account_type = trade` values can be saved accidentally.
- There is no readable candidate/winner summary.

The live search test entered `retail`, but the UI still displayed `2 assignments` and both Retail and Trade rows. This violates count/search truthfulness.

Evidence: [12 — two assignment drafts](../artifacts/schema-editor-walkthrough/R02/12-fullpage-retail-trade-assignments.png), [13 — `retail` search still showing two rows](../artifacts/schema-editor-walkthrough/R02/13-fullpage-assignment-search.png).

### 10. Run preflight

Preflight correctly found a tie between the two empty, match-all Applicability Sets and blocked the two name-only fixtures whose default expected outcome was Pass. This proves there is a useful foundation for release gating.

The result also exposes the circular authoring trap:

- The ambiguity is real because both name-only sets default to empty `All` conditions.
- There is no UI in which to repair either matcher.
- The fixture failures cannot be repaired because there is no payload, journey, profile, expected-winner, or expected-issue editor.
- Issues are plain text rather than field-level links.
- Missing page routes, event identities, dangling flow references, empty schema documents, absent profile-to-schema composition, and disconnected live validation are not reported.

The hidden-creation-screen bug is especially visible here: the preflight content appears beneath the old Create blank project form and a large blank region.

Evidence: [14 — three preflight blockers beneath displaced workspace](../artifacts/schema-editor-walkthrough/R02/14-fullpage-preflight-result.png).

### 11. Inspect coverage

Coverage renders 16 rows and labels the result as bounded overscan. It is not a specification coverage matrix. Every non-empty named entity is effectively marked Covered, including Pages that have no route, Events that have no event name/source, Flows containing raw or nonexistent references, and metadata-only schemas.

It does not answer the operator's actual questions:

- Which Page × Event × Flow-step combinations are covered?
- Which effective requirements apply?
- Which profile introduced each requirement?
- Which applicability candidates matched and which won?
- Which fixture proves the route and contract?
- Which coverage gaps are waived?

Evidence: [15 — flat entity-presence coverage marked Covered](../artifacts/schema-editor-walkthrough/R02/15-fullpage-coverage-matrix.png).

### 12. Generate documentation

The documentation dialog is clearly labelled, gives field/include choices, previews output, and separates copying from closing. Those are good improvements.

With Requirement provenance, Where used, Applicability, Flows, Fixtures, and Release metadata all checked, the preview still contained only profile requirement rows. The Applicability, Flows, and Fixtures toggles suppress omission warnings; they do not add those semantics to the document. The result therefore looks more complete than it is.

Evidence: [16 — all semantic options checked, profile rows only](../artifacts/schema-editor-walkthrough/R02/16-fullpage-documentation-dialog.png).

### 13. Review publication

The release dialog correctly states that publication is blocked by three issues, and clicking the visually enabled Publish button did not bypass the block. This is positive safety behavior.

The review is too shallow for a whole-project release:

- It displays only “Publication blocked by 3 issues,” not the issues or links.
- It does not show a structured first-release diff.
- It does not show effective requirement changes, applicability/routing changes, flow changes, fixture evidence, coverage, affected consumers, or breaking changes.
- Publish looks enabled even though it cannot succeed.
- The Releases tree item has no working view handler.

Evidence: [17 — blocked release review](../artifacts/schema-editor-walkthrough/R02/17-fullpage-release-review.png), [18 — Publish attempt remains blocked](../artifacts/schema-editor-walkthrough/R02/18-fullpage-release-blocked-attempt.png).

### 14. Responsive and keyboard pass

At 720px and 360px the desktop columns become a long vertical document, but both navigation and inspector retain their own `max-height:35vh; overflow:auto`. The result has multiple visible vertical scrollbars and three separate scroll owners. At 360px the operator sees the tree, then toolbar, then rows; the selected entity inspector is below the fold and detached from its context.

Positive findings:

- No horizontal page overflow was observed in the reviewed states.
- Controls generally meet the 44px target.
- Labels wrap rather than clip.

Negative findings:

- Tree categories are independent buttons, not a keyboard-operable tree/listbox.
- Clicking a category moves focus to the workspace; ArrowDown then does not navigate the next category.
- Generic disclosure names do not include the selected entity.
- Search, expanded disclosures, scroll state, and inspector position are not restored.
- Selecting a flow or schema can leave unrelated disclosures expanded.
- Publish-and-close focus handling is unsafe in source because it can target a hidden workspace control.

Evidence: [19 — 720px multiple scroll regions](../artifacts/schema-editor-walkthrough/R02/19-emulated-720-flow-workspace.png), [20 — 360px stacked tree/toolbar/workspace](../artifacts/schema-editor-walkthrough/R02/20-emulated-360-flow-workspace.png).

### 15. Search and exact-source navigation

Global search found both profiles containing `/ecommerce/value`, which is useful. The result is entity-level only: it does not show the exact property, origins, consumers, or releases. Clicking `Retail confirmation requirements` leaves the operator in the same search result view rather than opening that profile/property. This fails the R01 “preflight/search to exact field within two actions” goal.

Evidence: [21 — property search finds two owning profiles](../artifacts/schema-editor-walkthrough/R02/21-fullpage-global-property-search.png), [22 — clicking a result does not open its source](../artifacts/schema-editor-walkthrough/R02/22-global-search-result-does-not-open.png).

### 16. Verify persistence and the schema-authoring bridge

Project collection counts survived a full builder reload, which is an important positive result.

The schema bridge is not understandable or safe:

1. Before reloading the side panel, it still showed only the two old schemas.
2. After reloading, the two project schema drafts appeared, so synchronization is neither immediate nor explained.
3. Opening Retail in the side-panel editor showed a description but `0 of 0 properties` and no profile-derived requirements.
4. Adding `/ecommerce/transaction_id` through visible controls created an object parent and showed `2 of 2 properties`.
5. One unrelated builder transaction synchronized the project's stale empty schema over the side-panel library copy.
6. After reload the editor returned to `0 of 0 properties`.

This is the decisive trust failure of the round.

Evidence: [23 — library before side-panel reload](../artifacts/schema-editor-walkthrough/R02/23-sidepanel-schema-library-after-builder.png), [24 — project drafts appear after reload](../artifacts/schema-editor-walkthrough/R02/24-sidepanel-schema-library-after-reload.png), [25 — project schema opened in the old editor](../artifacts/schema-editor-walkthrough/R02/25-sidepanel-retail-schema-editor-empty.png), [26 — empty validation contract](../artifacts/schema-editor-walkthrough/R02/26-sidepanel-retail-schema-editor-controls.png), [27 — property successfully added](../artifacts/schema-editor-walkthrough/R02/27-sidepanel-retail-schema-property-added.png), [28 — property silently overwritten after unrelated builder save](../artifacts/schema-editor-walkthrough/R02/28-sidepanel-cross-surface-property-overwritten.png).

## Decisive acceptance result

| R01 criterion | Result | Reason |
| --- | --- | --- |
| Define shared sitewide page/event envelope | Partial | Profile paths/types can be stored, but Required/rules/docs/examples and event/page linkage cannot be authored. |
| Define Retail and Trade flows sharing Purchase and confirmation URL | Partial | Two named flows and raw steps can be stored; URL/event semantics and stable references cannot be configured through UI. |
| Retail requires transaction ID, value, currency | Failed | Profiles cannot mark fields Required and are not compiled into the validation schema. |
| Trade additionally requires account and PO number | Failed | Same gap; the Trade profile is a detached path/type list. |
| Prior flow state distinguishes markerless final events | Failed end-to-end | Project routing can record different winners, but Live validation ignores that condition and returns an assignment error/tie. |
| Optional Retail upsell and repeatable Product step | Partial/incorrect | UI stores these values; runtime ignores branch/transition and treats max as the exact count before advancing. |
| See effective requirement, origin, winner, and flow coverage | Failed | No effective contract view; coverage is a flat entity list. |
| Detect an ambiguous matcher before publication | Partial | Empty match-all sets tie and preflight blocks, but the matcher cannot be authored or repaired. |
| Validate passing/failing event and journey fixtures | Failed | Fixture UI creates only a name; the runner does not execute journeys. |
| Publish/export/reload complete stable semantics | Failed | Project counts persist and raw full-state export exists, but release is blocked and schema edits can be overwritten. |
| Recover name/description/properties after reload | Failed | Cross-surface property loss was reproduced. |
| Paste 100 properties, review errors, commit/undo once | Failed | Valid rows commit immediately; no staged review or property grid. |
| Apply Required to a multi-selection once | Failed | No multi-select or Required authoring UI. |
| Preflight issue opens exact field in ≤2 actions | Failed | Issues are plain text and affected entity editors do not exist. |
| Property search shows all users/releases | Failed | Search shows owning profile rows only and result click does not open the property. |
| Complete core workflow keyboard-only | Failed | Missing semantic editors make completion impossible; tree arrow navigation also fails. |

## R01 recommendation verification

| Recommendation | Status | Post-implementation finding |
| --- | --- | --- |
| DLSP-01 — State integrity and truthful UI | **Failed / P0** | Side-panel schema properties are silently overwritten by later project saves; assignment search/count also disagrees. Original legacy draft/publication defects remain in source. |
| DLSP-02 — Full-page Specification Project workspace | **Partial** | The shell, tree, breadcrumb, inspector, draft state, and actions exist. Onboarding, context restoration, project/environment management, Releases navigation, and hidden-layout behavior are incomplete. |
| DLSP-03 — First-class pages, applicability, flows, steps, releases | **Partial primitive** | Collections exist, but most entities are name-only property bags. Flow fields are stored more deeply than they execute. |
| DLSP-04 — Ordered profile composition | **Model-only / failed UX** | A composition function exists, but no production editor or effective/provenance view exists and Live validation does not consume it. |
| DLSP-05 — Durable drafts and atomic releases | **Partial** | Project transactions/reload work, but complete metadata is not versioned, first-release review is shallow, and cross-surface authoring loses work. |
| DLSP-06 — Bulk-first authoring | **Failed** | Only a tiny `/path,type` textarea exists; no staging, grid, imports, multi-selection, documentation, or Required action. |
| DLSP-07 — Guided matcher builder and routing analysis | **Failed** | Named sets exist without a production matcher editor. Assignments expose one fixed raw All + Not form. |
| DLSP-08 — Fixtures, coverage, and preflight | **Failed** | Fixture semantics cannot be authored; coverage is entity presence; preflight is narrow and not field-navigable. |
| DLSP-09 — Navigation, search, provenance, and impact | **Partial** | Tree/breadcrumb/search exist, but results do not open exact sources and no true property provenance/impact view is available. |
| DLSP-10 — Full-fidelity interchange and staged diff/merge | **Partial** | Raw project-state round-trip exists. Semantic validation, migration UI, graph-wide review, and complete standard manifest do not. |
| DLSP-11 — Rename/rescope Build specification | **Partial** | Workspace naming and documentation export are separated, but legacy Build specification remains and documentation toggles overstate included semantics. |
| DLSP-12 — Responsive and accessible system | **Failed** | Basic control sizing and wrapping are good; nested scroll owners, context loss, tree keyboard behavior, stale disclosures, and focus restoration fail the intended workflow. |

## Implementation and evidence discrepancy

The repository's R03 report and traceability matrix say DLSP-01 through DLSP-12 and every decisive criterion are implemented and verified. That conclusion is not supported by the live product path.

Why the automated evidence did not expose the gaps:

- The production Add entity form captures only kind and name (`specification-builder.html:12`, `src/specification-builder.ts:86`). Tests directly construct richer model objects that operators cannot create.
- The browser test reads generated IDs from storage before entering raw step/assignment references; an operator has no equivalent workflow.
- The feature adapter routes many detailed scenarios through a shared model test and shared browser observation rather than exercising the individual behavior.
- The decisive feature's mutation manifest currently records `"scenarios":[]` even though the document contains scenarios.
- The temporal runtime test asserts distinct routing winner IDs but never runs the final payload through `validateEvent` with the two schemas.
- The “bounded virtualization” implementation is a hard first-40 slice; later rows have no paging/windowing path.

Focused suites still pass:

- `node test/data-layer-specification-project-test.mjs`
- `node test/data-layer-specification-runtime-test.mjs`
- `node test/data-layer-specification-project-property-test.mjs` — 200 generated cases

These passes show that useful model primitives exist. They do not prove that a greenfield operator can author the model through the UI or that the live validator consumes it.

## Root causes

### 1. The UI exposes collections instead of complete domain editors

`ProjectEntity` is a generic `{ id, name, ... }` object and the inspector captures only kind/name for most entities. The model and tests can create rich pages, events, applicability sets, profiles, flows, and fixtures, but the production UI cannot.

### 2. There are two applicability/assignment systems

Project assignments store a generic `condition` (`src/data-layer-specification-project.ts:162–168`). The live `SchemaAssignment` type has no matching field (`src/data-layer-schema-verification.ts:50–66`), and its resolver considers source, event, URL, and legacy data conditions (`src/data-layer-schema-verification.ts:326–364`). Flow-routing evidence is written to separate storage and never consumed by Live validation.

### 3. There are two schema sources of truth

Specification Builder synchronizes project schemas one way into the old library. The side-panel editor does not write schema changes back into Specification Project storage. Any later project persist can replace the edited library schema with the stale project copy.

### 4. Profiles are documentation data, not compiled validation contracts

`composeRequirementProfiles` is used by the simplified fixture path, not by page/event resolution or Live validation. A profile saying `/account_id` is required does not make the Trade validation document require it.

### 5. Preflight and coverage use simplified proxies

Coverage considers an entity present/covered rather than proving Page × Event × Flow-step × effective requirement. Preflight does not share the Live validator/resolver, so it cannot guarantee runtime behavior.

## Recommended correction plan

### P0 — Stop data loss and misleading publication

1. Establish one canonical schema store. Either edit project schema drafts directly from both surfaces or remove side-panel structural editing for project-owned schemas.
2. Add optimistic revision checks so stale builder state can never overwrite a newer schema revision.
3. On storage conflict, preserve both drafts and show an explicit merge/reload choice.
4. Fix the hidden-layout rule with `#project-empty[hidden] { display:none; }` or a global reliable hidden contract.
5. Mark Specification Builder as Preview and disable production release for flow-dependent assignments until resolver parity is proven.
6. Correct the R03/traceability status so unimplemented UI outcomes are not presented as passed.

P0 exit criteria:

- Zero lost edits across navigation, reload, cross-surface editing, autosave failure, and concurrent stale-state tests.
- Side panel and full-page editor show the same schema revision and requirements immediately.
- An unrelated project save never changes a schema document.

### P0 — Unify routing and actual validation

1. Make assignments reference a named `applicabilitySetId` rather than embedding a second condition language.
2. Evaluate host/path/query/hash, source/event/target, payload/raw input, environment, active flow ID, and active step ID in one canonical resolver.
3. Pass stable flow/step context directly into `validateEvent`; do not use a side-channel evidence record as the source of truth.
4. Use the same resolver for previews, fixtures, preflight, release, and Live capture.
5. Return one explainable result: candidates, rejected reasons, winner, ties, shadowed fallback, effective profiles, and effective schema.
6. Use stable flow IDs, never lower-cased flow names, as routing identity.

P0 exit criterion: Retail and Trade share source, event, URL, and markerless final payload; their prior journeys produce different **actual Live validation schemas and results**, not merely different routing records.

### P0 — Add complete contextual editors

| Entity | Minimum production editor |
| --- | --- |
| Profile | Wide property grid; Type, Required, Forbidden, allowed values, rules, docs, examples; ordered composition; effective/origin view |
| Page | Host/path/query/SPA matching, page groups, expected events, profiles, applicability, environment |
| Event | Source, canonical event name, target, profiles, occurrence policy |
| Applicability | Nested All/Any/Not builder, named predicates, priority, test context, candidate/winner preview |
| Flow | Searchable stable Page/Event selectors, profile/applicability attachments, editable/reorderable steps, entry/exit, branch/join, timeout/correlation |
| Fixture | Payload or ordered journey, context, expected winner/step/schema/issues, required/optional policy |
| Schema | Properties and rules compiled from profiles, local overrides, effective document, revision history |
| Assignment | Schema/Event/Applicability selectors, readable summary, conflict preview, version policy |

Every entity also needs Edit, Duplicate, Delete, dependency-aware rename, Where used, and field-level validation.

### P0 — Deliver real bulk authoring

1. Accept JSON example, JSON Schema, CSV/spreadsheet, template, and paste.
2. Stage candidate rows in a full-width grid before modifying the project.
3. Include Path, Type, Required, Forbidden, Allowed values, Description, Example, Rule, Severity, and Origin.
4. Normalize paths and show per-cell parse/semantic errors.
5. Support multi-select and one-action Required/rule/documentation changes.
6. Commit as one transaction and Undo as one transaction.
7. Immediately show the effective requirement tree and provenance.

### P0 — Make fixtures, preflight, coverage, and release use production semantics

1. Execute fixture journeys through the same flow automaton, resolver, profile compiler, and validator used by Live capture.
2. Implement correct minimum/maximum behavior, transitions, branches, joins, exit, timeout, failure, and multiple-active-flow ambiguity.
3. Make preflight detect missing/dangling references, unreachable required branches, profile conflicts, unpinned revisions, uncovered contexts, resolver disagreement, and unexpected fixture outcomes.
4. Replace entity-presence coverage with Page/Event/Flow-step × effective-requirement coverage including origin, winner, fixture result, and waiver.
5. Make every issue a deep link to an editable field in at most two actions.
6. Show a structured whole-project release diff and affected consumers before atomic publication.

### P1 — Improve learnability and look-and-feel

1. Add a start screen with Template, Import project, JSON/Schema/spreadsheet, and Blank project paths.
2. Add a project Overview with a recommended sequence and progress: Context → Requirements → Applicability → Flows → Fixtures → Preflight → Release.
3. Group toolbar actions into Author, Verify, Publish, and Import/Export; use one clear primary action per state.
4. Keep project/environment/draft or release, selected flow/step/profile, and validation state persistently visible.
5. Use the center workspace for wide grids and editors; keep the inspector for concise selected-item metadata and actions.
6. Hide irrelevant disclosures and reset form state when entity kind changes.
7. Replace raw UUID-heavy list text with human names and compact ID copy affordances.
8. Use status chips for Draft, Saved, Blocked, Covered, Missing, Ambiguous, and Published.
9. Preserve selection, search, expanded state, active view, and scroll across render/reload.
10. At narrow widths, show one active pane with explicit Tree / Editor / Inspector navigation and one scroll owner.

### P1 — Repair keyboard and accessibility behavior

1. Implement tree/listbox ArrowUp/ArrowDown/Home/End semantics or use a simpler accessible list of links.
2. Include selected entity names in disclosure headings.
3. Trap and restore dialog focus, including Escape/cancel and Publish-and-close.
4. On validation failure, focus the exact field and announce one concise message.
5. Make flow-step reorder/edit/remove and bulk-grid selection fully keyboard-operable.
6. Run the complete decisive workflow with keyboard and screen-reader output at desktop and narrow widths.

## Release go/no-go rubric

| Gate | Required proof | Current result |
| --- | --- | --- |
| Temporal correctness | Markerless Retail and Trade journeys select different schemas in the actual Live validation result | **Fail** |
| Complete UI authoring | Entire decisive project can be created from blank through visible controls, without storage edits, raw IDs, or project JSON | **Fail** |
| Resolver parity | Fixture, preflight, release, and Live validation return identical candidate/winner evidence | **Fail** |
| Contract compilation | Retail and Trade profiles produce the correct effective validation documents with full provenance | **Fail** |
| Trust and durability | No edit is lost across rerender, reload, cross-surface edit, or failed save | **Fail** |
| Ambiguity safety | A deliberate tie blocks release and a visible matcher repair clears it | **Partial; repair impossible** |
| Bulk throughput | 100 rows previewed, corrected, multi-marked Required, committed, and undone in under two minutes | **Fail** |
| Coverage/navigation | Every release-scoped page/event/step is covered or waived; each issue opens its exact field | **Fail** |
| Atomic portability | Publish, export, fresh import, and reload retain IDs, order, flows, assignments, fixtures, revisions, and validation results | **Not established** |
| Accessibility/comprehension | Keyboard-only completion; operator can always state project, flow, step, profile, and draft/release state | **Fail** |
| Verification credibility | Actual built-extension tests exercise non-empty scenarios and visible production validation; removing flow evaluation fails them | **Fail** |

Any failure in temporal correctness, complete UI authoring, resolver parity, contract compilation, trust, ambiguity safety, atomic portability, or verification credibility is an unconditional no-go.

## What should be retained

The correction should build on, not discard, these implementation gains:

- The full-page workspace concept.
- The visible project collections and stable IDs.
- Project autosave, transactions, Undo/Redo, and reload persistence.
- Breadcrumb and selected-row treatment.
- The basic structured linear step editor.
- Clear separation between documentation export and full-state interchange.
- Preflight/release blocking plumbing.
- Pinned revision and stable assignment identity concepts.
- 44px control sizing and lack of horizontal overflow in reviewed states.
- Full-state JSON backup as an internal recovery format.

## Evidence index

| # | Evidence | Demonstrates |
| ---: | --- | --- |
| 01 | [Side-panel builder bridge](../artifacts/schema-editor-walkthrough/R02/01-360-schema-workspace-migrated.png) | Existing library and new full-page entry point |
| 02 | [Create blank project](../artifacts/schema-editor-walkthrough/R02/02-fullpage-create-project.png) | Minimal greenfield start |
| 03 | [Empty workspace](../artifacts/schema-editor-walkthrough/R02/03-fullpage-empty-project.png) | New tree/workspace/inspector shell |
| 04 | [First-action scroll jump](../artifacts/schema-editor-walkthrough/R02/04-fullpage-profile-added-scroll-jump.png) | Hidden creation screen still occupying layout |
| 05 | [Bulk input](../artifacts/schema-editor-walkthrough/R02/05-fullpage-bulk-property-input.png) | Tiny path/type textarea |
| 06 | [Bulk commit](../artifacts/schema-editor-walkthrough/R02/06-fullpage-bulk-properties-committed.png) | Immediate commit rather than staged review |
| 07 | [Three profiles](../artifacts/schema-editor-walkthrough/R02/07-fullpage-three-profiles.png) | No rendered requirement grid |
| 08 | [Selected Page](../artifacts/schema-editor-walkthrough/R02/08-fullpage-page-name-only.png) | Name-only semantics and stale inspector state |
| 09 | [Selected Applicability Set](../artifacts/schema-editor-walkthrough/R02/09-fullpage-applicability-name-only.png) | No matcher editor |
| 10 | [Retail flow](../artifacts/schema-editor-walkthrough/R02/10-fullpage-retail-flow-steps.png) | Structured steps in cramped raw-reference form |
| 11 | [Schema drafts](../artifacts/schema-editor-walkthrough/R02/11-fullpage-schema-drafts-metadata-only.png) | Metadata-only schema rows and inspector bleed |
| 12 | [Retail/Trade assignments](../artifacts/schema-editor-walkthrough/R02/12-fullpage-retail-trade-assignments.png) | Pinned drafts and fixed raw condition form |
| 13 | [Assignment search](../artifacts/schema-editor-walkthrough/R02/13-fullpage-assignment-search.png) | Query/count/results disagree |
| 14 | [Preflight](../artifacts/schema-editor-walkthrough/R02/14-fullpage-preflight-result.png) | Three blockers and severe layout displacement |
| 15 | [Coverage](../artifacts/schema-editor-walkthrough/R02/15-fullpage-coverage-matrix.png) | Flat entity-presence coverage |
| 16 | [Documentation dialog](../artifacts/schema-editor-walkthrough/R02/16-fullpage-documentation-dialog.png) | Checked semantics absent from preview |
| 17 | [Release review](../artifacts/schema-editor-walkthrough/R02/17-fullpage-release-review.png) | Shallow blocker summary |
| 18 | [Blocked Publish attempt](../artifacts/schema-editor-walkthrough/R02/18-fullpage-release-blocked-attempt.png) | Release gate holds despite active-looking action |
| 19 | [720px flow workspace](../artifacts/schema-editor-walkthrough/R02/19-emulated-720-flow-workspace.png) | Stacked panes and multiple scroll owners |
| 20 | [360px flow workspace](../artifacts/schema-editor-walkthrough/R02/20-emulated-360-flow-workspace.png) | Context split across long vertical layout |
| 21 | [Global property search](../artifacts/schema-editor-walkthrough/R02/21-fullpage-global-property-search.png) | Entity-level property matches |
| 22 | [Search result does not open](../artifacts/schema-editor-walkthrough/R02/22-global-search-result-does-not-open.png) | Exact-source navigation failure |
| 23 | [Library before reload](../artifacts/schema-editor-walkthrough/R02/23-sidepanel-schema-library-after-builder.png) | Project schemas not immediately visible |
| 24 | [Library after reload](../artifacts/schema-editor-walkthrough/R02/24-sidepanel-schema-library-after-reload.png) | Project schemas appear after reload |
| 25 | [Retail schema opened](../artifacts/schema-editor-walkthrough/R02/25-sidepanel-retail-schema-editor-empty.png) | Return to old side-panel editor |
| 26 | [Empty schema contract](../artifacts/schema-editor-walkthrough/R02/26-sidepanel-retail-schema-editor-controls.png) | Profile requirements did not compile into schema |
| 27 | [Property added](../artifacts/schema-editor-walkthrough/R02/27-sidepanel-retail-schema-property-added.png) | Successful visible side-panel edit |
| 28 | [Property overwritten](../artifacts/schema-editor-walkthrough/R02/28-sidepanel-cross-surface-property-overwritten.png) | Reproduced silent data loss after builder save |

## Final recommendation

Keep the Specification Builder shell, but do not continue polishing it as if the workflow is complete. The next implementation cycle should first unify storage, requirement compilation, applicability, flow state, fixtures, preflight, release, and Live validation behind one canonical project compiler/runtime. Then expose that model through real contextual editors and a full-width bulk grid.

Only after the decisive Retail/Trade project can be created entirely through visible controls, validated by the same engine used in Live capture, published atomically, exported/imported semantically, and edited without loss should the tool be presented as a production Specification Builder.
