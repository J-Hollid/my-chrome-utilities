import { addProjectEntity, commitBulkProperties, createSpecificationProject, exportSpecificationProject, importSpecificationProject, projectPreflight, publishProjectRelease, redoProjectTransaction, undoProjectTransaction, } from "./data-layer-specification-project.js";
const STORAGE_KEY = "my-chrome-utilities.specification-project.v1", NAVIGATION_KEY = "my-chrome-utilities.specification-project-navigation.v1";
const q = (selector) => { const element = document.querySelector(selector); if (!element)
    throw new Error(`Missing ${selector}`); return element; };
const id = (kind) => `${kind}:${crypto.randomUUID()}`;
const labels = { profiles: "Shared profiles", pages: "Pages", pageGroups: "Page groups", events: "Events", applicabilitySets: "Applicability", flows: "Flows", fixtures: "Fixtures" };
let state;
let selectedKind = "profiles", selectedId;
function persist(next) { state = next; localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); render(); }
function restore() { const stored = localStorage.getItem(STORAGE_KEY); if (stored)
    try {
        state = JSON.parse(stored);
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
function renderTree() { const tree = q("#project-tree"); tree.replaceChildren(); if (!state)
    return; for (const kind of Object.keys(labels)) {
    const item = document.createElement("li"), button = document.createElement("button");
    button.type = "button";
    button.textContent = `${labels[kind]} (${state.project.collections[kind].length})`;
    button.dataset.kind = kind;
    button.setAttribute("aria-current", String(kind === selectedKind));
    button.addEventListener("click", () => { selectedKind = kind; selectedId = undefined; persistNavigation(); render(); q("#workspace-pane").focus(); });
    item.append(button);
    tree.append(item);
} const release = document.createElement("li"), button = document.createElement("button"); button.type = "button"; button.textContent = `Releases (${state.project.releases.length})`; button.dataset.kind = "releases"; release.append(button); tree.append(release); }
function renderWorkspace() { const content = q("#workspace-content"); content.replaceChildren(); if (!state)
    return; const search = q("#project-search").value.trim().toLowerCase(); if (search) {
    const matches = Object.entries(state.project.collections).flatMap(([kind, entities]) => entities.filter((entity) => entitySearchText(entity).includes(search)).map((entity) => ({ kind, entity }))).slice(0, 40);
    const heading = document.createElement("h1");
    heading.textContent = "Global search";
    const count = document.createElement("p");
    count.className = "status-text";
    count.textContent = `${matches.length} matching project entities`;
    const list = document.createElement("ul");
    list.className = "entity-grid";
    for (const { kind, entity } of matches) {
        const row = document.createElement("li");
        row.className = "entity-row";
        const select = document.createElement("button");
        select.type = "button";
        select.textContent = entity.name;
        select.addEventListener("click", () => { selectedKind = kind; selectedId = entity.id; persistNavigation(); q("#project-search").value = search; render(); });
        const location = document.createElement("span");
        location.className = "search-location";
        location.textContent = `${labels[kind]} · ${entity.id}`;
        const used = document.createElement("span");
        used.textContent = `Used ${whereUsed(entity.id).length} times`;
        row.append(select, location, used);
        list.append(row);
    }
    content.append(heading, count, list);
    q("#project-breadcrumb").textContent = `${state.project.name} / Search / ${search}`;
    return;
} const all = state.project.collections[selectedKind], visible = all.slice(0, 40); const heading = document.createElement("h1"); heading.textContent = labels[selectedKind]; const count = document.createElement("p"); count.className = "status-text"; count.textContent = `${visible.length} of ${all.length} rows rendered${all.length > 40 ? " · virtualized with bounded overscan" : ""}`; const list = document.createElement("ul"); list.className = "entity-grid"; list.setAttribute("role", "listbox"); for (const entity of visible) {
    const row = document.createElement("li");
    row.className = "entity-row";
    row.dataset.entityId = entity.id;
    row.setAttribute("role", "option");
    row.setAttribute("aria-selected", String(entity.id === selectedId));
    const select = document.createElement("button");
    select.type = "button";
    select.textContent = entity.name;
    select.addEventListener("click", () => { selectedId = entity.id; persistNavigation(); render(); });
    const kindText = document.createElement("span");
    kindText.className = "search-location";
    kindText.textContent = `${labels[selectedKind]} · ${entity.id}`;
    const usage = document.createElement("span");
    usage.textContent = `Used ${whereUsed(entity.id).length} times`;
    row.append(select, kindText, usage);
    list.append(row);
} content.append(heading, count, list); q("#project-breadcrumb").textContent = `${state.project.name} / ${labels[selectedKind]}${selectedId ? ` / ${all.find(({ id }) => id === selectedId)?.name ?? selectedId}` : ""}`; const selected = all.find(({ id }) => id === selectedId); q("#inspector-context").textContent = selected ? `${selected.name} · ${selected.id} · Where used: ${whereUsed(selected.id).join(", ") || "None"}` : "Select a project entity."; }
function whereUsed(identity) { if (!state)
    return []; const result = []; for (const [kind, entities] of Object.entries(state.project.collections))
    for (const entity of entities)
        if (entity.id !== identity && entitySearchText(entity).includes(identity.toLowerCase()))
            result.push(`${kind}/${entity.name}`); for (const release of state.project.releases)
    if (entitySearchText(release.snapshot).includes(identity.toLowerCase()))
        result.push(`releases/${release.name}`); return result; }
function render() { const empty = q("#project-empty"), workspace = q("#project-workspace"); empty.hidden = Boolean(state); workspace.hidden = !state; if (!state) {
    q("#project-context").textContent = "No project";
    return;
} q("#project-context").textContent = `${state.project.name} · ${state.project.environments[0]} · ${state.draft ? `Draft ${state.draft.id}` : `Release ${state.project.currentRelease}`}`; q("#project-state").textContent = state.draft?.status ?? "Published"; q("#tree-project-name").textContent = state.project.name; q("#undo-project").disabled = !state.history.undo.length; q("#redo-project").disabled = !state.history.redo.length; renderTree(); renderWorkspace(); }
q("#create-project-form").addEventListener("submit", (event) => { event.preventDefault(); persist(createSpecificationProject({ name: q("#project-name").value.trim(), description: q("#project-description").value, site: q("#project-site").value.trim(), environments: ["Production", "Staging"], id })); q("#workspace-pane").focus(); });
q("#add-entity-form").addEventListener("submit", (event) => { event.preventDefault(); if (!state)
    return; const kind = q("#entity-kind").value, name = q("#entity-name").value.trim(); if (!name)
    return; const defaults = kind === "profiles" ? { requirements: [] } : kind === "flows" ? { steps: [] } : kind === "applicabilitySets" ? { priority: 0, condition: { kind: "all", conditions: [] } } : {}; persist(addProjectEntity(state, kind, { name, ...defaults }, id)); selectedKind = kind; selectedId = state?.project.collections[kind].at(-1)?.id; q("#entity-name").value = ""; persistNavigation(); render(); });
q("#undo-project").addEventListener("click", () => { if (state)
    persist(undoProjectTransaction(state)); });
q("#redo-project").addEventListener("click", () => { if (state)
    persist(redoProjectTransaction(state)); });
q("#project-search").addEventListener("input", renderWorkspace);
q("#commit-bulk-properties").addEventListener("click", () => { if (!state || selectedKind !== "profiles" || !selectedId)
    return; const properties = q("#bulk-properties").value.split(/\r?\n/).filter(Boolean).map((line) => { const [path = "", type = ""] = line.split(",", 2); return { path: path.trim(), type: type.trim() }; }); const result = commitBulkProperties(state, selectedId, properties); q("#bulk-assistance").textContent = result.errors.length ? result.errors.map(({ index, message }) => `Row ${index + 1}: ${message}`).join("; ") : `Committed ${properties.length} properties in one transaction.`; if (!result.errors.length)
    persist(result.state); });
q("#run-preflight").addEventListener("click", () => { if (!state)
    return; const result = projectPreflight(state.project), content = q("#workspace-content"); const section = document.createElement("section"); section.innerHTML = `<h2>Project preflight</h2><p class="status-text">${result.blockers.length ? `${result.blockers.length} blockers` : "Ready to publish"}</p>`; const list = document.createElement("ul"); list.className = "preflight-list"; for (const blocker of result.blockers) {
    const item = document.createElement("li");
    item.className = "error";
    item.textContent = `${blocker.kind}: ${blocker.message}`;
    list.append(item);
} section.append(list); content.prepend(section); });
const releaseDialog = q("#release-review");
q("#publish-project").addEventListener("click", () => { if (!state)
    return; const preflight = projectPreflight(state.project); q("#release-summary").textContent = preflight.blockers.length ? `Publication blocked by ${preflight.blockers.length} issues.` : `Release ${state.project.releases.length + 1} snapshots profiles, pages, events, applicability, flows, fixtures, and references.`; q("#confirm-release").disabled = Boolean(preflight.blockers.length); releaseDialog.showModal(); releaseDialog.querySelector("h2")?.focus(); });
q("#cancel-release").addEventListener("click", () => releaseDialog.close());
q("#confirm-release").addEventListener("click", () => { if (!state)
    return; const next = publishProjectRelease(state, { id, write: (project) => localStorage.setItem(STORAGE_KEY, JSON.stringify({ project, history: { undo: [], redo: [] } })) }); state = next; localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); releaseDialog.close(); render(); q("#workspace-pane").focus(); });
q("#export-project").addEventListener("click", () => { if (!state)
    return; const blob = new Blob([`${exportSpecificationProject(state.project)}\n`], { type: "application/json" }), url = URL.createObjectURL(blob), link = document.createElement("a"); link.href = url; link.download = `${state.project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-project.json`; link.click(); URL.revokeObjectURL(url); });
q("#import-project").addEventListener("click", () => q("#import-project-file").click());
q("#import-project-file").addEventListener("change", async (event) => { const file = event.currentTarget.files?.[0]; if (!file)
    return; const imported = importSpecificationProject(await file.text(), { existingProjects: state ? [state.project] : [], id }); persist({ project: imported.project, draft: { id: id("draft"), status: "Saved", updatedAt: new Date().toISOString() }, history: { undo: [], redo: [] } }); });
restore();
render();
const parameters = new URLSearchParams(location.search), deepKind = parameters.get("kind"), deepId = parameters.get("entity");
if (deepKind && deepKind in labels) {
    selectedKind = deepKind;
    selectedId = deepId ?? undefined;
    persistNavigation();
    render();
    q("#workspace-pane").focus();
}
//# sourceMappingURL=specification-builder.js.map