import { compileLayeredSchema } from "./data-layer-layered-schema.js";
import { layeredContributorsForPath } from "./data-layer-layered-schema-project.js";
import { compileFlowDocumentationSnapshot, configureFlowDocumentationSnapshot, configureFlowDocumentationTable, flowDocumentationCellDetail, flowDocumentationPropertyPaths, flowDocumentationSnapshotStale, orderFlowDocumentationOccurrenceIds, renderFlowDocumentationClipboard, writeFlowDocumentationWorkbook, } from "./data-layer-flow-table-documentation-export.js";
import { documentaryFlowGraph } from "./utilities/data-layer/flow-graph.js";
const createButton = (text, action) => {
    const value = document.createElement("button");
    value.type = "button";
    value.textContent = text;
    value.addEventListener("click", action);
    return value;
};
const labelled = (text, control) => { const label = document.createElement("label"); label.append(control, ` ${text}`); return label; };
const defaultPorts = () => ({
    writePlain: async (value) => navigator.clipboard.writeText(value),
    writeRich: async (html, plain) => {
        if (globalThis.ClipboardItem && navigator.clipboard.write) {
            await navigator.clipboard.write([new ClipboardItem({ "text/html": new Blob([html], { type: "text/html" }), "text/plain": new Blob([plain], { type: "text/plain" }) })]);
            return;
        }
        await navigator.clipboard.writeText(plain);
    },
    download: (name, bytes, type) => { const url = URL.createObjectURL(new Blob([Uint8Array.from(bytes).buffer], { type })), link = document.createElement("a"); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url); },
});
const stableRevision = (value) => { const text = JSON.stringify(value), bytes = new TextEncoder().encode(text); let hash = 2166136261; for (const byte of bytes)
    hash = Math.imul(hash ^ byte, 16777619); return hash >>> 0; };
const graphRevisionFor = (graph) => stableRevision({ pageGroupIds: graph.pageGroupIds, pageFrames: graph.pageFrames, occurrences: graph.occurrences.map(({ canonicalSchema: _canonicalSchema, schemaConstraints: _schemaConstraints, ...occurrence }) => occurrence), relationships: graph.relationships });
const schemaRevisionFor = (state, entities, occurrence) => {
    const ids = new Set([...entities.filter((entity) => Boolean(entity)).map(({ id }) => id), occurrence.id]), canonical = entities.filter((entity) => Boolean(entity)).map((entity) => ({ id: entity.id, revision: Number(entity.canonicalSchema?.revision ?? 0) })), targets = (state.project.layeredSchemaTargets ?? []).filter((target) => target.occurrenceId === occurrence.id || ids.has(String(target.contributorId ?? ""))).map(({ occurrenceId, contributorId, revision }) => ({ occurrenceId, contributorId, revision: Number(revision ?? 0) }));
    return stableRevision({ canonical: canonical.sort((left, right) => left.id.localeCompare(right.id)), targets: targets.sort((left, right) => String(left.contributorId ?? left.occurrenceId).localeCompare(String(right.contributorId ?? right.occurrenceId))) });
};
const emptyCompiled = () => ({ status: "ready", properties: {}, conflicts: [], provenance: [], exclusions: [] });
export function flowDocumentationSnapshotFromState(state, flowId, generatedAt = new Date().toISOString(), revision = 0) {
    const flow = state.project.collections.flows.find(({ id }) => id === flowId);
    if (!flow)
        throw new Error(`Unknown Flow ${flowId}`);
    const graph = documentaryFlowGraph(state.project, flowId), pageById = new Map(state.project.collections.pages.map((page) => [page.id, page])), frameById = new Map(graph.pageFrames.map((frame) => [frame.id, frame])), groupById = new Map(state.project.collections.pageGroups.map((group) => [group.id, group])), profileById = new Map(state.project.collections.profiles.map((profile) => [profile.id, profile])), ordered = orderFlowDocumentationOccurrenceIds(graph.occurrences, graph.relationships, graph.pageGroupIds), occurrenceById = new Map(graph.occurrences.map((occurrence) => [occurrence.id, occurrence]));
    const contexts = ordered.ids.flatMap((occurrenceId, index) => {
        const occurrence = occurrenceById.get(occurrenceId);
        if (!occurrence)
            return [];
        const frame = frameById.get(String(occurrence.pageFrameId)), page = pageById.get(String(occurrence.pageId ?? frame?.pageId)), binding = (page?.contextEventBindings ?? []).find(({ id }) => id === occurrence.contextBindingId), eventId = String(binding?.eventId ?? occurrence.eventId ?? ""), event = state.project.collections.events.find(({ id }) => id === eventId), pageGroupId = String(occurrence.pageGroupId ?? frame?.pageGroupId ?? ""), pageGroup = groupById.get(pageGroupId), profileId = String(page?.profileIds?.[0] ?? ""), profile = profileById.get(profileId), path = { flowId, occurrenceId: occurrence.id, ...(pageGroupId ? { pageGroupId } : {}), ...(eventId ? { eventId } : {}), ...(page?.id ? { pageId: page.id } : {}), ...(profileId ? { profileId } : {}) }, declaredUnresolved = [occurrence, event, page].flatMap((entity) => (entity?.unresolvedReferences ?? [])), unresolved = [...(occurrence.pageFrameId && !frame ? [{ path: "/context/page-frame", issue: `Unresolved Page frame ${String(occurrence.pageFrameId)}`, repair: "Open Flow Page frame" }] : []), ...(!page ? [{ path: "/context/page", issue: `Unresolved Page ${String(occurrence.pageId ?? frame?.pageId ?? "")}`, repair: "Open Page reference" }] : []), ...(occurrence.contextBindingId && !binding ? [{ path: "/context/binding", issue: `Unresolved Page binding ${String(occurrence.contextBindingId)}`, repair: "Open Page context bindings" }] : []), ...(!event ? [{ path: "/context/event", issue: `Unresolved Event ${eventId}`, repair: "Open Event reference" }] : []), ...(pageGroupId && !pageGroup ? [{ path: "/context/page-group", issue: `Unresolved Page Group ${pageGroupId}`, repair: "Open Page Group membership" }] : []), ...(declaredUnresolved.map((item) => ({ path: item.path ?? "/context/reference", issue: item.issue ?? "Unresolved context reference", repair: item.repair ?? "Open context reference" })))], contributors = layeredContributorsForPath(state, path), compiled = contributors.length ? compileLayeredSchema(contributors, { eventId, eventRole: binding ? "context" : "interaction", occurrenceId: occurrence.id }) : emptyCompiled();
        return [{ id: `context:${occurrence.id}`, kind: binding ? "page-context" : "interaction", pageFrameId: String(frame?.id ?? occurrence.freePageFrameId ?? occurrence.id), ...(binding ? { bindingId: binding.id } : { occurrenceId: occurrence.id }), pageName: page?.name ?? "Unresolved Page", eventName: event?.name ?? "Unresolved Event", stepLabel: ordered.labels[occurrence.id] ?? String(index + 1), effectiveRevision: schemaRevisionFor(state, [profile, event, pageGroup, page, flow, occurrence], occurrence), compiled, ...(unresolved.length ? { unresolved } : {}) }];
    });
    const occurrenceIds = new Set(graph.occurrences.map(({ id }) => id));
    graph.relationships.forEach((relationship, index) => { const source = String(relationship.sourceNodeId ?? ""), target = String(relationship.targetNodeId ?? ""), missing = [...(!occurrenceIds.has(source) ? [`source ${source || "(empty)"}`] : []), ...(!occurrenceIds.has(target) ? [`target ${target || "(empty)"}`] : [])]; if (!missing.length || !contexts.length)
        return; const anchor = occurrenceIds.has(source) ? source : occurrenceIds.has(target) ? target : ordered.ids[0], contextIndex = Math.max(0, contexts.findIndex(({ id }) => id === `context:${anchor}`)), context = contexts[contextIndex]; contexts[contextIndex] = { ...context, unresolved: [...(context.unresolved ?? []), { path: `/relationships/${String(relationship.id ?? index)}`, issue: `Dangling Flow relationship: unresolved ${missing.join(" and ")}`, repair: "Open Flow relationship" }] }; });
    return compileFlowDocumentationSnapshot({ projectId: state.project.id, projectName: state.project.name, flowId, flowName: flow.name, graphRevision: graphRevisionFor(graph), sourceState: state.draft ? "draft" : "published", generatedAt, contexts });
}
export function installFlowDocumentationExportUi(options) {
    const ports = options.ports ?? defaultPorts();
    let open = false, snapshot, view = "values", includeHeadings = true, style = "plain", confirmedIncomplete = false, pathDisplay = "display", search = "", feedbackText = "";
    let propertyOrder = [], selectedPaths = new Set(), contextOrder = [], selectedContexts = new Set(), stepLabels = {}, metadata = [], headingParts = { step: true, page: true, event: true };
    const current = () => { const value = options.context(); return { ...value, flow: value.flowId && value.state?.project.collections.flows.find(({ id }) => id === value.flowId) }; };
    const fresh = (state, flowId, revision) => { snapshot = flowDocumentationSnapshotFromState(state, flowId, new Date().toISOString(), revision); propertyOrder = [...flowDocumentationPropertyPaths(snapshot)]; selectedPaths = new Set(propertyOrder); contextOrder = snapshot.contexts.map(({ id }) => id); selectedContexts = new Set(contextOrder); stepLabels = Object.fromEntries(snapshot.contexts.map(({ id, stepLabel }) => [id, stepLabel])); metadata = []; confirmedIncomplete = false; feedbackText = ""; };
    const configuredSnapshot = () => configureFlowDocumentationSnapshot(snapshot, { contextOrder: contextOrder.filter((id) => selectedContexts.has(id)), stepLabels });
    const configuredTable = (kind = view) => configureFlowDocumentationTable(configuredSnapshot(), kind, { selectedPaths: propertyOrder.filter((path) => selectedPaths.has(path)), metadata, pathDisplay, headingParts });
    const move = (items, item, direction) => { const index = items.indexOf(item), target = index + direction; if (index < 0 || target < 0 || target >= items.length)
        return items; const next = [...items]; [next[index], next[target]] = [next[target], next[index]]; return next; };
    const staleState = (state, flowId, revision) => { const live = flowDocumentationSnapshotFromState(state, flowId, snapshot.generatedAt, revision); return flowDocumentationSnapshotStale(snapshot, { graphRevision: live.graphRevision, contextRevisions: Object.fromEntries(live.contexts.map(({ id, effectiveRevision }) => [id, effectiveRevision])) }); };
    function renderTable(host, value, detail) {
        const tableElement = document.createElement("table"), head = document.createElement("thead"), headRow = document.createElement("tr"), body = document.createElement("tbody"), metadataCount = metadata.length, currentSnapshot = configuredSnapshot();
        headRow.append(...value.headings.map((heading) => Object.assign(document.createElement("th"), { textContent: heading })));
        head.append(headRow);
        value.rows.forEach((row, rowIndex) => { const tr = document.createElement("tr"); row.forEach((cell, columnIndex) => { const td = document.createElement("td"); if (columnIndex > metadataCount) {
            const context = currentSnapshot.contexts[columnIndex - metadataCount - 1], path = propertyOrder.filter((candidate) => selectedPaths.has(candidate))[rowIndex];
            if (context && path) {
                const activate = createButton(cell, () => { const value = flowDocumentationCellDetail(currentSnapshot, context.id, path); detail.replaceChildren(Object.assign(document.createElement("h3"), { textContent: value.summary }), Object.assign(document.createElement("p"), { textContent: `${value.rule} · ${value.revision} · ${value.provenance}` }), ...value.repairs.map((repair) => createButton(repair, () => options.openRepair?.(context.id, path, repair)))); });
                activate.setAttribute("aria-label", `${cell || "Empty"} details for ${context.pageName} ${context.eventName} ${path}`);
                td.append(activate);
            }
            else
                td.textContent = cell;
        }
        else
            td.textContent = cell; tr.append(td); }); body.append(tr); });
        tableElement.append(head, body);
        host.replaceChildren(tableElement);
        if (value.legend)
            host.append(Object.assign(document.createElement("p"), { textContent: value.legend }));
    }
    function renderWorkspace() {
        const { state, flowId, flow, revision } = current(), host = document.querySelector("#flow-graph-workspace");
        if (!host || !state || !flowId || !flow)
            return;
        if (!snapshot)
            fresh(state, flowId, revision);
        const base = snapshot, stale = staleState(state, flowId, revision), configured = configuredSnapshot(), value = configuredTable(), blocked = stale.stale || (base.incomplete && !confirmedIncomplete);
        host.replaceChildren();
        const section = document.createElement("section"), heading = document.createElement("h2"), identity = document.createElement("p"), controls = document.createElement("section"), common = document.createElement("fieldset"), viewSelect = document.createElement("select"), headingControl = document.createElement("input"), styleSelect = document.createElement("select"), pathSelect = document.createElement("select"), propertySearch = document.createElement("input"), propertyList = document.createElement("ol"), metadataList = document.createElement("ol"), contextList = document.createElement("ol"), preview = document.createElement("section"), detail = document.createElement("section"), diagnostics = document.createElement("ul"), feedback = document.createElement("output"), actions = document.createElement("div");
        section.setAttribute("aria-label", "Selected Flow documentation export");
        heading.textContent = "Selected Flow documentation export";
        heading.tabIndex = -1;
        identity.textContent = `${base.projectName} · ${base.flowName} · ${base.title} · graph revision ${base.graphRevision} · schema revisions ${base.contexts.map(({ effectiveRevision }) => effectiveRevision).join(", ")}`;
        if (stale.stale) {
            const warning = document.createElement("p");
            warning.setAttribute("role", "alert");
            warning.textContent = `Preview stale — ${stale.graphChanged ? "graph revision changed. " : ""}${stale.changedContexts.length ? `Changed contexts: ${stale.changedContexts.join(", ")}.` : ""} Refresh before export.`;
            section.append(warning);
        }
        viewSelect.setAttribute("aria-label", "Documentation view");
        viewSelect.append(new Option("Flow value map", "values"), new Option("Data capture matrix", "matrix"));
        viewSelect.value = view;
        viewSelect.addEventListener("change", () => { view = viewSelect.value === "matrix" ? "matrix" : "values"; renderWorkspace(); });
        headingControl.type = "checkbox";
        headingControl.checked = includeHeadings;
        headingControl.addEventListener("change", () => { includeHeadings = headingControl.checked; renderWorkspace(); });
        styleSelect.setAttribute("aria-label", "Table style");
        for (const [optionValue, label] of [["plain", "Plain"], ["bordered", "Bordered"], ["highlighted", "Bordered with highlighted headings"]])
            styleSelect.append(new Option(label, optionValue));
        styleSelect.value = style;
        styleSelect.addEventListener("change", () => { style = styleSelect.value; renderWorkspace(); });
        pathSelect.setAttribute("aria-label", "Property row labels");
        pathSelect.append(new Option("Display name", "display"), new Option("Canonical path", "canonical"));
        pathSelect.value = pathDisplay;
        pathSelect.addEventListener("change", () => { pathDisplay = pathSelect.value === "canonical" ? "canonical" : "display"; renderWorkspace(); });
        common.append(Object.assign(document.createElement("legend"), { textContent: "Shared table configuration" }), labelled("View", viewSelect), labelled("Include headings", headingControl), labelled("Style", styleSelect), labelled("Row labels", pathSelect));
        const propertyFieldset = document.createElement("fieldset");
        propertyFieldset.append(Object.assign(document.createElement("legend"), { textContent: "Searchable property selection" }));
        propertySearch.type = "search";
        propertySearch.value = search;
        propertySearch.setAttribute("aria-label", "Search documentation properties");
        propertySearch.addEventListener("input", () => { search = propertySearch.value; renderWorkspace(); });
        propertyFieldset.append(propertySearch);
        for (const path of propertyOrder.filter((candidate) => candidate.toLowerCase().includes(search.trim().toLowerCase()))) {
            const item = document.createElement("li"), check = document.createElement("input");
            check.type = "checkbox";
            check.checked = selectedPaths.has(path);
            check.addEventListener("change", () => { check.checked ? selectedPaths.add(path) : selectedPaths.delete(path); renderWorkspace(); });
            item.append(labelled(path, check), createButton("Move earlier", () => { propertyOrder = move(propertyOrder, path, -1); renderWorkspace(); }), createButton("Move later", () => { propertyOrder = move(propertyOrder, path, 1); renderWorkspace(); }));
            propertyList.append(item);
        }
        propertyFieldset.append(propertyList, createButton("Reset property columns", () => { propertyOrder = [...flowDocumentationPropertyPaths(snapshot)]; selectedPaths = new Set(propertyOrder); metadata = []; renderWorkspace(); }));
        const metadataFieldset = document.createElement("fieldset"), metadataOptions = [["description", "Description"], ["type", "Type"], ["allowedValues", "Allowed values"], ["example", "Documented example"], ["comments", "Comments"], ["provenance", "Provenance"]];
        metadataFieldset.append(Object.assign(document.createElement("legend"), { textContent: "Optional metadata columns" }));
        for (const [key, label] of metadataOptions) {
            const item = document.createElement("li"), check = document.createElement("input");
            item.dataset.metadataKey = key;
            item.draggable = metadata.includes(key);
            item.addEventListener("dragstart", (event) => event.dataTransfer?.setData("application/x-flow-documentation-metadata", key));
            item.addEventListener("dragover", (event) => event.preventDefault());
            item.addEventListener("drop", (event) => { event.preventDefault(); const dragged = event.dataTransfer?.getData("application/x-flow-documentation-metadata"); if (!metadata.includes(dragged) || dragged === key)
                return; const without = metadata.filter((value) => value !== dragged), target = without.indexOf(key); metadata = [...without.slice(0, target), dragged, ...without.slice(target)]; renderWorkspace(); });
            check.type = "checkbox";
            check.checked = metadata.includes(key);
            check.addEventListener("change", () => { metadata = check.checked ? [...metadata, key] : metadata.filter((value) => value !== key); renderWorkspace(); });
            item.append(labelled(label, check));
            if (metadata.includes(key))
                item.append(createButton("Move earlier", () => { metadata = move(metadata, key, -1); renderWorkspace(); }), createButton("Move later", () => { metadata = move(metadata, key, 1); renderWorkspace(); }));
            metadataList.append(item);
        }
        metadataFieldset.append(metadataList);
        const contextFieldset = document.createElement("fieldset");
        contextFieldset.append(Object.assign(document.createElement("legend"), { textContent: "Context columns and documentation order" }));
        for (const id of contextOrder) {
            const context = base.contexts.find((candidate) => candidate.id === id);
            const item = document.createElement("li"), check = document.createElement("input"), label = document.createElement("input");
            item.dataset.contextId = context.id;
            item.dataset.pageFrameId = context.pageFrameId;
            if (context.bindingId)
                item.dataset.bindingId = context.bindingId;
            if (context.occurrenceId)
                item.dataset.occurrenceId = context.occurrenceId;
            check.type = "checkbox";
            check.checked = selectedContexts.has(id);
            check.addEventListener("change", () => { check.checked ? selectedContexts.add(id) : selectedContexts.delete(id); renderWorkspace(); });
            label.value = stepLabels[id] ?? context.stepLabel;
            label.setAttribute("aria-label", `Step label for ${context.pageName} ${context.eventName}`);
            label.addEventListener("change", () => { stepLabels[id] = label.value.trim() || context.stepLabel; renderWorkspace(); });
            item.append(labelled(`${context.pageName} / ${context.eventName} · ${context.kind}`, check), label, createButton("Move earlier", () => { contextOrder = move(contextOrder, id, -1); renderWorkspace(); }), createButton("Move later", () => { contextOrder = move(contextOrder, id, 1); renderWorkspace(); }));
            contextList.append(item);
        }
        contextFieldset.append(contextList, createButton("Reset context order", () => { contextOrder = snapshot.contexts.map(({ id }) => id); selectedContexts = new Set(contextOrder); stepLabels = Object.fromEntries(snapshot.contexts.map(({ id, stepLabel }) => [id, stepLabel])); renderWorkspace(); }));
        const headingFieldset = document.createElement("fieldset");
        headingFieldset.append(Object.assign(document.createElement("legend"), { textContent: "Column heading format" }));
        for (const [key, label] of [["step", "Step label"], ["page", "Page instance"], ["event", "Event"]]) {
            const check = document.createElement("input");
            check.type = "checkbox";
            check.checked = headingParts[key];
            check.addEventListener("change", () => { headingParts = { ...headingParts, [key]: check.checked }; renderWorkspace(); });
            headingFieldset.append(labelled(label, check));
        }
        controls.append(common, propertyFieldset, metadataFieldset, contextFieldset, headingFieldset);
        preview.setAttribute("aria-label", view === "values" ? "Flow value map preview" : "Data capture matrix preview");
        detail.setAttribute("aria-label", "Documentation cell detail");
        renderTable(preview, value, detail);
        diagnostics.setAttribute("aria-label", "Export diagnostics");
        for (const issue of base.diagnostics) {
            const item = document.createElement("li");
            item.append(`${issue.contextName} · ${issue.path} · ${issue.issue} · `, createButton(issue.repair, () => options.openRepair?.(issue.contextId, issue.path, issue.repair)));
            diagnostics.append(item);
        }
        if (base.incomplete) {
            const confirm = document.createElement("input");
            confirm.type = "checkbox";
            confirm.checked = confirmedIncomplete;
            confirm.addEventListener("change", () => { confirmedIncomplete = confirm.checked; renderWorkspace(); });
            controls.append(labelled("Export labelled incomplete", confirm));
        }
        const copy = async (mode) => { if (blocked) {
            feedbackText = stale.stale ? "Refresh the stale preview before export." : "Confirm Export labelled incomplete first.";
            renderWorkspace();
            return;
        } const rendered = renderFlowDocumentationClipboard(configuredTable(), { includeHeadings, style, ...(snapshot.incomplete ? { documentTitle: snapshot.title } : {}) }); try {
            mode === "plain" ? await ports.writePlain(rendered.plain) : await ports.writeRich(rendered.html, rendered.plain);
            feedbackText = mode === "plain" ? "Spreadsheet copied." : "Rich table copied with plain fallback.";
        }
        catch {
            feedbackText = "Copy failed; preview remains available.";
        } renderWorkspace(); };
        const spreadsheet = createButton("Spreadsheet", () => { void copy("plain"); }), rich = createButton("Rich table for Confluence or Jira", () => { void copy("rich"); }), download = createButton("Download Excel workbook", () => { if (blocked) {
            feedbackText = stale.stale ? "Refresh the stale preview before export." : "Confirm Export labelled incomplete first.";
            renderWorkspace();
            return;
        } const configuredNow = configuredSnapshot(), bytes = writeFlowDocumentationWorkbook(configuredNow, { valueTable: configuredTable("values"), matrixTable: configuredTable("matrix") }); ports.download(`${flow.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-documentation.xlsx`, bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"); feedbackText = "Excel workbook downloaded."; renderWorkspace(); });
        spreadsheet.disabled = rich.disabled = download.disabled = blocked;
        actions.append(spreadsheet, rich, download, createButton("Refresh preview", () => { fresh(state, flowId, revision); renderWorkspace(); }), createButton("Close documentation export", () => { open = false; snapshot = undefined; options.renderFlow(); }));
        feedback.textContent = feedbackText;
        section.append(heading, identity, controls, preview, detail, diagnostics, actions, feedback);
        host.append(section);
        heading.focus();
    }
    function render() {
        const { state, flowId, revision } = current();
        if (!state || !flowId)
            return;
        if (open) {
            renderWorkspace();
            return;
        }
        const toolbar = document.querySelector('[aria-label="Flow component catalogs"]');
        if (!toolbar || toolbar.querySelector("[data-flow-documentation-export]"))
            return;
        const control = createButton("Open Documentation export", () => { open = true; fresh(state, flowId, revision); renderWorkspace(); });
        control.dataset.flowDocumentationExport = "true";
        toolbar.append(control);
    }
    return { render };
}
//# sourceMappingURL=data-layer-flow-table-documentation-export-ui.js.map