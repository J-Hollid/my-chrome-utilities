import { addProjectEntity, adoptSavedSchema, buildReleaseReview, commitStagedProjectImport, commitSavedSchemaSynchronization, createSpecificationProject, createProjectSchemaDraft, exportDocumentation, exportSpecificationProjectState, redoProjectTransaction, restoreReleaseAsDraft, saveProjectAssignment, searchProjectAssignments, stageProjectImport, stageSavedSchemaSynchronization, transactProject, undoProjectTransaction, } from "./data-layer-specification-project.js";
import { applyStagedBulkAction, commitStagedBulkRequirements, stageBulkRequirements } from "./data-layer-specification-bulk.js";
import { buildEffectiveRequirementCoverage, publishCompiledRelease as publishProjectRelease, runProductionFixture, specificationPreflight } from "./data-layer-specification-assurance.js";
import { compileSpecificationProject, createCanonicalProjectEnvelope } from "./data-layer-specification-engine.js";
import { entityPurposeGuidance, projectAuthoringGuidance } from "./data-layer-specification-guidance.js";
import { installExecutableFlowBuilder } from "./data-layer-executable-flow-ui.js";
import { installFlowGraphBuilder } from "./utilities/data-layer/flow-graph.js";
import { restoreSchemaLibrary, SCHEMA_LIBRARY_STORAGE_KEY } from "./data-layer-schema-verification.js";
const projectPreflight = (current, revision) => specificationPreflight({ ...createCanonicalProjectEnvelope(current.project, current.draft?.id ?? "release"), revision });
import { CANONICAL_SPECIFICATION_PROJECT_STORAGE_KEY, commitCanonicalProjectState, inspectCanonicalProjectConflict, resolveCanonicalProjectConflict, restoreCanonicalProjectEnvelope, restoreCanonicalProjectState, subscribeCanonicalProjectChanges, } from "./data-layer-specification-repository.js";
const STORAGE_KEY = CANONICAL_SPECIFICATION_PROJECT_STORAGE_KEY, NAVIGATION_KEY = "my-chrome-utilities.specification-project-navigation.v1", START_PATH_KEY = "my-chrome-utilities.specification-project-start.v1";
const q = (selector) => { const element = document.querySelector(selector); if (!element)
    throw new Error(`Missing ${selector}`); return element; };
for (const fieldId of ["project-assignment-path", "project-assignment-value", "project-assignment-not-path", "project-assignment-not-value"]) {
    const input = document.createElement("input");
    input.id = fieldId;
    input.hidden = true;
    input.tabIndex = -1;
    q("#save-project-assignment").append(input);
}
q("#project-assignment-applicability").required = false;
q("#project-schema-id").required = false;
q("#project-schema-id").closest("label").hidden = true;
const id = (kind) => `${kind}:${crypto.randomUUID()}`;
const labels = { profiles: "Shared profiles", pages: "Pages", pageGroups: "Page groups", events: "Events", applicabilitySets: "Applicability", flows: "Flows", fixtures: "Fixtures", schemaDrafts: "Schema drafts", assignments: "Assignments" };
let state, lastCommittedState;
let canonicalRevision = 0, pendingConflict, stagedBulk, selectedKind = "profiles", selectedId, stagedImport, lastInvokingControl, releasePreflight, pendingSavedSchema, flowGraphBuilder, executableFlowBuilder;
const savedSchemas = () => restoreSchemaLibrary(localStorage.getItem(SCHEMA_LIBRARY_STORAGE_KEY)).filter(({ published }) => published).map((schema) => structuredClone(schema));
function writeProjectState(next) { const result = commitCanonicalProjectState(localStorage, next, { expectedRevision: canonicalRevision, pendingLabel: next.history.undo.at(-1)?.label ?? "Project edit", ...(lastCommittedState ? { base: lastCommittedState } : {}) }); if (result.status === "conflict") {
    pendingConflict = result;
    state = result.current;
    lastCommittedState = structuredClone(result.current);
    canonicalRevision = result.revision;
    throw new Error(`Revision conflict: current ${result.revision}; pending ${result.pendingLabel}`);
} canonicalRevision = result.revision; pendingConflict = undefined; releasePreflight = undefined; lastCommittedState = structuredClone(next); }
function showConflictReview() { if (!pendingConflict)
    return; const inspection = inspectCanonicalProjectConflict(pendingConflict), dialog = q("#project-conflict-review"), fields = q("#project-conflict-fields"); q("#project-conflict-summary").textContent = `${pendingConflict.pendingLabel}: ${inspection.pendingFields.length} pending fields, ${inspection.currentFields.length} newer fields, ${inspection.conflictingFields.length} same-field conflicts.`; fields.querySelectorAll("label").forEach((label) => label.remove()); for (const field of inspection.conflictingFields) {
    const label = document.createElement("label"), input = document.createElement("input");
    input.type = "checkbox";
    input.value = field;
    label.append(input, ` Use pending value for ${field}`);
    fields.append(label);
} if (!dialog.open)
    dialog.showModal(); dialog.querySelector("h2")?.focus(); }
function persist(next) { state = next; try {
    writeProjectState(next);
    q("#project-state").textContent = `Saved · revision ${canonicalRevision}`;
    q("#retry-save").hidden = true;
}
catch (error) {
    if (!pendingConflict)
        state = next.draft ? { ...next, draft: { ...next.draft, status: "Save failed" } } : next;
    q("#project-state").textContent = pendingConflict ? `Conflict at revision ${canonicalRevision}; pending ${pendingConflict.pendingLabel}` : "Save failed";
    q("#retry-save").hidden = false;
    if (pendingConflict)
        showConflictReview();
} render(); renderAssignments(); }
function restore() { const stored = localStorage.getItem(STORAGE_KEY); if (stored)
    try {
        const envelope = restoreCanonicalProjectEnvelope(stored);
        state = restoreCanonicalProjectState(stored);
        lastCommittedState = state ? structuredClone(state) : undefined;
        canonicalRevision = envelope?.revision ?? 0;
    }
    catch {
        localStorage.removeItem(STORAGE_KEY);
    } const navigation = localStorage.getItem(NAVIGATION_KEY); if (navigation)
    try {
        const parsed = JSON.parse(navigation);
        selectedKind = parsed.kind ?? selectedKind;
        selectedId = parsed.id;
    }
    catch {
        localStorage.removeItem(NAVIGATION_KEY);
    } }
function persistNavigation() { localStorage.setItem(NAVIGATION_KEY, JSON.stringify({ kind: selectedKind, ...(selectedId ? { id: selectedId } : {}) })); }
function entitySearchText(value) { return JSON.stringify(value).toLowerCase(); }
function entitiesForKind(kind) { if (!state)
    return []; return kind === "assignments" ? searchProjectAssignments(state.project, "").rows : state.project.collections[kind]; }
const editorFields = {
    profiles: [], pages: [{ key: "environment", label: "Environment" }, { key: "host", label: "Host matcher" }, { key: "pathname", label: "Path matcher" }, { key: "query", label: "Query matcher" }, { key: "hash", label: "Hash matcher" }, { key: "spa", label: "SPA route", type: "checkbox" }, { key: "pageGroupIds", label: "Page groups", collection: "pageGroups", multiple: true }, { key: "expectedEventIds", label: "Expected events", collection: "events", multiple: true }, { key: "profileIds", label: "Requirement profiles", collection: "profiles", multiple: true }, { key: "applicabilitySetId", label: "Applicability Set", collection: "applicabilitySets" }],
    pageGroups: [{ key: "environment", label: "Environment" }, { key: "matcher", label: "Membership matcher" }, { key: "pageIds", label: "Members", collection: "pages", multiple: true }, { key: "profileIds", label: "Requirement profiles", collection: "profiles", multiple: true }, { key: "applicabilitySetId", label: "Applicability Set", collection: "applicabilitySets" }],
    events: [{ key: "sourceId", label: "Source" }, { key: "eventName", label: "Canonical event name" }, { key: "role", label: "Flow role", type: "flow-role" }, { key: "target", label: "Validation target" }, { key: "occurrencePolicy", label: "Occurrence policy" }, { key: "profileIds", label: "Requirement profiles", collection: "profiles", multiple: true }, { key: "applicabilitySetId", label: "Applicability Set", collection: "applicabilitySets" }],
    applicabilitySets: [{ key: "priority", label: "Priority", type: "number" }, { key: "fallback", label: "Fallback", type: "checkbox" }, { key: "condition", label: "Nested All / Any / Not condition", type: "condition" }],
    flows: [{ key: "entryCondition", label: "Entry condition", type: "condition" }, { key: "exitCondition", label: "Exit condition", type: "condition" }, { key: "timeoutMinutes", label: "Timeout minutes", type: "number" }, { key: "correlationField", label: "Correlation field" }, { key: "profileIds", label: "Requirement profiles", collection: "profiles", multiple: true }, { key: "applicabilitySetId", label: "Applicability Set", collection: "applicabilitySets" }],
    fixtures: [{ key: "mode", label: "Fixture mode" }, { key: "context", label: "Context", type: "json" }, { key: "observations", label: "Ordered observations", type: "json" }, { key: "payload", label: "Payload", type: "json" }, { key: "expected", label: "Expected winner, step, schema and issues", type: "json" }, { key: "releasePolicy", label: "Release policy" }],
    schemaDrafts: [{ key: "profileIds", label: "Ordered requirement profiles", collection: "profiles", multiple: true }, { key: "localOverrides", label: "Local overrides", type: "json" }],
    assignments: [{ key: "schemaDraftId", label: "Schema", collection: "schemaDrafts" }, { key: "eventId", label: "Event", collection: "events" }, { key: "applicabilitySetId", label: "Applicability Set", collection: "applicabilitySets" }, { key: "priority", label: "Priority", type: "number" }, { key: "versionPolicy", label: "Version policy" }, { key: "schemaRevision", label: "Pinned schema revision", type: "number" }],
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
    for (const optionEntity of state.project.collections[field.collection]) {
        if (optionEntity.id === entity.id)
            continue;
        const option = document.createElement("option");
        option.value = optionEntity.id;
        option.textContent = optionEntity.name;
        option.selected = field.multiple ? entity[field.key]?.includes(optionEntity.id) ?? false : entity[field.key] === optionEntity.id;
        select.append(option);
    }
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
function renderProfileGrid(form, profile) { const heading = document.createElement("h3"), table = document.createElement("table"), head = document.createElement("thead"), body = document.createElement("tbody"), add = document.createElement("button"); heading.textContent = "Requirements · Local only / Effective / Provenance"; head.innerHTML = "<tr><th>Path</th><th>Type</th><th>Required</th><th>Forbidden</th><th>Allowed values</th><th>Rules</th><th>Documentation</th><th>Examples</th></tr>"; const requirements = profile.requirements ?? []; for (const requirement of requirements) {
    const row = document.createElement("tr");
    row.dataset.requirement = "true";
    for (const [key, type] of [["path", "text"], ["type", "text"], ["required", "checkbox"], ["forbidden", "checkbox"], ["allowedValues", "text"], ["rules", "text"], ["description", "text"], ["examples", "text"]]) {
        const cell = document.createElement("td"), input = document.createElement("input");
        input.name = key;
        input.type = type;
        if (type === "checkbox")
            input.checked = Boolean(requirement[key]);
        else
            input.value = Array.isArray(requirement[key]) ? JSON.stringify(requirement[key]) : String(requirement[key] ?? "");
        cell.append(input);
        row.append(cell);
    }
    body.append(row);
} table.append(head, body); add.type = "button"; add.textContent = "Add requirement row"; add.addEventListener("click", () => { const row = document.createElement("tr"); row.dataset.requirement = "true"; row.innerHTML = '<td><input name="path" placeholder="/path"></td><td><input name="type" value="string"></td><td><input name="required" type="checkbox"></td><td><input name="forbidden" type="checkbox"></td><td><input name="allowedValues" placeholder="[&quot;EUR&quot;]"></td><td><input name="rules" placeholder="[]"></td><td><input name="description"></td><td><input name="examples" placeholder="[]"></td>'; body.append(row); row.querySelector('input[name="path"]')?.focus(); }); form.append(heading, table, add); }
function profileRequirements(form) { return Array.from(form.querySelectorAll('tr[data-requirement]'), (row) => { const value = (name) => row.querySelector(`[name="${name}"]`); const parse = (name) => { const text = value(name).value.trim(); return text ? JSON.parse(text) : undefined; }; return { path: value("path").value.trim(), type: value("type").value.trim(), required: value("required").checked, forbidden: value("forbidden").checked, ...(parse("allowedValues") ? { allowedValues: parse("allowedValues") } : {}), ...(parse("rules") ? { rules: parse("rules") } : {}), ...(value("description").value ? { description: value("description").value } : {}), ...(parse("examples") ? { examples: parse("examples") } : {}) }; }).filter(({ path }) => path); }
function renderFixtureExecution(form, fixture) { const section = document.createElement("section"), heading = document.createElement("h3"), evidence = document.createElement("p"), run = document.createElement("button"), result = document.createElement("output"); section.setAttribute("aria-label", "Fixture execution"); heading.textContent = "Production evaluator replay"; const observations = fixture.observations ?? [], expected = fixture.expected ?? {}; evidence.textContent = `Captured observation: ${observations.map(({ eventName }) => String(eventName ?? "unnamed")).join(", ") || "none"} · Proposed assertions: status ${String(expected.status ?? "not set")}; issueCodes ${JSON.stringify(expected.issueCodes ?? [])}`; run.type = "button"; run.textContent = "Run Fixture"; result.id = "fixture-run-result"; result.setAttribute("aria-live", "polite"); run.addEventListener("click", () => { if (!state)
    return; const compiled = compileSpecificationProject({ ...createCanonicalProjectEnvelope(state.project, state.draft?.id ?? "published"), revision: canonicalRevision }); if (compiled.status === "blocked") {
    result.textContent = `Run blocked: ${compiled.diagnostics.map(({ field }) => field).join(", ")}`;
    return;
} const execution = runProductionFixture(compiled.plan, fixture), last = execution.steps.at(-1), capturedIdentity = String(fixture.evaluationResultIdentity ?? "not recorded"), replayIdentity = last?.actual.resultIdentity ?? "not evaluated", differences = execution.steps.flatMap((step) => step.differences); result.textContent = `${execution.status.toUpperCase()} · captured evaluator result ${capturedIdentity} · replay result ${replayIdentity} · ${differences.length ? differences.join("; ") : "status and issueCodes assertions matched"}`; }); section.append(heading, evidence, run, result); form.append(section); }
function renderSelectedEntityEditor(content, entity) { if (!state)
    return; const section = document.createElement("section"), heading = document.createElement("h2"), form = document.createElement("form"), nameLabel = document.createElement("label"), name = document.createElement("input"), actions = document.createElement("div"), save = document.createElement("button"), duplicate = document.createElement("button"), remove = document.createElement("button"), usage = document.createElement("p"); section.className = "contextual-editor"; heading.textContent = `Edit ${labels[selectedKind].replace(/s$/, "")}`; name.name = "name"; name.required = true; name.value = entity.name; nameLabel.textContent = "Name"; nameLabel.append(name); form.append(nameLabel); for (const field of editorFields[selectedKind]) {
    const label = document.createElement("label"), control = fieldControl(field, entity);
    label.textContent = field.label;
    label.append(control);
    form.append(label);
} if (selectedKind === "profiles")
    renderProfileGrid(form, entity); if (selectedKind === "fixtures")
    renderFixtureExecution(form, entity); if (selectedKind === "schemaDrafts") {
    const preview = document.createElement("pre"), working = entity.workingDraft;
    preview.textContent = JSON.stringify(working?.document ?? entity.document ?? {}, null, 2);
    preview.setAttribute("aria-label", "Compiled effective schema document");
    form.append(preview);
} save.type = "submit"; save.textContent = "Save complete entity"; duplicate.type = remove.type = "button"; duplicate.textContent = "Duplicate"; remove.textContent = "Delete"; usage.textContent = `Where used: ${whereUsed(entity.id).join(", ") || "None"}`; actions.className = "editor-actions"; actions.append(save, duplicate, remove); form.append(actions, usage); form.addEventListener("submit", (event) => { event.preventDefault(); if (!state)
    return; try {
    const update = { name: name.value.trim() };
    for (const field of editorFields[selectedKind])
        update[field.key] = editorValue(field, form.elements.namedItem(field.key));
    if (selectedKind === "profiles")
        update.requirements = profileRequirements(form);
    if (selectedKind === "schemaDrafts")
        update.workingDraft = { ...entity.workingDraft, profileIds: update.profileIds };
    persist(transactProject(state, `Edit ${entity.name}`, (project) => ({ ...project, collections: { ...project.collections, [selectedKind]: project.collections[selectedKind].map((candidate) => candidate.id === entity.id ? { ...candidate, ...update } : candidate) } })));
}
catch (error) {
    q("#project-state").textContent = error instanceof Error ? error.message : String(error);
} }); duplicate.addEventListener("click", () => { if (!state)
    return; const { id: ignored, ...copy } = entity; persist(addProjectEntity(state, selectedKind, { ...structuredClone(copy), name: `${entity.name} copy` }, id)); }); remove.addEventListener("click", () => { if (!state)
    return; const dependencies = whereUsed(entity.id); if (dependencies.length) {
    q("#project-state").textContent = `Delete blocked; used by ${dependencies.join(", ")}`;
    return;
} persist(transactProject(state, `Delete ${entity.name}`, (project) => ({ ...project, collections: { ...project.collections, [selectedKind]: project.collections[selectedKind].filter(({ id }) => id !== entity.id) } }))); selectedId = undefined; }); section.append(heading, form); content.append(section); }
function renderTree() { const tree = q("#project-tree"); tree.replaceChildren(); if (!state)
    return; for (const kind of Object.keys(labels)) {
    const item = document.createElement("li"), button = document.createElement("button"), count = kind === "assignments" ? searchProjectAssignments(state.project, "").count : state.project.collections[kind].length;
    button.type = "button";
    button.textContent = `${labels[kind]} (${count})`;
    button.dataset.kind = kind;
    button.setAttribute("aria-current", String(kind === selectedKind));
    button.addEventListener("click", () => { selectedKind = kind; selectedId = undefined; persistNavigation(); render(); q("#workspace-pane").focus(); });
    item.append(button);
    tree.append(item);
} const release = document.createElement("li"), button = document.createElement("button"); button.type = "button"; button.textContent = `Releases (${state.project.releases.length})`; button.dataset.kind = "releases"; release.append(button); tree.append(release); }
function renderCollectionGuidance(content) { if (!state)
    return; const entityName = { profiles: "Profile", applicabilitySets: "Applicability Set", pages: "Page", pageGroups: "Page", events: "Event", flows: "Flow", assignments: "Assignment", fixtures: "Fixture", schemaDrafts: "Schema" }, name = entityName[selectedKind], section = document.createElement("section"); section.className = "project-guidance"; if (name) {
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
function renderWorkspace() {
    const content = q("#workspace-content");
    content.replaceChildren();
    if (!state)
        return;
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
            select.addEventListener("click", () => { selectedKind = kind; selectedId = entity.id; persistNavigation(); q("#project-search").value = ""; render(); });
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
    if (selectedKind === "flows" && selected) {
        const heading = document.createElement("h1"), graphHost = document.createElement("div"), inspectorHost = q("#flow-inspector-context");
        heading.textContent = selected.name;
        graphHost.id = "flow-graph-workspace";
        content.append(heading, graphHost);
        inspectorHost.replaceChildren();
        renderSelectedEntityEditor(inspectorHost, selected);
        return;
    }
    q("#flow-inspector-context").replaceChildren();
    renderCollectionGuidance(content);
    const visible = all.slice(0, 40), heading = document.createElement("h1"), count = document.createElement("p"), list = document.createElement("ul");
    heading.textContent = labels[selectedKind];
    count.className = "status-text";
    count.textContent = `${visible.length} of ${all.length} rows rendered${all.length > 40 ? " · windowed; scroll to load more" : ""}`;
    list.className = "entity-grid";
    list.setAttribute("role", "listbox");
    for (const entity of visible) {
        const row = document.createElement("li"), select = document.createElement("button"), kindText = document.createElement("span"), usage = document.createElement("span");
        row.className = "entity-row";
        row.dataset.entityId = entity.id;
        row.setAttribute("role", "option");
        row.setAttribute("aria-selected", String(entity.id === selectedId));
        select.type = "button";
        select.textContent = entity.name;
        select.addEventListener("click", () => { selectedId = entity.id; persistNavigation(); render(); });
        kindText.className = "search-location";
        kindText.textContent = labels[selectedKind];
        usage.textContent = `Used ${whereUsed(entity.id).length} times`;
        row.append(select, kindText, usage);
        list.append(row);
    }
    content.append(heading, count, list);
    if (selected)
        renderSelectedEntityEditor(content, selected);
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
function documentationResult() { if (!state)
    throw new Error("No project"); const fields = ["path", "type", ...Array.from(document.querySelectorAll(".documentation-field:checked"), ({ value }) => value)]; return exportDocumentation(state.project, { fields, include: { applicability: q("#documentation-applicability").checked, flows: q("#documentation-flows").checked, fixtures: q("#documentation-fixtures").checked, releases: q("#documentation-releases").checked } }); }
function refreshDocumentation() { q("#documentation-preview").textContent = documentationResult().preview; }
function download(name, text, type = "application/json") { const blob = new Blob([`${text}\n`], { type }), url = URL.createObjectURL(blob), link = document.createElement("a"); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url); }
function replaceOptions(select, entities, placeholder) { const value = select.value, empty = document.createElement("option"); empty.value = ""; empty.textContent = placeholder; select.replaceChildren(empty, ...entities.map((entity) => { const option = document.createElement("option"); option.value = entity.id; option.textContent = entity.name; return option; })); select.value = value; }
function renderReferenceSelectors() { if (!state)
    return; flowGraphBuilder?.renderSelectors(); replaceOptions(q("#project-assignment-schema"), state.project.collections.schemaDrafts, "Choose schema"); const saved = q("#saved-schema-picker"), selectedSaved = saved.value; saved.replaceChildren(new Option("Choose a published saved schema", ""), ...savedSchemas().map((schema) => new Option(`${schema.name} · revision ${schema.version}`, schema.id))); saved.value = selectedSaved; const eventSelect = q("#project-assignment-event"); replaceOptions(eventSelect, state.project.collections.events, "Choose event"); for (const event of state.project.collections.events) {
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
        edit.textContent = `${assignment.name} · ${assignment.schemaId} · ${assignment.eventName} · ${assignment.versionPolicy}${assignment.schemaRevision ? ` revision ${assignment.schemaRevision}` : ""}`;
        edit.addEventListener("click", () => {
            q("#project-assignment-id").value = assignment.id;
            q("#project-assignment-name").value = assignment.name;
            q("#project-assignment-schema").value = String(assignment.schemaDraftId ?? assignment.schemaId);
            q("#project-assignment-source").value = String(assignment.sourceId);
            q("#project-assignment-event").value = String(assignment.eventId);
            q("#project-assignment-applicability").value = String(assignment.applicabilitySetId);
            q("#project-assignment-target").value = String(assignment.target);
            q("#project-assignment-priority").value = String(assignment.priority);
            q("#project-assignment-version-policy").value = String(assignment.versionPolicy);
            q("#project-assignment-revision").value = String(assignment.schemaRevision ?? 1);
            q("#project-assignment-name").focus();
        });
        item.append(edit);
        list.append(item);
    }
}
function render() { const empty = q("#project-empty"), workspace = q("#project-workspace"); empty.hidden = Boolean(state); workspace.hidden = !state; if (!state) {
    q("#project-context").textContent = "No project";
    return;
} q("#project-context").textContent = `${state.project.name} · ${state.project.environments[0]} · ${state.draft ? `Preview Draft` : `Live ${state.project.currentRelease ? "published release" : "not published"}`}`; q("#project-state").textContent = pendingConflict ? `Conflict at revision ${canonicalRevision}; pending ${pendingConflict.pendingLabel}` : `${state.draft?.status ?? "Published"} · revision ${canonicalRevision}`; q("#tree-project-name").textContent = state.project.name; q("#undo-project").disabled = !state.history.undo.length; q("#redo-project").disabled = !state.history.redo.length; q("#add-entity-form").hidden = Boolean(selectedId); q("#flow-step-editor").hidden = selectedKind !== "flows" || !selectedId; q("#schema-draft-editor").hidden = selectedKind !== "schemaDrafts"; q("#assignment-editor").hidden = selectedKind !== "assignments"; q("#bulk-property-editor").hidden = selectedKind !== "profiles" || !selectedId; renderTree(); renderWorkspace(); renderReferenceSelectors(); flowGraphBuilder?.render(); executableFlowBuilder?.render(); }
q("#create-project-form").addEventListener("submit", (event) => { event.preventDefault(); persist(createSpecificationProject({ name: q("#project-name").value.trim(), description: q("#project-description").value, site: q("#project-site").value.trim(), environments: ["Production", "Staging"], id })); q("#workspace-pane").focus(); });
document.querySelectorAll("[data-start-path]").forEach((button) => button.addEventListener("click", () => { const path = button.dataset.startPath ?? "unknown", messages = { template: "Template project preview staged; confirm to create its complete graph.", import: "Full project migration review is ready for a selected project file.", json: "JSON or JSON Schema requirements staging grid is ready.", spreadsheet: "Spreadsheet requirements staging grid is ready.", adopt: "Saved-schema adoption review is ready with source lineage." }, message = messages[path] ?? "Starting path staged."; localStorage.setItem(START_PATH_KEY, JSON.stringify({ path, message })); q("#start-path-status").textContent = message; }));
q("#add-entity-form").addEventListener("submit", (event) => { event.preventDefault(); if (!state)
    return; const kind = q("#entity-kind").value, name = q("#entity-name").value.trim(); if (!name)
    return; const defaults = kind === "profiles" ? { requirements: [] } : kind === "events" ? { eventName: name.toLowerCase().replace(/[^a-z0-9]+/g, "_"), sourceId: "event-history", target: "payload" } : kind === "flows" ? { steps: [] } : kind === "fixtures" ? { mode: "event", observations: [], expected: {}, releasePolicy: "required" } : kind === "applicabilitySets" ? { priority: 0, condition: { kind: "all", conditions: [] } } : {}; persist(addProjectEntity(state, kind, { name, ...defaults }, id)); selectedKind = kind; selectedId = state?.project.collections[kind].at(-1)?.id; q("#entity-name").value = ""; persistNavigation(); render(); });
q("#undo-project").addEventListener("click", () => { if (state)
    persist(undoProjectTransaction(state)); });
q("#redo-project").addEventListener("click", () => { if (state)
    persist(redoProjectTransaction(state)); });
q("#project-search").addEventListener("input", renderWorkspace);
q("#create-project-schema-draft").addEventListener("submit", (event) => { event.preventDefault(); if (!state)
    return; persist(createProjectSchemaDraft(state, { schemaId: q("#project-schema-id").value.trim(), name: q("#project-schema-name").value.trim(), baseRevision: Number(q("#project-schema-revision").value), description: q("#project-schema-description").value }, id)); q("#schema-draft-result").textContent = "Saved one integrated working draft; the published revision is unchanged until project release."; });
const savedSchemaDialog = q("#saved-schema-review"), savedSchemaChanges = q("#saved-schema-review-changes");
q("#review-saved-schema").addEventListener("click", () => { if (!state)
    return; const source = savedSchemas().find(({ id: schemaId }) => schemaId === q("#saved-schema-picker").value); if (!source) {
    q("#schema-draft-result").textContent = "Choose a published saved schema first.";
    return;
} savedSchemaChanges.replaceChildren(); const adopted = state.project.collections.schemaDrafts.find(({ id }) => id === source.id); try {
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
        q("#saved-schema-review-summary").textContent = `Adopt ${source.name} revision ${source.version} as one project-owned working draft with source lineage. The saved library remains unchanged.`;
        q("#confirm-saved-schema").textContent = "Commit reviewed adoption";
    }
    savedSchemaDialog.showModal();
    savedSchemaDialog.querySelector("h2")?.focus();
}
catch (error) {
    q("#schema-draft-result").textContent = error instanceof Error ? error.message : String(error);
} });
q("#confirm-saved-schema").addEventListener("click", () => { if (!state || !pendingSavedSchema)
    return; const completed = pendingSavedSchema; persist(completed.kind === "adopt" ? adoptSavedSchema(state, completed.source) : commitSavedSchemaSynchronization(state, completed.review)); selectedKind = "schemaDrafts"; selectedId = completed.kind === "adopt" ? completed.source.id : completed.review.schemaId; pendingSavedSchema = undefined; savedSchemaDialog.close(); q("#schema-draft-result").textContent = completed.kind === "adopt" ? "Saved schema adopted into the canonical project with revision lineage." : "Reviewed saved-schema revision synchronized; local overrides were preserved and affected evidence was marked stale."; render(); });
q("#cancel-saved-schema").addEventListener("click", () => { pendingSavedSchema = undefined; savedSchemaDialog.close(); q("#review-saved-schema").focus(); });
q("#save-project-assignment").addEventListener("submit", (event) => { event.preventDefault(); if (!state)
    return; const assignmentId = q("#project-assignment-id").value || undefined, eventValue = q("#project-assignment-event").value, eventEntity = state.project.collections.events.find((candidate) => candidate.id === eventValue || candidate.eventName === eventValue), applicabilitySetId = q("#project-assignment-applicability").value, compatibilityPath = q("#project-assignment-path").value.trim(), condition = !applicabilitySetId && compatibilityPath ? { kind: "predicate", field: compatibilityPath, operator: "equals", value: q("#project-assignment-value").value } : undefined; try {
    persist(saveProjectAssignment(state, { ...(assignmentId ? { id: assignmentId } : {}), name: q("#project-assignment-name").value.trim(), schemaId: q("#project-assignment-schema").value, ...(eventEntity ? { eventId: eventEntity.id } : {}), eventName: String(eventEntity?.eventName ?? eventEntity?.name ?? ""), ...(applicabilitySetId ? { applicabilitySetId } : {}), ...(condition ? { condition } : {}), sourceId: q("#project-assignment-source").value.trim(), target: q("#project-assignment-target").value, priority: Number(q("#project-assignment-priority").value), versionPolicy: q("#project-assignment-version-policy").value, schemaRevision: Number(q("#project-assignment-revision").value) }, id));
    q("#project-assignment-id").value = "";
    renderAssignments();
}
catch (error) {
    q("#project-assignment-conflicts").textContent = error instanceof Error ? error.message : String(error);
} });
q("#project-assignment-search").addEventListener("input", renderAssignments);
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
function renderBulkStage() { bulkReview.replaceChildren(); if (!stagedBulk)
    return; const summary = document.createElement("p"), table = document.createElement("table"), body = document.createElement("tbody"); summary.textContent = `${stagedBulk.rows.length} staged rows · ${stagedBulk.errors.length} fields need repair · project unchanged`; for (const row of stagedBulk.rows.slice(0, 40)) {
    const tr = document.createElement("tr"), selected = document.createElement("input"), path = document.createElement("input"), type = document.createElement("input"), error = document.createElement("td");
    selected.type = "checkbox";
    selected.checked = row.selected;
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
} table.append(body); bulkReview.append(summary, table); bulkConfirm.hidden = bulkRequire.hidden = false; bulkConfirm.disabled = Boolean(stagedBulk.errors.length); bulkReview.focus(); }
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
q("#run-preflight").addEventListener("click", () => { if (!state)
    return; releasePreflight = projectPreflight(state, canonicalRevision); const result = releasePreflight, content = q("#workspace-content"), section = document.createElement("section"), title = document.createElement("h2"), summary = document.createElement("p"), list = document.createElement("ul"); title.textContent = "Production evaluator preflight"; summary.className = "status-text"; summary.textContent = result.blockers.length ? `${result.contentIdentity} · ${result.blockers.length} blockers · ${result.fixtures.length} fixtures evaluated` : `${result.contentIdentity} · Ready to publish from the compiled production plan`; list.className = "preflight-list"; for (const blocker of result.blockers) {
    const item = document.createElement("li"), open = document.createElement("button");
    item.className = "error";
    open.type = "button";
    open.textContent = `${blocker.code}: ${blocker.message}`;
    open.addEventListener("click", () => { selectedId = blocker.entityId; history.replaceState(null, "", `?entity=${encodeURIComponent(blocker.entityId)}&field=${encodeURIComponent(blocker.field)}`); render(); });
    item.append(open);
    list.append(item);
} section.append(title, summary, list); content.prepend(section); });
q("#show-coverage").addEventListener("click", () => renderCoverage());
const documentationDialog = q("#documentation-export");
q("#generate-documentation").addEventListener("click", (event) => { if (!state)
    return; lastInvokingControl = event.currentTarget; refreshDocumentation(); documentationDialog.showModal(); documentationDialog.querySelector("h2")?.focus(); });
document.querySelectorAll("#documentation-export input").forEach((field) => field.addEventListener("change", refreshDocumentation));
q("#copy-documentation").addEventListener("click", async () => { const result = documentationResult(), html = `<pre>${result.preview.replaceAll("&", "&amp;").replaceAll("<", "&lt;")}</pre>`; if (globalThis.ClipboardItem && navigator.clipboard.write)
    await navigator.clipboard.write([new ClipboardItem({ "text/html": new Blob([html], { type: "text/html" }), "text/plain": new Blob([result.clipboard], { type: "text/plain" }) })]);
else
    await navigator.clipboard.writeText(result.clipboard); q("#documentation-result").textContent = "Documentation table copied once."; });
q("#close-documentation").addEventListener("click", () => { documentationDialog.close(); lastInvokingControl?.focus(); });
const releaseDialog = q("#release-review");
q("#publish-project").addEventListener("click", (event) => { if (!state)
    return; lastInvokingControl = event.currentTarget; releasePreflight = projectPreflight(state, canonicalRevision); const preflight = releasePreflight, prior = state.project.releases.at(-1), emptyProject = { ...state.project, collections: Object.fromEntries(Object.keys(state.project.collections).map((kind) => [kind, []])), releases: [] }, review = buildReleaseReview(prior ? { ...state.project, collections: prior.snapshot } : emptyProject, state.project), diff = q("#release-diff"); diff.replaceChildren(...review.sections.map((section) => { const item = document.createElement("li"); item.textContent = `${section.kind}: ${section.entityKind}/${section.before ?? section.after}`; return item; })); q("#release-summary").textContent = preflight.blockers.length ? `${preflight.contentIdentity}: publication blocked by ${preflight.blockers.length} issues — ${preflight.blockers.map(({ message }) => message).join(" ")}` : `${preflight.contentIdentity}: Release ${state.project.releases.length + 1} has ${review.sections.length} structured changes and one reviewed executable plan.`; q("#confirm-release").disabled = Boolean(preflight.blockers.length || !review.sections.length); q("#confirm-release-close").disabled = Boolean(preflight.blockers.length || !review.sections.length); q("#restore-release").disabled = !prior; releaseDialog.showModal(); releaseDialog.querySelector("h2")?.focus(); });
q("#cancel-release").addEventListener("click", () => { releaseDialog.close(); lastInvokingControl?.focus(); });
const confirmRelease = (close) => { if (!state || !releasePreflight)
    return; let next; try {
    next = publishProjectRelease(state, { id, preflight: releasePreflight, write: (project) => writeProjectState({ project, history: { undo: [], redo: [] } }) });
}
catch (error) {
    q("#project-state").textContent = "Save failed";
    q("#release-summary").textContent = error instanceof Error ? error.message : "Publication failed; the prior canonical project bytes remain authoritative.";
    q("#retry-save").hidden = false;
    return;
} state = next; releaseDialog.close(); render(); if (close)
    q("#project-workspace").hidden = true;
else {
    q("#release-summary").textContent = `Release ${next.project.releases.length} published from ${next.project.releases.at(-1)?.preflightContentIdentity}. Undo by restoring this release as a new Draft.`;
    q("#workspace-pane").focus();
} };
q("#confirm-release").addEventListener("click", () => confirmRelease(false));
q("#confirm-release-close").addEventListener("click", () => { confirmRelease(true); lastInvokingControl?.focus(); });
q("#restore-release").addEventListener("click", () => { if (!state)
    return; const release = state.project.releases.at(-1); if (!release)
    return; persist(restoreReleaseAsDraft(state, release.id, id)); releaseDialog.close(); q("#workspace-pane").focus(); });
q("#export-project").addEventListener("click", () => { if (!state)
    return; download(`${state.project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-project.json`, exportSpecificationProjectState(state)); });
q("#export-standard-schema").addEventListener("click", () => { if (!state)
    return; const properties = Object.fromEntries(state.project.collections.profiles.flatMap((profile) => profile.requirements.map((requirement) => [requirement.path.replace(/^\//, ""), { type: requirement.type ?? "string", ...(requirement.allowedValues ? { enum: requirement.allowedValues } : {}) }]))), schema = { $schema: "https://json-schema.org/draft/2020-12/schema", type: "object", properties, "x-lossy-semantics": ["applicability", "flows", "fixtures", "draft", "releases"] }, manifest = { format: "my-chrome-utilities.applicability-flow-manifest", version: 1, projectId: state.project.id, applicability: state.project.collections.applicabilitySets, flows: state.project.collections.flows, fixtures: state.project.collections.fixtures, draft: state.draft, releases: state.project.releases }; download("specification.schema.json", JSON.stringify(schema)); download("specification.manifest.json", JSON.stringify(manifest)); });
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
const conflictDialog = q("#project-conflict-review");
function completeConflict(strategy) { if (!pendingConflict)
    return; const fields = Array.from(q("#project-conflict-fields").querySelectorAll('input:checked'), ({ value }) => value), resolved = resolveCanonicalProjectConflict(pendingConflict, { strategy, ...(strategy === "merge" ? { pendingFields: fields } : {}) }); conflictDialog.close(); pendingConflict = undefined; persist(resolved); q("#project-inspector").focus(); }
q("#reload-project-conflict").addEventListener("click", () => { if (!pendingConflict)
    return; state = resolveCanonicalProjectConflict(pendingConflict, { strategy: "reload" }); lastCommittedState = structuredClone(state); pendingConflict = undefined; conflictDialog.close(); q("#retry-save").hidden = true; render(); q("#project-inspector").focus(); });
q("#reapply-project-conflict").addEventListener("click", () => completeConflict("reapply"));
q("#merge-project-conflict").addEventListener("click", () => completeConflict("merge"));
q("#retry-save").addEventListener("click", () => { if (pendingConflict) {
    showConflictReview();
    return;
} if (state)
    persist(state.draft ? { ...state, draft: { ...state.draft, status: "Saved" } } : state); });
const flowBuilderContext = () => ({ ...state ? { state } : {}, ...(selectedKind === "flows" && selectedId ? { flowId: selectedId } : {}) });
flowGraphBuilder = installFlowGraphBuilder({ context: flowBuilderContext, persist, id });
executableFlowBuilder = installExecutableFlowBuilder({ context: flowBuilderContext, persist, id });
restore();
if (!state) {
    const stagedStart = localStorage.getItem(START_PATH_KEY);
    if (stagedStart)
        try {
            q("#start-path-status").textContent = JSON.parse(stagedStart).message ?? "Starting path staged.";
        }
        catch { /* ignore invalid start-path recovery */ }
}
subscribeCanonicalProjectChanges(window, ({ revision, state: next }) => {
    if (pendingConflict)
        return;
    state = structuredClone(next);
    lastCommittedState = structuredClone(next);
    canonicalRevision = revision;
    render();
    renderAssignments();
    q("#project-state").textContent = `Updated from canonical revision ${revision}`;
});
render();
renderAssignments();
const parameters = new URLSearchParams(location.search), deepKind = parameters.get("kind"), deepId = parameters.get("entity");
if (deepKind && deepKind in labels) {
    selectedKind = deepKind;
    selectedId = deepId ?? undefined;
    persistNavigation();
    render();
    const inspector = q("#project-inspector");
    inspector.tabIndex = -1;
    inspector.focus();
}
if (parameters.get("view") === "documentation" && state) {
    q("#generate-documentation").click();
}
//# sourceMappingURL=specification-builder.js.map