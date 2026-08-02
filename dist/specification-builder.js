import { addProjectEntity, adoptSavedSchema, buildReleaseReview, commitStagedProjectImport, commitSavedSchemaReview, confirmCanonicalMigration, exportSpecificationProjectState, restoreReleaseAsDraft, saveProjectAssignment, searchProjectAssignments, stageProjectImport, stageSavedSchemaSynchronization, transactProject, } from "./data-layer-specification-project.js";
import { openDurableProjectRuntime } from "./data-layer-durable-project-runtime.js";
import { durableConflictSemanticField, durableProjectRouteForWorkspace } from "./data-layer-durable-project-repository.js";
import { applyStagedBulkAction, commitStagedBulkRequirements, stageBulkRequirements } from "./data-layer-specification-bulk.js";
import { assertDeveloperSchemaExportAvailable, buildEffectiveRequirementCoverage, publishCompiledRelease as publishProjectRelease, runProductionFixture as executeProductionFixture, specificationPreflight } from "./data-layer-specification-assurance.js";
import { compileSpecificationProject as executeCompileSpecificationProject, createCanonicalProjectEnvelope } from "./data-layer-specification-engine.js";
import { entityPurposeGuidance, projectAuthoringGuidance } from "./data-layer-specification-guidance.js";
import { installExecutableFlowBuilder } from "./data-layer-specification-executable-flow-ui.js";
import { applyFlowPageGroupLaneSelection, flowPageGroupLaneIds, installFlowGraphBuilder, moveFlowPageFrame, removeFlowPageFrame } from "./utilities/data-layer/flow-graph.js";
import { addPageGroupMembership, confirmPageGroupMembershipMigration, inspectPageGroupMembershipRemoval, movePageGroupMembership, orderedPageGroupIds, pageGroupMembers, previewPageGroupMembershipMove, removePageGroupMembership, requiresPageGroupMembershipMigration, stagePageGroupMembershipMigration } from "./data-layer-page-group-membership.js";
import { restoreSchemaLibrary, SCHEMA_LIBRARY_STORAGE_KEY } from "./data-layer-schema-verification.js";
const projectPreflight = (current, revision) => specificationPreflight({ ...createCanonicalProjectEnvelope(current.project, current.draft?.id ?? "release"), revision });
const nextProjectReleaseRevision = (current, published) => Math.max(published, ...current.project.releases.map((release) => release.revision)) + 1;
import { CANONICAL_SPECIFICATION_PROJECT_STORAGE_KEY, commitCanonicalProjectState, inspectCanonicalProjectConflict, resolveCanonicalProjectConflict, restoreCanonicalProjectEnvelope, restoreCanonicalProjectState, } from "./data-layer-specification-repository.js";
import { PROJECT_LIBRARY_STORAGE_KEY, activateProject, activeProjectContextChange, createProjectInLibrary, migrateSingletonProject, projectLibrary, recordProjectNavigation, replaceActiveProjectState, resolveProjectNavigation, restoreProjectLibrary, serializeProjectLibrary } from "./data-layer-project-library.js";
import { effectivePropertySummary, installLayeredSchemaUi } from "./data-layer-layered-schema-ui.js";
import { assignmentContributorTargets, projectCanonicalConcepts } from "./data-layer-layered-schema-project.js";
import { evaluatePageGroupFixture as executePageGroupFixture, pageGroupStructuralSchema, resetDepartedPageApplicabilityPreview } from "./data-layer-page-group-structural-authoring.js";
import { applyComposedSchemaContextualFacet, composedSchemaWorkspace, overrideComposedSchemaLocalRule, resetComposedSchemaLocalFacet, resetComposedSchemaLocalProperty, resetComposedSchemaLocalRule, saveComposedEntitySchemaPolicy, saveComposedSchemaLocalFacetsAndStructures, saveComposedSchemaPolicy } from "./data-layer-composed-schema-workspace.js";
import { mountComposedSchemaWorkspace } from "./data-layer-composed-schema-workspace-ui.js";
import { installFlowDocumentationExportUi } from "./data-layer-flow-table-documentation-export-ui.js";
import { installProjectDocumentationWorkspaceUi } from "./data-layer-project-documentation-workspace-ui.js";
import { applyCanonicalCommand, canonicalCommandOutcome, canonicalRequirements, evaluateCanonicalPredicate, migrateLegacyProfile } from "./data-layer-canonical-schema.js";
import { mountCanonicalSchemaEditor as mountCanonicalSchemaEditorBase } from "./data-layer-canonical-schema-ui.js";
import { mountProjectConditionEditor, projectConditionEditorValue } from "./data-layer-project-condition-editor.js";
import { createProjectCollectionEntity, hasSavedSchemaAdoptionActions, inspectProjectEntityRemoval, projectCollectionCreationFields, projectCollectionCreationRoute, projectCollectionDefinitions, projectEntityWorkspaceRoute, projectInspectorTogglePresentation, removeProjectCollectionEntity } from "./data-layer-project-entity-lifecycle.js";
import { declareStudioChoice, installStudioChoiceControls } from "./data-layer-studio-choice-controls.js";
import { compareGuidedTestCase, guidedArrayMove, guidedInputControls, guidedInputWithValue, guidedTestCaseTypeOptions, validateGuidedInput } from "./data-layer-guided-test-cases.js";
import { installStudioAnalystGuidance, studioAnalystGuidanceIsActive } from "./specification-studio-technical-analyst-guidance.js";
import { createProfileInheritanceRecipe, markProfileInheritanceConsumersForSourceChange, profileInheritanceRecipeApplied } from "./data-layer-selective-profile-inheritance.js";
import { mountSelectiveProfileInheritance } from "./data-layer-selective-profile-inheritance-ui.js";
import { savePageDetails } from "./data-layer-page-authoring.js";
import { mountAssignmentRoutingWorkspace } from "./data-layer-assignment-routing-ui.js";
import { developerProductionSchemaExport, loadProductionSpecificationPlan, publishableProductionSchemas } from "./data-layer-production-specification.js";
const STORAGE_KEY = CANONICAL_SPECIFICATION_PROJECT_STORAGE_KEY, START_PATH_KEY = "my-chrome-utilities.specification-project-start.v1", routeParameters = new URLSearchParams(location.search), startupProjectId = routeParameters.get("project") ?? undefined, startupKind = routeParameters.get("kind") ?? undefined, startupEntityId = routeParameters.get("entity") ?? undefined, startupRoute = startupKind ? durableProjectRouteForWorkspace(startupKind, startupEntityId) : undefined;
installStudioChoiceControls(document.body);
const durableProjectRuntime = await openDurableProjectRuntime(globalThis.localStorage, globalThis.indexedDB, { ...(startupProjectId ? { projectId: startupProjectId } : {}), ...(startupRoute ? { route: startupRoute } : {}) }).catch((error) => { const status = document.querySelector("#project-state"); if (status)
    status.textContent = `Durable project storage unavailable: ${error instanceof Error ? error.message : String(error)}`; document.querySelectorAll("button,input,select,textarea").forEach((control) => { control.disabled = true; }); return new Promise(() => { }); }), projectStorage = durableProjectRuntime.storage;
const q = (selector) => { const element = document.querySelector(selector); if (!element)
    throw new Error(`Missing ${selector}`); return element; };
const projectInspector = q("#project-inspector"), projectInspectorToggle = q("#toggle-project-inspector"), projectWorkspace = q("#project-workspace");
const setProjectInspectorOpen = (open) => { const presentation = projectInspectorTogglePresentation(open); projectInspector.hidden = !open; projectInspectorToggle.textContent = presentation.label; projectInspectorToggle.setAttribute("aria-expanded", presentation.expanded); projectWorkspace.dataset.inspectorOpen = String(open); };
projectInspectorToggle.addEventListener("click", () => setProjectInspectorOpen(projectInspector.hidden));
setProjectInspectorOpen(globalThis.matchMedia("(min-width: 1600px)").matches);
for (const fieldId of ["project-assignment-path", "project-assignment-value", "project-assignment-not-path", "project-assignment-not-value"]) {
    const input = document.createElement("input");
    input.id = fieldId;
    input.hidden = true;
    input.tabIndex = -1;
    q("#save-project-assignment").append(input);
}
q("#project-assignment-applicability").required = false;
const id = (kind) => `${kind}:${crypto.randomUUID()}`;
const labels = { profiles: "Shared Profiles", pages: "Pages", pageGroups: "Page Groups", events: "Events", applicabilitySets: "Applicability", flows: "Flows", fixtures: "Test cases", assignments: "Assignments" };
let state, lastCommittedState, library = projectLibrary();
let canonicalRevision = 0, publishedRevision = 0, guidedEvaluatorInvocations = 0, pendingConflict, durableConflict, saveStatus = { kind: "idle" }, stagedBulk, selectedKind = "profiles", selectedId, projectOverview = routeParameters.get("route") === "overview", documentationOpen = routeParameters.get("view") === "documentation", creationKind, removalReview, lifecycleStatus = "", removedFocus, pendingLifecycleFocus, pendingWorkspaceFocus, pendingProfileInheritanceFocus, pendingHistoryFocus, pendingProfileSource, stagedImport, lastInvokingControl, releasePreflight, releaseReviewHasChanges = true, pendingSavedSchema, flowGraphBuilder, executableFlowBuilder, layeredSchemaUi, flowDocumentationExportUi, projectDocumentationWorkspaceUi;
const recordGuidedEvaluation = () => { guidedEvaluatorInvocations += 1; document.querySelector("[data-guided-test-case]")?.setAttribute("data-evaluator-invocations", String(guidedEvaluatorInvocations)); };
const evaluatePageGroupFixture = (...args) => { recordGuidedEvaluation(); return executePageGroupFixture(...args); };
const runProductionFixture = (...args) => { recordGuidedEvaluation(); return executeProductionFixture(...args); };
const compileSpecificationProject = (...args) => {
    const compiled = executeCompileSpecificationProject(...args);
    if (compiled.status !== "blocked")
        return compiled;
    const editor = document.querySelector("[data-guided-test-case]"), result = editor?.querySelector("#fixture-run-result"), repair = editor && Array.from(editor.querySelectorAll("button")).find(({ textContent }) => textContent === "Repair Test case"), message = `Compilation failed: ${compiled.diagnostics.map(({ field }) => field).join(", ")}`;
    if (result)
        result.textContent = `Blocked: ${message}. Saved input and prior evidence are retained.`;
    if (repair) {
        repair.hidden = false;
        repair.focus();
    }
    return compiled;
};
const analystNavigation = q('#project-workspace > nav'), analystRegion = q("#studio-analyst-guidance"), analystControl = q("#studio-analyst-control"), analystHint = q("#studio-analyst-hint");
installStudioAnalystGuidance({
    bubble: analystHint,
    analystControl,
    controlRoot: projectWorkspace,
    route: () => documentationOpen ? "Documentation" : projectOverview ? "Project overview" : labels[selectedKind],
    active: () => studioAnalystGuidanceIsActive({ document, populated: Boolean(state), workspace: projectWorkspace, navigation: analystNavigation, region: analystRegion }),
});
const mountCanonicalSchemaEditor = (options) => mountCanonicalSchemaEditorBase({ ...options, conceptSuggestions: () => state ? projectCanonicalConcepts(state) : [] });
let pageGroupMembershipStatus = "";
let pendingPageGroupMembershipReorder;
const pageApplicabilityPreviews = new Map();
let activePageApplicabilityPreviewRoute;
const setPageApplicabilityPreviewRoute = (next) => { activePageApplicabilityPreviewRoute = resetDepartedPageApplicabilityPreview(pageApplicabilityPreviews, activePageApplicabilityPreviewRoute, next); };
let canonicalCommandFeedback;
let retainedBuilderCanonicalEditor;
const savedSchemas = () => restoreSchemaLibrary(projectStorage.getItem(SCHEMA_LIBRARY_STORAGE_KEY)).filter(({ published }) => published).map((schema) => structuredClone(schema));
function renderCanonicalEntityEditor(host, kind, entity) {
    if (!state)
        return;
    const canonical = entity.canonicalSchema;
    if (!canonical) {
        const review = migrateLegacyProfile(entity, { id }), section = document.createElement("section"), heading = document.createElement("h3"), summary = document.createElement("p"), list = document.createElement("ul"), confirm = document.createElement("button");
        const sourceDefinitions = Object.values(review.document.nodes).reduce((count, node) => count + node.provenance.length, 0), deduplicated = sourceDefinitions - Object.keys(review.document.nodes).length;
        section.setAttribute("aria-label", "Canonical schema migration review");
        heading.textContent = "Migrate legacy schema to one canonical property tree";
        summary.textContent = `${Object.keys(review.document.nodes).length} properties mapped · ${deduplicated} repeated semantic entries deduplicated with all source provenance · rules, documentation, and examples mapped · ${review.conflicts.length} incompatible definitions at generated paths · requirements, structured draft, and path constraints will be replaced atomically.`;
        for (const conflict of [...review.conflicts]) {
            const item = document.createElement("li"), resolution = document.createElement("select");
            item.textContent = `${conflict.path}: ${conflict.message} `;
            resolution.append(new Option("Choose resolution", ""), new Option("Use string", "string"), new Option("Use number", "number"), new Option("Use object", "object"));
            resolution.setAttribute("aria-label", `Resolve migration conflict ${conflict.path}`);
            resolution.addEventListener("change", () => { if (!resolution.value)
                return; review.document.nodes[conflict.propertyId].type = resolution.value; review.conflicts.splice(review.conflicts.indexOf(conflict), 1); confirm.disabled = Boolean(review.conflicts.length); });
            item.append(resolution);
            list.append(item);
        }
        confirm.type = "button";
        confirm.textContent = "Confirm canonical migration";
        confirm.disabled = Boolean(review.conflicts.length);
        confirm.addEventListener("click", () => persist(confirmCanonicalMigration(state, review)));
        section.append(heading, summary, list, confirm);
        host.append(section);
        return;
    }
    if (retainedBuilderCanonicalEditor?.schemaId === canonical.id && retainedBuilderCanonicalEditor.entityId === entity.id) {
        host.append(retainedBuilderCanonicalEditor.host);
        retainedBuilderCanonicalEditor.editor.render();
        return;
    }
    const editorHost = document.createElement("section");
    host.append(editorHost);
    const retainedEditor = mountCanonicalSchemaEditor({ host: editorHost, surface: "Builder", renderAfterDispatch: false, load: () => state.project.collections[kind].find(({ id: entityId }) => entityId === entity.id).canonicalSchema, id, dispatch: (command) => { const current = state.project.collections[kind].find(({ id: entityId }) => entityId === entity.id).canonicalSchema, result = applyCanonicalCommand(current, command); if (result.status === "applied" || result.status === "rebased") {
            canonicalCommandFeedback = { schemaId: current.id, text: canonicalCommandOutcome(command, result, current) };
            persist(transactProject(state, `${command.kind} canonical property in ${entity.name}`, (project) => { const changed = markProfileInheritanceConsumersForSourceChange(project, entity.id, current, result.document); return { ...changed, collections: { ...changed.collections, [kind]: changed.collections[kind].map((candidate) => candidate.id === entity.id ? { ...candidate, canonicalSchema: result.document, requirements: [] } : candidate) } }; }));
        } return result; }, onUndo: () => { if (state)
            void durableProjectRuntime.undo(state.project.id); }, onRedo: () => { if (state)
            void durableProjectRuntime.redo(state.project.id); }, ...(canonicalCommandFeedback?.schemaId === canonical.id ? { initialFeedback: canonicalCommandFeedback.text } : {}) });
    retainedBuilderCanonicalEditor = { schemaId: canonical.id, entityId: entity.id, host: editorHost, editor: retainedEditor };
}
function renderCanonicalProfileOverview(host) {
    if (!state || selectedKind !== "profiles" || selectedId)
        return;
    const section = document.createElement("section"), heading = document.createElement("h2"), guidance = document.createElement("p"), saved = document.createElement("select"), adopt = document.createElement("button"), review = document.createElement("p");
    section.setAttribute("aria-label", "Saved Schema Library adoption");
    heading.textContent = "Adopt a published saved schema";
    guidance.textContent = "Adoption creates one project-owned Shared Profile Draft with source lineage; new profiles use the overview's single Add Shared Profile route.";
    adopt.type = "button";
    adopt.textContent = "Add saved schema to project";
    saved.setAttribute("aria-label", "Saved schema to add");
    saved.append(new Option("Choose a published saved schema", ""), ...savedSchemas().map((schema) => new Option(`${schema.name} revision ${schema.version}`, schema.id)));
    adopt.addEventListener("click", () => { const source = savedSchemas().find(({ id: schemaId }) => schemaId === saved.value); if (!source) {
        review.textContent = "Choose a published saved schema for review.";
        return;
    } review.replaceChildren(); review.textContent = `Review ${source.name} revision ${source.version}: one project-owned canonical draft will preserve source lineage. `; const confirm = document.createElement("button"); confirm.type = "button"; confirm.textContent = "Confirm adding saved schema"; confirm.addEventListener("click", () => { const next = adoptSavedSchema(state, source); selectedId = next.project.collections.profiles.at(-1).id; persist(next); persistNavigation(); }); review.append(confirm); });
    section.append(heading, guidance, labeledControl("Saved Schema Library", saved), adopt, review);
    host.append(section);
}
function labeledControl(text, control) { const label = document.createElement("label"); label.append(text, control); return label; }
function renderComposedSchemaWorkspace(host, entity, kind, scope, pageGroupApplicabilitySetIds) {
    if (!state)
        return;
    const workspaceState = state, canonical = entity.canonicalSchema, region = kind === "pages" ? document.createElement("section") : host;
    if (kind === "pages") {
        region.setAttribute("aria-label", "Effective and local schema");
        host.append(region);
        renderPageApplicabilityPreview(region, entity);
    }
    const persistComposed = (next) => { durableProjectRuntime.prepareProjectRoute(next.project.id, { collectionKind: kind, entityId: entity.id }); persist(next); }, liveState = () => state ?? workspaceState, model = composedSchemaWorkspace(workspaceState, entity, scope, undefined, undefined, pageGroupApplicabilitySetIds), section = mountComposedSchemaWorkspace({ host: region, model, effectiveText: (row) => effectivePropertySummary(row.effective), conceptSuggestions: () => projectCanonicalConcepts(liveState()), schemaContributorId: entity.id, schemaContributorScope: scope, onlyDefinedFields: (canonical?.onlyDefinedFields ?? entity.onlyDefinedFields) === true, onOnlyDefinedFields: (value) => persistComposed(kind === "events" ? saveComposedEntitySchemaPolicy(liveState(), kind, entity.id, value) : saveComposedSchemaPolicy(liveState(), kind, entity.id, value)), onSave: (row, facets, structures = []) => persistComposed(saveComposedSchemaLocalFacetsAndStructures(liveState(), kind, entity.id, row.path, facets, structures, id)), onReset: (row) => persistComposed(resetComposedSchemaLocalProperty(liveState(), kind, entity.id, row.path)), onStructure: () => { }, onRepair: (repair) => { const row = model.rows.find((candidate) => candidate.repairs.includes(repair) || candidate.decisions?.some(({ repairs }) => repairs.includes(repair))); if (repair.kind === "use-source" && repair.facet && row) {
            persistComposed(resetComposedSchemaLocalFacet(liveState(), kind, entity.id, row.path, repair.facet));
            return;
        } if (repair.kind === "use-contextual" && repair.facet && repair.value !== undefined && row) {
            persistComposed(applyComposedSchemaContextualFacet(liveState(), kind, entity.id, row.path, repair.facet, repair.value));
            return;
        } if (repair.kind === "remove-local-rule" && repair.ruleId && row) {
            persistComposed(resetComposedSchemaLocalRule(liveState(), kind, entity.id, row.path, repair.ruleId));
            return;
        } if (repair.kind === "override-rule" && repair.ruleId && repair.sourceRuleId && row) {
            persistComposed(overrideComposedSchemaLocalRule(liveState(), kind, entity.id, row.path, repair.ruleId, repair.sourceRuleId));
            return;
        } const match = ['pages', 'pageGroups', 'profiles', 'events'].find((collection) => state.project.collections[collection].some(({ id }) => id === repair.contributorId)); if (match) {
            selectedKind = match;
            selectedId = repair.contributorId;
            persistNavigation();
            render();
        } } });
    if (canonical) {
        const canonicalHost = document.createElement("section");
        canonicalHost.setAttribute("aria-label", `${entity.name} canonical schema contribution`);
        section.append(canonicalHost);
        mountCanonicalSchemaEditor({ host: canonicalHost, surface: "Builder", renderAfterDispatch: false, showOnlyDefinedFields: false, load: () => state.project.collections[kind].find(({ id: entityId }) => entityId === entity.id).canonicalSchema, id, dispatch: (command) => { const current = state.project.collections[kind].find(({ id: entityId }) => entityId === entity.id).canonicalSchema, result = applyCanonicalCommand(current, command); if (result.status === "applied" || result.status === "rebased") {
                canonicalCommandFeedback = { schemaId: current.id, text: canonicalCommandOutcome(command, result, current) };
                persistComposed(transactProject(liveState(), `${command.kind} canonical property in ${entity.name}`, (project) => ({ ...project, collections: { ...project.collections, [kind]: project.collections[kind].map((candidate) => candidate.id === entity.id ? { ...candidate, canonicalSchema: result.document } : candidate) } })));
            } return result; }, onUndo: () => { if (state)
                void durableProjectRuntime.undo(state.project.id); }, onRedo: () => { if (state)
                void durableProjectRuntime.redo(state.project.id); }, ...(canonicalCommandFeedback?.schemaId === canonical.id ? { initialFeedback: canonicalCommandFeedback.text } : {}) });
    }
}
function renderPageApplicabilityPreview(host, page) {
    if (!state)
        return;
    const memberships = orderedPageGroupIds(state.project, page.id), groups = new Map(state.project.collections.pageGroups.map((group) => [group.id, group])), referenced = [...new Set(memberships.flatMap((groupId) => { const setId = groups.get(groupId)?.applicabilitySetId; return typeof setId === "string" && setId ? [setId] : []; }))], selected = pageApplicabilityPreviews.get(page.id) ?? new Set(referenced), structure = pageGroupStructuralSchema(state, page.id, [...selected]), preview = document.createElement("fieldset"), legend = document.createElement("legend"), guidance = document.createElement("p");
    pageApplicabilityPreviews.set(page.id, selected);
    preview.setAttribute("aria-label", "Applicability Set composition preview");
    legend.textContent = "Applicability preview";
    guidance.textContent = "Preview only — not saved";
    preview.append(legend, guidance);
    for (const option of structure.applicabilityPreviews) {
        const control = document.createElement("input"), label = document.createElement("label");
        control.type = "checkbox";
        control.checked = option.checked;
        control.value = option.applicabilitySetId;
        control.dataset.applicabilityPreviewSetId = option.applicabilitySetId;
        declareStudioChoice(control, "schema.page-group-applicability-preview");
        control.addEventListener("change", () => { if (control.checked)
            selected.add(option.applicabilitySetId);
        else
            selected.delete(option.applicabilitySetId); render(); });
        label.append(control, `${option.applicabilitySetName} · ${option.condition}`);
        preview.append(label);
    }
    if (structure.excludedMemberships.length) {
        const explanation = document.createElement("p");
        explanation.setAttribute("aria-label", "Unchecked applicability preview explanation");
        explanation.textContent = `Unchecked applicability choices exclude ${structure.excludedMemberships.map(({ groupName }) => groupName).join(", ")} from this preview.`;
        preview.append(explanation);
    }
    host.append(preview);
}
function renderPageGroupMembershipEditor(host, page) {
    if (!state)
        return;
    const section = document.createElement("section"), heading = document.createElement("h3"), guidance = document.createElement("p"), impact = document.createElement("p"), picker = document.createElement("section"), search = document.createElement("input"), results = document.createElement("div"), add = document.createElement("button"), stack = document.createElement("ol"), memberships = orderedPageGroupIds(state.project, page.id), migrationRequired = requiresPageGroupMembershipMigration(state.project, page.id), groups = new Map(state.project.collections.pageGroups.map((group) => [group.id, group])), referencedSetIds = [...new Set(memberships.flatMap((groupId) => { const setId = groups.get(groupId)?.applicabilitySetId; return typeof setId === "string" && setId ? [setId] : []; }))], selectedSets = pageApplicabilityPreviews.get(page.id) ?? new Set(referencedSetIds);
    pageApplicabilityPreviews.set(page.id, selectedSets);
    section.setAttribute("aria-label", "Page Group rule stack");
    heading.textContent = "Page Group rule stack";
    guidance.textContent = "Rules apply from top to bottom, general to specific. Later ordinary values replace earlier ones; invariants and structural incompatibilities remain blocked.";
    impact.setAttribute("role", "status");
    impact.setAttribute("aria-label", "Page Group membership impact");
    impact.textContent = pageGroupMembershipStatus;
    picker.setAttribute("aria-label", "Add to Page Group picker");
    picker.hidden = true;
    search.type = "search";
    search.setAttribute("aria-label", "Search Page Groups to add");
    results.setAttribute("aria-label", "Page Group membership search results");
    add.type = "button";
    add.textContent = "Add to Page Group";
    const showPicker = () => { picker.hidden = false; search.focus(); }, renderResults = () => { const term = search.value.trim().toLowerCase(); results.replaceChildren(...state.project.collections.pageGroups.filter((group) => !memberships.includes(group.id) && group.name.toLowerCase().includes(term)).map((group) => { const control = document.createElement("button"), constraints = (group.canonicalSchema?.nodes ? Object.keys(group.canonicalSchema.nodes).length : (group.schemaConstraints ?? []).length), applicability = state.project.collections.applicabilitySets.find(({ id }) => id === group.applicabilitySetId); control.type = "button"; control.textContent = `${group.name} · Purpose ${String(group.purpose ?? "Page schema contribution")} · Applicability ${applicability?.name ?? "Always"} · Prospective rule impact ${constraints} properties`; control.addEventListener("click", () => persist(addPageGroupMembership(state, page.id, group.id))); return control; })); };
    search.addEventListener("input", renderResults);
    add.addEventListener("click", showPicker);
    picker.append(search, results);
    renderResults();
    for (const [index, groupId] of memberships.entries()) {
        const group = groups.get(groupId), row = document.createElement("li"), summary = document.createElement("span"), actions = document.createElement("div"), open = document.createElement("button"), earlier = document.createElement("button"), later = document.createElement("button"), remove = document.createElement("button");
        row.dataset.pageGroupMembershipId = groupId;
        row.tabIndex = -1;
        summary.textContent = `${index + 1}. ${group?.name ?? groupId} · ${(group?.schemaConstraints ?? []).length} effective contributions or conflicts`;
        actions.className = "membership-row-actions";
        for (const control of [open, earlier, later, remove])
            control.type = "button";
        open.textContent = "Open Page Group";
        earlier.textContent = "Move earlier";
        later.textContent = "Move later";
        remove.textContent = "Remove";
        earlier.disabled = migrationRequired || index === 0;
        later.disabled = migrationRequired || index === memberships.length - 1;
        remove.disabled = migrationRequired;
        open.addEventListener("click", () => { selectedKind = "pageGroups"; selectedId = groupId; persistNavigation(); render(); });
        const reorder = (delta) => { const nextOrder = previewPageGroupMembershipMove(state.project, page.id, groupId, delta), previewState = structuredClone(state), previewPage = previewState.project.collections.pages.find(({ id }) => id === page.id); previewPage.pageGroupIds = nextOrder; const before = pageGroupStructuralSchema(state, page.id, [...selectedSets]).compiled, after = pageGroupStructuralSchema(previewState, page.id, [...selectedSets]).compiled, paths = [...new Set([...Object.keys(before.properties), ...Object.keys(after.properties)])], changed = paths.filter((path) => JSON.stringify(before.properties[path]) !== JSON.stringify(after.properties[path])).map((path) => { const prior = before.properties[path]?.origins.at(-1)?.contributorName ?? "none", next = after.properties[path]?.origins.at(-1)?.contributorName ?? "none"; return `${path}: ${prior} → ${next}`; }); pendingPageGroupMembershipReorder = { pageId: page.id, pageGroupId: groupId, delta }; pageGroupMembershipStatus = `Impact preview before commit: ${changed.join("; ") || "no effective property changes"}; contributors ${nextOrder.map((id) => groups.get(id)?.name ?? id).join(" → ")}; affected Page instances and compiled targets will be recomputed; exports and evidence become stale; project remains Draft with Undo available.`; render(); queueMicrotask(() => document.querySelector("[data-confirm-membership-reorder]")?.focus()); }, keyboardReorder = (event, delta) => { if (event.key !== "Enter" && event.key !== " ")
            return; event.preventDefault(); reorder(delta); };
        earlier.addEventListener("click", () => reorder(-1));
        later.addEventListener("click", () => reorder(1));
        earlier.addEventListener("keydown", (event) => keyboardReorder(event, -1));
        later.addEventListener("keydown", (event) => keyboardReorder(event, 1));
        remove.addEventListener("click", () => { const review = inspectPageGroupMembershipRemoval(state.project, page.id, groupId); if (review.blocked) {
            impact.textContent = review.message;
            for (const action of review.actions) {
                const repair = document.createElement("button");
                repair.type = "button";
                repair.textContent = action.label;
                repair.addEventListener("click", () => persist(action.kind === "move-frame" ? moveFlowPageFrame(state, action.flowId, action.frameId, { pageGroupId: action.pageGroupId, y: Number((state.project.documentationFlowGraphs[action.flowId]?.pageFrames ?? []).find(({ id }) => id === action.frameId)?.position.y ?? 90) }) : removeFlowPageFrame(state, action.flowId, action.frameId)));
                impact.append(" ", repair);
            }
            return;
        } pageGroupMembershipStatus = `Changed membership ${group?.name ?? groupId}; affected schema targets and Page instances updated; exports and evidence are stale; Draft status retained; Undo available.`; persist(removePageGroupMembership(state, page.id, groupId)); });
        actions.append(open, earlier, later, remove);
        row.append(summary, actions);
        stack.append(row);
    }
    if (pendingPageGroupMembershipReorder?.pageId === page.id) {
        const pending = pendingPageGroupMembershipReorder, confirm = document.createElement("button"), cancel = document.createElement("button");
        confirm.type = cancel.type = "button";
        confirm.textContent = "Confirm membership reorder";
        confirm.dataset.confirmMembershipReorder = "true";
        cancel.textContent = "Cancel membership reorder";
        confirm.addEventListener("click", () => { pendingPageGroupMembershipReorder = undefined; pageGroupMembershipStatus = `Changed membership order for ${page.name}; affected schema targets and Page instances updated; exports and evidence are stale; Draft status retained; Undo available.`; persist(movePageGroupMembership(state, pending.pageId, pending.pageGroupId, pending.delta)); queueMicrotask(() => document.querySelector(`[data-page-group-membership-id="${CSS.escape(pending.pageGroupId)}"]`)?.focus()); });
        cancel.addEventListener("click", () => { pendingPageGroupMembershipReorder = undefined; pageGroupMembershipStatus = ""; render(); });
        impact.append(" ", confirm, " ", cancel);
    }
    const legacy = state.project.collections.pageGroups.some((group) => (group.pageIds ?? []).includes(page.id)), migration = stagePageGroupMembershipMigration(state.project, page.id);
    if (legacy || migration.missingPageGroupIds.length || migration.duplicatePageGroupIds.length) {
        const review = document.createElement("section"), summary = document.createElement("p"), confirm = document.createElement("button");
        review.setAttribute("aria-label", "Page Group membership migration review");
        summary.textContent = `Proposed ordered membership: ${migration.proposedPageGroupIds.map((id) => groups.get(id)?.name ?? id).join(", ")}. Page-owned order is preserved before group-only memberships. ${migration.missingPageGroupIds.length ? `Missing references: ${migration.missingPageGroupIds.join(", ")}.` : "No membership will be lost."}`;
        confirm.type = "button";
        confirm.textContent = "Confirm ordered membership migration";
        confirm.disabled = Boolean(migration.missingPageGroupIds.length || migration.duplicatePageGroupIds.length);
        confirm.addEventListener("click", () => persist(confirmPageGroupMembershipMigration(state, migration)));
        review.append(summary, confirm);
        section.append(review);
    }
    section.append(heading, guidance, add, picker, stack, impact);
    host.append(section);
}
function writeProjectState(next, label = "Project edit") { const result = commitCanonicalProjectState(projectStorage, next, { expectedRevision: canonicalRevision, pendingLabel: label, ...(lastCommittedState ? { base: lastCommittedState } : {}) }); if (result.status === "conflict") {
    pendingConflict = result;
    state = result.current;
    lastCommittedState = structuredClone(result.current);
    canonicalRevision = result.revision;
    throw new Error(`A newer Saved Draft conflicts with pending ${result.pendingLabel}.`);
} const committed = restoreCanonicalProjectState(projectStorage.getItem(STORAGE_KEY)) ?? next; canonicalRevision = result.revision; pendingConflict = undefined; releasePreflight = undefined; state = { ...structuredClone(committed), history: { undo: [], redo: [] } }; lastCommittedState = structuredClone(state); if (library.activeProjectId) {
    library = replaceActiveProjectState(library, state, result.revision);
    projectStorage.setItem(PROJECT_LIBRARY_STORAGE_KEY, serializeProjectLibrary(library));
} }
function showConflictReview() {
    if (!pendingConflict && !durableConflict)
        return;
    const dialog = q("#project-conflict-review"), fields = q("#project-conflict-fields"), historyBlocked = durableProjectRuntime.failedSave()?.command.commandId.startsWith("blocked-history:") ?? false;
    fields.querySelectorAll("label").forEach((label) => label.remove());
    q("#reapply-project-conflict").disabled = historyBlocked;
    q("#merge-project-conflict").disabled = historyBlocked;
    if (durableConflict) {
        q("#project-conflict-summary").textContent = historyBlocked
            ? `${durableConflict.label}: a newer Saved Draft changed ${durableConflict.conflictingFields.join(", ")}. Reject this window history action to preserve the newer value; the history entry remains available.`
            : `${durableConflict.label}: base Draft differs from the newer Saved Draft. Pending fields ${durableConflict.pendingFields.join(", ")}; newer fields ${durableConflict.currentFields.join(", ")}; conflicts ${durableConflict.conflictingFields.join(", ")}.`;
        const groups = new Map();
        for (const field of durableConflict.conflictingFields) {
            const semantic = durableConflictSemanticField(field), group = groups.get(semantic) ?? [];
            group.push(field);
            groups.set(semantic, group);
        }
        for (const [semantic, group] of groups) {
            const field = group[0], label = document.createElement("label"), input = document.createElement("input"), current = document.createElement("span"), pending = document.createElement("span");
            input.type = "checkbox";
            declareStudioChoice(input, "conflict.pending-field");
            input.value = semantic;
            input.disabled = historyBlocked;
            current.textContent = ` Current ${JSON.stringify(durableConflict.currentValues[field])}.`;
            pending.textContent = ` Pending ${JSON.stringify(durableConflict.pendingValues[field])}.`;
            const description = group.length > 1 ? `${semantic} (${group.join(" and ")}; committed together)` : field;
            label.append(input, historyBlocked ? ` Blocked history value for ${description}.` : ` Use pending value for ${description}.`, current, pending);
            fields.append(label);
        }
    }
    else {
        const inspection = inspectCanonicalProjectConflict(pendingConflict);
        q("#project-conflict-summary").textContent = `${pendingConflict.pendingLabel}: ${inspection.pendingFields.length} pending fields, ${inspection.currentFields.length} newer fields, ${inspection.conflictingFields.length} same-field conflicts.`;
        for (const field of inspection.conflictingFields) {
            const label = document.createElement("label"), input = document.createElement("input");
            input.type = "checkbox";
            declareStudioChoice(input, "conflict.pending-field");
            input.value = field;
            label.append(input, ` Use pending value for ${field}`);
            fields.append(label);
        }
    }
    if (!dialog.open)
        dialog.showModal();
    dialog.querySelector("h2")?.focus();
}
function persist(next) { const label = next.history.undo.at(-1)?.label ?? "Project edit", clean = { ...structuredClone(next), history: { undo: [], redo: [] } }; state = clean; saveStatus = { kind: "saving", label }; try {
    writeProjectState(clean, label);
    q("#retry-save").hidden = true;
}
catch (error) {
    saveStatus = { kind: "failed", label, message: error instanceof Error ? error.message : String(error) };
    if (!pendingConflict)
        state = clean.draft ? { ...clean, draft: { ...clean.draft, status: "Save failed" } } : clean;
    q("#retry-save").hidden = false;
    if (pendingConflict)
        showConflictReview();
    render();
    renderAssignments();
    return;
} q("#project-state").textContent = `Saving ${label}… · Published revision ${publishedRevision}`; q("#publish-project").disabled = true; }
function restore() { const stored = projectStorage.getItem(STORAGE_KEY); let singleton, revision = 0; if (stored)
    try {
        const envelope = restoreCanonicalProjectEnvelope(stored);
        singleton = restoreCanonicalProjectState(stored);
        revision = envelope?.revision ?? 0;
    }
    catch {
        projectStorage.removeItem(STORAGE_KEY);
    } library = migrateSingletonProject(restoreProjectLibrary(projectStorage.getItem(PROJECT_LIBRARY_STORAGE_KEY)), singleton ? { state: singleton, revision } : undefined); const active = library.activeProjectId ? library.projects[library.activeProjectId] : undefined; state = active ? { ...structuredClone(active.state), history: { undo: [], redo: [] } } : undefined; lastCommittedState = state ? structuredClone(state) : undefined; canonicalRevision = active?.revision ?? 0; publishedRevision = active?.publishedRevision ?? Math.max(0, ...(active?.state.project.releases.map(({ revision }) => revision) ?? [0])); const navigation = library.activeProjectId ? resolveProjectNavigation(library, library.activeProjectId) : undefined; if (navigation) {
    selectedKind = navigation.kind ?? selectedKind;
    selectedId = navigation.id;
} }
function persistNavigation() { if (!state || library.activeProjectId !== state.project.id)
    return; const navigation = { kind: selectedKind, ...(selectedId ? { id: selectedId } : {}) }; library = recordProjectNavigation(library, state.project.id, navigation); projectStorage.setItem(PROJECT_LIBRARY_STORAGE_KEY, serializeProjectLibrary(library)); }
function entitySearchText(value) { return JSON.stringify(value).toLowerCase(); }
function entitiesForKind(kind) { if (!state)
    return []; return kind === "assignments" ? searchProjectAssignments(state.project, "").rows : state.project.collections[kind]; }
const editorFields = {
    profiles: [], pages: [],
    pageGroups: [{ key: "description", label: "Description", type: "textarea" }, { key: "profileIds", label: "Shared Profile sources", collection: "profiles", multiple: true }, { key: "applicabilitySetId", label: "Applicability Set", collection: "applicabilitySets" }],
    events: [{ key: "sourceId", label: "Source" }, { key: "eventName", label: "Canonical event name" }, { key: "trigger", label: "Default documentary trigger" }, { key: "target", label: "Validation target" }, { key: "occurrencePolicy", label: "Occurrence policy" }, { key: "profileIds", label: "Shared Profile sources", collection: "profiles", multiple: true }, { key: "applicabilitySetId", label: "Applicability Set", collection: "applicabilitySets" }],
    applicabilitySets: [{ key: "priority", label: "Priority", type: "number" }, { key: "fallback", label: "Fallback", type: "checkbox" }, { key: "condition", label: "Nested All / Any / Not condition", type: "condition" }],
    flows: [{ key: "entryCondition", label: "Entry condition", type: "condition" }, { key: "exitCondition", label: "Exit condition", type: "condition" }, { key: "timeoutMinutes", label: "Timeout minutes", type: "number" }, { key: "correlationField", label: "Correlation field" }, { key: "profileIds", label: "Requirement profiles", collection: "profiles", multiple: true }, { key: "applicabilitySetId", label: "Applicability Set", collection: "applicabilitySets" }],
    fixtures: [],
    assignments: [{ key: "targetKind", label: "Contributor kind" }, { key: "targetId", label: "Contributor target" }, { key: "eventId", label: "Event", collection: "events" }, { key: "applicabilitySetId", label: "Applicability Set", collection: "applicabilitySets" }, { key: "priority", label: "Priority", type: "number" }],
};
function fieldControl(field, entity) { if (field.type === "flow-role") {
    const select = document.createElement("select");
    select.name = field.key;
    select.append(new Option("Interaction", "interaction"), new Option("Context-setting", "context-setting"));
    select.value = entity[field.key] === "context-setting" ? "context-setting" : "interaction";
    return select;
} if (field.collection && state) {
    const select = document.createElement("select");
    select.name = field.key;
    select.multiple = Boolean(field.multiple);
    if (!field.multiple && field.key === "applicabilitySetId")
        select.append(new Option("None", ""));
    for (const optionEntity of state.project.collections[field.collection]) {
        if (optionEntity.id === entity.id)
            continue;
        const option = document.createElement("option");
        option.value = optionEntity.id;
        option.textContent = optionEntity.name;
        option.selected = field.multiple ? entity[field.key]?.includes(optionEntity.id) ?? false : entity[field.key] === optionEntity.id;
        select.append(option);
    }
    select.value = field.multiple ? select.value : String(entity[field.key] ?? "");
    return select;
} if (field.type === "condition") {
    const group = document.createElement("fieldset"), operator = document.createElement("select"), rows = document.createElement("div"), add = document.createElement("button"), condition = entity[field.key];
    group.name = field.key;
    group.dataset.conditionBuilder = "true";
    operator.dataset.groupOperator = "true";
    for (const value of ["all", "any", "not"]) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value === "all" ? "All conditions" : value === "any" ? "Any condition" : "Not";
        operator.append(option);
    }
    operator.value = condition && condition.kind !== "predicate" ? condition.kind : "all";
    const appendPredicate = (predicate, negated = false) => { const row = document.createElement("div"), not = document.createElement("input"), path = document.createElement("input"), comparison = document.createElement("select"), value = document.createElement("input"); row.dataset.predicate = "true"; not.type = "checkbox"; not.checked = negated; not.setAttribute("aria-label", "Negate predicate"); path.value = predicate?.field ?? ""; path.placeholder = "Context field"; path.setAttribute("aria-label", "Predicate field"); for (const name of ["exists", "does not exist", "equals", "does not equal", "is one of", "matches pattern", "greater than", "at least", "less than", "at most", "contains", "glob", "regex"]) {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        comparison.append(option);
    } comparison.value = predicate?.operator ?? "equals"; comparison.setAttribute("aria-label", "Predicate operator"); value.value = predicate?.values?.join(", ") ?? predicate?.pattern ?? String(predicate?.value ?? ""); value.setAttribute("aria-label", "Predicate value"); row.append(not, path, comparison, value); rows.append(row); };
    const visit = (node, negated = false) => { if (!node)
        return; if (node.kind === "predicate")
        appendPredicate(node, negated);
    else
        for (const child of node.conditions)
            visit(child, node.kind === "not" ? !negated : negated); };
    visit(condition);
    if (!rows.children.length)
        appendPredicate();
    add.type = "button";
    add.textContent = "Add predicate";
    add.addEventListener("click", () => appendPredicate());
    group.append(operator, rows, add);
    return group;
} if (field.type === "textarea" || field.type === "json") {
    const textarea = document.createElement("textarea");
    textarea.name = field.key;
    textarea.rows = field.type === "json" ? 6 : 3;
    textarea.value = field.type === "json" ? JSON.stringify(entity[field.key] ?? (field.key === "observations" ? [] : {}), null, 2) : String(entity[field.key] ?? "");
    return textarea;
} const input = document.createElement("input"); input.name = field.key; input.type = field.type ?? "text"; if (field.type === "checkbox")
    input.checked = Boolean(entity[field.key]);
else
    input.value = String(entity[field.key] ?? ""); return input; }
function editorValue(field, control) { if (control instanceof HTMLFieldSetElement && field.type === "condition") {
    const kind = control.querySelector("[data-group-operator]").value, conditions = Array.from(control.querySelectorAll("[data-predicate]"), (row) => { const inputs = row.querySelectorAll("input"), operator = row.querySelector("select").value, text = inputs[2].value.trim(), predicate = { kind: "predicate", field: inputs[1].value.trim(), operator, ...(operator === "is one of" ? { values: text.split(",").map((entry) => entry.trim()).filter(Boolean) } : operator === "matches pattern" ? { pattern: text } : !["exists", "does not exist"].includes(operator) ? { value: ["greater than", "at least", "less than", "at most"].includes(operator) ? Number(text) : text } : {}) }; return inputs[0].checked ? { kind: "not", conditions: [predicate] } : predicate; }).filter((condition) => condition.kind !== "predicate" || Boolean(condition.field));
    return { kind, conditions };
} if (control instanceof HTMLSelectElement)
    return field.multiple ? Array.from(control.selectedOptions, ({ value }) => value) : control.value; if (control instanceof HTMLInputElement && field.type === "checkbox")
    return control.checked; if (field.type === "number")
    return Number(control.value); if (field.type === "json")
    return JSON.parse(control.value || "{}"); return control.value; }
function productionFieldControl(field, entity) {
    if (field.type !== "condition")
        return fieldControl(field, entity);
    const group = document.createElement("fieldset");
    group.name = field.key;
    mountProjectConditionEditor(group, entity[field.key]);
    return group;
}
function productionEditorValue(field, control) {
    if (control instanceof HTMLFieldSetElement && field.type === "condition") {
        return projectConditionEditorValue(control);
    }
    return editorValue(field, control);
}
const setInputPath = (input, path, value) => { const parts = path.split("/").filter(Boolean); let cursor = input; parts.forEach((part, index) => { if (index === parts.length - 1) {
    cursor[part] = value;
    return;
} const child = cursor[part]; cursor[part] = child && typeof child === "object" && !Array.isArray(child) ? child : {}; cursor = cursor[part]; }); };
const guidedSchemaCandidates = (testCase) => { if (!state)
    return []; const event = state.project.collections.events.find(({ id }) => id === testCase.eventId), profileIds = new Set([...(event?.profileIds ?? []), ...((state.project.collections.assignments.filter(({ eventId }) => eventId === testCase.eventId).flatMap(({ targetKind, targetId }) => targetKind === "Shared Profile" ? [String(targetId)] : [])))]); const selected = String(testCase.inputGuidance?.schemaId ?? ""); return state.project.collections.profiles.filter((profile) => profile.id === selected || !profileIds.size || profileIds.has(profile.id)); };
const guidedPathParts = (path) => path.split("/").filter(Boolean);
const guidedParentPath = (path) => { const parts = guidedPathParts(path); parts.pop(); return parts.length ? `/${parts.join("/")}` : ""; };
const guidedPathValue = (input, path) => guidedPathParts(path).reduce((value, part) => value && typeof value === "object" ? value[part] : undefined, input);
const guidedDefaultValue = (descriptor) => descriptor.jsonTypes.includes("null") ? null : descriptor.control === "object" ? {} : descriptor.control === "array" ? [] : descriptor.control === "boolean" ? false : descriptor.control === "number" ? 0 : "";
const guidedPageEvaluatorRevision = (current, pageId) => { const page = current.project.collections.pages.find(({ id }) => id === pageId), groups = current.project.collections.pageGroups.filter(({ id }) => page?.pageGroupIds?.includes(id)); return `page:${JSON.stringify({ pageId: page?.id, pageRevision: page?.canonicalSchema?.revision ?? page?.revision ?? 0, groups: groups.map((group) => [group.id, group.canonicalSchema?.revision ?? group.revision ?? 0]) })}`; };
function guidedControlsForSchema(schema, input) {
    const canonical = schema?.canonicalSchema, requirements = canonical ? canonicalRequirements(canonical) : schema?.requirements ?? [];
    const effective = requirements.map((requirement) => {
        const propertyId = String(requirement.propertyId ?? ""), node = canonical?.nodes[propertyId], conditional = Boolean(requirement.condition), matched = canonical && conditional ? evaluateCanonicalPredicate(requirement.condition, canonical, input) : undefined, presence = String(requirement.presenceMode ?? (requirement.required ? "required" : "optional")), active = !conditional || Boolean(matched?.matched), required = presence === "required" || (presence === "required-when" && active), explanation = matched?.branches.length ? matched.branches.map(({ label, matched: branchMatched }) => `${label}: ${branchMatched ? "matched" : "not matched"}`).join("; ") : undefined, requirementType = typeof requirement.type === "string" ? requirement.type : "string";
        return { ...requirement, type: requirement.nullable && requirementType !== "null" ? [requirementType, "null"] : requirementType, required, active, ...(explanation ? { explanation } : {}), ...(node?.type === "object" ? { additionalProperties: node.onlyDefinedFields !== true } : {}) };
    });
    return guidedInputControls(effective, input);
}
function mountGuidedInputBuilder(host, options) {
    const render = () => {
        const controls = options.controls(), input = options.input();
        host.replaceChildren(Object.assign(document.createElement("legend"), { textContent: "Structured input" }));
        const byParent = (parent) => controls.filter((descriptor) => descriptor.active && guidedParentPath(descriptor.path) === parent);
        const update = (path, value) => { options.update(guidedInputWithValue(options.input(), path, value)); render(); };
        const renderScalar = (descriptor, concretePath) => {
            const wrapper = document.createElement("div"), help = document.createElement("small"), helpId = `test-input-help-${concretePath.replace(/[^a-z0-9]/gi, "-")}`, value = guidedPathValue(options.input(), concretePath), label = concretePath;
            wrapper.className = "guided-input-property";
            wrapper.dataset.guidedProperty = concretePath;
            help.id = helpId;
            help.textContent = [descriptor.path, descriptor.jsonTypes.join(" or "), descriptor.required ? "required" : "optional", descriptor.description, descriptor.explanation, descriptor.example !== undefined ? `Example ${JSON.stringify(descriptor.example)}` : undefined, descriptor.origin ? `Origin ${descriptor.origin}` : undefined].filter(Boolean).join(" · ");
            let control;
            if (descriptor.control === "choice" || descriptor.control === "boolean") {
                control = document.createElement("select");
                if (!descriptor.required)
                    control.append(new Option("Choose value", ""));
                const values = descriptor.control === "boolean" ? [true, false] : (descriptor.constraints.allowedValues ?? []);
                for (const choice of values)
                    control.append(new Option(String(choice), JSON.stringify(choice)));
                control.value = value === undefined ? "" : JSON.stringify(value);
                control.addEventListener("change", () => update(concretePath, control.value === "" ? undefined : JSON.parse(control.value)));
            }
            else if (descriptor.control === "nullable") {
                const group = document.createElement("fieldset"), legend = document.createElement("legend"), mode = document.createElement("select");
                legend.textContent = label;
                mode.setAttribute("aria-label", `${label} null or typed value`);
                mode.append(new Option("Null", "null"), new Option(`Use ${descriptor.jsonTypes.filter((type) => type !== "null").join(" or ")} value`, "value"));
                mode.value = value === null || value === undefined ? "null" : "value";
                mode.addEventListener("change", () => update(concretePath, mode.value === "null" ? null : ""));
                group.append(legend, mode);
                if (mode.value === "value") {
                    const typed = { ...descriptor, control: descriptor.jsonTypes.includes("number") || descriptor.jsonTypes.includes("integer") ? "number" : "text", jsonTypes: descriptor.jsonTypes.filter((type) => type !== "null") };
                    group.append(renderScalar(typed, concretePath));
                }
                wrapper.append(group, help);
                return wrapper;
            }
            else {
                control = document.createElement("input");
                control.type = descriptor.control === "number" ? "number" : "text";
                control.value = value === undefined ? "" : String(value);
                if (typeof descriptor.constraints.minimum === "number")
                    control.min = String(descriptor.constraints.minimum);
                if (typeof descriptor.constraints.maximum === "number")
                    control.max = String(descriptor.constraints.maximum);
                control.addEventListener("change", () => update(concretePath, control.type === "number" && control.value !== "" ? Number(control.value) : control.value));
            }
            control.dataset.testInputPath = concretePath;
            control.required = descriptor.required;
            control.setAttribute("aria-describedby", helpId);
            wrapper.append(labeledControl(label, control), help);
            return wrapper;
        };
        const renderAdditional = (descriptor, concretePath) => {
            if (descriptor.constraints.additionalProperties !== true)
                return undefined;
            const group = document.createElement("fieldset"), legend = document.createElement("legend"), name = document.createElement("input"), type = document.createElement("select"), value = document.createElement("input"), add = document.createElement("button");
            legend.textContent = `Add undeclared property to ${concretePath}`;
            name.setAttribute("aria-label", "Additional property name");
            type.setAttribute("aria-label", "Additional property value type");
            for (const choice of ["string", "number", "boolean", "object", "array", "null"])
                type.append(new Option(choice, choice));
            value.setAttribute("aria-label", "Additional property typed value");
            add.type = "button";
            add.textContent = "Add guided property";
            add.addEventListener("click", () => { const property = name.value.trim(); if (!property) {
                name.setCustomValidity("Enter a property name.");
                name.reportValidity();
                name.focus();
                return;
            } let typed = value.value; try {
                typed = type.value === "string" ? value.value : type.value === "number" ? Number(value.value) : type.value === "boolean" ? value.value === "true" : type.value === "null" ? null : JSON.parse(value.value || (type.value === "array" ? "[]" : "{}"));
            }
            catch {
                value.setCustomValidity(`Enter a valid ${type.value} value.`);
                value.reportValidity();
                value.focus();
                return;
            } update(`${concretePath}/${property}`, typed); });
            group.append(legend, labeledControl("Property name", name), labeledControl("Value type", type), labeledControl("Typed value", value), add);
            return group;
        };
        const renderDescriptor = (descriptor, concretePath = descriptor.path) => {
            const value = guidedPathValue(options.input(), concretePath);
            if (!descriptor.required && value === undefined) {
                const add = document.createElement("button");
                add.type = "button";
                add.textContent = `Add optional ${concretePath}`;
                add.addEventListener("click", () => update(concretePath, guidedDefaultValue(descriptor)));
                return add;
            }
            if (descriptor.control === "object") {
                const group = document.createElement("fieldset"), legend = document.createElement("legend");
                legend.textContent = `${concretePath} · Object${descriptor.required ? " · required" : ""}`;
                group.dataset.guidedObject = concretePath;
                for (const child of byParent(descriptor.path))
                    group.append(renderDescriptor(child, child.path.replace(descriptor.path, concretePath)));
                const additional = renderAdditional(descriptor, concretePath);
                if (additional)
                    group.append(additional);
                group.prepend(legend);
                return group;
            }
            if (descriptor.control === "array") {
                const group = document.createElement("fieldset"), legend = document.createElement("legend"), items = Array.isArray(value) ? value : [], children = byParent(`${descriptor.path}/*`);
                legend.textContent = `${concretePath} · Array${descriptor.required ? " · required" : ""}`;
                group.dataset.guidedArray = concretePath;
                items.forEach((_item, index) => { const item = document.createElement("fieldset"), itemLegend = document.createElement("legend"), earlier = document.createElement("button"), later = document.createElement("button"), remove = document.createElement("button"); itemLegend.textContent = `Item ${index + 1}`; earlier.type = later.type = remove.type = "button"; earlier.textContent = "Move earlier"; later.textContent = "Move later"; remove.textContent = "Remove item"; earlier.disabled = index === 0; later.disabled = index === items.length - 1; earlier.addEventListener("click", () => { options.update(guidedArrayMove(options.input(), concretePath, index, index - 1)); render(); }); later.addEventListener("click", () => { options.update(guidedArrayMove(options.input(), concretePath, index, index + 1)); render(); }); remove.addEventListener("click", () => { const next = [...items]; next.splice(index, 1); update(concretePath, next); }); item.append(itemLegend); if (children.length)
                    for (const child of children)
                        item.append(renderDescriptor(child, child.path.replace(`${descriptor.path}/*`, `${concretePath}/${index}`)));
                else {
                    const itemType = String(descriptor.constraints.itemType ?? "string"), synthetic = { ...descriptor, path: `${descriptor.path}/*`, control: itemType === "number" || itemType === "integer" ? "number" : itemType === "boolean" ? "boolean" : "text", jsonTypes: [itemType], required: true };
                    item.append(renderScalar(synthetic, `${concretePath}/${index}`));
                } item.append(earlier, later, remove); group.append(item); });
                const add = document.createElement("button");
                add.type = "button";
                add.textContent = "Add array item";
                add.addEventListener("click", () => update(concretePath, [...items, descriptor.constraints.itemType === "object" ? {} : descriptor.constraints.itemType === "array" ? [] : descriptor.constraints.itemType === "boolean" ? false : descriptor.constraints.itemType === "number" || descriptor.constraints.itemType === "integer" ? 0 : ""]));
                group.prepend(legend);
                group.append(add);
                return group;
            }
            return renderScalar(descriptor, concretePath);
        };
        for (const descriptor of byParent(""))
            host.append(renderDescriptor(descriptor));
        const issues = validateGuidedInput(controls, options.input());
        for (const issue of issues) {
            const wrapper = host.querySelector(`[data-guided-property="${CSS.escape(issue.path)}"]`) ?? host.querySelector(`[data-guided-array="${CSS.escape(issue.path)}"],[data-guided-object="${CSS.escape(issue.path)}"]`);
            if (!wrapper)
                continue;
            const error = document.createElement("small"), control = wrapper.querySelector("input,select"), errorId = `test-input-error-${issue.path.replace(/[^a-z0-9]/gi, "-")}`;
            error.id = errorId;
            error.className = "error";
            error.textContent = issue.message;
            wrapper.append(error);
            control?.setAttribute("aria-errormessage", errorId);
            control?.setAttribute("aria-invalid", "true");
        }
    };
    render();
}
function renderGuidedTestCaseEditor(content, entity) {
    if (!state)
        return;
    const testCase = { testType: entity.testType === "page-context" ? "page-context" : "event-validation", input: structuredClone(entity.input ?? entity.payload ?? {}), inputGuidance: { kind: "authoring-guidance", ...(entity.inputGuidance ?? {}) }, sourceProvenance: entity.sourceProvenance ?? { kind: "legacy", id: entity.id, revision: String(entity.revision ?? "imported") }, reviewedExpectations: structuredClone(entity.reviewedExpectations ?? entity.expected ?? {}), status: entity.status ?? "Blocked", differences: entity.differences ?? [], ...entity }, section = document.createElement("section"), heading = document.createElement("h2"), definition = document.createElement("p"), form = document.createElement("form"), steps = document.createElement("ol"), result = document.createElement("output");
    section.className = "contextual-editor guided-test-case";
    section.dataset.guidedTestCase = entity.id;
    section.dataset.evaluatorInvocations = String(guidedEvaluatorInvocations);
    heading.textContent = "Edit Test case";
    heading.tabIndex = -1;
    definition.textContent = "A Test case is saved input plus reviewed expectations rerunnable against the current Draft. Test-case assurance is advisory.";
    for (const label of ["Source", "Scope", "Input", "Save and run", "Expectations", "Review"]) {
        const item = document.createElement("li");
        item.textContent = label;
        steps.append(item);
    }
    const name = document.createElement("input");
    name.name = "name";
    name.required = true;
    name.value = testCase.name;
    form.append(labeledControl("Test case name", name));
    const type = document.createElement("select");
    type.name = "testType";
    for (const option of guidedTestCaseTypeOptions()) {
        const element = new Option(`${option.label} — ${option.purpose}`, option.value);
        type.append(element);
    }
    type.value = testCase.testType;
    form.append(labeledControl("Test case type", type));
    const scope = document.createElement("fieldset"), scopeLegend = document.createElement("legend"), eventSelect = document.createElement("select"), pageSelect = document.createElement("select");
    scopeLegend.textContent = "Scope";
    eventSelect.name = "eventId";
    pageSelect.name = "pageId";
    eventSelect.append(new Option("Choose one named Event", ""));
    pageSelect.append(new Option("No Page context", ""));
    for (const event of state.project.collections.events)
        eventSelect.append(new Option(event.name, event.id));
    for (const page of state.project.collections.pages)
        pageSelect.append(new Option(page.name, page.id));
    eventSelect.value = String(testCase.eventId ?? "");
    pageSelect.value = String(testCase.pageId ?? "");
    scope.append(scopeLegend, labeledControl("Event", eventSelect), labeledControl("Page", pageSelect));
    form.append(scope);
    const source = document.createElement("p");
    source.textContent = `Source: ${testCase.sourceProvenance.kind} ${testCase.sourceProvenance.id} at ${testCase.sourceProvenance.revision}. Later source edits cannot change this saved copy.`;
    form.append(source);
    const candidates = guidedSchemaCandidates(testCase), schemaSelect = document.createElement("select");
    let schema = candidates.find(({ id }) => id === String(testCase.inputGuidance.schemaId ?? "")) ?? candidates[0], draftInput = structuredClone(testCase.input);
    schemaSelect.name = "inputGuidance";
    schemaSelect.append(new Option("Choose input-guidance schema", ""));
    for (const profile of candidates)
        schemaSelect.append(new Option(`${profile.name} · Event ${state.project.collections.events.find(({ id }) => id === testCase.eventId)?.name ?? "scope"} · applicability ${state.project.collections.assignments.some(({ eventId, targetId }) => eventId === testCase.eventId && targetId === profile.id) ? "eligible" : "proposed"} · revision ${String(profile.canonicalSchema?.revision ?? profile.revision ?? 1)}`, profile.id));
    schemaSelect.value = String(schema?.id ?? "");
    form.append(labeledControl("Input-guidance schema (authoring assistance only; expected and actual Assignment remain separate)", schemaSelect));
    const inputGroup = document.createElement("fieldset"), mountInput = () => { schema = candidates.find(({ id }) => id === schemaSelect.value); if (!schema) {
        inputGroup.replaceChildren(Object.assign(document.createElement("legend"), { textContent: "Structured input" }));
        const missing = document.createElement("p"), repair = document.createElement("button");
        missing.textContent = "No eligible input-guidance schema describes this scope. Repair the Event, Assignment, contributor, or schema relationship; the Test case name, type, source, and scope will be preserved.";
        repair.type = "button";
        repair.textContent = "Open Shared Profiles to create, adopt, select, or repair guidance";
        repair.addEventListener("click", () => { const preserved = { ...testCase, name: name.value.trim(), testType: type.value, eventId: eventSelect.value || undefined, pageId: pageSelect.value || undefined, input: draftInput, inputGuidance: { schemaId: schemaSelect.value, revision: "missing", kind: "authoring-guidance" } }; persist(transactProject(state, `Preserve Test case before guidance repair`, (project) => ({ ...project, collections: { ...project.collections, fixtures: project.collections.fixtures.map((candidate) => candidate.id === entity.id ? preserved : candidate) } }))); selectedKind = "profiles"; selectedId = undefined; persistNavigation(); render(); });
        inputGroup.append(missing, repair);
        return;
    } mountGuidedInputBuilder(inputGroup, { controls: () => guidedControlsForSchema(schema, draftInput), input: () => draftInput, update: (next) => { draftInput = next; } }); };
    schemaSelect.addEventListener("change", mountInput);
    mountInput();
    form.append(inputGroup);
    const expectations = document.createElement("fieldset"), expectationLegend = document.createElement("legend"), winner = document.createElement("select"), pageGroups = document.createElement("select"), outcome = document.createElement("select"), issueChoices = document.createElement("fieldset");
    expectationLegend.textContent = "Reviewed expectations";
    winner.name = "expectedWinner";
    winner.append(new Option("Do not assert Assignment", ""), new Option("No Assignment", "no-assignment"));
    for (const assignment of state.project.collections.assignments)
        winner.append(new Option(assignment.name, assignment.id));
    winner.value = String(testCase.reviewedExpectations.winner ?? "");
    pageGroups.name = "expectedPageGroups";
    pageGroups.multiple = true;
    for (const group of state.project.collections.pageGroups) {
        const option = new Option(group.name, group.id);
        option.selected = (testCase.reviewedExpectations.applicablePageGroups ?? []).includes(group.id);
        pageGroups.append(option);
    }
    outcome.name = "expectedOutcome";
    outcome.append(new Option("Do not assert validation outcome", ""), new Option("Valid", "Valid"), new Option("Invalid", "Invalid"));
    outcome.value = String(testCase.reviewedExpectations.outcome ?? "");
    issueChoices.append(Object.assign(document.createElement("legend"), { textContent: "Expected issue path and code pairs" }));
    const pairedIssues = [...new Map([...(testCase.actualResult?.issues ?? []), ...(testCase.reviewedExpectations.issues ?? [])].map((issue) => [`${issue.path}:${issue.code}`, issue])).values()];
    for (const issue of pairedIssues) {
        const choice = document.createElement("input");
        choice.type = "checkbox";
        choice.value = `${issue.path}\t${issue.code}`;
        choice.checked = (testCase.reviewedExpectations.issues ?? []).some((expected) => expected.path === issue.path && expected.code === issue.code);
        issueChoices.append(labeledControl(`${issue.path} · ${issue.code}`, choice));
    }
    expectations.append(expectationLegend, labeledControl("Expected winning Assignment", winner), labeledControl("Expected applicable Page Groups", pageGroups), labeledControl("Expected validation outcome", outcome), issueChoices);
    form.append(expectations);
    let renderedCase = testCase;
    if (testCase.actualResult) {
        let currentRevision = testCase.actualResult.evaluatorRevision;
        if (testCase.testType === "page-context")
            currentRevision = guidedPageEvaluatorRevision(state, testCase.pageId);
        else {
            const current = compileSpecificationProject({ ...createCanonicalProjectEnvelope(state.project, state.draft?.id ?? "published"), revision: canonicalRevision });
            if (current.status === "compiled")
                currentRevision = current.plan.evaluatorContentIdentity;
        }
        renderedCase = compareGuidedTestCase({ ...testCase, evaluatorRevision: currentRevision });
        if (testCase.status !== "Blocked" && renderedCase.status === "Stale" && testCase.status !== "Stale")
            queueMicrotask(() => { if (!state)
                return; persist(transactProject(state, `Mark Test case ${testCase.name} stale`, (project) => ({ ...project, collections: { ...project.collections, fixtures: project.collections.fixtures.map((candidate) => candidate.id === entity.id ? renderedCase : candidate) } }))); });
    }
    const actualEvidence = document.createElement("section"), actualHeading = document.createElement("h3");
    actualHeading.textContent = "Actual and expected evidence";
    actualEvidence.dataset.testEvidence = "true";
    actualEvidence.append(actualHeading, Object.assign(document.createElement("p"), { textContent: testCase.actualResult ? `Observed outcome: ${testCase.actualResult.outcome ?? "not reported"} · Test comparison: ${renderedCase.status}` : "No actual result has been recorded." }));
    for (const issue of testCase.actualResult?.issues ?? [])
        actualEvidence.append(Object.assign(document.createElement("p"), { textContent: `Actual ${issue.path} · ${issue.code} · Expected ${pairedIssues.some((expected) => expected.path === issue.path && expected.code === issue.code) ? "paired" : "not reviewed"}` }));
    const differences = document.createElement("section");
    differences.setAttribute("aria-label", "Test case differences and repairs");
    for (const difference of renderedCase.differences) {
        const repair = document.createElement("button");
        repair.type = "button";
        repair.textContent = `Repair expected ${difference.field}`;
        repair.addEventListener("click", () => { const target = difference.field === "winner" ? winner : difference.field === "outcome" ? outcome : difference.field === "applicablePageGroups" ? pageGroups : issueChoices.querySelector("input"); target?.focus(); });
        differences.append(Object.assign(document.createElement("p"), { textContent: `${difference.field}: expected ${JSON.stringify(difference.expected)}, actual ${JSON.stringify(difference.actual)}` }), repair);
    }
    const run = document.createElement("button"), useActual = document.createElement("button"), repairRun = document.createElement("button");
    run.type = "submit";
    run.textContent = renderedCase.status === "Stale" ? "Rerun against current Draft" : "Save and run";
    useActual.type = repairRun.type = "button";
    useActual.textContent = "Use actual as expected";
    useActual.disabled = !testCase.actualResult;
    repairRun.textContent = "Repair Test case";
    repairRun.hidden = true;
    repairRun.addEventListener("click", () => { const target = form.querySelector("[aria-invalid=true],:invalid") ?? schemaSelect; target.focus(); });
    result.id = "fixture-run-result";
    result.setAttribute("aria-live", "polite");
    result.textContent = `${renderedCase.status} · ${renderedCase.status === "Stale" ? "prior actual and expected evidence retained; rerun is available" : renderedCase.differences.map(({ field }) => field).join(", ") || "complete guided input and review expectations"}`;
    const readExpectations = () => { const issues = Array.from(issueChoices.querySelectorAll("input:checked"), ({ value }) => { const [path, code] = value.split("\t"); return { path: path, code: code }; }); return { ...(winner.value ? { winner: winner.value } : {}), ...(type.value === "page-context" && pageGroups.selectedOptions.length ? { applicablePageGroups: Array.from(pageGroups.selectedOptions, ({ value }) => value) } : {}), ...(outcome.value ? { outcome: outcome.value } : {}), ...(issues.length ? { issues } : {}) }; };
    form.addEventListener("submit", async (event) => { event.preventDefault(); if (!state)
        return; eventSelect.required = type.value === "event-validation"; pageSelect.required = type.value === "page-context"; const inputIssues = validateGuidedInput(guidedControlsForSchema(schema, draftInput), draftInput); if (inputIssues.length) {
        result.textContent = `Blocked: ${inputIssues[0].message}`;
        mountInput();
        inputGroup.querySelector(`[data-guided-property="${CSS.escape(inputIssues[0].path)}"] input,[data-guided-array="${CSS.escape(inputIssues[0].path)}"] button`)?.focus();
        return;
    } if (!form.reportValidity()) {
        form.querySelector(":invalid")?.focus();
        return;
    } const reviewedExpectations = readExpectations(); if (!Object.keys(reviewedExpectations).length) {
        result.textContent = "Blocked: review at least one expected result.";
        expectations.querySelector("select,input")?.focus();
        return;
    } const prepared = { ...testCase, name: name.value.trim(), testType: type.value, eventId: eventSelect.value || undefined, pageId: pageSelect.value || undefined, input: structuredClone(draftInput), payload: structuredClone(draftInput), inputGuidance: { schemaId: schemaSelect.value, revision: String(schema?.canonicalSchema?.revision ?? schema?.revision ?? 1), kind: "authoring-guidance" }, reviewedExpectations, status: "Blocked", differences: [] }, persisted = transactProject(state, `Save Test case ${prepared.name}`, (project) => ({ ...project, collections: { ...project.collections, fixtures: project.collections.fixtures.map((candidate) => candidate.id === entity.id ? prepared : candidate) } })); persist(persisted); try {
        await durableProjectRuntime.settled();
        if (saveStatus.kind === "failed" || durableProjectRuntime.failedSave()) {
            result.textContent = "Save failed. Evaluation did not run; exact editable input is preserved.";
            repairRun.hidden = false;
            repairRun.focus();
            return;
        }
        await durableProjectRuntime.ensureProject(state.project.id);
        await durableProjectRuntime.settled();
        const loaded = await durableProjectRuntime.repository.loadProject(state.project.id);
        state = structuredClone(loaded.state);
        canonicalRevision = loaded.draftSequence;
        const saved = state.project.collections.fixtures.find(({ id }) => id === entity.id);
        let actualResult;
        if (saved.testType === "page-context") {
            const evaluated = evaluatePageGroupFixture(state, saved.id), included = new Set(evaluated.includedStack);
            actualResult = { applicablePageGroups: state.project.collections.pageGroups.filter(({ name }) => included.has(name)).map(({ id }) => id), outcome: evaluated.validation.issues.length ? "Invalid" : "Valid", issues: evaluated.validation.issues.map(({ path, code }) => ({ path, code })), evaluatorRevision: guidedPageEvaluatorRevision(state, saved.pageId) };
        }
        else {
            const { plan } = await loadProductionSpecificationPlan(durableProjectRuntime.repository, state.project.id);
            const execution = runProductionFixture(plan, saved), actual = execution.steps.at(-1)?.actual;
            if (!actual)
                throw new Error(execution.blockers?.join(" ") ?? "Production evaluation produced no result.");
            actualResult = { winner: actual.winner?.assignmentId ?? "no-assignment", outcome: actual.issueDetails.length ? "Invalid" : "Valid", issues: actual.issueDetails.map(({ path, code }) => ({ path, code })), evaluatorRevision: plan.evaluatorContentIdentity, resultIdentity: actual.resultIdentity };
        }
        const compared = compareGuidedTestCase({ ...saved, actualResult, evaluatorRevision: actualResult.evaluatorRevision });
        persist(transactProject(state, `Record Test case result ${saved.name}`, (project) => ({ ...project, collections: { ...project.collections, fixtures: project.collections.fixtures.map((candidate) => candidate.id === entity.id ? compared : candidate) } })));
        await durableProjectRuntime.settled();
        result.textContent = `${compared.status} · Observed outcome: ${actualResult.outcome} · Test comparison: ${compared.status} · ${compared.differences.map(({ field }) => field).join(", ") || "actual and reviewed expectations retained"}`;
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        document.body.dataset.guidedTestError = message;
        result.textContent = `Blocked: ${message}. Saved input and prior evidence are retained.`;
        repairRun.hidden = false;
        repairRun.focus();
    } });
    useActual.addEventListener("click", () => { if (!state || !testCase.actualResult)
        return; const actual = testCase.actualResult, reviewedExpectations = { ...(actual.winner ? { winner: actual.winner } : {}), ...(actual.applicablePageGroups ? { applicablePageGroups: actual.applicablePageGroups } : {}), ...(actual.outcome ? { outcome: actual.outcome } : {}), ...(actual.issues ? { issues: actual.issues } : {}) }, compared = compareGuidedTestCase({ ...testCase, reviewedExpectations, evaluatorRevision: actual.evaluatorRevision }); persist(transactProject(state, `Review actual Test case result ${testCase.name}`, (project) => ({ ...project, collections: { ...project.collections, fixtures: project.collections.fixtures.map((candidate) => candidate.id === entity.id ? compared : candidate) } }))); });
    form.append(actualEvidence, differences, run, useActual, repairRun, result);
    section.append(heading, definition, steps, form);
    content.append(section);
}
function renderProfileInheritanceCards(host, entity) {
    if (!state || !(selectedKind === "pages" || selectedKind === "pageGroups" || selectedKind === "events"))
        return;
    const kind = selectedKind, pending = pendingProfileSource?.targetId === entity.id ? [pendingProfileSource.profileId] : [], profileIds = [...new Set([...(entity.profileIds ?? []), ...(typeof entity.profileId === "string" ? [entity.profileId] : []), ...pending])], stored = entity.profileInheritanceRecipes ?? [], scope = kind === "pages" ? "Page" : kind === "pageGroups" ? "Page Group" : "Event";
    for (const profileId of profileIds) {
        const profile = state.project.collections.profiles.find(({ id: profileIdentity }) => profileIdentity === profileId), canonical = profile?.canonicalSchema;
        if (!profile || !canonical)
            continue;
        const recipe = stored.find((candidate) => candidate.profileId === profileId) ?? createProfileInheritanceRecipe({ id: id("inheritance-recipe"), profileId, targetId: entity.id, startingPoint: "everything", sourceRevision: canonical.revision }), copySources = ['pages', 'pageGroups', 'events'].flatMap((kind) => state.project.collections[kind].flatMap((candidate) => candidate.id === entity.id ? [] : (candidate.profileInheritanceRecipes ?? []).filter((candidateRecipe) => candidateRecipe.profileId === profileId).map((candidateRecipe) => ({ label: `${candidate.name} (${labels[kind]})`, recipe: candidateRecipe }))));
        const compositionPreview = (staged) => { const stagedEntity = { ...entity, profileInheritanceRecipes: [...stored.filter((candidate) => candidate.profileId !== profileId), staged] }, stagedState = { ...state, project: { ...state.project, collections: { ...state.project.collections, [kind]: state.project.collections[kind].map((candidate) => candidate.id === entity.id ? stagedEntity : candidate) } } }, previewModel = composedSchemaWorkspace(stagedState, stagedEntity, scope); return { sources: profileIds.flatMap((identity) => { const source = state.project.collections.profiles.find(({ id }) => id === identity); return source ? [source.name] : []; }), rows: previewModel.rows.map((row) => ({ path: row.path, source: row.source, effective: effectivePropertySummary(row.effective) })), conflicts: previewModel.rows.filter(({ validationState }) => validationState === "blocked").map((row) => ({ path: row.path, sources: [...new Set(row.provenance.map(({ contributorName }) => contributorName))], summary: row.decisions?.map(({ detail }) => detail).join(" · ") || row.message, resolutionLabel: "Open property decision" })), status: previewModel.status }; };
        const card = mountSelectiveProfileInheritance({ host, profile: { id: profile.id, name: profile.name, canonicalSchema: canonical }, target: { id: entity.id, name: entity.name }, recipe, copySources, compositionPreview, id, onOpenConflict: (path) => { const row = Array.from(document.querySelectorAll("[data-effective-property-path]")).find(({ dataset }) => dataset.effectivePropertyPath === path), action = row?.querySelector("[data-property-actions-path]"); action?.click(); action?.focus(); }, onApply: (applied) => { if (!state)
                return; const reviewed = profileInheritanceRecipeApplied(canonical, applied), next = transactProject(state, `Apply ${profile.name} inheritance to ${entity.name}`, (project) => ({ ...project, collections: { ...project.collections, [kind]: project.collections[kind].map((candidate) => candidate.id !== entity.id ? candidate : { ...candidate, profileIds: [...new Set([...(candidate.profileIds ?? []), profileId])], profileInheritanceRecipes: [...(candidate.profileInheritanceRecipes ?? []).filter((candidateRecipe) => candidateRecipe.profileId !== profileId), reviewed], compiledTargetsStale: true, validationStale: true, testCasesStale: true, documentationStale: true, exportStale: true }) } })); pendingProfileSource = undefined; pendingProfileInheritanceFocus = profileId; persist(next); } });
        if (pendingProfileSource?.targetId === entity.id && pendingProfileSource.profileId === profileId)
            queueMicrotask(() => card.querySelector("button")?.click());
    }
}
function renderPageDetailsEditor(host, page) {
    const details = document.createElement("section"), heading = document.createElement("h2"), form = document.createElement("form"), name = document.createElement("input"), description = document.createElement("textarea"), save = document.createElement("button");
    details.className = "contextual-editor";
    details.setAttribute("aria-label", "Page details");
    heading.textContent = "Page details";
    name.name = "name";
    name.required = true;
    name.value = page.name;
    description.name = "description";
    description.rows = 3;
    description.value = String(page.description ?? "");
    const guided = (labelText, control, guidanceText) => { const label = document.createElement("label"), guidance = document.createElement("small"); label.textContent = labelText; guidance.id = `page-details-${control.name}-guidance`; guidance.textContent = guidanceText; control.setAttribute("aria-describedby", guidance.id); label.append(control, guidance); return label; };
    save.type = "submit";
    save.textContent = "Save Page details";
    form.append(guided("Name", name, "A stable, recognizable name for this reusable Page schema context."), guided("Description (optional)", description, "Explain the Page's purpose for project authors."), save);
    form.addEventListener("submit", (event) => { event.preventDefault(); try {
        persist(savePageDetails(state, page.id, { name: name.value, description: description.value }));
    }
    catch (error) {
        q("#project-state").textContent = error instanceof Error ? error.message : String(error);
    } });
    details.append(heading, form);
    host.append(details);
}
function renderProfileInheritanceEditor(host, entity, includePageGroups = false) {
    if (!state)
        return;
    const section = document.createElement("section"), heading = document.createElement("h2"), add = document.createElement("button"), picker = document.createElement("section"), search = document.createElement("input"), results = document.createElement("div"), existing = new Set([...(entity.profileIds ?? []), ...(entity.profileInheritanceRecipes ?? []).map(({ profileId }) => profileId)]);
    section.setAttribute("aria-label", "Inherited schema");
    heading.textContent = "Inherited schema";
    add.type = "button";
    add.textContent = "Add Shared Profile";
    picker.hidden = true;
    picker.setAttribute("aria-label", "Add Shared Profile picker");
    search.type = "search";
    search.setAttribute("aria-label", "Search Shared Profiles to inherit");
    const renderResults = () => results.replaceChildren(...state.project.collections.profiles.filter(({ id, name }) => !existing.has(id) && name.toLowerCase().includes(search.value.trim().toLowerCase())).map((profile) => { const choose = document.createElement("button"); choose.type = "button"; choose.textContent = profile.name; choose.addEventListener("click", () => { const projectId = state.project.id, targetId = entity.id; void durableProjectRuntime.repository.loadProject(projectId).then((loaded) => { if (state?.project.id !== projectId || selectedId !== targetId)
        return; state = { ...structuredClone(loaded.state), history: state.history }; pendingProfileSource = { targetId, profileId: profile.id }; render(); }); }); return choose; }));
    search.addEventListener("input", renderResults);
    add.addEventListener("click", () => { picker.hidden = false; search.focus(); });
    picker.append(search, results);
    renderResults();
    section.append(heading, add, picker);
    renderProfileInheritanceCards(section, entity);
    if (includePageGroups)
        renderPageGroupMembershipEditor(section, entity);
    host.append(section);
}
function renderSelectedEntityEditor(content, entity) {
    if (!state)
        return;
    if (selectedKind === "fixtures") {
        renderGuidedTestCaseEditor(content, entity);
        return;
    }
    if (selectedKind === "pages") {
        renderPageDetailsEditor(content, entity);
        return;
    }
    if (selectedKind === "assignments") {
        mountAssignmentRoutingWorkspace({ host: content, state, assignment: entity, id, loadState: async () => structuredClone((await durableProjectRuntime.repository.loadProject(state.project.id)).state), onSave: (next) => { persist(next); render(); } });
        return;
    }
    const section = document.createElement("section");
    const heading = document.createElement("h2");
    const form = document.createElement("form");
    const nameLabel = document.createElement("label");
    const name = document.createElement("input");
    const actions = document.createElement("div");
    const save = document.createElement("button");
    const duplicate = document.createElement("button");
    const usage = document.createElement("p");
    section.className = "contextual-editor";
    heading.textContent = `Edit ${labels[selectedKind].replace(/s$/, "")}`;
    name.name = "name";
    name.required = true;
    name.value = entity.name;
    nameLabel.textContent = "Name";
    nameLabel.append(name);
    form.append(nameLabel);
    for (const field of editorFields[selectedKind]) {
        const label = document.createElement("label");
        const control = productionFieldControl(field, selectedKind === "flows" && field.key === "pageGroupIds"
            ? { ...entity, pageGroupIds: flowPageGroupLaneIds(state.project, entity.id) }
            : entity);
        if (control instanceof HTMLInputElement && control.type === "checkbox")
            declareStudioChoice(control, "entity.editor-option");
        label.textContent = field.label;
        label.append(control);
        form.append(label);
    }
    save.type = "submit";
    save.textContent = "Save complete entity";
    duplicate.type = "button";
    duplicate.textContent = "Duplicate";
    usage.textContent = `Where used: ${whereUsed(entity.id).join(", ") || "None"}`;
    actions.className = "editor-actions";
    actions.append(save, duplicate);
    form.append(actions, usage);
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!state)
            return;
        try {
            const update = { name: name.value.trim() };
            for (const field of editorFields[selectedKind]) {
                update[field.key] = productionEditorValue(field, form.elements.namedItem(field.key));
            }
            const laneIds = selectedKind === "flows" ? update.pageGroupIds : undefined;
            if (laneIds)
                delete update.pageGroupIds;
            if (selectedKind === "pageGroups" || selectedKind === "events") {
                const selectedProfiles = update.profileIds ?? [], existing = entity.profileInheritanceRecipes ?? [];
                update.profileInheritanceRecipes = selectedProfiles.flatMap((profileId) => {
                    const retained = existing.find((recipe) => recipe.profileId === profileId);
                    if (retained)
                        return [retained];
                    const profile = state.project.collections.profiles.find(({ id: profileIdentity }) => profileIdentity === profileId), canonical = profile?.canonicalSchema;
                    const recipe = createProfileInheritanceRecipe({ id: id("inheritance-recipe"), profileId, targetId: entity.id, startingPoint: "everything", sourceRevision: canonical?.revision ?? Number(profile?.revision ?? 1) });
                    return [canonical ? profileInheritanceRecipeApplied(canonical, recipe) : recipe];
                });
            }
            const edited = transactProject(state, `Edit ${entity.name}`, (project) => ({
                ...project,
                collections: {
                    ...project.collections,
                    [selectedKind]: project.collections[selectedKind].map((candidate) => {
                        if (candidate.id !== entity.id)
                            return candidate;
                        const merged = { ...candidate, ...update };
                        if (selectedKind === "flows")
                            delete merged.pageGroupIds;
                        if (selectedKind === "pageGroups") {
                            merged.description = String(merged.description ?? "").trim();
                            if (!merged.description)
                                delete merged.description;
                            if (Array.isArray(merged.profileIds) && !merged.profileIds.length)
                                delete merged.profileIds;
                            if (Array.isArray(merged.profileInheritanceRecipes) && !merged.profileInheritanceRecipes.length)
                                delete merged.profileInheritanceRecipes;
                            delete merged.environment;
                            delete merged.matcher;
                        }
                        if (update.applicabilitySetId === "")
                            delete merged.applicabilitySetId;
                        return merged;
                    }),
                },
            }));
            persist(selectedKind === "flows"
                ? applyFlowPageGroupLaneSelection(edited, entity.id, laneIds)
                : edited);
        }
        catch (error) {
            q("#project-state").textContent = error instanceof Error ? error.message : String(error);
        }
    });
    duplicate.addEventListener("click", () => {
        if (!state)
            return;
        const { id: ignored, ...copy } = entity;
        persist(addProjectEntity(state, selectedKind, { ...structuredClone(copy), name: `${entity.name} copy` }, id));
    });
    section.append(heading, form);
    content.append(section);
    if (selectedKind === "profiles")
        renderCanonicalEntityEditor(content, selectedKind, entity);
}
function renderTree() { const tree = q("#project-tree"); tree.replaceChildren(); if (!state)
    return; const documentation = document.createElement("li"), documentationButton = document.createElement("button"); documentationButton.type = "button"; documentationButton.textContent = `Documentation (${state.project.documentation?.sets.length ?? 0})`; documentationButton.dataset.kind = "documentation"; documentationButton.setAttribute("aria-current", String(documentationOpen)); documentationButton.addEventListener("click", () => { documentationOpen = true; projectOverview = false; selectedId = undefined; const url = new URL(location.href); url.searchParams.set("project", state.project.id); url.searchParams.set("view", "documentation"); url.searchParams.delete("route"); url.searchParams.delete("kind"); url.searchParams.delete("entity"); history.replaceState(null, "", url); render(); }); documentation.append(documentationButton); tree.append(documentation); const overview = document.createElement("li"), overviewButton = document.createElement("button"); overviewButton.type = "button"; overviewButton.textContent = "Project overview"; overviewButton.dataset.kind = "overview"; overviewButton.setAttribute("aria-current", String(projectOverview)); overviewButton.addEventListener("click", openProjectOverview); overview.append(overviewButton); tree.append(overview); for (const kind of Object.keys(labels)) {
    const item = document.createElement("li"), button = document.createElement("button"), count = kind === "assignments" ? searchProjectAssignments(state.project, "").count : state.project.collections[kind].length;
    button.type = "button";
    button.textContent = `${labels[kind]} (${count})`;
    button.dataset.kind = kind;
    button.setAttribute("aria-current", String(!documentationOpen && !projectOverview && kind === selectedKind));
    button.addEventListener("click", () => openCollectionOverview(kind));
    item.append(button);
    tree.append(item);
} const release = document.createElement("li"), button = document.createElement("button"); button.type = "button"; button.textContent = `Releases (${state.project.releases.length})`; button.dataset.kind = "releases"; release.append(button); tree.append(release); }
function renderCollectionGuidance(content) { if (!state)
    return; const entityName = { profiles: "Profile", applicabilitySets: "Applicability Set", pages: "Page", pageGroups: "Page", events: "Event", flows: "Flow", assignments: "Assignment", fixtures: "Fixture" }, name = entityName[selectedKind], section = document.createElement("section"); section.className = "project-guidance"; if (name) {
    const guidance = entityPurposeGuidance(name), heading = document.createElement("h2"), purpose = document.createElement("p"), example = document.createElement("p"), prerequisites = document.createElement("p"), usedBy = document.createElement("p"), distinction = document.createElement("p");
    heading.textContent = `About ${name}`;
    purpose.textContent = guidance.purpose;
    example.textContent = `Example: ${guidance.example}`;
    prerequisites.textContent = `Prerequisites: ${guidance.prerequisites.join(", ")}`;
    usedBy.textContent = guidance.usedBy;
    distinction.textContent = `Unlike ${guidance.distinguishesFrom}, this entity ${guidance.purpose.toLowerCase()}`;
    section.append(heading, purpose, example, prerequisites, usedBy, distinction);
} if (Object.values(state.project.collections).every((entities) => entities.length === 0)) {
    const guidance = projectAuthoringGuidance(state.project), heading = document.createElement("h2"), tasks = document.createElement("div"), map = document.createElement("ol"), next = document.createElement("button"), reason = document.createElement("p"), worked = document.createElement("details"), workedSummary = document.createElement("summary"), workedBody = document.createElement("p");
    heading.textContent = "Build Retail and Trade by task";
    tasks.className = "task-entry-points";
    for (const task of guidance.tasks) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = task.label;
        tasks.append(button);
    }
    map.className = "specification-map";
    for (const stage of guidance.map) {
        const item = document.createElement("li");
        item.textContent = `${stage.name}: ${stage.complete ? "Complete" : `Blocked — ${stage.blocker}`}`;
        map.append(item);
    }
    next.type = "button";
    next.className = "primary-continue";
    next.textContent = guidance.continue.label;
    reason.textContent = `${guidance.continue.reason} Unlocks: ${guidance.continue.unlocks}.`;
    workedSummary.textContent = "Retail and Trade worked example";
    workedBody.textContent = "One shared Checkout confirmation Page and Purchase Event combine with Sitewide, Retail, and Trade Profiles; two Flows route Assignments into positive and negative Fixtures, Coverage, Release, and published-plan Live.";
    worked.append(workedSummary, workedBody);
    section.append(heading, tasks, map, next, reason, worked);
} if (section.childElementCount)
    content.append(section); }
function replaceProjectRoute(kind, entityId, action) { if (!state)
    return; const url = new URL(location.href); url.searchParams.set("project", state.project.id); url.searchParams.delete("view"); if (action)
    url.searchParams.set("route", action);
else
    url.searchParams.delete("route"); url.searchParams.set("kind", kind); if (entityId)
    url.searchParams.set("entity", entityId);
else
    url.searchParams.delete("entity"); history.replaceState(null, "", url); }
function openProjectOverview() { if (!state)
    return; setPageApplicabilityPreviewRoute(undefined); pendingWorkspaceFocus = undefined; documentationOpen = false; projectOverview = true; creationKind = undefined; removalReview = undefined; selectedId = undefined; const url = new URL(location.href); url.searchParams.set("project", state.project.id); url.searchParams.set("route", "overview"); url.searchParams.delete("view"); url.searchParams.delete("kind"); url.searchParams.delete("entity"); history.replaceState(null, "", url); render(); queueMicrotask(() => q("#workspace-content h1").focus({ preventScroll: true })); }
function focusCurrentStudioContext() { const target = projectInspector.hidden ? document.querySelector("#workspace-content h1, #workspace-content [data-add-kind], #workspace-pane") : projectInspector; target?.focus({ preventScroll: true }); }
function restorePendingLifecycleFocus() { const pending = pendingLifecycleFocus; if (!pending)
    return; const target = pending.id ? document.querySelector(`[data-entity-id="${CSS.escape(pending.id)}"]`) : document.querySelector(`[data-add-kind="${pending.kind}"]`); target?.focus({ preventScroll: true }); }
function restorePendingWorkspaceFocus() { const pending = pendingWorkspaceFocus; if (!pending || selectedKind !== pending.kind || selectedId !== pending.id)
    return; document.querySelector(`[data-project-entity-workspace="${CSS.escape(pending.id)}"] h1`)?.focus({ preventScroll: true }); }
function hydrateVisibleProjectRoute(kind, entityId, focus) { if (!state)
    return; const projectId = state.project.id; void durableProjectRuntime.ensureProjectRoute(projectId, durableProjectRouteForWorkspace(kind, entityId)).then((loaded) => { if (state?.project.id !== projectId || selectedKind !== kind || selectedId !== entityId)
    return; state = { ...structuredClone(loaded.state), history: { undo: [], redo: [] } }; lastCommittedState = structuredClone(state); canonicalRevision = loaded.draftSequence; publishedRevision = loaded.publishedRevision; library = restoreProjectLibrary(projectStorage.getItem(PROJECT_LIBRARY_STORAGE_KEY)) ?? library; if (pendingWorkspaceFocus?.kind === kind && pendingWorkspaceFocus.id === entityId)
    pendingWorkspaceFocus = undefined; render(); queueMicrotask(() => focus?.()?.focus({ preventScroll: true })); }).catch((error) => { pendingWorkspaceFocus = undefined; saveStatus = { kind: "failed", label: `Open ${labels[kind]}`, message: error instanceof Error ? error.message : String(error) }; render(); }); }
function openCollectionOverview(kind, focusId) { setPageApplicabilityPreviewRoute(undefined); pendingWorkspaceFocus = undefined; documentationOpen = false; projectOverview = false; creationKind = undefined; removalReview = undefined; selectedKind = kind; selectedId = undefined; persistNavigation(); replaceProjectRoute(kind); render(); hydrateVisibleProjectRoute(kind, undefined, () => focusId ? document.querySelector(`[data-entity-id="${CSS.escape(focusId)}"]`) : document.querySelector(`[data-add-kind="${kind}"]`)); }
function openProjectEntityWorkspace(kind, entityId) { setPageApplicabilityPreviewRoute(kind === "pages" ? { projectId: state.project.id, pageId: entityId } : undefined); pendingWorkspaceFocus = { kind, id: entityId }; projectOverview = false; creationKind = undefined; removalReview = undefined; selectedKind = kind; selectedId = entityId; durableProjectRuntime.prepareProjectRoute(state.project.id, durableProjectRouteForWorkspace(kind, entityId)); persistNavigation(); replaceProjectRoute(kind, entityId); render(); queueMicrotask(restorePendingWorkspaceFocus); hydrateVisibleProjectRoute(kind, entityId, () => document.querySelector(`[data-project-entity-workspace="${CSS.escape(entityId)}"] h1`)); }
function openProjectCollectionCreation(kind) { setPageApplicabilityPreviewRoute(undefined); pendingWorkspaceFocus = undefined; projectOverview = false; creationKind = kind; removalReview = undefined; selectedKind = kind; selectedId = undefined; persistNavigation(); replaceProjectRoute(kind, undefined, "add"); render(); }
function projectCreationFieldControl(field) { if (field.key === "targetId" && state) {
    const select = document.createElement("select");
    select.name = field.key;
    for (const target of assignmentContributorTargets(state))
        select.append(new Option(`${target.kind} · ${target.name}`, target.id));
    if (!select.options.length)
        select.append(new Option("No canonical contributors available", ""));
    return select;
} if (field.collection && state) {
    const select = document.createElement("select");
    select.name = field.key;
    select.multiple = Boolean(field.multiple);
    for (const entity of state.project.collections[field.collection])
        select.append(new Option(entity.name, entity.id));
    if (!select.options.length)
        select.append(new Option(`No ${field.label} available`, ""));
    return select;
} if (field.control === "select") {
    const select = document.createElement("select");
    select.name = field.key;
    for (const option of field.options ?? [])
        select.append(new Option(option.label, option.value));
    if (field.defaultValue !== undefined)
        select.value = String(field.defaultValue);
    return select;
} if (field.control === "textarea") {
    const textarea = document.createElement("textarea");
    textarea.name = field.key;
    textarea.rows = 3;
    textarea.value = String(field.defaultValue ?? "");
    return textarea;
} const input = document.createElement("input"); input.name = field.key; input.type = field.control ?? "text"; if (field.control === "checkbox")
    input.checked = Boolean(field.defaultValue);
else
    input.value = String(field.defaultValue ?? ""); if (field.key === "eventName")
    input.placeholder = "Derived from name when blank"; return input; }
function projectCreationFieldValue(field, control) { if (control instanceof HTMLSelectElement)
    return field.multiple ? Array.from(control.selectedOptions, ({ value }) => value).filter(Boolean) : control.value; if (control instanceof HTMLInputElement && field.control === "checkbox")
    return control.checked; if (field.control === "number")
    return Number(control.value); return control.value; }
function renderCreationPage(content, kind) {
    if (!state)
        return;
    const definition = projectCollectionDefinitions[kind], route = projectCollectionCreationRoute(kind), fields = projectCollectionCreationFields[kind], section = document.createElement("section"), heading = document.createElement("h1"), purpose = document.createElement("p"), prerequisites = document.createElement("p"), usedBy = document.createElement("p"), form = document.createElement("form"), name = document.createElement("input"), nameLabel = document.createElement("label"), settings = document.createElement("fieldset"), legend = document.createElement("legend"), cancel = document.createElement("button"), create = document.createElement("button"), feedback = document.createElement("output");
    section.className = "collection-lifecycle-page";
    section.dataset.creationKind = kind;
    section.dataset.projectRoute = "add";
    section.setAttribute("aria-label", route.label);
    heading.tabIndex = -1;
    heading.textContent = route.heading;
    purpose.textContent = `Purpose: ${definition.purpose}. Example: ${definition.example}.`;
    prerequisites.textContent = `Prerequisites: ${definition.prerequisites.join(", ")}.`;
    usedBy.textContent = `Used by: ${definition.consumers.join(", ")}.`;
    nameLabel.textContent = `${definition.singular} name`;
    name.name = "name";
    name.required = true;
    nameLabel.append(name);
    legend.textContent = `${definition.singular} settings`;
    settings.dataset.creationFields = kind;
    settings.append(legend);
    for (const field of fields) {
        const label = document.createElement("label"), control = projectCreationFieldControl(field);
        if (kind === "pages" && field.key === "eventName") {
            control.required = true;
            control.setAttribute("placeholder", "Required observed Page event");
        }
        if (control instanceof HTMLInputElement && control.type === "checkbox")
            declareStudioChoice(control, "entity.creation-option");
        label.textContent = field.label;
        control.dataset.creationField = field.key;
        label.append(control);
        if (field.guidance) {
            const guidance = document.createElement("small");
            guidance.id = `creation-${kind}-${field.key}-guidance`;
            guidance.textContent = field.guidance;
            control.setAttribute("aria-describedby", guidance.id);
            label.append(guidance);
        }
        settings.append(label);
    }
    cancel.type = "button";
    create.type = "submit";
    cancel.textContent = "Cancel";
    create.textContent = `Create ${definition.singular}`;
    cancel.addEventListener("click", () => openCollectionOverview(kind));
    form.addEventListener("submit", (event) => { event.preventDefault(); try {
        const values = Object.fromEntries(fields.map((field) => [field.key, projectCreationFieldValue(field, form.elements.namedItem(field.key))])), next = createProjectCollectionEntity(state, kind, name.value, id, values), created = next.project.collections[kind].at(-1);
        creationKind = undefined;
        selectedKind = kind;
        selectedId = created.id;
        lifecycleStatus = `Created ${definition.singular} ${created.name} in the Saved Draft.`;
        persist(next);
        persistNavigation();
        replaceProjectRoute(kind, created.id);
        queueMicrotask(() => document.querySelector(`[data-project-entity-workspace="${CSS.escape(created.id)}"] h1`)?.focus({ preventScroll: true }));
    }
    catch (error) {
        feedback.textContent = error instanceof Error ? error.message : String(error);
    } });
    form.append(nameLabel, settings, cancel, create, feedback);
    section.append(heading, purpose, prerequisites, usedBy, form);
    content.append(section);
    q("#project-breadcrumb").textContent = `${state.project.name} / ${definition.overview} / Create`;
    queueMicrotask(() => heading.focus({ preventScroll: true }));
}
function renderRemovalPage(content, review) { if (!state)
    return; const definition = projectCollectionDefinitions[review.kind], section = document.createElement("section"), heading = document.createElement("h1"), summary = document.createElement("p"), dependencies = document.createElement("ul"), actions = document.createElement("div"), cancel = document.createElement("button"), confirm = document.createElement("button"); section.className = "collection-lifecycle-page"; section.dataset.removalKind = review.kind; heading.tabIndex = -1; heading.textContent = `Review removal of ${review.name}`; summary.textContent = review.summary; for (const dependency of review.dependencies) {
    const item = document.createElement("li"), open = document.createElement("button"), kind = dependency.kind === "flowGraph" ? "flows" : dependency.kind;
    item.textContent = `${dependency.name}: ${dependency.relationship}. `;
    open.type = "button";
    open.textContent = `Open ${dependency.name}`;
    open.addEventListener("click", () => openProjectEntityWorkspace(kind, dependency.id));
    item.append(open);
    dependencies.append(item);
} cancel.type = confirm.type = "button"; cancel.textContent = "Cancel removal"; confirm.textContent = `Remove ${review.name}`; confirm.disabled = review.blocked; cancel.addEventListener("click", () => openCollectionOverview(review.kind, review.id)); confirm.addEventListener("click", () => { const entities = state.project.collections[review.kind], index = entities.findIndex(({ id }) => id === review.id), focus = entities[index + 1]?.id ?? entities[index - 1]?.id; removedFocus = { kind: review.kind, id: review.id }; pendingLifecycleFocus = { kind: review.kind, ...(focus ? { id: focus } : {}) }; removalReview = undefined; selectedKind = review.kind; selectedId = undefined; lifecycleStatus = `Removed ${review.name}. Draft saved; dependent evidence is stale. Undo restores the same stable identity.`; persist(removeProjectCollectionEntity(state, review.kind, review.id)); persistNavigation(); replaceProjectRoute(review.kind); void durableProjectRuntime.settled().then(() => queueMicrotask(() => { restorePendingLifecycleFocus(); pendingLifecycleFocus = undefined; })); }); actions.append(cancel, confirm); section.append(heading, summary, dependencies, actions); content.append(section); q("#project-breadcrumb").textContent = `${state.project.name} / ${definition.overview} / Remove ${review.name}`; queueMicrotask(() => heading.focus({ preventScroll: true })); }
function renderProjectEntityWorkspace(content, kind, entity) { if (!state)
    return; const route = projectEntityWorkspaceRoute(kind, entity.id, entity.name), workspace = document.createElement("section"), heading = document.createElement("h1"), back = document.createElement("button"); workspace.dataset.projectEntityWorkspace = entity.id; workspace.dataset.projectEntityKind = kind; workspace.setAttribute("aria-label", route.label); heading.tabIndex = -1; heading.textContent = route.heading; back.type = "button"; back.textContent = route.backAction; back.addEventListener("click", () => openCollectionOverview(kind, entity.id)); workspace.append(heading, back); content.append(workspace); if (kind === "flows") {
    const graphHost = document.createElement("div"), inspectorHost = q("#flow-inspector-context");
    graphHost.id = "flow-graph-workspace";
    workspace.append(graphHost);
    inspectorHost.replaceChildren();
    renderSelectedEntityEditor(inspectorHost, entity);
    return;
} q("#flow-inspector-context").replaceChildren(); renderSelectedEntityEditor(workspace, entity); if (kind === "pages") {
    renderProfileInheritanceEditor(workspace, entity, true);
    renderComposedSchemaWorkspace(workspace, entity, "pages", "Page", [...(pageApplicabilityPreviews.get(entity.id) ?? new Set())]);
} if (kind === "pageGroups") {
    const members = document.createElement("section"), memberList = document.createElement("ul");
    members.setAttribute("aria-label", "Derived Page Group members");
    members.append(Object.assign(document.createElement("h3"), { textContent: "Derived members" }));
    for (const page of pageGroupMembers(state.project, entity.id))
        memberList.append(Object.assign(document.createElement("li"), { textContent: page.name }));
    members.append(memberList);
    workspace.append(members);
    renderProfileInheritanceEditor(workspace, entity);
    renderComposedSchemaWorkspace(workspace, entity, "pageGroups", "Page Group");
} if (kind === "events") {
    renderProfileInheritanceEditor(workspace, entity);
    renderComposedSchemaWorkspace(workspace, entity, "events", "Event");
} }
function renderWorkspace() {
    const content = q("#workspace-content");
    content.replaceChildren();
    if (!state)
        return;
    if (documentationOpen) {
        q("#project-breadcrumb").textContent = `${state.project.name} / Documentation`;
        q("#inspector-context").textContent = "Project-level Documentation Sets, themes, previews, and export.";
        projectDocumentationWorkspaceUi?.render(content);
        return;
    }
    if (projectOverview) {
        const heading = document.createElement("h1"), identity = document.createElement("p"), metadata = document.createElement("dl"), openSchemas = document.createElement("button"), details = [["Purpose", state.project.description], ["Website", state.project.site], ["Owner", String(state.project.owner ?? "")], ["Notes", String(state.project.notes ?? "")]];
        q("#project-breadcrumb").textContent = `${state.project.name} / Project overview`;
        q("#inspector-context").textContent = `${state.project.name} project context and collection entry points.`;
        heading.tabIndex = -1;
        heading.textContent = "Project overview";
        identity.textContent = `${state.project.name} · stable identity ${state.project.id} · Saved Draft · Published revision ${publishedRevision}`;
        for (const [label, value] of details) {
            const term = document.createElement("dt"), description = document.createElement("dd");
            term.textContent = label;
            description.textContent = value;
            metadata.append(term, description);
        }
        openSchemas.type = "button";
        openSchemas.textContent = "Open Shared Profiles";
        openSchemas.addEventListener("click", () => openCollectionOverview("profiles"));
        content.append(heading, identity, metadata, openSchemas);
        return;
    }
    if (creationKind) {
        renderCreationPage(content, creationKind);
        return;
    }
    if (removalReview) {
        renderRemovalPage(content, removalReview);
        return;
    }
    const search = q("#project-search").value.trim().toLowerCase();
    if (search) {
        const matches = Object.keys(labels).flatMap((kind) => entitiesForKind(kind).filter((entity) => entitySearchText(entity).includes(search)).map((entity) => ({ kind, entity }))).slice(0, 40), heading = document.createElement("h1"), count = document.createElement("p"), list = document.createElement("ul");
        heading.textContent = "Global search";
        count.className = "status-text";
        count.textContent = `${matches.length} matching project entities`;
        list.className = "entity-grid";
        for (const { kind, entity } of matches) {
            const row = document.createElement("li"), select = document.createElement("button"), location = document.createElement("span"), used = document.createElement("span");
            row.className = "entity-row";
            select.type = "button";
            select.textContent = entity.name;
            select.addEventListener("click", () => { q("#project-search").value = ""; openProjectEntityWorkspace(kind, entity.id); });
            location.className = "search-location";
            location.textContent = labels[kind];
            used.textContent = `Used ${whereUsed(entity.id).length} times`;
            row.append(select, location, used);
            list.append(row);
        }
        content.append(heading, count, list);
        q("#project-breadcrumb").textContent = `${state.project.name} / Search / ${search}`;
        return;
    }
    const all = entitiesForKind(selectedKind), selected = all.find(({ id }) => id === selectedId);
    q("#project-breadcrumb").textContent = `${state.project.name} / ${labels[selectedKind]}${selectedId ? ` / ${selected?.name ?? selectedId}` : ""}`;
    q("#inspector-context").textContent = selected ? `${selected.name} · Where used: ${whereUsed(selected.id).join(", ") || "None"}` : "Select a project entity.";
    if (selected) {
        renderProjectEntityWorkspace(content, selectedKind, selected);
        return;
    }
    q("#flow-inspector-context").replaceChildren();
    const definition = projectCollectionDefinitions[selectedKind], heading = document.createElement("h1"), primary = document.createElement("button"), guidance = document.createElement("section"), purpose = document.createElement("p"), example = document.createElement("p"), prerequisites = document.createElement("p"), consumers = document.createElement("p"), count = document.createElement("p"), list = document.createElement("ul"), visible = all.slice(0, 40);
    heading.textContent = definition.overview;
    primary.type = "button";
    primary.textContent = definition.addAction;
    primary.dataset.addKind = selectedKind;
    primary.setAttribute("aria-label", `${definition.addAction} to ${state.project.name}`);
    primary.addEventListener("click", () => openProjectCollectionCreation(selectedKind));
    guidance.className = "project-guidance";
    purpose.textContent = definition.purpose;
    example.textContent = `Example: ${definition.example}.`;
    prerequisites.textContent = `Prerequisites: ${definition.prerequisites.join(", ")}.`;
    consumers.textContent = `Used by: ${definition.consumers.join(", ")}.`;
    guidance.append(purpose, example, prerequisites, consumers);
    count.className = "status-text";
    count.textContent = all.length ? `${visible.length} of ${all.length} rows rendered${all.length > 40 ? " · windowed; scroll to load more" : ""}` : `No ${definition.overview} yet. ${definition.purpose}.`;
    list.className = "entity-grid";
    list.setAttribute("role", "listbox");
    for (const entity of visible) {
        const row = document.createElement("li"), open = document.createElement("button"), remove = document.createElement("button"), kindText = document.createElement("span"), usage = document.createElement("span");
        row.className = "entity-row";
        row.dataset.entityId = entity.id;
        row.tabIndex = -1;
        row.setAttribute("role", "option");
        row.setAttribute("aria-selected", String(entity.id === selectedId));
        open.type = remove.type = "button";
        open.textContent = entity.name;
        open.setAttribute("aria-label", `Open ${entity.name}`);
        open.addEventListener("click", () => openProjectEntityWorkspace(selectedKind, entity.id));
        remove.textContent = `Remove ${entity.name}`;
        remove.setAttribute("aria-label", `Remove ${definition.singular} ${entity.name}`);
        remove.addEventListener("click", () => { if (!state)
            return; const projectId = state.project.id, kind = selectedKind; remove.disabled = true; void durableProjectRuntime.ensureProject(projectId).then(() => { if (state?.project.id !== projectId)
            return; removalReview = inspectProjectEntityRemoval(state, kind, entity.id); selectedKind = kind; selectedId = undefined; replaceProjectRoute(kind); render(); }).catch((error) => { saveStatus = { kind: "failed", label: `Review removal of ${entity.name}`, message: error instanceof Error ? error.message : String(error) }; render(); }); });
        kindText.className = "search-location";
        kindText.textContent = selectedKind === "pages" ? `Context-setting ${String(entity.eventName ?? "pageview")}` : selectedKind === "events" ? `Interaction ${String(entity.eventName ?? entity.name)}` : definition.singular;
        usage.textContent = `Used ${whereUsed(entity.id).length} times`;
        row.append(open, kindText, usage, remove);
        list.append(row);
    }
    if (lifecycleStatus) {
        const status = document.createElement("p");
        status.className = "status-text";
        status.setAttribute("role", "status");
        status.textContent = lifecycleStatus;
        content.append(status);
    }
    content.append(heading, primary, guidance, count, list);
    if (hasSavedSchemaAdoptionActions(selectedKind, selectedId))
        renderCanonicalProfileOverview(content);
}
function whereUsed(identity) { if (!state)
    return []; const result = []; for (const [kind, entities] of Object.entries(state.project.collections))
    for (const entity of entities)
        if (entity.id !== identity && entitySearchText(entity).includes(identity.toLowerCase()))
            result.push(`${kind}/${entity.name}`); for (const release of state.project.releases)
    if (entitySearchText(release.snapshot).includes(identity.toLowerCase()))
        result.push(`releases/${release.name}`); return result; }
function renderCoverage(offset = 0) { if (!state)
    return; const compiled = compileSpecificationProject(createCanonicalProjectEnvelope(state.project, state.draft?.id ?? "published")), content = q("#workspace-content"), heading = document.createElement("h1"), summary = document.createElement("p"), controls = document.createElement("nav"), previous = document.createElement("button"), next = document.createElement("button"), rowLabel = document.createElement("label"), rowNumber = document.createElement("input"), go = document.createElement("button"), rows = document.createElement("ul"), limit = 40; heading.textContent = "Effective requirement coverage"; if (compiled.status === "blocked") {
    summary.textContent = `Coverage blocked: ${compiled.diagnostics.map(({ field }) => field).join(", ")}`;
    content.replaceChildren(heading, summary);
    return;
} const evidence = state.project.collections.fixtures.map((fixture) => ({ fixture, result: runProductionFixture(compiled.plan, fixture) })), matrix = buildEffectiveRequirementCoverage(compiled.plan, evidence, { offset, limit }); summary.className = "status-text"; summary.textContent = `Rows ${matrix.rows.length ? offset + 1 : 0}–${offset + matrix.rows.length} of ${matrix.totalRows} Page × Event × Flow step × Effective requirement cells`; controls.setAttribute("aria-label", "Coverage row window"); previous.type = next.type = go.type = "button"; previous.textContent = "Previous 40"; next.textContent = "Next 40"; previous.disabled = offset === 0; next.disabled = offset + limit >= matrix.totalRows; previous.addEventListener("click", () => renderCoverage(Math.max(0, offset - limit))); next.addEventListener("click", () => renderCoverage(offset + limit)); rowLabel.textContent = "Go to coverage row"; rowNumber.type = "number"; rowNumber.min = "1"; rowNumber.max = String(matrix.totalRows); rowNumber.value = String(Math.min(matrix.totalRows, offset + 1)); rowLabel.append(rowNumber); go.textContent = "Open row window"; go.addEventListener("click", () => { const requested = Math.max(1, Math.min(matrix.totalRows, Number(rowNumber.value) || 1)); renderCoverage(Math.floor((requested - 1) / limit) * limit); }); controls.append(previous, next, rowLabel, go); rows.className = "coverage-grid"; for (const row of matrix.rows) {
    const item = document.createElement("li"), open = document.createElement("button"), origin = document.createElement("span"), status = document.createElement("strong");
    item.className = "coverage-row";
    open.type = "button";
    open.textContent = `${row.requirementPath} · ${row.stepId}`;
    open.setAttribute("aria-label", `Open ${row.requirementPath} ${row.state} coverage issue`);
    open.addEventListener("click", () => { selectedKind = "flows"; selectedId = row.flowId; history.replaceState(null, "", `?kind=flows&entity=${encodeURIComponent(row.flowId)}&field=${encodeURIComponent(row.stepId)}`); persistNavigation(); render(); const workspace = q("#workspace-pane"); queueMicrotask(() => workspace.focus({ preventScroll: true })); });
    origin.textContent = `schema r${row.schemaRevision} · ${row.profileIds.join(", ")} · ${row.fixtureId ?? "no proving fixture"}`;
    status.textContent = row.state;
    item.append(open, origin, status);
    rows.append(item);
} content.replaceChildren(heading, summary, controls, rows); }
function download(name, text, type = "application/json") { const blob = new Blob([`${text}\n`], { type }), url = URL.createObjectURL(blob), link = document.createElement("a"); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url); }
function replaceOptions(select, entities, placeholder) { const value = select.value, empty = document.createElement("option"); empty.value = ""; empty.textContent = placeholder; select.replaceChildren(empty, ...entities.map((entity) => { const option = document.createElement("option"); option.value = entity.id; option.textContent = entity.name; return option; })); select.value = value; }
function renderReferenceSelectors() { if (!state)
    return; flowGraphBuilder?.renderSelectors(); const targetKind = q("#project-assignment-kind"), targetSelect = q("#project-assignment-contributor"), selectedTarget = targetSelect.value, targets = assignmentContributorTargets(state).filter(({ kind }) => !targetKind.value || kind === targetKind.value); targetSelect.replaceChildren(new Option("Choose contributor", ""), ...targets.map((target) => new Option(`${target.kind} · ${target.name}`, target.id))); targetSelect.value = selectedTarget; const saved = q("#saved-schema-picker"), selectedSaved = saved.value; saved.replaceChildren(new Option("Choose a published saved schema", ""), ...savedSchemas().map((schema) => new Option(`${schema.name} · revision ${schema.version}`, schema.id))); saved.value = selectedSaved; const eventSelect = q("#project-assignment-event"); replaceOptions(eventSelect, state.project.collections.events, "Choose event"); for (const event of state.project.collections.events) {
    const eventName = String(event.eventName ?? "");
    if (eventName && eventName !== event.id) {
        const alias = document.createElement("option");
        alias.value = eventName;
        alias.textContent = event.name;
        alias.hidden = true;
        eventSelect.append(alias);
    }
} replaceOptions(q("#project-assignment-applicability"), state.project.collections.applicabilitySets, "Choose applicability set"); }
function renderAssignments() {
    if (!state)
        return;
    const result = searchProjectAssignments(state.project, q("#project-assignment-search").value);
    q("#project-assignment-count").textContent = `${result.count} assignment${result.count === 1 ? "" : "s"}`;
    q("#project-assignment-empty").hidden = !result.empty;
    q("#project-assignment-conflicts").textContent = result.conflicts.map(({ message }) => message).join("; ");
    const list = q("#project-assignment-list");
    list.replaceChildren();
    for (const assignment of result.rows) {
        const item = document.createElement("li"), edit = document.createElement("button");
        edit.type = "button";
        edit.textContent = `${assignment.name} · ${assignment.targetKind} ${assignment.targetId} · ${assignment.eventName}`;
        edit.addEventListener("click", () => {
            q("#project-assignment-id").value = assignment.id;
            q("#project-assignment-name").value = assignment.name;
            q("#project-assignment-kind").value = String(assignment.targetKind);
            renderReferenceSelectors();
            q("#project-assignment-contributor").value = String(assignment.targetId);
            q("#project-assignment-source").value = String(assignment.sourceId);
            q("#project-assignment-event").value = String(assignment.eventId);
            q("#project-assignment-applicability").value = String(assignment.applicabilitySetId);
            q("#project-assignment-target").value = String(assignment.target);
            q("#project-assignment-priority").value = String(assignment.priority);
            q("#project-assignment-name").focus();
        });
        item.append(edit);
        list.append(item);
    }
}
function render() { const visiblePageRoute = state && !documentationOpen && !projectOverview && !creationKind && !removalReview && selectedKind === "pages" && selectedId ? { projectId: state.project.id, pageId: selectedId } : undefined; setPageApplicabilityPreviewRoute(visiblePageRoute); if (pendingProfileSource && pendingProfileSource.targetId !== selectedId)
    pendingProfileSource = undefined; const empty = q("#project-empty"), workspace = q("#project-workspace"); empty.hidden = Boolean(state); workspace.hidden = !state; if (!state) {
    document.title = "Specification Studio · No active project";
    q("#project-context").textContent = "No active project";
    return;
} document.title = `Specification Studio · ${state.project.name} · ${state.project.id}`; q("#project-context").textContent = `${state.project.name} · ${state.project.id} · ${state.project.environments[0]} · ${state.draft ? `Preview Draft` : `Published revision ${publishedRevision}`}`; q("#project-state").textContent = pendingConflict ? `Draft conflict; pending ${pendingConflict.pendingLabel}` : durableConflict ? `${durableConflict.label} conflicts with a newer Saved Draft; review current and pending fields.` : saveStatus.kind === "saving" ? `Saving ${saveStatus.label}… · Published revision ${publishedRevision}` : saveStatus.kind === "failed" ? `Save failed for ${state.project.name}: ${saveStatus.label}. ${saveStatus.message ?? "The last Saved Draft is unchanged."}` : state.draft ? `Saved Draft · Published revision ${publishedRevision}` : `Published revision ${publishedRevision}`; q("#tree-project-name").textContent = state.project.name; const history = durableProjectRuntime.historyInspection(state.project.id), undo = q("#undo-project"), redo = q("#redo-project"); undo.dataset.undoCount = String(history.undo.length); redo.dataset.redoCount = String(history.redo.length); undo.disabled = !history.undo.length || Boolean(durableProjectRuntime.failedSave()); redo.disabled = !history.redo.length || Boolean(durableProjectRuntime.failedSave()); q("#publish-project").disabled = Boolean(durableProjectRuntime.failedSave()); q("#flow-step-editor").hidden = selectedKind !== "flows" || !selectedId || projectOverview; q("#schema-draft-editor").hidden = true; q("#assignment-editor").hidden = selectedKind !== "assignments" || projectOverview; q("#bulk-property-editor").hidden = selectedKind !== "profiles" || !selectedId || projectOverview; renderTree(); renderWorkspace(); const profileWorkspace = selectedKind === "profiles" && Boolean(selectedId) && !projectOverview; if (!profileWorkspace) {
    layeredSchemaUi?.render();
    renderReferenceSelectors();
    flowGraphBuilder?.render();
    flowDocumentationExportUi?.render();
    executableFlowBuilder?.render();
} }
q("#create-project-form").addEventListener("submit", (event) => { event.preventDefault(); if (durableProjectRuntime.failedSave()) {
    q("#project-state").textContent = "A failed durable Draft blocks creating and switching active project context until Retry succeeds.";
    return;
} library = createProjectInLibrary(library, { name: q("#project-name").value.trim(), purpose: q("#project-description").value, website: q("#project-site").value.trim(), owner: "", notes: "" }, { id }); const activeId = library.activeProjectId; if (!activeId)
    throw new Error("The created project did not become active."); const next = library.projects[activeId].state; projectStorage.setItem(PROJECT_LIBRARY_STORAGE_KEY, serializeProjectLibrary(library)); persist(next); q("#workspace-pane").focus(); });
document.querySelectorAll("[data-start-path]").forEach((button) => button.addEventListener("click", () => { const path = button.dataset.startPath ?? "unknown", messages = { template: "Template project preview staged; confirm to create its complete graph.", import: "Full project migration review is ready for a selected project file.", json: "JSON or JSON Schema requirements staging grid is ready.", spreadsheet: "Spreadsheet requirements staging grid is ready.", adopt: "Saved-schema adoption review is ready with source lineage." }, message = messages[path] ?? "Starting path staged."; localStorage.setItem(START_PATH_KEY, JSON.stringify({ path, message })); q("#start-path-status").textContent = message; }));
q("#add-entity-form").addEventListener("submit", (event) => { event.preventDefault(); if (!state)
    return; const kind = q("#entity-kind").value, name = q("#entity-name").value.trim(); if (!name)
    return; const next = createProjectCollectionEntity(state, kind, name, id), created = next.project.collections[kind].at(-1); selectedKind = kind; selectedId = created?.id; q("#entity-name").value = ""; persist(next); persistNavigation(); render(); });
q("#undo-project").addEventListener("click", () => { if (!state)
    return; const projectId = state.project.id, restored = removedFocus; pendingHistoryFocus = "undo-project"; if (restored)
    pendingLifecycleFocus = { kind: restored.kind, id: restored.id }; void durableProjectRuntime.undo(projectId).then(() => { if (restored) {
    removedFocus = undefined;
    selectedKind = restored.kind;
    selectedId = undefined;
    lifecycleStatus = "Removal undone; the same stable identity is restored.";
    persistNavigation();
    replaceProjectRoute(restored.kind);
    pendingLifecycleFocus = { kind: restored.kind, id: restored.id };
    render();
    queueMicrotask(() => { restorePendingLifecycleFocus(); pendingLifecycleFocus = undefined; });
} queueMicrotask(() => { const control = q("#undo-project"); (control.disabled ? document.querySelector("[data-profile-inheritance-card], #workspace-content h1") : control)?.focus({ preventScroll: true }); }); }); });
q("#redo-project").addEventListener("click", () => { if (state) {
    pendingHistoryFocus = "redo-project";
    void durableProjectRuntime.redo(state.project.id).then(() => queueMicrotask(() => { const control = q("#redo-project"); (control.disabled ? document.querySelector("[data-profile-inheritance-card], #workspace-content h1") : control)?.focus({ preventScroll: true }); }));
} });
q("#project-search").addEventListener("input", renderWorkspace);
const savedSchemaDialog = q("#saved-schema-review"), savedSchemaChanges = q("#saved-schema-review-changes");
q("#review-saved-schema").addEventListener("click", () => { if (!state)
    return; const source = savedSchemas().find(({ id: schemaId }) => schemaId === q("#saved-schema-picker").value); if (!source) {
    q("#schema-draft-result").textContent = "Choose a published saved schema first.";
    return;
} savedSchemaChanges.replaceChildren(); const adopted = state.project.collections.profiles.find(({ sourceIdentity }) => sourceIdentity === source.id); try {
    if (adopted) {
        const review = stageSavedSchemaSynchronization(state, source);
        pendingSavedSchema = { kind: "synchronize", review };
        q("#saved-schema-review-summary").textContent = `Synchronize ${source.name} from library revision ${review.fromRevision} to ${review.toRevision}; ${review.localOverrides.length} project-local fields remain unchanged.`;
        for (const change of review.changes) {
            const item = document.createElement("li");
            item.textContent = `${change.path}: ${JSON.stringify(change.before)} → ${JSON.stringify(change.after)}`;
            savedSchemaChanges.append(item);
        }
        q("#confirm-saved-schema").textContent = "Commit reviewed synchronization";
    }
    else {
        pendingSavedSchema = { kind: "adopt", source };
        q("#saved-schema-review-summary").textContent = `Adopt ${source.name} revision ${source.version} as one project-owned Shared Profile with source lineage. `;
        q("#confirm-saved-schema").textContent = "Commit reviewed adoption";
    }
    savedSchemaDialog.showModal();
    savedSchemaDialog.querySelector("h2")?.focus();
}
catch (error) {
    q("#schema-draft-result").textContent = error instanceof Error ? error.message : String(error);
} });
q("#confirm-saved-schema").addEventListener("click", () => { if (!state || !pendingSavedSchema)
    return; const completed = pendingSavedSchema, result = commitSavedSchemaReview(state, completed); persist(result.state); selectedKind = "profiles"; selectedId = result.profileId; persistNavigation(); replaceProjectRoute("profiles", result.profileId); pendingSavedSchema = undefined; savedSchemaDialog.close(); q("#schema-draft-result").textContent = completed.kind === "adopt" ? "Saved schema adopted as a Shared Profile with revision lineage." : "Reviewed saved-schema revision synchronized; local overrides were preserved and affected evidence was marked stale."; render(); });
q("#cancel-saved-schema").addEventListener("click", () => { pendingSavedSchema = undefined; savedSchemaDialog.close(); q("#review-saved-schema").focus(); });
q("#save-project-assignment").addEventListener("submit", (event) => { event.preventDefault(); if (!state)
    return; const assignmentId = q("#project-assignment-id").value || undefined, eventValue = q("#project-assignment-event").value, eventEntity = state.project.collections.events.find((candidate) => candidate.id === eventValue || candidate.eventName === eventValue), applicabilitySetId = q("#project-assignment-applicability").value, compatibilityPath = q("#project-assignment-path").value.trim(), condition = !applicabilitySetId && compatibilityPath ? { kind: "predicate", field: compatibilityPath, operator: "equals", value: q("#project-assignment-value").value } : undefined; try {
    persist(saveProjectAssignment(state, { ...(assignmentId ? { id: assignmentId } : {}), name: q("#project-assignment-name").value.trim(), targetKind: q("#project-assignment-kind").value, targetId: q("#project-assignment-contributor").value, ...(eventEntity ? { eventId: eventEntity.id } : {}), eventName: String(eventEntity?.eventName ?? eventEntity?.name ?? ""), ...(applicabilitySetId ? { applicabilitySetId } : {}), ...(condition ? { condition } : {}), sourceId: q("#project-assignment-source").value.trim(), target: q("#project-assignment-target").value, priority: Number(q("#project-assignment-priority").value) }, id));
    q("#project-assignment-id").value = "";
    renderAssignments();
}
catch (error) {
    q("#project-assignment-conflicts").textContent = error instanceof Error ? error.message : String(error);
} });
q("#project-assignment-search").addEventListener("input", renderAssignments);
q("#project-assignment-kind").addEventListener("change", renderReferenceSelectors);
const bulkStageButton = q("#commit-bulk-properties"), bulkDetails = bulkStageButton.closest("details"), bulkFormat = document.createElement("select"), bulkReview = document.createElement("div"), bulkConfirm = document.createElement("button"), bulkRequire = document.createElement("button"), bulkChoices = [["paste", "Paste columns"], ["csv", "Spreadsheet / CSV"], ["json", "JSON requirements"], ["json-schema", "JSON Schema"], ["template", "100-row template"]];
for (const [value, label] of bulkChoices) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    bulkFormat.append(option);
}
bulkFormat.setAttribute("aria-label", "Bulk input format");
bulkReview.id = "bulk-stage-review";
bulkReview.tabIndex = -1;
bulkConfirm.id = "confirm-bulk-properties";
bulkRequire.id = "bulk-mark-required";
bulkConfirm.type = bulkRequire.type = "button";
bulkConfirm.textContent = "Commit all staged rows";
bulkRequire.textContent = "Mark selected Required";
bulkConfirm.hidden = bulkRequire.hidden = true;
bulkDetails.insertBefore(bulkFormat, q("#bulk-properties"));
bulkDetails.insertBefore(bulkReview, q("#bulk-assistance"));
bulkDetails.insertBefore(bulkRequire, q("#bulk-assistance"));
bulkDetails.insertBefore(bulkConfirm, q("#bulk-assistance"));
function renderBulkStage() {
    bulkReview.replaceChildren();
    if (!stagedBulk)
        return;
    const summary = document.createElement("p"), table = document.createElement("table"), body = document.createElement("tbody");
    summary.textContent = `${stagedBulk.rows.length} staged rows · ${stagedBulk.errors.length} fields need repair · project unchanged`;
    for (const row of stagedBulk.rows.slice(0, 40)) {
        const tr = document.createElement("tr"), selected = document.createElement("input"), path = document.createElement("input"), type = document.createElement("input"), error = document.createElement("td");
        selected.type = "checkbox";
        declareStudioChoice(selected, "bulk.staged-property");
        selected.checked = row.selected;
        selected.setAttribute("aria-label", `Select staged property ${row.path}`);
        selected.addEventListener("change", () => { row.selected = selected.checked; });
        path.value = row.path;
        type.value = row.type ?? "";
        path.addEventListener("change", () => { row.path = path.value; stagedBulk = stageBulkRequirements("json", JSON.stringify(stagedBulk.rows.map(({ id: selectedId, selected: isSelected, ...requirement }) => requirement))); renderBulkStage(); });
        type.addEventListener("change", () => { row.type = type.value; stagedBulk = stageBulkRequirements("json", JSON.stringify(stagedBulk.rows.map(({ id: selectedId, selected: isSelected, ...requirement }) => requirement))); renderBulkStage(); });
        for (const control of [selected, path, type]) {
            const td = document.createElement("td");
            td.append(control);
            tr.append(td);
        }
        error.textContent = stagedBulk.errors.filter(({ rowId }) => rowId === row.id).map(({ field, message }) => `${field}: ${message}`).join("; ");
        tr.append(error);
        body.append(tr);
    }
    table.append(body);
    bulkReview.append(summary, table);
    bulkConfirm.hidden = bulkRequire.hidden = false;
    bulkConfirm.disabled = Boolean(stagedBulk.errors.length);
    bulkReview.focus();
}
bulkStageButton.addEventListener("click", () => { if (!state || selectedKind !== "profiles" || !selectedId)
    return; try {
    stagedBulk = stageBulkRequirements(bulkFormat.value, q("#bulk-properties").value);
    q("#bulk-assistance").textContent = "Review, repair, select, and commit the staged grid.";
    renderBulkStage();
}
catch (error) {
    q("#bulk-assistance").textContent = error instanceof Error ? error.message : String(error);
} });
bulkRequire.addEventListener("click", () => { if (!stagedBulk)
    return; stagedBulk = applyStagedBulkAction(stagedBulk, stagedBulk.rows.filter(({ selected }) => selected).map(({ id }) => id), { required: true }); renderBulkStage(); });
bulkConfirm.addEventListener("click", () => { if (!state || !selectedId || !stagedBulk)
    return; persist(commitStagedBulkRequirements(state, selectedId, stagedBulk)); q("#bulk-assistance").textContent = `Committed ${stagedBulk.rows.length} requirements in one revision and one Undo transaction.`; stagedBulk = undefined; renderBulkStage(); });
function renderAssuranceFindings(host, result) {
    const repairRoute = (finding) => {
        const fieldMatch = finding.field.match(/^collections\.(profiles|pageGroups|pages|events|flows|assignments|fixtures)(?:\/([^/]+))?/), fieldKind = fieldMatch?.[1];
        if (fieldKind)
            return { kind: fieldKind, ...(fieldMatch?.[2] ? { id: fieldMatch[2] } : {}) };
        if (state)
            for (const kind of Object.keys(state.project.collections))
                if (state.project.collections[kind].some(({ id }) => id === finding.entityId))
                    return { kind, id: finding.entityId };
        return { kind: selectedKind };
    };
    const region = (label, findings) => {
        const section = document.createElement("section"), heading = document.createElement("h3"), list = document.createElement("ul"), severity = label === "Warnings" ? "warning" : "error", headingId = `${host.id || "preflight"}-${severity}-heading`;
        section.className = "assurance-region";
        section.dataset.assuranceSeverity = severity;
        section.setAttribute("aria-labelledby", headingId);
        heading.id = headingId;
        heading.textContent = `${label} (${findings.length})`;
        list.className = "preflight-list";
        list.setAttribute("aria-label", label);
        for (const finding of findings) {
            const item = document.createElement("li"), open = document.createElement("button");
            item.className = severity;
            item.setAttribute("role", severity === "warning" ? "status" : "alert");
            open.type = "button";
            open.textContent = `${finding.code}: ${finding.message}`;
            open.dataset.repairKind = repairRoute(finding).kind;
            open.dataset.repairEntity = repairRoute(finding).id ?? "";
            open.addEventListener("click", () => { const route = repairRoute(finding), dialog = q("#release-review"); if (dialog.open)
                dialog.close(); projectOverview = false; selectedKind = route.kind; selectedId = route.id; persistNavigation(); replaceProjectRoute(route.kind, route.id); render(); const workspace = q("#workspace-pane"); workspace.dataset.repairField = finding.field; workspace.focus(); });
            item.append(open);
            list.append(item);
        }
        section.append(heading, list);
        return section;
    };
    host.replaceChildren(region("Warnings", result.warnings), region("Blocking issues", result.blockers));
}
function applyDeveloperExportGate(result) { const control = q("#export-standard-schema"); control.disabled = Boolean(result.blockers.length || !result.plan); control.title = control.disabled ? `Repair ${result.blockers.length} canonical or effective-schema blocking issues before developer export.` : "Developer export is available; project-assurance warnings are advisory."; }
q("#run-preflight").addEventListener("click", () => { if (state)
    applyDeveloperExportGate(projectPreflight(state, nextProjectReleaseRevision(state, publishedRevision))); });
q("#run-preflight").addEventListener("click", () => { if (!state)
    return; releasePreflight = projectPreflight(state, nextProjectReleaseRevision(state, publishedRevision)); const result = releasePreflight, content = q("#workspace-content"), section = document.createElement("section"), title = document.createElement("h2"), summary = document.createElement("p"), findings = document.createElement("div"); title.textContent = "Production evaluator preflight"; summary.className = "status-text"; summary.textContent = result.blockers.length ? `${result.contentIdentity} · ${result.warnings.length} warnings · ${result.blockers.length} blocking issues · ${result.fixtures.length} fixtures evaluated` : `${result.contentIdentity} · Ready to publish from the compiled production plan · ${result.warnings.length} warnings · 0 blocking issues`; findings.id = "preflight-assurance"; findings.setAttribute("aria-label", "Project assurance"); renderAssuranceFindings(findings, result); section.append(title, summary, findings); content.prepend(section); });
q("#show-coverage").addEventListener("click", () => renderCoverage());
q("#publish-project").addEventListener("click", () => { releasePreflight = undefined; const renderReviewedAssurance = (attempt = 0) => { if (releasePreflight) {
    renderAssuranceFindings(q("#release-assurance"), releasePreflight);
    applyDeveloperExportGate(releasePreflight);
    return;
} if (attempt < 200)
    setTimeout(() => renderReviewedAssurance(attempt + 1), 10); }; setTimeout(() => renderReviewedAssurance(), 0); });
const releaseDialog = q("#release-review");
q("#publish-project").addEventListener("click", (event) => { if (!state)
    return; lastInvokingControl = event.currentTarget; const projectId = state.project.id, releaseSummary = q("#release-summary"); q("#project-state").textContent = `Preparing the current Saved Draft for publication · Published revision ${publishedRevision}`; releaseSummary.textContent = "Preparing the current Saved Draft for publication…"; q("#confirm-release").disabled = true; q("#confirm-release-close").disabled = true; if (!releaseDialog.open)
    releaseDialog.showModal(); releaseDialog.querySelector("h2")?.focus(); void (async () => { try {
    await durableProjectRuntime.settled();
    await durableProjectRuntime.refreshProject(projectId);
    const durable = await durableProjectRuntime.repository.loadProject(projectId);
    state = structuredClone(durable.state);
    lastCommittedState = structuredClone(state);
    canonicalRevision = durable.draftSequence;
    publishedRevision = durable.publishedRevision;
    const nextPublishedRevision = Math.max(publishedRevision, ...state.project.releases.map((release) => release.revision)) + 1;
    releasePreflight = projectPreflight(state, nextPublishedRevision);
    const preflight = releasePreflight, prior = state.project.releases.at(-1), emptyProject = { ...state.project, collections: Object.fromEntries(Object.keys(state.project.collections).map((kind) => [kind, []])), releases: [] }, review = buildReleaseReview(prior ? { ...state.project, collections: prior.snapshot } : emptyProject, state.project), diff = q("#release-diff");
    diff.replaceChildren(...review.sections.map((section) => { const item = document.createElement("li"); item.textContent = `${section.kind}: ${section.entityKind}/${section.before ?? section.after}`; return item; }));
    releaseReviewHasChanges = Boolean(review.sections.length || !publishedRevision);
    releaseSummary.textContent = preflight.blockers.length ? `${preflight.contentIdentity}: publication blocked by ${preflight.blockers.length} issues — ${preflight.blockers.map(({ message }) => message).join(" ")}` : releaseReviewHasChanges ? `${preflight.contentIdentity}: Release ${nextPublishedRevision} has ${review.sections.length} structured changes and one reviewed executable plan.` : `${preflight.contentIdentity}: No production changes. Project and Schema revisions will remain unchanged.`;
    q("#confirm-release").disabled = Boolean(preflight.blockers.length);
    q("#confirm-release-close").disabled = Boolean(preflight.blockers.length);
    q("#restore-release").disabled = !prior;
}
catch (error) {
    q("#project-state").textContent = `Publication review failed; the Saved Draft remains available · Published revision ${publishedRevision}`;
    releaseSummary.textContent = error instanceof Error ? error.message : "Publication review could not load the current Saved Draft.";
    lastInvokingControl?.focus();
} })(); });
q("#cancel-release").addEventListener("click", () => { releaseDialog.close(); lastInvokingControl?.focus(); });
const confirmRelease = async (close) => { if (!state || !releasePreflight?.plan)
    return; const confirm = q(close ? "#confirm-release-close" : "#confirm-release"), other = q(close ? "#confirm-release" : "#confirm-release-close"); confirm.disabled = other.disabled = true; try {
    const productionSchemas = publishableProductionSchemas(releasePreflight.plan);
    if (!releaseReviewHasChanges) {
        await durableProjectRuntime.settled();
        const durable = await durableProjectRuntime.repository.loadProject(state.project.id), publicationId = durable.state.project.currentRelease ?? (await durableProjectRuntime.repository.currentProductionManifest(state.project.id))?.publicationId;
        if (!publicationId)
            throw new Error("No current publication identity is available for the no-change review.");
        const published = await durableProjectRuntime.repository.publish(state.project.id, durable.draftToken, { publicationId, schemas: productionSchemas });
        if (published.status !== "no-changes")
            throw new Error("The reviewed Draft contains production changes; review it again before publishing.");
        publishedRevision = published.publishedRevision;
        releaseDialog.close();
        render();
        q("#project-state").textContent = `No production changes · Published revision ${publishedRevision}`;
        return;
    }
    const next = publishProjectRelease(state, { id, preflight: releasePreflight, write: (project) => writeProjectState({ project, ...(state?.draft ? { draft: structuredClone(state.draft) } : {}), history: { undo: [], redo: [] } }) }), publicationId = next.project.releases.at(-1)?.id;
    if (!publicationId)
        throw new Error("Publication did not create a reviewed release identity.");
    await durableProjectRuntime.settled();
    const durable = await durableProjectRuntime.repository.loadProject(next.project.id), published = await durableProjectRuntime.repository.publish(next.project.id, durable.draftToken, { publicationId, schemas: productionSchemas });
    await durableProjectRuntime.refreshProject(next.project.id);
    await durableProjectRuntime.settled();
    library = restoreProjectLibrary(projectStorage.getItem(PROJECT_LIBRARY_STORAGE_KEY)) ?? library;
    const active = library.projects[next.project.id];
    state = active ? structuredClone(active.state) : structuredClone(next);
    lastCommittedState = structuredClone(state);
    canonicalRevision = active?.revision ?? durable.draftSequence + 1;
    publishedRevision = published.publishedRevision;
    releaseDialog.close();
    render();
    if (close)
        q("#project-workspace").hidden = true;
    else {
        q("#project-state").textContent = `Saved Draft · Published revision ${publishedRevision}`;
        q("#workspace-pane").focus();
    }
}
catch (error) {
    q("#project-state").textContent = `Publication failed; the Saved Draft remains available · Published revision ${publishedRevision}`;
    q("#release-summary").textContent = error instanceof Error ? error.message : "Publication failed; the prior Published revision remains authoritative.";
    confirm.disabled = other.disabled = false;
} };
q("#confirm-release").addEventListener("click", () => void confirmRelease(false));
q("#confirm-release-close").addEventListener("click", () => void confirmRelease(true).then(() => lastInvokingControl?.focus()));
q("#restore-release").addEventListener("click", () => { if (!state)
    return; const release = state.project.releases.at(-1); if (!release)
    return; persist(restoreReleaseAsDraft(state, release.id, id)); releaseDialog.close(); q("#workspace-pane").focus(); });
q("#export-standard-schema").addEventListener("click", (event) => { if (!state)
    return; const preflight = projectPreflight(state, nextProjectReleaseRevision(state, publishedRevision)); applyDeveloperExportGate(preflight); try {
    assertDeveloperSchemaExportAvailable(preflight);
}
catch (error) {
    event.preventDefault();
    event.stopImmediatePropagation();
    q("#project-state").textContent = error instanceof Error ? error.message : String(error);
} }, { capture: true });
q("#export-project").addEventListener("click", () => { if (!state)
    return; download(`${state.project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-project.json`, exportSpecificationProjectState(state)); });
q("#export-standard-schema").addEventListener("click", () => { if (!state)
    return; void developerProductionSchemaExport(durableProjectRuntime.repository, state.project.id).then(production => { download("specification.schema.json", JSON.stringify({ $schema: "https://json-schema.org/draft/2020-12/schema", oneOf: production.schemas.map(({ effectiveSchema }) => effectiveSchema) })); download("specification.manifest.json", JSON.stringify({ format: "my-chrome-utilities.production-schema-manifest", version: 1, projectId: production.projectId, projectRevision: production.projectRevision, schemas: production.schemas.map(({ evidence }) => evidence) })); }, error => { q("#project-state").textContent = error instanceof Error ? error.message : String(error); }); });
q("#import-project").addEventListener("click", () => q("#import-project-file").click());
const importDialog = q("#import-review");
q("#import-project-file").addEventListener("change", async (event) => { const file = event.currentTarget.files?.[0]; if (!file || !state)
    return; try {
    stagedImport = stageProjectImport(await file.text(), state);
    q("#import-summary").textContent = stagedImport.blockers.length ? `${stagedImport.blockers.length} blocking collisions; ${stagedImport.diff.sections.length} linked changes.` : `${stagedImport.diff.sections.length} linked changes ready.`;
    q("#commit-import").disabled = Boolean(stagedImport.blockers.length);
    importDialog.showModal();
    importDialog.querySelector("h2")?.focus();
}
catch (error) {
    q("#import-summary").textContent = error instanceof Error ? error.message : String(error);
    importDialog.showModal();
} });
q("#remap-import").addEventListener("click", () => { if (!stagedImport || !state)
    return; stagedImport = stageProjectImport(stagedImport.source, state, { projectId: id("project") }); q("#import-summary").textContent = `Collision remapped; ${stagedImport.diff.sections.length} linked changes ready.`; q("#commit-import").disabled = false; });
q("#commit-import").addEventListener("click", () => { if (!state || !stagedImport)
    return; persist(commitStagedProjectImport(state, stagedImport, { write: () => { } })); importDialog.close(); q("#import-project").focus(); });
q("#cancel-import").addEventListener("click", () => { stagedImport = undefined; importDialog.close(); q("#import-project").focus(); });
const conflictDialog = q("#project-conflict-review"), restoreDurableProjection = () => { restore(); library = restoreProjectLibrary(projectStorage.getItem(PROJECT_LIBRARY_STORAGE_KEY)) ?? library; };
function completeConflict(strategy) { const fields = Array.from(q("#project-conflict-fields").querySelectorAll('input:checked'), ({ value }) => value); if (durableConflict) {
    void durableProjectRuntime.resolveFailedSave(strategy, fields).then(() => { durableConflict = undefined; saveStatus = { kind: "idle" }; restoreDurableProjection(); conflictDialog.close(); render(); focusCurrentStudioContext(); });
    return;
} if (!pendingConflict)
    return; const resolved = resolveCanonicalProjectConflict(pendingConflict, { strategy, ...(strategy === "merge" ? { pendingFields: fields } : {}) }); conflictDialog.close(); pendingConflict = undefined; persist(resolved); focusCurrentStudioContext(); }
q("#reload-project-conflict").addEventListener("click", () => { if (durableConflict) {
    void durableProjectRuntime.resolveFailedSave("reject").then(() => { durableConflict = undefined; saveStatus = { kind: "idle" }; restoreDurableProjection(); conflictDialog.close(); render(); focusCurrentStudioContext(); });
    return;
} if (!pendingConflict)
    return; state = resolveCanonicalProjectConflict(pendingConflict, { strategy: "reload" }); lastCommittedState = structuredClone(state); pendingConflict = undefined; conflictDialog.close(); q("#retry-save").hidden = true; render(); focusCurrentStudioContext(); });
q("#reapply-project-conflict").addEventListener("click", () => completeConflict("reapply"));
q("#merge-project-conflict").addEventListener("click", () => completeConflict("merge"));
q("#retry-save").addEventListener("click", () => { if (pendingConflict || durableConflict) {
    showConflictReview();
    return;
} void durableProjectRuntime.retryFailedSave(); });
const builderRecoveryDialog = q("#builder-storage-recovery"), builderRecoveryResult = q("#builder-recovery-result");
let builderRecoveryOrigin;
q("#builder-retry-save").addEventListener("click", () => { builderRecoveryResult.textContent = "Retrying the exact unsaved command…"; void durableProjectRuntime.retryFailedSave().then(() => { builderRecoveryResult.textContent = "Retry committed the Saved Draft."; builderRecoveryResult.focus(); }, (error) => { builderRecoveryResult.textContent = `Retry was not committed; the exact unsaved command remains available for recovery. ${error instanceof Error ? error.message : String(error)}`; builderRecoveryResult.focus(); }); });
q("#builder-export-unsaved").addEventListener("click", () => { const failed = durableProjectRuntime.failedSave(); if (!failed)
    return; download(`${failed.projectName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-unsaved-draft.json`, durableProjectRuntime.exportUnsavedDraft()); builderRecoveryResult.textContent = "Exported the exact unsaved Draft."; builderRecoveryResult.focus(); });
q("#builder-export-repository").addEventListener("click", () => { builderRecoveryResult.textContent = "Preparing repository backup…"; void durableProjectRuntime.repository.exportRepositoryRecoveryBundle().then((bundle) => { download("durable-project-repository-backup.json", JSON.stringify(bundle)); builderRecoveryResult.textContent = "Exported repository backup without changing the Saved Draft."; builderRecoveryResult.focus(); }); });
q("#builder-storage-diagnostics").addEventListener("click", () => { const failed = durableProjectRuntime.failedSave(); if (!failed)
    return; void navigator.storage.estimate().then((estimate) => durableProjectRuntime.repository.storageDiagnostics(failed.projectId, { usage: estimate.usage ?? 0, quota: estimate.quota ?? 0 }, failed.command.label)).then((diagnostics) => { builderRecoveryResult.textContent = `Last saved ${diagnostics.lastSavedAt}; Published revision ${diagnostics.publishedRevision}; unsaved ${diagnostics.unsavedCommand}; project ${diagnostics.projectEntityBytes} bytes; releases ${diagnostics.releaseBytes} bytes; fixtures ${diagnostics.fixtureBytes} bytes; migration backup ${diagnostics.migrationBackupBytes} bytes. ${diagnostics.explanation}`; builderRecoveryResult.focus(); }); });
q("#builder-close-recovery").addEventListener("click", () => { builderRecoveryDialog.close(); builderRecoveryOrigin?.focus(); });
globalThis.addEventListener("durable-project-saving", (event) => { const label = event.detail?.label ?? "project edit"; saveStatus = { kind: "saving", label }; });
globalThis.addEventListener("durable-project-saved", () => { saveStatus = { kind: "idle" }; q("#retry-save").hidden = true; if (builderRecoveryDialog.open)
    builderRecoveryDialog.close(); });
globalThis.addEventListener("durable-project-save-failed", (event) => { const failed = durableProjectRuntime.failedSave(); if (!failed)
    return; state = { ...structuredClone(failed.state), history: { undo: [], redo: [] } }; saveStatus = { kind: "failed", label: failed.command.label, message: failed.error instanceof Error ? failed.error.message : String(failed.error) }; q("#retry-save").hidden = false; if (failed.conflict) {
    durableConflict = structuredClone(failed.conflict);
    showConflictReview();
}
else {
    builderRecoveryOrigin = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
    q("#builder-recovery-summary").textContent = `Save failed for ${failed.projectName}: ${failed.command.label}. ${saveStatus.message} The last Saved Draft is unchanged; switching and publication remain blocked.`;
    builderRecoveryResult.textContent = "Retry, export the unsaved Draft, export the repository backup, or inspect storage diagnostics.";
    if (!builderRecoveryDialog.open)
        builderRecoveryDialog.showModal();
    builderRecoveryDialog.querySelector("h2")?.focus();
} render(); });
const flowBuilderContext = () => ({ ...state ? { state } : {}, revision: canonicalRevision, ...(selectedKind === "flows" && selectedId ? { flowId: selectedId } : {}) });
projectDocumentationWorkspaceUi = installProjectDocumentationWorkspaceUi({ state: () => state, revision: () => canonicalRevision, save: (documentation, label) => { if (!state)
        return; persist(transactProject(state, label, (project) => ({ ...project, documentation: structuredClone(documentation) }))); }, openRepair: (target) => { documentationOpen = false; openProjectEntityWorkspace(target.kind, target.id); if (target.path) {
        const route = new URL(location.href);
        route.searchParams.set("kind", target.kind);
        route.searchParams.set("entity", target.id);
        route.searchParams.set("field", target.path);
        history.replaceState(null, "", route);
        const focusPath = (attempt = 0) => { const candidate = document.querySelector(`[data-property-id="${CSS.escape(target.path)}"],[data-flow-instance-effective-path="${CSS.escape(target.path)}"]`); if (candidate) {
            candidate.click();
            candidate.focus({ preventScroll: true });
            return;
        } if (attempt < 8)
            setTimeout(() => focusPath(attempt + 1), 25); };
        queueMicrotask(focusPath);
    } } });
flowGraphBuilder = installFlowGraphBuilder({ context: flowBuilderContext, persist, id, openOccurrenceSchema: (occurrenceId, path, originFocus) => layeredSchemaUi?.openGraphOccurrenceSchema(occurrenceId, path, originFocus) ?? false });
flowDocumentationExportUi = installFlowDocumentationExportUi({ context: flowBuilderContext, renderFlow: () => { flowGraphBuilder?.render(); flowDocumentationExportUi?.render(); }, openRepair: (contextId, path, repair) => { const selectPath = () => setTimeout(() => Array.from(document.querySelectorAll("[data-property-id]")).find((candidate) => candidate.dataset.propertyId === path || candidate.textContent?.includes(path))?.click(), 0); if (repair.startsWith("Open contributing schema ")) {
        const name = repair.slice("Open contributing schema ".length), match = ["profiles", "events", "pageGroups", "pages", "flows"].flatMap((kind) => state.project.collections[kind].map((entity) => ({ kind, entity }))).find(({ entity }) => entity.name === name);
        if (match) {
            selectedKind = match.kind;
            selectedId = match.entity.id;
            persistNavigation();
            render();
            selectPath();
            return;
        }
    } const contributorId = contextId.startsWith("context:frame:") ? contextId.slice("context:frame:".length) : contextId.replace(/^context:/, ""); layeredSchemaUi?.openGraphOccurrenceSchema(contributorId, path); } });
executableFlowBuilder = installExecutableFlowBuilder({ context: flowBuilderContext, persist, id });
layeredSchemaUi = installLayeredSchemaUi({ context: () => ({ ...state ? { state } : {}, kind: selectedKind, ...(selectedId ? { entityId: selectedId } : {}) }), persist, onUndo: () => { if (state)
        void durableProjectRuntime.undo(state.project.id); }, onRedo: () => { if (state)
        void durableProjectRuntime.redo(state.project.id); } });
const synchronizeActiveProjectContext = (serialized) => { const change = activeProjectContextChange(serialized, state?.project.id, canonicalRevision); if (!change.changed)
    return; library = change.library; pendingConflict = undefined; durableConflict = undefined; saveStatus = { kind: "idle" }; const active = change.active; state = active ? { ...structuredClone(active.state), history: { undo: [], redo: [] } } : undefined; lastCommittedState = state ? structuredClone(state) : undefined; canonicalRevision = active?.revision ?? 0; publishedRevision = active?.publishedRevision ?? Math.max(0, ...(active?.state.project.releases.map(({ revision }) => revision) ?? [0])); selectedKind = "profiles"; selectedId = undefined; creationKind = undefined; documentationOpen = false; projectOverview = Boolean(active); if (active) {
    const navigation = resolveProjectNavigation(library, active.state.project.id);
    if (navigation) {
        projectOverview = false;
        selectedKind = navigation.kind;
        selectedId = navigation.id;
    }
    const url = new URL(location.href);
    url.searchParams.set("project", active.state.project.id);
    url.searchParams.delete("route");
    url.searchParams.set("kind", selectedKind);
    if (selectedId)
        url.searchParams.set("entity", selectedId);
    else
        url.searchParams.delete("entity");
    history.replaceState(null, "", url);
}
else {
    const url = new URL(location.href);
    for (const key of ["project", "route", "kind", "entity"])
        url.searchParams.delete(key);
    history.replaceState(null, "", url);
} render(); renderAssignments(); q("#project-state").textContent = active ? `Active project synchronized: ${active.state.project.name} · Saved Draft · Published revision ${publishedRevision}` : "No active project"; };
restore();
if (!state) {
    const stagedStart = localStorage.getItem(START_PATH_KEY);
    if (stagedStart)
        try {
            q("#start-path-status").textContent = JSON.parse(stagedStart).message ?? "Starting path staged.";
        }
        catch { /* ignore invalid start-path recovery */ }
}
q("#run-preflight").addEventListener("click", () => void (async () => {
    if (!state)
        return;
    const projectId = state.project.id;
    await durableProjectRuntime.settled();
    await durableProjectRuntime.refreshProject(projectId);
    const durable = await durableProjectRuntime.repository.loadProject(projectId);
    state = structuredClone(durable.state);
    canonicalRevision = durable.draftSequence;
    publishedRevision = durable.publishedRevision;
    releasePreflight = projectPreflight(state, nextProjectReleaseRevision(state, publishedRevision));
    applyDeveloperExportGate(releasePreflight);
    const prior = document.querySelector("#preflight-assurance")?.parentElement, section = prior ?? document.createElement("section"), title = document.createElement("h2"), summary = document.createElement("p"), findings = document.createElement("div");
    title.textContent = "Production evaluator preflight";
    summary.className = "status-text";
    summary.textContent = releasePreflight.blockers.length ? `${releasePreflight.contentIdentity} · ${releasePreflight.warnings.length} warnings · ${releasePreflight.blockers.length} blocking issues · ${releasePreflight.fixtures.length} fixtures evaluated` : `${releasePreflight.contentIdentity} · Ready to publish from the compiled production plan · ${releasePreflight.warnings.length} warnings · 0 blocking issues`;
    findings.id = "preflight-assurance";
    findings.setAttribute("aria-label", "Project assurance");
    renderAssuranceFindings(findings, releasePreflight);
    section.replaceChildren(title, summary, findings);
    if (!prior)
        q("#workspace-content").prepend(section);
})());
const restoreGuidedSaveFailureUi = () => queueMicrotask(() => {
    if (!durableProjectRuntime.failedSave())
        return;
    const editor = document.querySelector("[data-guided-test-case]"), recovery = q("#builder-storage-recovery");
    if (!editor)
        return;
    const result = editor.querySelector("#fixture-run-result"), repair = Array.from(editor.querySelectorAll("button")).find(({ textContent }) => textContent === "Repair Test case");
    if (result)
        result.textContent = "Save failed. Evaluation did not run; exact editable input is preserved.";
    if (repair)
        repair.hidden = false;
    if (!recovery.open)
        recovery.showModal();
    recovery.querySelector("#builder-retry-save")?.focus();
});
globalThis.addEventListener("durable-project-save-failed", restoreGuidedSaveFailureUi);
globalThis.addEventListener("durable-project-saved", restoreGuidedSaveFailureUi);
durableProjectRuntime.subscribe(({ library: incoming, active }) => {
    if (pendingConflict || durableConflict || durableProjectRuntime.failedSave())
        return;
    if (active?.state.project.id !== state?.project.id) {
        synchronizeActiveProjectContext(serializeProjectLibrary(incoming));
        return;
    }
    library = structuredClone(incoming);
    if (!active)
        return;
    const focusedMembershipId = document.activeElement instanceof HTMLElement ? document.activeElement.closest("[data-page-group-membership-id]")?.dataset.pageGroupMembershipId : undefined;
    state = { ...structuredClone(active.state), history: { undo: [], redo: [] } };
    lastCommittedState = structuredClone(state);
    canonicalRevision = active.draftSequence;
    publishedRevision = active.publishedRevision;
    if (!durableProjectRuntime.failedSave())
        saveStatus = { kind: "idle" };
    render();
    renderAssignments();
    if (pendingProfileInheritanceFocus) {
        const profileId = pendingProfileInheritanceFocus;
        queueMicrotask(() => { const card = document.querySelector(`[data-profile-inheritance-card='${CSS.escape(profileId)}']`); if (card) {
            card.focus({ preventScroll: true });
            pendingProfileInheritanceFocus = undefined;
        } });
    }
    if (pendingHistoryFocus) {
        const controlId = pendingHistoryFocus;
        queueMicrotask(() => { const control = q(`#${controlId}`); (control.disabled ? document.querySelector("[data-profile-inheritance-card], #workspace-content h1") : control)?.focus({ preventScroll: true }); if (pendingHistoryFocus === controlId)
            pendingHistoryFocus = undefined; });
    }
    if (focusedMembershipId)
        queueMicrotask(() => document.querySelector(`[data-page-group-membership-id="${CSS.escape(focusedMembershipId)}"]`)?.focus());
    queueMicrotask(restorePendingLifecycleFocus);
    queueMicrotask(restorePendingWorkspaceFocus);
    q("#project-state").textContent = `Updated to the newer Saved Draft · Published revision ${publishedRevision}`;
});
render();
renderAssignments();
const applyRequestedRoute = () => { const deepKind = routeParameters.get("kind"), deepId = routeParameters.get("entity"), requestedAction = routeParameters.get("route"); if (deepKind && deepKind in labels) {
    documentationOpen = false;
    projectOverview = false;
    selectedKind = deepKind;
    creationKind = requestedAction === "add" ? deepKind : undefined;
    selectedId = creationKind ? undefined : deepId && state && state.project.collections[deepKind].some(({ id }) => id === deepId) ? deepId : undefined;
    persistNavigation();
    render();
    queueMicrotask(() => { const target = creationKind ? document.querySelector(`[data-creation-kind="${deepKind}"] h1`) : selectedId ? document.querySelector(`[data-project-entity-workspace="${CSS.escape(selectedId)}"] h1`) : document.querySelector(`[data-add-kind="${deepKind}"], #workspace-content h1, #workspace-pane`); if (target) {
        target.tabIndex = -1;
        target.focus({ preventScroll: true });
    } });
} if (routeParameters.get("view") === "documentation" && state) {
    documentationOpen = true;
    projectOverview = false;
    render();
} };
const requestedProject = routeParameters.get("project");
if (requestedProject && requestedProject !== library.activeProjectId) {
    const target = library.projects[requestedProject], dialog = document.createElement("dialog"), heading = document.createElement("h2"), summary = document.createElement("p"), confirm = document.createElement("button"), cancel = document.createElement("button");
    heading.textContent = `Open ${target?.state.project.name ?? requestedProject} in Specification Studio`;
    summary.textContent = `${state?.project.name ?? "No active project"} → ${target?.state.project.name ?? requestedProject}. Active context will change before the requested entity is resolved.`;
    confirm.type = cancel.type = "button";
    confirm.textContent = "Confirm project context and continue";
    cancel.textContent = "Cancel";
    confirm.disabled = !target;
    confirm.addEventListener("click", () => { const prepare = startupRoute ? durableProjectRuntime.ensureProjectRoute(requestedProject, startupRoute).then(() => { }) : durableProjectRuntime.ensureProject(requestedProject); void prepare.then(() => { library = restoreProjectLibrary(projectStorage.getItem(PROJECT_LIBRARY_STORAGE_KEY)) ?? library; library = activateProject(library, requestedProject); projectStorage.setItem(PROJECT_LIBRARY_STORAGE_KEY, serializeProjectLibrary(library)); return durableProjectRuntime.settled(); }).then(() => { const record = (restoreProjectLibrary(projectStorage.getItem(PROJECT_LIBRARY_STORAGE_KEY)) ?? library).projects[requestedProject]; state = structuredClone(record.state); lastCommittedState = structuredClone(record.state); canonicalRevision = record.revision; publishedRevision = record.publishedRevision ?? Math.max(0, ...record.state.project.releases.map(({ revision }) => revision)); projectOverview = routeParameters.get("route") === "overview"; dialog.close(); dialog.remove(); render(); applyRequestedRoute(); }).catch((error) => { summary.textContent = error instanceof Error ? error.message : String(error); }); });
    cancel.addEventListener("click", () => { dialog.close(); dialog.remove(); });
    dialog.append(heading, summary, confirm, cancel);
    document.body.append(dialog);
    dialog.showModal();
    heading.tabIndex = -1;
    heading.focus();
}
else
    applyRequestedRoute();
//# sourceMappingURL=specification-builder.js.map