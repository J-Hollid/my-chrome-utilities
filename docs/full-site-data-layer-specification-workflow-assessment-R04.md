# Full-Site Data-Layer Specification Workflow Assessment: R04

## Executive assessment

R04 is the first round in this correction sequence performed against the installed `chrome-extension://` pages in the existing Chrome QA window. The implementation is a meaningful improvement over R02: the blank-page layout defect is fixed, the desktop editor has a legible three-pane structure, most entities have contextual centre-pane editors, relationship controls commonly show human names, and small bulk imports now have a real stage/repair/commit transaction with one-step Undo and Redo.

The interface is also not yet self-guiding enough for its intended operator. This walkthrough could reconstruct the intended sequence and distinguish legacy state from production state because the reviewer could inspect source code, persisted objects, and runtime modules. A real operator will not have that advantage. The UI presents many unexplained concepts and controls, does not establish a recommended creation order, rarely states prerequisites or downstream effects, and often gives no clear account of what Save, Run, Publish, or a relationship change actually altered. That makes operator guidance and interaction explainability a separate adoption blocker, even after the execution defects are corrected.

The full-site, multi-flow authoring outcome is nevertheless **not release-ready**. An operator can now understand more of the project graph, but cannot reliably produce the graph that the production evaluator consumes. The rendered assignment screens edit legacy schema-owned rows while `collections.assignments` remains empty; a normal parent requirement followed by child requirements crashes compilation; human-readable flow names do not resolve in applicability rules; several advertised operators and flow transitions are not executable; empty fixtures prove nothing yet pass; coverage can show zero cells; release review can enable Publish and then fail under a different gate; and a stale side-panel property edit silently removed a newer Builder profile composition.

The recommended product decision is **no-go for production specification authoring**. Keep the current UI foundation, but treat the canonical model/evaluator/persistence boundary and truthful assurance workflow as the next correction program—not as polish.

## Review context

| Field | Value |
| --- | --- |
| Review round | R04 actual-extension walkthrough |
| Date | 18 July 2026 |
| Audited revision | `94a73ff` |
| Browser boundary | Installed extension at `chrome-extension://agfocmipigpofpagbcllmdmjdoimibgj/` |
| Project | Existing migrated QA project, `Multiflow commerce data layer` |
| Final QA state | Saved revision 22; no published release; Retail profile composition restored; `/r04_side_marker` retained |
| Desktop viewport | 2224 × 1231 CSS px |
| Responsive viewports | 720 × 1000 and 360 × 900 CSS px |
| Evidence | [R04 visual walkthrough](../artifacts/schema-editor-walkthrough/R04/README.md) |
| Previous boundary | R03 was an HTTP component harness and explicitly left this actual-extension run outstanding |

The existing QA project was used as both a migration and authoring case. A clean-start project could not be exercised without deleting the persisted QA project because the loaded workspace exposes no visible project switcher, New Project action, or return to onboarding.

The side-panel Live target picker required persistent all-tabs browsing permission. That permission was not changed. A local safe commerce page was opened successfully, but the picker showed `0 matching targets`, so no page event was emitted through the observer in this round. This is recorded as a boundary limitation, not a passed Live result. Source and production-module checks were used to assess the remaining Live split.

## Outcome at a glance

| Operator need | R04 result | Assessment |
| --- | --- | --- |
| Understand the project structure | Improved | Clear categories, counts, breadcrumbs, selected rows, and contextual editors establish a useful foundation. |
| Know what to do next and predict an action's impact | Failed | There is no guided authoring sequence, concept glossary, prerequisite guidance, dependency preview, or consistent post-action explanation. Source inspection was required to understand several controls. |
| Define reusable requirements | Partially usable | Full-width rows and small bulk staging work, but effective/provenance claims are not rendered and normal parent/child contracts can crash compilation. |
| Define pages and events once for multiple funnels | Blocked | Applicability is a compulsory single select with no empty choice; saving a generic Page or Event silently selects Retail. |
| Define Retail and Trade routing without IDs | Blocked | A typed `Retail checkout` flow value persists but does not match runtime `flow:<uuid>`. |
| Define executable flow transitions | Blocked | Selector-based steps are clearer, but stale step controls can target another flow and the saved transition shape is not the runtime transition shape. |
| Create production assignments | Blocked | Two rows are displayed, but the production evaluator's assignment collection remains empty and contextual Save does not populate it. |
| Prove behavior with fixtures | Blocked | Fixtures are raw JSON with no Run action; empty observations and `{}` expectations pass. |
| Trust preflight, coverage, and release | Blocked | Silent compiler failure, false-ready preflight, zero-cell coverage, zero-change first release, and disagreement between review and publication were reproduced. |
| Work safely across Builder and side panel | Failed | A stale side-panel save removed newer Builder profile links without conflict. |
| Use the tool at narrow widths or by keyboard | Failed | All panes stack, multiple scroll owners remain, the requirement table is clipped, and tree arrow navigation is absent. |

## Visual operator walkthrough

### 1. Re-entering the existing project

The updated Builder opens directly into a coherent full-height workspace. The prior hidden creation screen no longer occupies layout space, the document fits the desktop viewport, and the project tree, working area, and inspector are immediately recognisable.

Evidence: [updated desktop workspace](../artifacts/schema-editor-walkthrough/R04/01-fullpage-updated-existing-project.png).

What works:

- Project name, environment, draft identity, saved revision, entity categories, counts, and breadcrumb are visible.
- The selected collection and entity have strong enough visual outlines.
- The centre pane has enough room for contextual authoring.

Remaining friction:

- There is no project overview, completion summary, graph health, or recommended next action.
- The toolbar gives Undo, preflight, coverage, documentation, publish, two export modes, and import nearly equal visual weight.
- The inspector keeps global Add Entity, Flow Steps, Schema Draft, Assignment, and Bulk disclosures available regardless of the selected entity. This creates two competing authoring locations.
- No visible project switcher or New Project action exists after a project has been created.

### 2. Defining the checkout-confirmation page

Selecting Pages and then Checkout confirmation opens a real page editor with Environment, Host, Path, Query, Hash, SPA route, Page Groups, Expected Events, Profiles, and Applicability. Values saved and survived re-render and reload.

Evidence: [empty contextual page editor](../artifacts/schema-editor-walkthrough/R04/02-fullpage-page-contextual-editor.png), [completed page](../artifacts/schema-editor-walkthrough/R04/03-fullpage-page-complete.png).

The operator-facing failure is that Applicability has no empty option and supports one set only. The walkthrough explicitly cleared the selection before Save; the re-rendered Page nevertheless contained `Retail purchase context`. The same occurred for the generic Purchase Event. A shared checkout confirmation Page/Event therefore becomes Retail-specific unless the operator duplicates it, while the goal is one common event with flow-specific contracts.

Recommendation:

- Make contextual applicability optional by default and multi-valued where composition is valid.
- Separate page/event identity from assignment routing. A Page or Event should not need a funnel to exist.
- Show a readable matcher summary and a Test URL/Test observation action beside route fields.

### 3. Defining Purchase

The Event editor is easy to discover and includes Source, canonical event name, target, occurrence policy, profiles, and applicability. The walkthrough saved `event-history`, `purchase`, `payload`, and `once per flow`.

Evidence: [Purchase event editor](../artifacts/schema-editor-walkthrough/R04/04-fullpage-event-editor.png).

Source and occurrence policy are still free text, however, and authored target/occurrence/profile/applicability relationships are not consistently consumed by the compiled evaluator. The Event applicability control also forced Retail after an attempted clear.

Recommendation: make Source and occurrence policy controlled concepts with help text, validation, and a visible explanation of which downstream consumers execute each field.

### 4. Building the Retail requirement profile

The centre-pane profile grid is a real improvement. The operator can see Path, Type, Required, Forbidden, Allowed Values, Rules, Documentation, and Examples together. The walkthrough marked transaction ID, value, currency, tax, discount code, and coupon required, documented the core fields, and restricted currency to EUR/GBP.

Evidence: [profile editor](../artifacts/schema-editor-walkthrough/R04/05-fullpage-profile-editor.png).

The heading promises `Local only / Effective / Provenance`, but the grid displays only local rows. There are no origin badges, composition order, conflicts, inherited values, severities, or requirement-level issues. Allowed values, rules, and examples are unassisted JSON strings.

The new bulk path was tested with three rows including one missing path:

- Stage reported `3 staged rows · 1 fields need repair · project unchanged`.
- Commit was disabled while invalid.
- Repairing the bad path enabled Commit.
- The repair re-staged the grid and cleared earlier row selections.
- Selecting all rows, marking Required, and committing added all three in one revision.
- One Undo removed all three and one Redo restored all three.

Evidence: [invalid staged bulk input](../artifacts/schema-editor-walkthrough/R04/06-fullpage-bulk-invalid-stage.png).

This is useful for tens of paths, but not yet a full-site import workflow. Only 40 staged rows render, there is no pager, exclusion action, file upload, spreadsheet workbook import, rule multi-action, or full-field repair grid. Staging is not bound to the selected profile or base revision.

### 5. Composing a schema

The Retail schema was linked to Sitewide and Retail profiles using human-readable multi-select options. The screen continued to label a raw working document as the `Compiled effective schema document`; it stayed `{ "type": "object", "properties": {} }` rather than showing the seven effective Retail requirements.

Evidence: [false compiled preview](../artifacts/schema-editor-walkthrough/R04/07-fullpage-schema-false-compiled-preview.png).

A normal contract containing `/page` followed by `/page/type`, and `/ecommerce` followed by `/ecommerce/transaction_id`, caused `requirementDocument` to access a missing `properties` object. The Run Preflight click then failed silently and left the prior workspace unchanged. To continue the walkthrough, the explicit parent rows had to be renamed to unrelated optional marker paths.

Evidence: [silent preflight crash](../artifacts/schema-editor-walkthrough/R04/15-fullpage-preflight-silent-crash.png).

This is a P0 compiler defect because explicit object parents are the natural way an operator describes a complex data layer.

Recommendation:

- Build the document through a path trie that safely merges parent and child declarations in any order.
- Render the actual compiler result, effective profile order, provenance per path, local overrides, and conflicts.
- Catch compiler exceptions at every UI action and show an exact path-level error rather than doing nothing.

### 6. Defining Retail applicability

Applicability now exposes a root All/Any/Not group and predicate rows. The walkthrough authored:

```text
All
  flowId equals Retail checkout
  eventName equals purchase
```

Evidence: [human-readable applicability rule](../artifacts/schema-editor-walkthrough/R04/08-fullpage-applicability-human-name.png).

This is what a reasonable operator would enter because the UI shows flow names everywhere else. The production evaluator compared that value strictly with `flow:3a439449-...`, rejected the candidate as `applicability did not match`, and selected no winner. The UI does not offer the required stable ID as a choice. `contains`, `glob`, and `regex` are advertised but the compiled evaluator implements only equals, not equals, and exists. Fallback is not executed. Nested groups beyond the root cannot be authored or preserved.

Recommendation:

- Replace free-text reference values with typed entity selectors and canonicalise to stable IDs on Save.
- Hide unsupported operators or implement them in the single production evaluator.
- Add an observation tester showing matching predicates, rejected predicates, candidate priorities, overlap, and final winner before Save.

### 7. Building Retail and Trade flows

The Page/Event selectors in the global Flow Steps disclosure are clearer than raw IDs. Adding a new step with Checkout confirmation and Purchase persisted valid IDs. Move Up/Down and Remove are understandable.

Evidence: [flow step editor](../artifacts/schema-editor-walkthrough/R04/09-fullpage-flow-step-editor.png).

The live walkthrough reproduced two dangerous context defects:

1. Selecting a flow did not render its existing steps. The list appeared only after adding another step.
2. Switching directly from Retail to Trade left the Retail step list and Retail Remove/Move controls visible under the Trade selection.

Evidence: [Trade selected with stale Retail steps](../artifacts/schema-editor-walkthrough/R04/10-fullpage-flow-stale-after-switch.png).

Those handlers use the newly selected global flow ID, so activating a stale control can mutate the wrong flow. Existing steps cannot be edited; the only repair was Remove and re-add. The walkthrough removed the migrated name-based steps and rebuilt a valid two-step Retail flow and one-step Trade flow through selectors.

The visible Branch field and singular `{from,to}` transition are not the runtime `transitions[]` model and are ignored by temporal execution. Correlation field is not used to derive a key. Several flow/profile/applicability fields therefore create confidence without executable behavior.

Recommendation: make the centre-pane Flow editor the sole owner of an editable ordered step list, bind it to the selected flow and revision, and share one transition type with the evaluator. A compact outline or timeline is preferable to a canvas, but it must show entry, steps, optional branches, joins, occurrence bounds, and exit as one executable graph.

### 8. Fixtures

Fixture authoring remains Context JSON, Ordered Observations JSON, Payload JSON, Expected JSON, plus free-text mode and release policy. There is no human-name journey builder, autocomplete, validation assistance, Run Fixture action, result, or actual-versus-expected diff.

Evidence: [raw fixture editor](../artifacts/schema-editor-walkthrough/R04/11-fullpage-fixture-raw-json.png).

Both named fixtures contained empty observations, `{}` payload, and `{}` expectation. Production preflight treated both as Pass. Each produced one step containing no candidates, winner, effective profiles, or issues, with zero differences. After the parent-path workaround, visible preflight declared `Ready to publish from the compiled production plan`.

Evidence: [false-ready preflight](../artifacts/schema-editor-walkthrough/R04/16-fullpage-preflight-false-ready.png).

Recommendation:

- Provide an ordered observation builder with Page/Event selectors, timestamps, correlation/session fields, and payload editor.
- Require each release-gating fixture to assert at least a winner, schema revision, active flow/step, or exact issues.
- Treat zero observations, zero assertions, and zero proving fixtures as blockers—not successes.
- Show the result inline with candidate rejection reasons and exact differences.

### 9. Assignments

The UI displays two assignments and human-readable selectors. This looks substantially better than R02, but the lifecycle boundary is still split:

- The two displayed rows live in each schema's `workingDraft.assignments`.
- `project.collections.assignments`, which `compileSpecificationProject` consumes, remained `[]`.
- The Retail contextual editor defaulted its Event select to Product viewed because the lifecycle record contains `eventName` rather than a matching `eventId`.
- Explicitly selecting Purchase and saving the complete entity did not populate or update the production assignment collection.

Evidence: [assignment editor](../artifacts/schema-editor-walkthrough/R04/18-fullpage-assignment-editor.png).

Consequences:

- Compiled evaluation has no candidates.
- Coverage showed `0–0 of 0` cells despite profiles, flows, schemas, two displayed assignment rows, and two passing fixtures.
- The side panel labels both project schemas `unassigned`.

Evidence: [zero-cell coverage](../artifacts/schema-editor-walkthrough/R04/17-fullpage-coverage-zero-despite-contract.png).

Recommendation: migrate all lifecycle assignments once into `collections.assignments`, make all rendered surfaces read that collection, and delete the compatibility write path from operator-facing authoring. The term `Truthful assignments` should be withheld until this is complete.

### 10. Preflight, coverage, and release

Before flow repair, preflight correctly found ten dangling name references. Clicking the first blocker changed the URL to the flow-step ID and `pageId`, but retained the Fixtures collection, opened no contextual editor, focused no field, and left a raw flow-step ID in the breadcrumb.

Evidence: [dead preflight deep link](../artifacts/schema-editor-walkthrough/R04/12-fullpage-preflight-dead-link.png), [blocked coverage](../artifacts/schema-editor-walkthrough/R04/13-fullpage-coverage-blocked.png).

After the compiler workaround, empty fixtures and zero production assignments produced false readiness and zero coverage. Release review then said:

```text
Release 1: 0 structured changes; coverage, ambiguity,
affected consumers, and breaking changes reviewed.
```

Publish and Publish and Close were enabled. Activating Publish failed with `Publication failed; the prior canonical project bytes remain authoritative` because release review and publication use different preflight implementations.

Evidence: [enabled false-ready release](../artifacts/schema-editor-walkthrough/R04/19-fullpage-release-false-ready.png), [gate disagreement after confirmation](../artifacts/schema-editor-walkthrough/R04/20-fullpage-release-gate-disagreement.png).

The Releases tree row has no navigation handler: clicking `Releases (0)` leaves Schema drafts selected.

Recommendation: one compiled assurance result must drive the preflight screen, coverage, enabled state, confirmation, stored executable plan, and Live runtime. A first release should compare against an empty project and enumerate every added semantic entity, not report zero changes.

### 11. Search and reload

Searching `/ecommerce/value` returned Retail and Trade profiles and clicking Retail opened the correct profile. This is a useful improvement. It did not update the stale URL, identify the matching requirement path, scroll to that row, or focus the path/field. Reload preserved the selected profile and authored values, but also preserved the unrelated stale preflight query string.

Recommendation: search results should carry entity kind, entity ID, sub-entity/path, field, and match excerpt; opening a result should update navigation state and focus the exact control.

### 12. Cross-surface durability

This round reproduced actual data loss across the two installed extension pages:

1. Builder linked Sitewide and Retail profiles to Retail confirmation schema.
2. The already-open side panel still held its startup schema snapshot.
3. Adding `/r04_side_marker` in the side panel committed revision 21 successfully.
4. Reloading Builder showed the marker but zero selected profiles.

Evidence: [side-panel property editor](../artifacts/schema-editor-walkthrough/R04/24-side-panel-retail-property.png), [profile composition lost in Builder](../artifacts/schema-editor-walkthrough/R04/23-fullpage-cross-surface-profile-loss.png).

The reverse direction worked after reload: Builder restored both profile links while preserving the side-panel marker, and a subsequent side-panel reload still showed the marker. This does not mitigate the failed ordering. Side-panel persistence rereads the newest canonical envelope but applies every schema from its stale in-memory library, then commits against the newest revision. There is no storage listener, per-schema base revision, patch command, or conflict review.

Recommendation:

- Persist a narrowly scoped command such as `update schemaDraft X workingDocument from base revision N`.
- Reject stale base revisions and open the existing conflict review with field-level choices.
- Subscribe both surfaces to canonical storage changes and mark stale editors before Save.
- Never replace all project schemas from a side-panel snapshot.

### 13. Responsive and keyboard walkthrough

At 720px the page becomes 2233px tall: a 350px internally scrolling tree, a 1483px workspace, and a 350px internally scrolling inspector stack inside the body scroll. At 360px the page is 2325px tall with the same stacked model.

Evidence: [720px full page](../artifacts/schema-editor-walkthrough/R04/21-fullpage-responsive-720.png), [360px full page](../artifacts/schema-editor-walkthrough/R04/22-fullpage-responsive-360.png).

At 360px the profile editor was 315px wide while its table was 840px wide and the editor's scroll width was 854px. Only Path, Type, and Required were visible; Forbidden, Allowed Values, Rules, Documentation, and Examples were clipped with no usable horizontal scroll owner. Control height is generally a good 44px, but that does not make the layout operable.

Activating a project-tree category moves focus into the workspace. Arrow Down then does not move to the next category. There are no tree Arrow/Home/End handlers, exact error focus, or accessible labels for repeated table inputs.

Recommendation:

- At narrow widths, show one active pane—Structure, Editor, or Inspector—with a persistent pane switcher.
- Use one vertical scroll owner.
- Transform requirement rows into stacked cards or a controlled horizontally scrollable grid with frozen Path.
- Implement roving tree focus, Arrow/Home/End, Escape/return behavior, and deterministic focus after Save and validation errors.

### 14. Live validation boundary

The side-panel Live screen exposes session state, target, event count, Start testing, target selection, and the existing event feed. It does not expose compiled assignment winner, rejected candidates, active flow/step, effective profiles, effective schema revision, or provenance.

Evidence: [Live target picker under current permissions](../artifacts/schema-editor-walkthrough/R04/25-side-panel-live-target-blocked.png).

The real observer could not be exercised without granting persistent all-tabs browsing permission; the current picker showed zero targets. Independently of that permission limitation, the production source still calls `recordSpecificationCapture(...)` and discards its returned evaluation, while visible Live rows are built by the legacy `validateEvent(...)` path. Runtime compilation also uses the mutable draft project rather than a published release's immutable executable plan.

Recommendation: render the exact `SpecificationEvaluationResult` returned by the capture transaction and make the selected release plan its only evaluator input. Legacy validation may remain only as a migration comparator, never as the displayed authority.

### 15. Operator guidance and interaction explainability

The current workspace is easier to scan, but scanning it is not the same as knowing how to build a correct specification. The UI assumes that the operator already understands the internal ontology—Profiles, Schemas, Applicability, Assignments, Fixtures, Flow Steps, Coverage, working drafts, canonical revisions, and releases—and already knows the dependency order between them. It also exposes similar actions in the toolbar, centre pane, and inspector without explaining which is authoritative.

This is especially risky because controls that look routine can have non-obvious consequences. Selecting applicability on a Page changes whether that shared Page can serve multiple funnels; linking profiles changes an effective schema that is not shown; editing a flow step can affect another selected flow when the rendered list is stale; a side-panel Save can replace newer Builder composition; and Publish can be enabled without proving runtime behavior. The interface rarely describes these effects before the action or confirms them afterward.

A first-time operator is therefore likely to encounter three kinds of disorientation:

- **Concept disorientation:** what each entity represents, why both a Profile and Schema exist, and when Applicability versus Assignment should be used.
- **Sequence disorientation:** which entity to create first, what is still missing, and why a later assurance view is empty or blocked.
- **Impact disorientation:** which draft, dependencies, flows, coverage cells, fixtures, or published behavior an interaction will change.

The product should be usable without source access, internal model knowledge, or a facilitator. Recommended guidance system:

1. **Task-based entry points.** Start with goals such as `Create a shared purchase event`, `Add a funnel`, `Add flow-specific requirements`, and `Prove checkout confirmation`, rather than requiring the operator to choose an internal collection first.
2. **Persistent specification map.** Show the recommended sequence—foundation, shared entities, flows, routing, proof, release—with completion state, blockers, and one `Continue` action. Allow experts to navigate freely without hiding the path from new users.
3. **Plain-language concept guidance.** Give every entity an always-visible one-sentence purpose, a concrete example, prerequisites, and `Used by` relationships. Tooltips alone are insufficient for core concepts.
4. **Guided empty states.** An empty collection should explain why it exists, what must precede it, what a good first item looks like, and what will become possible after creation.
5. **Labeled interaction impact.** Before Save, Remove, profile composition, assignment changes, or Publish, state the affected entities and runtime consequence in human terms. For example: `This assignment makes Retail checkout confirmation use Sitewide + Retail requirements in Production.`
6. **Specific completion feedback.** After each action, say what changed, where it was saved, what remains draft-only, what downstream evidence became stale, and how to undo it. Do not rely on a revision counter or generic success state.
7. **Explain assurance results.** Empty coverage, a blocked preflight, and fixture results need a `Why am I seeing this?` explanation and a direct repair action. Error links must open the exact entity and field using names rather than raw IDs.
8. **Safe previews.** Show effective schema, assignment winner, affected flow steps, coverage change, and release diff before committing a relationship or publishing.
9. **Progressive disclosure.** Keep the primary task and next action prominent; move global creation forms, rarely used export controls, and advanced JSON behind contextual secondary actions.
10. **In-product worked example.** Include a dismissible Retail/Trade checkout example that demonstrates one shared Page/Event, two flows, two flow-specific profiles, assignments, negative fixtures, and the resulting Live explanation.

Guidance must describe the behavior of the same canonical model that production executes. Adding explanatory copy over divergent models would make the product more confidently misleading rather than easier to use.

## Decisive production-module probes

The same JavaScript modules loaded by the extension were invoked read-only against the persisted QA envelope to isolate semantic failures:

| Probe | Result |
| --- | --- |
| Human flow name | Runtime observation used stable Retail flow ID; authored condition value was `Retail checkout`; candidate rejected as `applicability did not match`; winner `null`. |
| Full schema validation | After substituting the stable flow ID in memory, Retail won. The compiled document contained string/number types and EUR/GBP enum, but a payload with numeric transaction ID, string value/tax, USD, numeric discount code, and boolean coupon returned `issues: []`. |
| Empty fixtures | Both fixtures returned `pass` with no candidate, winner, effective profile, or issue and no differences. |
| Production assignments | Persisted `collections.assignments` remained empty while the UI counted two schema-owned lifecycle rows. |
| Cross-surface state | Side-panel marker save advanced the canonical revision and removed the schema's linked profile IDs without a conflict. |

The validation evaluator currently enforces object shape and required presence only. It does not execute scalar types, enums, forbidden fields, or compiled rules.

## What is genuinely improved since R02

- The `[hidden]` layout regression is fixed.
- Desktop information architecture is substantially clearer.
- Contextual editors exist for the main entity kinds.
- Page/Event/Schema/Applicability references commonly show names rather than raw IDs.
- Small bulk inputs have staging, visible errors, blocked commit, one transaction, Undo, and Redo.
- Canonical revision storage, conflict primitives, compiler, temporal runtime, fixtures, coverage, and executable release types now exist as useful foundations.
- Search opens the correct top-level entity.
- Controls generally meet a 44px target size.
- The six focused model suites pass when run directly against a freshly generated build.

These improvements should be retained. The problem is not that the new foundation has no value; it is that several UI, canonical-model, assurance, and Live boundaries still point to different truths.

## Prioritised correction program

### P0 — establish one executable truth

1. **One canonical graph.** Move every operator-facing assignment, schema composition, matcher, flow transition, fixture, and release reference into the collection compiled by production. Remove legacy clones from rendered counts and Save paths.
2. **Command-scoped persistence.** Save patches against a declared base revision; reject or merge stale writes. Add storage subscriptions to both surfaces.
3. **One evaluator result.** Fixtures, preflight, coverage, release, persisted routing evidence, and visible Live must consume the same immutable plan and return the same result object.
4. **Release isolation.** Live evaluates the selected published executable plan. Unpublished draft changes cannot alter runtime behavior.
5. **Complete validation semantics.** Enforce type, enum/allowed values, forbidden fields, nested structures, cardinality, and authored rules; return path, code, severity, expected, actual, and provenance.

### P0 — make multi-flow authoring truthful

1. Use typed Page/Event/Flow/Step/Profile selectors anywhere a reference is required; store stable IDs and display names.
2. Make common Page/Event definitions independent of funnel applicability.
3. Use the same flow step and transition type in UI, compiler, fixtures, and runtime.
4. Add a matcher tester and overlap analysis before Save.
5. Make fixtures guided, runnable, assertion-bearing, and required for covered release cells.
6. Use one release gate and block zero evidence, zero coverage, ambiguity, and validation failures.

### P0 — make the workflow operable without source knowledge

1. Add task-based onboarding and a persistent project progress map with a single recommended next action.
2. Explain every core entity in plain language with prerequisites, examples, and visible `Used by` relationships.
3. Label the scope and consequence of every primary action before execution, then report the exact change and downstream invalidation afterward.
4. Provide human-readable dependency and impact previews for composition, applicability, assignment, flow, deletion, and release actions.
5. Replace silent, generic, and raw-ID failure states with cause, consequence, exact location, and direct repair actions.
6. Test the workflow with operators who cannot inspect code or persisted state; source knowledge must never be a usability prerequisite.

### P1 — reduce cognitive and visual load

1. Add a project overview with setup sequence, completion by area, blockers, and `Continue` actions.
2. Group the toolbar into Validate, Release, and More; keep the primary action contextual.
3. Remove global inspector forms that do not apply to the selected entity.
4. Show actual effective schema and provenance beside local requirements.
5. Make flow steps editable in place and show compact sequence/branch summaries.
6. Expand bulk staging with paging, row exclusion, full requirement columns, spreadsheet upload, and staged-context locking.
7. Implement single-pane narrow navigation and full keyboard semantics.

## Required acceptance gates for the next round

The next implementation should not be considered complete until one actual-extension run passes all of the following without storage injection or reading raw IDs:

- At least four of five representative first-time operators, without source access or facilitator intervention, can explain the entity model and complete the shared Purchase plus Retail/Trade task within 45 minutes.
- From the project overview alone, an operator can identify the next required action, why it is required, and what completing it will unlock.
- Before and after each relationship-changing or release action, the UI identifies the affected entities, draft/release scope, invalidated evidence, and available Undo path in human language.
- Create or switch to a fresh project through visible UI.
- Define one common Purchase event and confirmation page used by both Retail and Trade.
- Build two distinct flows with executable optional branch/transition behavior.
- Compose Sitewide plus flow-specific profiles and inspect the real compiled schema/provenance.
- Create production assignments whose visible rows exactly equal compiled plan assignments.
- Enter flow names through selectors and receive distinct Retail/Trade winners.
- Run positive and negative fixtures from their editor and inspect exact result differences.
- Demonstrate an empty fixture is blocked.
- Demonstrate type, allowed-value, forbidden, and rule violations in fixture and Live output.
- Detect two overlapping applicability sets before release and deep-link to the exact predicate.
- Show requirement-level, flow-scoped coverage with human names and proving fixtures.
- Publish using the same preflight result shown in review; first release lists all added semantics.
- Edit in Builder, then stale side panel, and in the reverse order without loss; force a visible conflict when appropriate.
- Emit markerless Retail and Trade purchases through the real observer and show winner, active step, effective profiles/schema revision, exact issues, and provenance in Live.
- Change a draft matcher after publication and prove Live remains on the published result until a new release is published.
- Complete the workflow at 360px with one active pane/scroll owner and by keyboard only.

## Verification notes

The six focused correction tests passed directly:

- specification engine
- canonical repository
- multi-format bulk staging
- temporal flow execution
- fixture/coverage/preflight assurance
- callback runtime

`npm run test:unit:specification-correction` did not complete through the aggregate script on this Windows host because `scripts/build.mjs` invokes bare `tsc` with `spawnSync` and received `ENOENT`. Direct TypeScript compilation through the installed package succeeded, static build assets were restored, and the six generated-module tests then passed. This is a build portability defect worth correcting, but it does not change the operator-workflow verdict.

## Round outcome

R04 closes the uncertainty left by the R03 component evidence: the actual installed extension is easier to read and materially better for small requirement edits, but it still cannot safely author, prove, publish, or visibly validate a complex multi-flow specification. It also does not yet teach an operator how to perform that work or make the impact of interactions predictable without internal knowledge. The next Swarmforge program should prioritise canonical/evaluator convergence, truthful assurance, and an in-product guidance system before further decorative polish. Once those boundaries are unified, the current three-pane/contextual-editor foundation can support a much more approachable product.
