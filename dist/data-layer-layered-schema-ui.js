import { compileLayeredSchema } from "./data-layer-layered-schema.js";
import { transactProject } from "./data-layer-specification-project.js";
const q = (selector) => { const value = document.querySelector(selector); if (!value)
    throw new Error(`Missing ${selector}`); return value; };
const scopeFor = (kind) => ({ profiles: "Shared Profile", events: "Event", pageGroups: "Page Group", pages: "Page", flows: "Flow Page-instance" }[kind] ?? "Event-occurrence");
const contributionFor = (entity, scope) => ({ id: entity.id, name: entity.name, scope, constraints: (entity.schemaConstraints ?? []) });
const structuredPaths = (document, prefix = "") => { if (!document || typeof document !== "object")
    return []; const properties = document.properties ?? {}; return Object.entries(properties).flatMap(([name, value]) => { const path = `${prefix}/${name}`; return [path, ...structuredPaths(value, path)]; }); };
export function installLayeredSchemaUi(options) {
    const inspector = q("#project-inspector"), workspace = q("#workspace-content"), summary = document.createElement("section"), editor = document.createElement("section");
    let graphSelection, returnFocus;
    summary.setAttribute("aria-label", "Schema constraints summary");
    editor.setAttribute("aria-label", "Shared schema constraints editor");
    editor.hidden = true;
    inspector.insertBefore(summary, inspector.firstChild?.nextSibling ?? null);
    workspace.prepend(editor);
    const current = () => { const { state, kind, entityId } = options.context(), entity = state && entityId ? state.project.collections[kind].find(({ id }) => id === entityId) : undefined; return { state, kind, entity: graphSelection ?? entity, scope: graphSelection ? "Event-occurrence" : scopeFor(kind) }; };
    const allContributors = (state) => [
        ...state.project.collections.profiles.map((entity) => contributionFor(entity, "Shared Profile")), ...state.project.collections.events.map((entity) => contributionFor(entity, "Event")), ...state.project.collections.pageGroups.map((entity) => contributionFor(entity, "Page Group")), ...state.project.collections.pages.map((entity) => contributionFor(entity, "Page")), ...state.project.collections.flows.map((entity) => contributionFor(entity, "Flow Page-instance")),
    ];
    function renderSummary() { const { state, entity, scope } = current(); summary.replaceChildren(); if (!state || !entity) {
        summary.hidden = true;
        return;
    } summary.hidden = false; const title = document.createElement("h3"), counts = document.createElement("p"), open = document.createElement("button"), compiled = compileLayeredSchema(allContributors(state), { eventId: String(entity.eventId ?? entity.id), eventRole: entity.occurrenceType === "page-context" ? "context" : "interaction", ...(entity.id ? { occurrenceId: entity.id } : {}) }), local = (entity.schemaConstraints ?? []).length, activation = String(entity.activation ?? "manual"); title.textContent = `Schema constraints · ${entity.name} · ${scope}`; counts.textContent = `Inherited ${Math.max(0, compiled.provenance.length - 1)} · Local ${local} · Effective ${Object.keys(compiled.properties).length} · Conflict ${compiled.conflicts.length} · Activation ${activation}`; open.type = "button"; open.textContent = "Open complete schema editor"; open.addEventListener("click", () => { returnFocus = open; renderEditor(); editor.hidden = false; Array.from(workspace.children).forEach((child) => { if (child !== editor)
        child.hidden = true; }); editor.querySelector("h2")?.focus(); }); summary.append(title, counts, open); }
    function renderEditor() {
        const { state, entity, scope } = current();
        editor.replaceChildren();
        if (!state || !entity)
            return;
        const title = document.createElement("h2"), identity = document.createElement("p"), areas = document.createElement("nav"), tree = document.createElement("ul"), search = document.createElement("input"), form = document.createElement("form"), status = document.createElement("p"), back = document.createElement("button"), compiled = compileLayeredSchema(allContributors(state), { eventId: String(entity.eventId ?? entity.id), eventRole: entity.occurrenceType === "page-context" ? "context" : "interaction", occurrenceId: entity.id });
        title.tabIndex = -1;
        title.textContent = "Shared schema editor";
        identity.textContent = `Contributor: ${entity.name} · Scope: ${scope}`;
        areas.setAttribute("aria-label", "Constraint result layers");
        areas.textContent = `Inherited constraints · Local contributions · Effective results · Superseded expectations · Blocking conflicts (${compiled.conflicts.length})`;
        search.type = "search";
        search.setAttribute("aria-label", "Add constraint inherited property search");
        search.placeholder = "Search inherited property paths";
        const paths = [...new Set(Object.keys(compiled.properties))];
        const refreshPaths = () => { tree.replaceChildren(...paths.filter((path) => path.includes(search.value)).map((path) => { const item = document.createElement("li"), button = document.createElement("button"); button.type = "button"; button.textContent = path; button.addEventListener("click", () => { form.querySelector('[name="path"]').value = path; }); item.append(button); return item; })); };
        search.addEventListener("input", refreshPaths);
        refreshPaths();
        const fields = [["path", "Property path", "text"], ["type", "Scalar type", "text"], ["allowedValues", "Allowed values (JSON)", "text"], ["presence", "Required, optional, forbidden, or permitted", "text"], ["expectedValue", "Expected value", "text"], ["enforcement", "Enforcement policy", "text"], ["target", "Target events", "text"], ["condition", "Condition (JSON)", "text"], ["documentation", "Documentation", "text"], ["examples", "Examples (JSON)", "text"], ["rules", "Conditional and reusable rules (JSON)", "text"]];
        for (const [name, labelText, type] of fields) {
            const label = document.createElement("label"), input = document.createElement("input");
            label.textContent = labelText;
            input.name = name;
            input.type = type;
            if (name === "path")
                input.required = true;
            label.append(input);
            form.append(label);
        }
        const save = document.createElement("button");
        save.type = "submit";
        save.textContent = "Save constraint";
        form.append(save);
        status.setAttribute("role", "status");
        form.addEventListener("submit", (event) => { event.preventDefault(); const data = new FormData(form), parse = (name) => { const value = String(data.get(name) ?? "").trim(); if (!value)
            return undefined; if (["allowedValues", "condition", "examples", "rules"].includes(name))
            return JSON.parse(value); return value; }, constraint = { path: String(data.get("path")), ...(parse("type") ? { type: String(parse("type")) } : {}), ...(parse("allowedValues") ? { allowedValues: parse("allowedValues") } : {}), ...(parse("presence") ? { presence: parse("presence") } : {}), ...(parse("expectedValue") !== undefined ? { expectedValue: parse("expectedValue") } : {}), ...(parse("enforcement") ? { enforcement: parse("enforcement") } : {}), ...(parse("target") ? { target: String(parse("target")) } : {}), ...(parse("condition") ? { condition: parse("condition") } : {}), ...(parse("documentation") ? { documentation: String(parse("documentation")) } : {}), ...(parse("examples") ? { examples: parse("examples") } : {}), ...(parse("rules") ? { rules: parse("rules") } : {}) }; const next = transactProject(state, `Save schema constraint for ${entity.name}`, (project) => { if (graphSelection) {
            const flowId = options.context().entityId, graphs = project.documentationFlowGraphs;
            return { ...project, documentationFlowGraphs: { ...graphs, [flowId]: { ...graphs[flowId], occurrences: graphs[flowId].occurrences.map((candidate) => candidate.id === entity.id ? { ...candidate, schemaConstraints: [...(candidate.schemaConstraints ?? []), constraint], compiledTargetsStale: true } : candidate) } } };
        } return { ...project, collections: { ...project.collections, [options.context().kind]: project.collections[options.context().kind].map((candidate) => candidate.id === entity.id ? { ...candidate, schemaConstraints: [...(candidate.schemaConstraints ?? []), constraint], compiledTargetsStale: true } : candidate) } }; }); options.persist(next); status.textContent = `Affected scope: ${scope} · compiled targets stale · Draft · Undo available`; renderSummary(); renderEditor(); });
        const schemaDocument = entity.structuredSchema ?? entity.structuredDraft?.document;
        for (const path of structuredPaths(schemaDocument)) {
            const item = document.createElement("li");
            item.textContent = `${path} · property · required/forbidden · rules · documentation · examples`;
            tree.append(item);
        }
        back.type = "button";
        back.textContent = "Return to Flow";
        back.addEventListener("click", () => { editor.hidden = true; Array.from(workspace.children).forEach((child) => child.hidden = false); returnFocus?.focus(); });
        editor.append(title, identity, areas, search, tree, form, status, back);
    }
    editor.addEventListener("submit", () => queueMicrotask(() => { const output = editor.querySelector('[role="status"]'), scope = current().scope; if (output)
        output.textContent = `Affected scope: ${scope} · compiled targets stale · Draft · Undo available`; }));
    document.addEventListener("click", (event) => { const target = event.target.closest("[data-occurrence-id]"); if (!target)
        return; const { state } = options.context(), flowId = options.context().kind === "flows" ? options.context().entityId : undefined, graphs = state?.project.documentationFlowGraphs; graphSelection = flowId ? graphs?.[flowId]?.occurrences?.find(({ id }) => id === target.dataset.occurrenceId) : undefined; renderSummary(); });
    document.addEventListener("keydown", (event) => { if (event.key !== "Enter" && event.key !== " ")
        return; const target = event.target.closest("[data-occurrence-id]"); if (!target)
        return; const { state } = options.context(), flowId = options.context().kind === "flows" ? options.context().entityId : undefined, graphs = state?.project.documentationFlowGraphs; graphSelection = flowId ? graphs?.[flowId]?.occurrences?.find(({ id }) => id === target.dataset.occurrenceId) : undefined; renderSummary(); });
    return { render() { if (!editor.isConnected)
            workspace.prepend(editor); if (!editor.hidden)
            return; graphSelection = undefined; renderSummary(); } };
}
//# sourceMappingURL=data-layer-layered-schema-ui.js.map