import { addFreePageFrame, addEventOccurrenceToPage, addGraphOccurrence, deriveFlowOccurrenceExample, deriveFlowPageFrameExample, documentaryFlowGraph, duplicateFlowPageFrame, flowOccurrenceExampleEditorRows, FLOW_GRAPH_GEOMETRY, flowRelationshipText, inspectOccurrencePageChange, migrateLegacyFlowContextBindings, migrateLegacyFlowRelationshipKinds, moveFreePageFrame, moveGraphOccurrence, projectFlowGraph, reassignFlowOccurrencePage, reviewLegacyFlowContextMigration, removeFlowPageFrame, removeFlowRelationship, removeGraphOccurrence, saveGraphRelationship, setFlowOccurrenceExample, } from "./data-layer-flow-graph.js";
import { appendFlowPageFrameCardControls } from "./data-layer-flow-graph-ui-page-frame.js";
import { addFlowPageFrameToSection, connectFlowPageFrames, createFlowSection, inspectSectionRemovalWithContents, moveFlowPageFramePresentation, moveFlowSection, movePageFrameToSection, removeFlowSection, removeFlowSectionWithContents, renameAndResizeFlowSection } from "./utilities/data-layer/property-set-flow-section.js";
import { button, elementByData, entityName, flowEdgeGeometry, flowPortPoint, nodeHeight, nodeWidth, ownsPointerDrag, q, restorePointerCancellationFocus, svg } from "./flow-graph/ui-primitives.js";
export function contextSettingPageLabel(pageName) { return `${pageName} · Context-setting Page`; }
function renderOccurrenceExampleControls(host, state, flowId, occurrenceId, persist, id) {
    host.setAttribute("aria-label", "Occurrence example controls");
    for (const row of flowOccurrenceExampleEditorRows(state.project, flowId, occurrenceId).filter(({ type }) => type !== "object" && type !== "array")) {
        const item = document.createElement("label"), value = document.createElement("input"), save = document.createElement("button");
        item.dataset.exampleEditorPath = row.path;
        item.append(`${row.path} · ${row.type ?? "unknown"} `);
        value.setAttribute("aria-label", `Example value for ${row.path}`);
        value.value = row.value === undefined ? "" : String(row.value);
        save.type = "button";
        save.textContent = "Save example";
        save.addEventListener("click", () => persist(setFlowOccurrenceExample(state, flowId, occurrenceId, row.path, value.value, id)));
        item.append(value, save);
        host.append(item);
    }
}
export { ownsPointerDrag, restorePointerCancellationFocus, flowEdgeGeometry };
export function flowViewAfterRelationshipDeletion(view, relationshipId) { if (view.selectedItem?.kind !== "relationship" || view.selectedItem.id !== relationshipId)
    return view; const { selectedItem, ...retained } = view; void selectedItem; return retained; }
export function consumeRelationshipDeletionFocus(intent, relationshipRestored) { if (!intent)
    return {}; if (relationshipRestored)
    return { target: "relationship" }; if (!intent.sourceFocused)
    return { target: "source", next: { ...intent, sourceFocused: true } }; return { next: intent }; }
export function flowRelationshipDeletionAccessibleName(label, sourceName, targetName) { return `Delete relationship ${[label, `${sourceName} to ${targetName}`].filter(Boolean).join(", ")}`; }
export function installFlowGraphBuilder(options) {
    const inspector = q("#project-inspector"), advanced = q("#flow-step-editor"), inspectorContext = document.createElement("section");
    inspectorContext.id = "flow-inspector-context";
    inspector.insertBefore(inspectorContext, advanced);
    let selected;
    let connection;
    let relationshipPopoverFocusIntent;
    let relationshipEdgeFocusIntent;
    let relationshipDeletionFocusIntent;
    let relationshipDeletionFocusTimer;
    let pageFrameFocusIntent;
    let suppressNodeClick = false;
    let statusMessage = "";
    let statusRepairHref = "";
    let activeCatalogPayload;
    const viewKey = (projectId, flowId) => `my-chrome-utilities.flow-view.v1:${projectId}:${flowId}`;
    const readView = (projectId, flowId) => { try {
        return JSON.parse(sessionStorage.getItem(viewKey(projectId, flowId)) ?? "{}");
    }
    catch {
        return {};
    } };
    const writeView = (projectId, flowId, view) => sessionStorage.setItem(viewKey(projectId, flowId), JSON.stringify(view));
    const clearPageDropStates = () => document.querySelectorAll("[data-section-dropzone]").forEach((section) => delete section.dataset.pageDropState);
    const clearActiveCatalogPayload = () => { activeCatalogPayload = undefined; clearPageDropStates(); };
    window.addEventListener("pointerup", clearActiveCatalogPayload);
    window.addEventListener("mouseup", clearActiveCatalogPayload);
    const current = () => { const context = options.context(), flow = context.flowId && context.state?.project.collections.flows.find(({ id }) => id === context.flowId), graph = flow && context.state ? documentaryFlowGraph(context.state.project, flow.id) : undefined; return { ...context, flow, graph }; };
    const persist = (next, feedback = "") => { try {
        statusMessage = feedback;
        statusRepairHref = "";
        options.persist(next);
        render();
    }
    catch (error) {
        statusMessage = error instanceof Error ? error.message : String(error);
        render();
    } };
    const pageFrame = (frameId) => current().graph?.pageFrames.find(({ id }) => id === frameId);
    const selectedFrameForPage = (pageId) => current().graph?.pageFrames.find((frame) => frame.pageId === pageId);
    const saveSelection = (value) => { const expanded = Array.from(document.querySelectorAll('[data-page-example-for],[data-event-example-for]')).filter((details) => details.open).map((details) => details.dataset.pageExampleFor ? `[data-page-example-for="${CSS.escape(details.dataset.pageExampleFor)}"]` : `[data-event-example-for="${CSS.escape(details.dataset.eventExampleFor ?? "")}]`); selected = value; const { state, flow } = current(); if (state && flow)
        writeView(state.project.id, flow.id, value ? { selectedItem: value } : {}); render(); for (const selector of expanded)
        document.querySelector(selector)?.setAttribute("open", ""); };
    function renderInspector() {
        inspectorContext.replaceChildren();
        const { state, flow, graph } = current();
        if (!state || !flow) {
            inspectorContext.hidden = true;
            return;
        }
        inspectorContext.hidden = false;
        const heading = document.createElement("h3"), copy = document.createElement("p");
        heading.textContent = "Flow details";
        if (!selected) {
            copy.textContent = `${flow.name}. Select a Section, Page frame, occurrence, or relationship for provenance and details. All graph commands remain in the main workspace.`;
            inspectorContext.append(heading, copy);
            return;
        }
        const occurrence = graph?.occurrences.find(({ id }) => id === selected.id), relationship = graph?.relationships.find(({ id }) => id === selected.id), frame = graph?.pageFrames.find(({ id }) => id === selected.id);
        copy.textContent = occurrence ? `${occurrence.name} · stable occurrence ${occurrence.id}` : relationship ? `Stable relationship ${relationship.id}` : frame ? `${entityName(state.project.collections.pages, frame.pageId)} · stable Page frame ${frame.id}` : "Selection details unavailable";
        inspectorContext.append(heading, copy);
    }
    function catalog(kind, entities, activate) {
        const section = document.createElement("section"), heading = document.createElement("h4"), search = document.createElement("input"), items = document.createElement("div");
        section.setAttribute("aria-label", `${kind} catalog`);
        heading.textContent = kind;
        search.type = "search";
        search.placeholder = `Search ${kind}`;
        search.setAttribute("aria-label", `Search ${kind}`);
        const renderItems = () => { const term = search.value.trim().toLowerCase(); items.replaceChildren(...entities.filter(({ name }) => name.toLowerCase().includes(term)).map((entity) => { const control = button(`Add ${entity.name}`, () => activate(entity)); control.draggable = true; control.dataset.componentKind = kind === "Pages" ? "page" : "event"; control.dataset.componentId = entity.id; const payload = () => ({ kind: String(control.dataset.componentKind), id: entity.id }); control.addEventListener("pointerdown", () => { activeCatalogPayload = payload(); }); control.addEventListener("dragstart", (event) => { activeCatalogPayload = payload(); event.dataTransfer?.setData("application/x-flow-component", JSON.stringify(activeCatalogPayload)); if (kind === "Pages")
            event.dataTransfer?.setData("application/x-flow-page-component", entity.id); }); control.addEventListener("dragend", clearActiveCatalogPayload); return control; })); };
        search.addEventListener("input", renderItems);
        renderItems();
        heading.append(button(kind, () => search.focus()));
        section.append(heading, search, items);
        return section;
    }
    function insertPage(page, targetSectionId) { const { state, flow } = current(); if (!state || !flow)
        return; persist(addFlowPageFrameToSection(state, flow.id, page.id, targetSectionId, options.id)); }
    function insertFreePage(page, region, x, y) { const { state, flow } = current(); if (!state || !flow)
        return; try {
        persist(addFreePageFrame(state, flow.id, { pageId: page.id, region, x, y }, options.id));
    }
    catch (error) {
        statusMessage = error instanceof Error ? error.message : String(error);
        statusRepairHref = `?kind=pages&entity=${encodeURIComponent(page.id)}&field=pageGroupIds`;
        render();
    } }
    function insertEvent(event, frameId) { const { state, flow, graph } = current(), selectedFrameId = frameId ?? (selected && selected.kind === "page-frame" ? selected.id : undefined), frame = selectedFrameId ? pageFrame(selectedFrameId) : undefined; if (!state || !flow || !graph || !frame) {
        statusMessage = "Select a Page frame before inserting an Event.";
        render();
        return;
    } const trigger = typeof event.trigger === "string" && event.trigger.trim() ? event.trigger.trim() : undefined, count = graph.occurrences.filter((occurrence) => occurrence.pageFrameId === frame.id).length; persist(addEventOccurrenceToPage(state, flow.id, { name: event.name, pageFrameId: frame.id, pageId: frame.pageId, eventId: event.id, ...(trigger ? { trigger } : {}), obligation: "Required", minimum: 1, maximum: 1, x: 24 + count * 210, y: 70 }, options.id)); }
    function occurrenceExampleDetails(state, flowId, occurrenceId, label) {
        const example = deriveFlowOccurrenceExample(state.project, flowId, occurrenceId), details = document.createElement("details"), summary = document.createElement("summary"), pre = document.createElement("pre"), provenance = document.createElement("ul"), issues = document.createElement("ul"), exampleControls = document.createElement("section");
        renderOccurrenceExampleControls(exampleControls, state, flowId, occurrenceId, persist, options.id);
        details.dataset.eventExampleFor = occurrenceId;
        details.dataset.exampleStatus = example.status;
        summary.textContent = `${label} · ${example.status} · Derived JSON example`;
        pre.dataset.readonlyExample = occurrenceId;
        pre.textContent = example.formattedJson;
        for (const [path, source] of Object.entries(example.provenance)) {
            const item = document.createElement("li");
            item.dataset.examplePath = path;
            item.dataset.exampleSource = source;
            item.textContent = `${path} · ${source}`;
            provenance.append(item);
        }
        for (const issue of example.issues) {
            const item = document.createElement("li"), repair = document.createElement("a"), value = document.createElement("input"), save = button("Save example", () => persist(setFlowOccurrenceExample(current().state, flowId, occurrenceId, issue.path, value.value, options.id)));
            item.dataset.exampleIssuePath = issue.path;
            item.dataset.exampleIssueCode = issue.code;
            repair.href = issue.editHref;
            repair.textContent = "Edit examples";
            repair.addEventListener("click", (event) => { if (options.openOccurrenceSchema?.(occurrenceId, issue.path)) {
                event.preventDefault();
            } });
            value.setAttribute("aria-label", `Example value for ${issue.path}`);
            item.append(`${issue.path} · ${issue.message} `, repair, " ", value, save);
            issues.append(item);
        }
        details.append(summary, pre, provenance, exampleControls, issues);
        return details;
    }
    function pageExampleDetails(state, flowId, frameId, label) {
        const example = deriveFlowPageFrameExample(state.project, flowId, frameId), details = document.createElement("details"), summary = document.createElement("summary"), pre = document.createElement("pre"), provenance = document.createElement("ul"), issues = document.createElement("ul");
        details.dataset.pageExampleFor = frameId;
        details.dataset.exampleStatus = example.status;
        summary.textContent = `${label} page event · ${example.status} · Derived JSON example`;
        pre.dataset.readonlyPageExample = frameId;
        pre.textContent = example.formattedJson;
        for (const [path, source] of Object.entries(example.provenance)) {
            const item = document.createElement("li");
            item.dataset.examplePath = path;
            item.dataset.exampleSource = source;
            item.textContent = `${path} · ${source}`;
            provenance.append(item);
        }
        for (const issue of example.issues) {
            const item = document.createElement("li"), repair = document.createElement("a");
            item.dataset.exampleIssuePath = issue.path;
            item.dataset.exampleIssueCode = issue.code;
            repair.href = issue.editHref;
            repair.textContent = "Open Page-frame contribution";
            repair.addEventListener("click", (event) => { const originFocus = document.activeElement instanceof HTMLElement ? document.activeElement : undefined; const opened = options.openOccurrenceSchema?.(frameId, issue.path, originFocus); saveSelection({ kind: "page-frame", id: frameId }); if (opened)
                event.preventDefault(); });
            item.append(`${issue.path} · ${issue.message} `, repair);
            issues.append(item);
        }
        details.append(summary, pre, provenance, issues);
        return details;
    }
    function renderSectionControls(host) {
        const { state, flow, graph } = current();
        if (!state || !flow || !graph)
            return;
        const heading = document.createElement("h4"), form = document.createElement("form"), name = document.createElement("input"), list = document.createElement("ol"), add = button("Add Section", () => { });
        heading.textContent = "Flow Sections";
        host.dataset.flowSectionWorkspace = flow.id;
        host.setAttribute("aria-label", "Flow Section controls");
        name.setAttribute("aria-label", "New Section name");
        form.addEventListener("submit", (event) => { event.preventDefault(); persist(createFlowSection(current().state, flow.id, { name: name.value, bounds: { x: 40, y: 40 + graph.sections.length * 230, width: 900, height: 200 } }, options.id)); });
        add.type = "submit";
        form.append(name, add);
        host.append(heading, form);
        for (const section of graph.sections) {
            const item = document.createElement("li"), sectionName = document.createElement("input"), review = document.createElement("section"), fields = Object.fromEntries(["x", "y", "width", "height"].map((key) => { const input = document.createElement("input"); input.type = "number"; input.value = String(section.bounds[key]); input.setAttribute("aria-label", `Section ${key} ${section.name}`); return [key, input]; })), save = button("Save name and size", () => persist(renameAndResizeFlowSection(current().state, flow.id, section.id, { name: sectionName.value, bounds: { x: Number(fields.x.value), y: Number(fields.y.value), width: Number(fields.width.value), height: Number(fields.height.value) } }))), move = button("Move Section", () => persist(moveFlowSection(current().state, flow.id, section.id, { x: Number(fields.x.value), y: Number(fields.y.value) }))), remove = button("Remove Section and retain Page frames", () => persist(removeFlowSection(current().state, flow.id, section.id))), removeWithContents = button("Review remove Section with contents", () => { const impact = inspectSectionRemovalWithContents(current().state.project, flow.id, section.id), summary = document.createElement("p"), confirmRemoval = button("Confirm remove Section with contents", () => persist(removeFlowSectionWithContents(current().state, flow.id, section.id, impact))), cancel = button("Cancel", () => { review.hidden = true; review.replaceChildren(); removeWithContents.focus(); }); summary.textContent = `Remove Page frames: ${impact.pageFrames.map(({ name }) => name).join(", ") || "none"}. Remove relationships: ${impact.relationships.map(({ name }) => name).join(", ") || "none"}. Nothing changes until confirmed.`; review.replaceChildren(summary, confirmRemoval, cancel); review.hidden = false; confirmRemoval.focus(); });
            item.dataset.flowSectionId = section.id;
            sectionName.value = section.name;
            sectionName.setAttribute("aria-label", `Section name ${section.name}`);
            review.hidden = true;
            review.setAttribute("aria-label", `Remove ${section.name} with contents review`);
            item.append(sectionName, fields.x, fields.y, fields.width, fields.height, save, move, remove, removeWithContents, review);
            list.append(item);
        }
        host.append(list);
        const placement = document.createElement("section"), frameChoice = document.createElement("select"), sectionChoice = document.createElement("select"), place = button("Place in Section", () => { if (frameChoice.value && sectionChoice.value)
            persist(movePageFrameToSection(current().state, flow.id, frameChoice.value, sectionChoice.value)); }), outside = button("Move outside every Section", () => { if (frameChoice.value)
            persist(movePageFrameToSection(current().state, flow.id, frameChoice.value)); }), connectionControls = document.createElement("section"), source = document.createElement("select"), target = document.createElement("select"), connect = button("Connect Page frames", () => { if (source.value && target.value)
            persist(connectFlowPageFrames(current().state, flow.id, source.value, target.value, options.id)); });
        frameChoice.setAttribute("aria-label", "Page frame to organize");
        sectionChoice.setAttribute("aria-label", "Destination Section");
        source.setAttribute("aria-label", "Relationship source Page frame");
        target.setAttribute("aria-label", "Relationship target Page frame");
        frameChoice.append(new Option("Choose Page frame", ""));
        source.append(new Option("Choose source", ""));
        target.append(new Option("Choose target", ""));
        for (const frame of graph.pageFrames) {
            const label = entityName(state.project.collections.pages, frame.pageId);
            frameChoice.append(new Option(label, frame.id));
            source.append(new Option(label, frame.id));
            target.append(new Option(label, frame.id));
        }
        sectionChoice.append(new Option("Choose Section", ""));
        for (const section of graph.sections)
            sectionChoice.append(new Option(section.name, section.id));
        placement.append(frameChoice, sectionChoice, place, outside);
        connectionControls.append(source, target, connect);
        host.append(placement, connectionControls);
    }
    function dropPayload(event) { const raw = event.dataTransfer?.getData("application/x-flow-component"); if (!raw)
        return activeCatalogPayload; try {
        return JSON.parse(raw);
    }
    catch {
        return activeCatalogPayload;
    } }
    function renderFrameCards(host) {
        const { state, flow, graph } = current();
        if (!state || !flow || !graph)
            return;
        const heading = document.createElement("h4");
        heading.textContent = "Page frames";
        host.setAttribute("aria-label", "Flow Page frames");
        host.append(heading);
        for (const frame of graph.pageFrames) {
            const page = state.project.collections.pages.find(({ id }) => id === frame.pageId), section = graph.sections.find(({ id }) => id === frame.sectionId), card = document.createElement("article"), title = button(`${section?.name ?? "Outside Sections"} / ${contextSettingPageLabel(page?.name ?? frame.pageId)}`, () => saveSelection({ kind: "page-frame", id: frame.id })), move = (dx, dy) => { sessionStorage.setItem(`my-chrome-utilities.flow-focus.v1:${state.project.id}:${flow.id}`, frame.id); persist(moveFlowPageFramePresentation(current().state, flow.id, frame.id, { x: Number(frame.position.x ?? 0) + dx, y: frame.position.y + dy, sectionId: frame.sectionId ?? null })); };
            card.dataset.pageFrameId = frame.id;
            card.dataset.pageId = frame.pageId;
            if (frame.sectionId)
                card.dataset.flowSectionId = frame.sectionId;
            card.tabIndex = 0;
            card.setAttribute("aria-label", `Page frame ${page?.name ?? frame.pageId}`);
            card.addEventListener("click", (event) => { if (event.target === card)
                saveSelection({ kind: "page-frame", id: frame.id }); });
            card.addEventListener("keydown", (event) => { if (!event.key.startsWith("Arrow"))
                return; event.preventDefault(); move(event.key === "ArrowLeft" ? -20 : event.key === "ArrowRight" ? 20 : 0, event.key === "ArrowUp" ? -20 : event.key === "ArrowDown" ? 20 : 0); });
            let drag;
            card.addEventListener("pointerdown", (event) => { drag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY }; });
            card.addEventListener("pointerup", (event) => { if (!drag || drag.pointerId !== event.pointerId)
                return; const origin = drag; drag = undefined; move(event.clientX - origin.x, event.clientY - origin.y); });
            card.addEventListener("dragover", (event) => event.preventDefault());
            card.addEventListener("drop", (event) => { event.preventDefault(); const payload = dropPayload(event); if (payload?.kind === "event") {
                const entity = current().state?.project.collections.events.find(({ id }) => id === payload.id);
                if (entity)
                    insertEvent(entity, frame.id);
            }
            else if (payload?.kind === "page") {
                statusMessage = "A Page frame cannot contain another Page.";
                render();
            } });
            appendFlowPageFrameCardControls({ card, title, state, flow, graph, frame, entityName, pageExampleDetails, saveSelection: (value) => saveSelection(value), ...(options.openOccurrenceSchema ? { openOccurrenceSchema: options.openOccurrenceSchema } : {}), persist: (next) => persist(next), duplicatePageFrame: (next, flowId, frameId) => duplicateFlowPageFrame(next, flowId, frameId, options.id), removePageFrame: (next, flowId, frameId) => removeFlowPageFrame(next, flowId, frameId) });
            host.append(card);
        }
    }
    function cancelConnection(announce = true, suppressClick = false) { const sourceId = connection?.sourceId, sourcePort = connection?.sourcePort; connection?.preview?.remove(); connection = undefined; document.querySelector(".flow-canvas-scroll")?.classList.remove("is-connecting"); document.querySelectorAll(".is-valid-target,.is-invalid-target").forEach((element) => element.classList.remove("is-valid-target", "is-invalid-target")); if (announce)
        statusMessage = "Connection cancelled; canonical state was not changed."; if (suppressClick) {
        suppressNodeClick = true;
        setTimeout(() => { suppressNodeClick = false; }, 0);
    } document.querySelector(`[data-flow-port-for="${CSS.escape(sourceId ?? "")}"][data-flow-port-side="${sourcePort ?? "right"}"]`)?.focus(); }
    function clearSelectedRelationshipForConnection() { if (selected?.kind !== "relationship")
        return; selected = undefined; relationshipPopoverFocusIntent = undefined; relationshipEdgeFocusIntent = undefined; document.querySelector('[aria-label="Inline relationship popover"]')?.remove(); }
    function commitConnection(targetId, targetPort) { const { state, flow, graph, revision } = current(), sourceId = connection?.sourceId, sourcePort = connection?.sourcePort ?? "right", inferredTargetPort = targetPort ?? (sourcePort === "right" ? "left" : sourcePort === "top" ? "bottom" : sourcePort === "bottom" ? "top" : undefined); if (!state || !flow || !graph || !sourceId || !targetId || !inferredTargetPort || sourceId === targetId) {
        cancelConnection(true, true);
        return;
    } const before = new Set(graph.relationships.map(({ id }) => id)), next = saveGraphRelationship(state, flow.id, sourceId, { toStepId: targetId, sourcePort, targetPort: inferredTargetPort }, options.id), created = documentaryFlowGraph(next.project, flow.id).relationships.find(({ id }) => !before.has(id)); if (!created) {
        cancelConnection(true, true);
        return;
    } connection = undefined; document.querySelector(".flow-canvas-scroll")?.classList.remove("is-connecting"); selected = { kind: "relationship", id: created.id }; relationshipPopoverFocusIntent = { id: created.id, revision: Number(revision ?? 0), optimisticFocused: false }; persist(next); }
    function renderRelationshipPopover(host) {
        if (selected?.kind !== "relationship")
            return;
        const { state, flow, revision } = current();
        if (!state || !flow)
            return;
        const projection = projectFlowGraph(state.project, flow.id).graph, relationship = projection.relationships.find(({ id }) => id === selected.id);
        if (!relationship)
            return;
        const sourceId = relationship.sourceEndpoint.id, targetId = relationship.targetEndpoint.id, source = projection.connectionEndpoints.find(({ id }) => id === sourceId), target = projection.connectionEndpoints.find(({ id }) => id === targetId), form = document.createElement("form"), heading = document.createElement("h4"), endpoints = document.createElement("p"), inferredKind = document.createElement("p"), group = document.createElement("input"), label = document.createElement("input"), condition = document.createElement("textarea"), expectation = document.createElement("textarea"), save = document.createElement("button"), cancel = document.createElement("button"), remove = document.createElement("button"), relationshipName = [relationship.label, `${source?.name ?? sourceId} to ${target?.name ?? targetId}`].filter(Boolean).join(", ");
        form.dataset.relationshipPopover = relationship.id;
        form.setAttribute("aria-label", "Inline relationship popover");
        heading.textContent = "Relationship details";
        endpoints.dataset.relationshipEndpoints = relationship.id;
        endpoints.textContent = `${source?.name ?? sourceId} ${relationship.sourcePort} → ${target?.name ?? targetId} ${relationship.targetPort}`;
        inferredKind.dataset.inferredRelationshipKind = relationship.kind;
        inferredKind.textContent = `Inferred kind: ${relationship.kind}`;
        group.value = relationship.group ?? "";
        group.setAttribute("aria-label", "Relationship group");
        label.value = relationship.label ?? "";
        label.setAttribute("aria-label", "Optional relationship label");
        condition.value = relationship.documentationCondition ?? "";
        condition.setAttribute("aria-label", "Documentation condition");
        expectation.value = relationship.expectation ?? "";
        expectation.setAttribute("aria-label", "Relationship expectation");
        save.type = "submit";
        save.textContent = "Save relationship";
        cancel.type = "button";
        cancel.textContent = "Cancel";
        remove.type = "button";
        remove.textContent = "Delete relationship";
        remove.setAttribute("aria-label", flowRelationshipDeletionAccessibleName(relationship.label, source?.name ?? sourceId, target?.name ?? targetId));
        remove.addEventListener("click", () => { relationshipPopoverFocusIntent = undefined; relationshipEdgeFocusIntent = undefined; relationshipDeletionFocusIntent = { id: relationship.id, sourceKind: relationship.sourceEndpoint.kind, sourceId, sourceFocused: false }; selected = undefined; const context = current(), view = readView(context.state.project.id, flow.id); writeView(context.state.project.id, flow.id, flowViewAfterRelationshipDeletion(view, relationship.id)); persist(removeFlowRelationship(context.state, flow.id, relationship.id), `Deleted relationship ${relationshipName}. Saved Draft; documentation preview stale; Undo available.`); });
        cancel.addEventListener("click", () => { relationshipPopoverFocusIntent = undefined; relationshipEdgeFocusIntent = undefined; selected = undefined; render(); document.querySelector(`[data-flow-port-for="${CSS.escape(sourceId)}"][data-flow-port-side="${relationship.sourcePort}"]`)?.focus(); });
        form.addEventListener("submit", (event) => { event.preventDefault(); relationshipPopoverFocusIntent = undefined; relationshipEdgeFocusIntent = { id: relationship.id, revision: Number(revision ?? 0), optimisticFocused: false }; persist(saveGraphRelationship(current().state, flow.id, sourceId, { id: relationship.id, toStepId: targetId, sourcePort: relationship.sourcePort, targetPort: relationship.targetPort, group: group.value.trim(), label: label.value.trim(), documentationCondition: condition.value.trim(), expectation: expectation.value.trim() }, options.id)); queueMicrotask(() => document.querySelector(`[data-relationship-id="${CSS.escape(relationship.id)}"]`)?.focus()); });
        const labeled = (text, control) => { const wrapper = document.createElement("label"); wrapper.append(text, control); return wrapper; };
        form.append(heading, endpoints, inferredKind, labeled("Group", group), labeled("Optional label", label), labeled("Condition", condition), labeled("Expectation", expectation), save, cancel, remove);
        host.append(form);
        const intent = relationshipPopoverFocusIntent;
        if (intent?.id === relationship.id) {
            const renderRevision = Number(revision ?? 0), replacement = intent.optimisticFocused && renderRevision > intent.revision;
            if (!intent.optimisticFocused) {
                intent.optimisticFocused = true;
                intent.revision = renderRevision;
            }
            queueMicrotask(() => { if (!label.isConnected)
                return; label.focus(); if (replacement && relationshipPopoverFocusIntent === intent)
                relationshipPopoverFocusIntent = undefined; });
        }
    }
    function renderActions(host) {
        const { state, flow, graph } = current();
        if (!state || !flow || !graph)
            return;
        if (selected?.kind === "page-frame") {
            const frame = graph.pageFrames.find(({ id }) => id === selected.id);
            if (!frame)
                return;
            const actions = document.createElement("section"), openSchema = button("Open schema contribution", () => options.openOccurrenceSchema?.(frame.id, undefined, openSchema));
            openSchema.dataset.flowSchemaContribution = "true";
            actions.setAttribute("aria-label", "Selected Page instance inline actions");
            actions.append(button("Move", () => document.querySelector(`[data-page-frame-id="${CSS.escape(frame.id)}"]`)?.focus()), button("Connect", () => document.querySelector(`[data-output-port-for="${CSS.escape(frame.id)}"]`)?.focus()), openSchema, button("Remove", () => persist(removeFlowPageFrame(current().state, flow.id, frame.id))));
            host.append(actions);
            return;
        }
        if (selected?.kind !== "occurrence")
            return;
        const occurrence = graph.occurrences.find(({ id }) => id === selected.id), node = projectFlowGraph(state.project, flow.id).graph.nodes.find(({ id }) => id === selected.id);
        if (!occurrence || !node)
            return;
        const actions = document.createElement("section"), migration = reviewLegacyFlowContextMigration(state.project, flow.id), pageChoice = document.createElement("select"), impact = document.createElement("output"), confirmPage = button("Confirm Page change", () => persist(reassignFlowOccurrencePage(current().state, flow.id, occurrence.id, pageChoice.value)));
        actions.setAttribute("aria-label", "Selected Event occurrence inline actions");
        pageChoice.setAttribute("aria-label", "Containing Page frame");
        pageChoice.append(new Option("Choose containing Page", ""));
        for (const frame of graph.pageFrames.filter(({ id }) => id !== occurrence.pageFrameId)) {
            const page = state.project.collections.pages.find(({ id }) => id === frame.pageId);
            pageChoice.append(new Option(`${page?.name ?? frame.pageId} · ${frame.id}`, frame.id));
        }
        confirmPage.disabled = true;
        pageChoice.addEventListener("change", () => { const review = inspectOccurrencePageChange(state.project, flow.id, occurrence.id, pageChoice.value); impact.textContent = review.message; confirmPage.disabled = review.rejected; });
        const duplicate = () => { const next = addGraphOccurrence(current().state, flow.id, { name: `${occurrence.name} copy`, ...(occurrence.pageFrameId ? { pageFrameId: String(occurrence.pageFrameId) } : {}), ...(occurrence.pageGroupId ? { pageGroupId: String(occurrence.pageGroupId) } : {}), ...(occurrence.freePageFrameId ? { freePageFrameId: String(occurrence.freePageFrameId) } : {}), pageId: String(occurrence.pageId), eventId: node.eventId, ...(node.trigger ? { trigger: node.trigger } : {}), obligation: String(occurrence.obligation ?? "Required"), minimum: Number(occurrence.minimum ?? 1), maximum: Number(occurrence.maximum ?? 1), y: Number(occurrence.position?.y ?? 70) + 24 }, options.id); persist(next); }, duplicateButton = button("Duplicate occurrence", duplicate);
        duplicateButton.disabled = Boolean(migration.items.length || migration.blockers.length);
        if (duplicateButton.disabled)
            duplicateButton.title = "Confirm the Page-context migration before changing this graph.";
        const openSchema = () => { document.querySelector(`[data-occurrence-id="${CSS.escape(occurrence.id)}"]`)?.dispatchEvent(new MouseEvent("click", { bubbles: true })); queueMicrotask(() => { const open = Array.from(document.querySelectorAll('[aria-label="Schema constraints summary"] button')).find(({ textContent }) => textContent?.includes("Open complete schema editor")); open?.click(); }); };
        actions.append(button("Move within Page", () => document.querySelector(`[data-occurrence-id="${CSS.escape(occurrence.id)}"]`)?.focus()), pageChoice, impact, confirmPage, duplicateButton, button("Remove", () => persist(removeGraphOccurrence(current().state, flow.id, occurrence.id))), button("Open schema contribution", openSchema));
        host.append(actions);
    }
    function renderGraph(flow) {
        const preMigrationState = current().state;
        if (preMigrationState) {
            const migrated = migrateLegacyFlowRelationshipKinds(preMigrationState, flow.id);
            if (migrated !== preMigrationState) {
                persist(migrated);
                return;
            }
        }
        const host = q("#flow-graph-workspace");
        host.replaceChildren();
        const { state, graph: stored } = current();
        if (!state || !stored)
            return;
        const migration = reviewLegacyFlowContextMigration(state.project, flow.id);
        if (migration.items.length || migration.blockers.length) {
            const review = document.createElement("section"), heading = document.createElement("h3"), list = document.createElement("ul"), confirm = button("Confirm Page-context migration", () => persist(migrateLegacyFlowContextBindings(current().state, flow.id)));
            review.setAttribute("aria-label", "Flow Page-context migration review");
            heading.textContent = "Review Page-context migration";
            for (const item of migration.items) {
                const row = document.createElement("li");
                row.textContent = `${item.flowName} / ${item.pageName} / ${item.eventName} · ${item.trigger} · occurrence ${item.occurrenceName}`;
                list.append(row);
            }
            for (const blocker of migration.blockers) {
                const row = document.createElement("li");
                row.textContent = blocker.message;
                list.append(row);
            }
            confirm.disabled = Boolean(migration.blockers.length) || !migration.items.length;
            review.append(heading, list, confirm);
            host.append(review);
        }
        const transientView = readView(state.project.id, flow.id), selectionExists = selected && (selected.kind === "page-frame" ? stored.pageFrames : selected.kind === "occurrence" ? stored.occurrences : stored.relationships).some(({ id }) => id === selected.id);
        if (!selectionExists)
            selected = transientView.selectedItem;
        const projection = projectFlowGraph(state.project, flow.id), section = document.createElement("section"), heading = document.createElement("h3"), boundary = document.createElement("p"), toolbar = document.createElement("section"), laneControls = document.createElement("section"), status = document.createElement("p"), frames = document.createElement("section"), views = document.createElement("div"), canvasScroll = document.createElement("div"), canvas = svg("svg"), outline = document.createElement("ol"), popover = document.createElement("section"), actions = document.createElement("section");
        const freeRoots = stored.pageFrames.filter(({ freePageRegion }) => Boolean(freePageRegion)), namedRight = Math.max(940, ...projection.laneBands.map(({ x, width }) => x + width), ...projection.graph.connectionEndpoints.map((endpoint) => endpoint.layout.x + endpoint.width + 60)), viewWidth = Math.max(960, namedRight + 100), viewHeight = Math.max(780, ...projection.laneBands.map(({ y, height }) => y + height + 80), ...projection.graph.connectionEndpoints.map((endpoint) => endpoint.layout.y + endpoint.height + 100));
        const targetPortFor = (sourcePort) => sourcePort === "right" ? "left" : sourcePort === "top" ? "bottom" : sourcePort === "bottom" ? "top" : undefined;
        const targetPortElement = (endpointId, sourcePort) => { const targetPort = targetPortFor(sourcePort); return targetPort ? document.querySelector(`[data-flow-port-for="${CSS.escape(endpointId)}"][data-flow-port-side="${targetPort}"]`) ?? undefined : undefined; };
        const beginPortConnection = (endpoint, sourcePort, port) => { clearSelectedRelationshipForConnection(); connection?.preview?.remove(); const targetPort = targetPortFor(sourcePort), targets = targetPort ? projection.graph.connectionEndpoints.map(({ id }) => id).filter((id) => id !== endpoint.id) : []; if (!targets.length) {
            statusMessage = targetPort ? "Add another Page frame before drawing a relationship." : "This port cannot start a relationship.";
            render();
            return;
        } const start = flowPortPoint(endpoint.layout, { width: endpoint.width, height: endpoint.height }, sourcePort), preview = svg("line"); preview.classList.add("flow-connection-preview"); preview.setAttribute("x1", String(start.x)); preview.setAttribute("y1", String(start.y)); preview.setAttribute("x2", String(start.x)); preview.setAttribute("y2", String(start.y)); canvas.append(preview); connection = { sourceId: endpoint.id, sourcePort, targets, targetIndex: 0, preview }; statusMessage = `Connection mode: choose a ${targetPort} port; Escape cancels.`; targetPortElement(targets[0], sourcePort)?.classList.add("is-valid-target"); port.focus(); };
        section.className = "documentary-flow";
        section.dataset.flowSectionWorkspace = flow.id;
        heading.textContent = "Canvas-first directional Flow";
        boundary.className = "status-text";
        boundary.textContent = "Documentary journey expectations are checked manually. Each Event payload schema validates independently.";
        toolbar.setAttribute("aria-label", "Flow component catalogs");
        const sectionCatalog = button("Sections", () => laneControls.querySelector('[aria-label="New Section name"]')?.focus()), toggleInspector = button(inspector.hidden ? "Open Inspector" : "Close Inspector", () => { inspector.hidden = !inspector.hidden; toggleInspector.textContent = inspector.hidden ? "Open Inspector" : "Close Inspector"; });
        toolbar.append(sectionCatalog, catalog("Pages", state.project.collections.pages, (page) => insertPage(page)), catalog("Events", state.project.collections.events, (event) => insertEvent(event)), toggleInspector);
        renderSectionControls(laneControls);
        renderFrameCards(frames);
        status.setAttribute("role", "status");
        status.textContent = statusMessage || (!stored.pageFrames.length ? "Add a Page from the Pages catalog." : "Draw between matching relationship ports, or press Enter on a port.");
        canvas.classList.add("flow-graph-canvas");
        canvas.setAttribute("aria-label", "Interactive directional Flow canvas");
        canvas.setAttribute("role", "application");
        canvas.dataset.viewport = JSON.stringify(transientView.viewport ?? { x: 0, y: 0, zoom: 1 });
        canvas.setAttribute("viewBox", `0 0 ${viewWidth} ${viewHeight}`);
        canvas.style.width = `${viewWidth}px`;
        canvas.style.height = `${viewHeight}px`;
        const resizeCanvasHeight = () => { const expanded = Array.from(canvas.querySelectorAll("[data-event-example-node]")).filter((candidate) => candidate.querySelector("details")?.open), height = Math.max(viewHeight, ...expanded.map((candidate) => { const parent = candidate.parentNode, parentY = parent.transform.baseVal.consolidate()?.matrix.f ?? 0; return parentY + Number(candidate.getAttribute("y") ?? 0) + Number(candidate.getAttribute("height") ?? 0); })); canvas.setAttribute("viewBox", `0 0 ${viewWidth} ${height}`); canvas.style.height = `${height}px`; };
        outline.setAttribute("aria-label", "Synchronized editable Flow outline");
        views.className = "flow-projections";
        projection.laneBands.forEach((band) => { const region = projection.lanes.find(({ id }) => id === band.id), group = svg("g"), rect = svg("rect"), label = svg("text"), outlineRow = document.createElement("li"), outlineControl = button(`${region.name} · Section`, () => laneControls.querySelector(`[data-flow-section-id="${CSS.escape(region.id)}"] input`)?.focus()); group.dataset.flowSectionId = region.id; rect.setAttribute("x", String(band.x)); rect.setAttribute("y", String(band.y)); rect.setAttribute("width", String(band.width)); rect.setAttribute("height", String(band.height)); rect.setAttribute("class", "flow-lane flow-section-region"); rect.dataset.sectionDropzone = region.id; rect.addEventListener("dragover", (event) => event.preventDefault()); rect.addEventListener("drop", (event) => { event.preventDefault(); const payload = dropPayload(event), page = payload?.kind === "page" ? current().state?.project.collections.pages.find(({ id }) => id === payload.id) : undefined; if (page)
            insertPage(page, region.id); }); label.classList.add("flow-lane-label"); label.setAttribute("x", String(band.x + 12)); label.setAttribute("y", String(band.y + 25)); label.textContent = region.name; group.append(rect, label); canvas.append(group); outlineRow.dataset.flowSectionId = region.id; outlineRow.append(outlineControl); outline.append(outlineRow); });
        const clearEdgeTargets = () => canvas.querySelectorAll("[data-free-page-edge-target]").forEach((target) => target.remove()), showEdgeTargets = () => { clearEdgeTargets(); for (const region of ["before-lanes", "after-lanes"]) {
            const target = svg("g"), rect = svg("rect"), label = svg("text"), x = region === "before-lanes" ? -112 : namedRight + 10;
            target.dataset.freePageEdgeTarget = region;
            target.setAttribute("role", "button");
            target.setAttribute("aria-label", region === "before-lanes" ? "Place before lanes" : "Place after lanes");
            rect.setAttribute("x", String(x));
            rect.setAttribute("y", "58");
            rect.setAttribute("width", "72");
            rect.setAttribute("height", "168");
            rect.setAttribute("rx", "10");
            rect.classList.add("flow-free-edge-target");
            label.setAttribute("x", String(x + 6));
            label.setAttribute("y", "82");
            label.textContent = region === "before-lanes" ? "Place before lanes" : "Place after lanes";
            target.addEventListener("dragover", (event) => { event.preventDefault(); rect.setAttribute("width", "88"); });
            target.addEventListener("drop", (event) => { event.preventDefault(); event.stopPropagation(); const payload = dropPayload(event), page = payload?.kind === "page" ? current().state?.project.collections.pages.find(({ id }) => id === payload.id) : undefined; if (page)
                insertFreePage(page, region, 24, 90); });
            target.append(rect, label);
            canvas.append(target);
        } };
        const placeActiveCatalogPage = (event) => { const payload = activeCatalogPayload, page = payload?.kind === "page" ? current().state?.project.collections.pages.find(({ id }) => id === payload.id) : undefined; if (!page)
            return; const target = event.target.closest("[data-section-dropzone]"); if (target?.dataset.sectionDropzone)
            insertPage(page, target.dataset.sectionDropzone); };
        canvas.addEventListener("pointerup", placeActiveCatalogPage);
        canvas.addEventListener("mouseup", placeActiveCatalogPage);
        for (const frame of stored.pageFrames.filter(({ freePageRegion }) => !freePageRegion)) {
            const endpoint = projection.graph.connectionEndpoints.find(({ kind, id }) => kind === "page-frame" && id === frame.id), x = endpoint.layout.x, y = endpoint.layout.y, group = svg("g"), rect = svg("rect"), label = svg("text"), inputPort = svg("circle"), outputPort = svg("circle"), moveTo = (targetId, nextX, nextY) => { const currentState = current().state, next = moveFlowPageFramePresentation(currentState, flow.id, frame.id, { x: Math.max(0, Math.round(nextX)), y: Math.max(0, Math.round(nextY)), sectionId: targetId ?? null }); if (next !== currentState)
                persist(next); setTimeout(() => elementByData("data-page-frame-id", frame.id)?.focus(), 50); }, beginConnection = () => { clearSelectedRelationshipForConnection(); connection?.preview?.remove(); const targets = projection.graph.connectionEndpoints.map(({ id }) => id).filter((id) => id !== frame.id); if (!targets.length) {
                statusMessage = "Add another Page frame before drawing a relationship.";
                render();
                return;
            } const preview = svg("line"); preview.classList.add("flow-connection-preview"); preview.setAttribute("x1", String(x + endpoint.width)); preview.setAttribute("y1", String(y + endpoint.height / 2)); preview.setAttribute("x2", String(x + endpoint.width + 20)); preview.setAttribute("y2", String(y + endpoint.height / 2)); canvas.append(preview); connection = { sourceId: frame.id, targets, targetIndex: 0, preview }; statusMessage = "Connection mode: choose a valid input port; Escape cancels."; elementByData("data-input-port-for", targets[0] ?? "")?.classList.add("is-valid-target"); outputPort.focus(); };
            group.dataset.pageFrameId = frame.id;
            group.dataset.flowEndpointId = frame.id;
            group.dataset.flowEndpointKind = "page-frame";
            group.dataset.pageId = frame.pageId;
            if (frame.sectionId)
                group.dataset.flowSectionId = frame.sectionId;
            group.setAttribute("transform", `translate(${x} ${y})`);
            group.tabIndex = 0;
            rect.setAttribute("width", String(endpoint.width));
            rect.setAttribute("height", String(endpoint.height));
            rect.setAttribute("rx", "12");
            rect.classList.add("flow-page-frame");
            label.setAttribute("x", "10");
            label.setAttribute("y", "22");
            label.textContent = endpoint.name;
            inputPort.setAttribute("cx", "0");
            inputPort.setAttribute("cy", String(endpoint.height / 2));
            inputPort.setAttribute("r", "8");
            inputPort.tabIndex = 0;
            inputPort.dataset.inputPortFor = frame.id;
            inputPort.setAttribute("aria-label", `Input port for ${endpoint.name}`);
            outputPort.setAttribute("cx", String(endpoint.width));
            outputPort.setAttribute("cy", String(endpoint.height / 2));
            outputPort.setAttribute("r", "8");
            outputPort.tabIndex = 0;
            outputPort.dataset.outputPortFor = frame.id;
            outputPort.setAttribute("aria-label", `Output port for ${endpoint.name}`);
            outputPort.addEventListener("pointerdown", (event) => { event.stopPropagation(); beginConnection(); });
            outputPort.addEventListener("keydown", (event) => { if (event.key === "Enter" && !connection) {
                event.preventDefault();
                beginConnection();
                return;
            } if (event.key === "Escape" && connection) {
                event.preventDefault();
                cancelConnection();
                return;
            } if (event.key === "Enter" && connection) {
                event.preventDefault();
                commitConnection(connection.targets[connection.targetIndex]);
            } });
            inputPort.addEventListener("pointerup", (event) => { event.stopPropagation(); commitConnection(frame.id); });
            label.textContent = `${endpoint.name} · Context-setting Page`;
            group.setAttribute("aria-label", `${endpoint.name}. Context-setting Page frame. Drag or use Arrow keys to move.`);
            group.addEventListener("dragover", (event) => event.preventDefault());
            group.addEventListener("drop", (event) => { event.preventDefault(); event.stopPropagation(); const payload = dropPayload(event); if (payload?.kind !== "event")
                return; const entity = current().state?.project.collections.events.find(({ id }) => id === payload.id); if (entity)
                insertEvent(entity, frame.id); });
            let start, suppressPointerClick = false;
            const releaseClickSuppression = () => setTimeout(() => { suppressPointerClick = false; }, 1000), move = (event) => { if (!ownsPointerDrag(start?.pointerId, event.pointerId))
                return; group.setAttribute("transform", `translate(${x + event.clientX - start.clientX} ${y + event.clientY - start.clientY})`); }, finish = (up) => { if (!ownsPointerDrag(start?.pointerId, up.pointerId))
                return; window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", finish); window.removeEventListener("pointercancel", cancel); const initial = start, nextX = x + up.clientX - initial.clientX, nextY = y + up.clientY - initial.clientY, target = Array.from(canvas.querySelectorAll("[data-section-dropzone]")).find((region) => { const bounds = region.getBoundingClientRect(); return up.clientX >= bounds.left && up.clientX <= bounds.right && up.clientY >= bounds.top && up.clientY <= bounds.bottom; })?.dataset.sectionDropzone, pointerId = initial.pointerId; if (group.hasPointerCapture(pointerId))
                group.releasePointerCapture(pointerId); start = undefined; if (suppressPointerClick)
                releaseClickSuppression(); moveTo(target, nextX, nextY); }, cancel = (event) => { if (!ownsPointerDrag(start?.pointerId, event.pointerId))
                return; window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", finish); window.removeEventListener("pointercancel", cancel); if (group.hasPointerCapture(start.pointerId))
                group.releasePointerCapture(start.pointerId); start = undefined; group.setAttribute("transform", `translate(${x} ${y})`); if (suppressPointerClick)
                releaseClickSuppression(); };
            group.addEventListener("pointerdown", (event) => { if (event.target.closest("circle"))
                return; if (start) {
                suppressPointerClick = true;
                return;
            } start = { pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY }; window.addEventListener("pointermove", move); window.addEventListener("pointerup", finish); window.addEventListener("pointercancel", cancel); try {
                group.setPointerCapture(event.pointerId);
            }
            catch { /* Synthetic tests have no active device pointer to capture. */ } });
            group.addEventListener("keydown", (event) => { if (!event.key.startsWith("Arrow") || event.target.closest("circle"))
                return; event.preventDefault(); const dx = event.key === "ArrowLeft" ? -20 : event.key === "ArrowRight" ? 20 : 0, dy = event.key === "ArrowUp" ? -20 : event.key === "ArrowDown" ? 20 : 0; moveTo(frame.sectionId, x + dx, y + dy); });
            group.addEventListener("click", (event) => { if (event.target.closest("circle"))
                return; if (suppressPointerClick) {
                event.stopPropagation();
                return;
            } saveSelection({ kind: "page-frame", id: frame.id }); });
            group.append(rect, label, inputPort, outputPort);
            canvas.append(group);
            const outlineRow = document.createElement("li"), outlineControl = button(`${endpoint.name} · Page instance`, () => saveSelection({ kind: "page-frame", id: frame.id }));
            outlineRow.dataset.pageFrameId = frame.id;
            outlineRow.dataset.pageId = frame.pageId;
            outlineRow.append(outlineControl);
            outline.append(outlineRow);
            outlineControl.textContent = `${endpoint.name} · Context-setting Page`;
        }
        for (const storedFrame of freeRoots) {
            const frame = svg("g"), rect = svg("rect"), label = svg("text"), page = state.project.collections.pages.find(({ id }) => id === storedFrame.pageId), position = storedFrame.position, endpoint = projection.graph.connectionEndpoints.find(({ kind, id }) => kind === "page-frame" && id === storedFrame.id), x = Number(endpoint?.layout.x ?? position.x ?? 24);
            frame.dataset.pageFrameId = storedFrame.id;
            frame.dataset.freePageFrameCanvas = storedFrame.id;
            frame.dataset.freePageRegion = storedFrame.freePageRegion;
            frame.setAttribute("transform", `translate(${x - 10} ${position.y - 12})`);
            frame.tabIndex = 0;
            frame.addEventListener("dragover", (event) => event.preventDefault());
            frame.addEventListener("drop", (event) => { event.preventDefault(); const payload = dropPayload(event); if (payload?.kind !== "event")
                return; const entity = current().state?.project.collections.events.find(({ id }) => id === payload.id); if (entity)
                insertEvent(entity, storedFrame.id); });
            rect.setAttribute("width", "190");
            rect.setAttribute("height", "108");
            rect.setAttribute("rx", "12");
            rect.classList.add("flow-page-frame", "flow-free-page-frame");
            label.setAttribute("x", "10");
            label.setAttribute("y", "20");
            label.setAttribute("textLength", "170");
            label.setAttribute("lengthAdjust", "spacingAndGlyphs");
            label.textContent = `${storedFrame.freePageRegion === "before-lanes" ? "Before" : "After"} lanes · ${contextSettingPageLabel(page?.name ?? storedFrame.pageId)}`;
            let start, targetRegion, suppressPointerClick = false;
            const owns = (event) => ownsPointerDrag(start?.pointerId, event.pointerId), stop = (pointerId) => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", finish); window.removeEventListener("pointercancel", cancel); if (frame.hasPointerCapture(pointerId))
                frame.releasePointerCapture(pointerId); start = undefined; targetRegion = undefined; }, move = (event) => { if (!owns(event))
                return; const edge = document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-free-page-edge-target]"); if (edge?.dataset.freePageEdgeTarget)
                targetRegion = edge.dataset.freePageEdgeTarget; }, finish = (event) => { if (!owns(event))
                return; const initial = start, region = targetRegion ?? storedFrame.freePageRegion, afterStart = namedRight, nextX = region === "before-lanes" ? Math.max(12, Math.round(x + event.clientX - initial.clientX)) : Math.max(12, Math.round(x + event.clientX - initial.clientX - afterStart)), nextY = Math.max(55, Math.round(position.y + event.clientY - initial.clientY)); stop(initial.pointerId); persist(moveFreePageFrame(current().state, flow.id, storedFrame.id, { region, x: nextX, y: nextY })); setTimeout(() => elementByData("data-free-page-frame-canvas", storedFrame.id)?.focus(), 50); }, cancel = (event) => { if (!owns(event))
                return; const pointerId = start.pointerId; stop(pointerId); clearEdgeTargets(); restorePointerCancellationFocus(frame); };
            frame.addEventListener("focus", showEdgeTargets);
            frame.addEventListener("pointerdown", (event) => { if (start) {
                suppressPointerClick = true;
                setTimeout(() => { suppressPointerClick = false; }, 500);
                return;
            } start = { clientX: event.clientX, clientY: event.clientY, pointerId: event.pointerId }; targetRegion = undefined; showEdgeTargets(); window.addEventListener("pointermove", move); window.addEventListener("pointerup", finish); window.addEventListener("pointercancel", cancel); try {
                frame.setPointerCapture(event.pointerId);
            }
            catch { /* Synthetic regression events have no active device pointer to capture. */ } });
            frame.addEventListener("click", (event) => { if (suppressPointerClick)
                event.stopPropagation(); });
            frame.addEventListener("keydown", (event) => { if (!event.key.startsWith("Arrow"))
                return; event.preventDefault(); const region = event.key === "ArrowLeft" ? "before-lanes" : event.key === "ArrowRight" ? "after-lanes" : storedFrame.freePageRegion, dy = event.key === "ArrowUp" ? -20 : event.key === "ArrowDown" ? 20 : 0, currentState = current().state, next = moveFreePageFrame(currentState, flow.id, storedFrame.id, { region, x: Number(position.x ?? 24), y: Math.max(55, position.y + dy) }); if (next === currentState) {
                pageFrameFocusIntent = undefined;
                queueMicrotask(() => elementByData("data-free-page-frame-canvas", storedFrame.id)?.focus());
                return;
            } pageFrameFocusIntent = { id: storedFrame.id, revision: Number(current().revision ?? 0), optimisticFocused: false }; persist(next); });
            frame.append(rect, label);
            canvas.append(frame);
        }
        for (const endpoint of projection.graph.connectionEndpoints.filter(({ kind, freePageRegion }) => kind === "page-frame" && Boolean(freePageRegion))) {
            const ports = svg("g"), input = svg("circle"), output = svg("circle"), begin = () => { clearSelectedRelationshipForConnection(); connection?.preview?.remove(); const targets = projection.graph.connectionEndpoints.map(({ id }) => id).filter((id) => id !== endpoint.id); if (!targets.length)
                return; const preview = svg("line"); preview.classList.add("flow-connection-preview"); preview.setAttribute("x1", String(endpoint.layout.x + endpoint.width)); preview.setAttribute("y1", String(endpoint.layout.y + endpoint.height / 2)); preview.setAttribute("x2", String(endpoint.layout.x + endpoint.width + 20)); preview.setAttribute("y2", String(endpoint.layout.y + endpoint.height / 2)); canvas.append(preview); connection = { sourceId: endpoint.id, targets, targetIndex: 0, preview }; elementByData("data-input-port-for", targets[0] ?? "")?.classList.add("is-valid-target"); output.focus(); };
            ports.dataset.flowEndpointId = endpoint.id;
            ports.dataset.flowEndpointKind = "page-frame";
            ports.setAttribute("transform", `translate(${endpoint.layout.x} ${endpoint.layout.y})`);
            input.setAttribute("cx", "0");
            input.setAttribute("cy", String(endpoint.height / 2));
            input.setAttribute("r", "8");
            input.tabIndex = 0;
            input.dataset.inputPortFor = endpoint.id;
            input.setAttribute("aria-label", `Input port for ${endpoint.name}`);
            output.setAttribute("cx", String(endpoint.width));
            output.setAttribute("cy", String(endpoint.height / 2));
            output.setAttribute("r", "8");
            output.tabIndex = 0;
            output.dataset.outputPortFor = endpoint.id;
            output.setAttribute("aria-label", `Output port for ${endpoint.name}`);
            output.addEventListener("pointerdown", (event) => { event.stopPropagation(); begin(); });
            output.addEventListener("keydown", (event) => { if (event.key === "Enter" && !connection) {
                event.preventDefault();
                begin();
                return;
            } if (event.key === "Escape" && connection) {
                event.preventDefault();
                cancelConnection();
                return;
            } if (event.key === "Enter" && connection) {
                event.preventDefault();
                commitConnection(connection.targets[connection.targetIndex]);
            } });
            input.addEventListener("pointerup", (event) => { event.stopPropagation(); commitConnection(endpoint.id); });
            ports.append(input, output);
            canvas.append(ports);
        }
        for (const relationship of projection.graph.relationships) {
            const source = projection.graph.connectionEndpoints.find(({ id, kind }) => id === relationship.sourceEndpoint.id && kind === relationship.sourceEndpoint.kind), target = projection.graph.connectionEndpoints.find(({ id, kind }) => id === relationship.targetEndpoint.id && kind === relationship.targetEndpoint.kind);
            if (!source || !target)
                continue;
            const geometry = flowEdgeGeometry(source.layout, target.layout, { width: source.width, height: source.height }, { width: target.width, height: target.height }, relationship.sourcePort, relationship.targetPort), edge = svg("g"), line = svg("line"), arrow = svg("polygon"), label = svg("text"), selectRelationship = () => saveSelection({ kind: "relationship", id: relationship.id });
            edge.classList.add("flow-edge");
            edge.dataset.relationshipId = relationship.id;
            edge.dataset.sourceEndpointKind = relationship.sourceEndpoint.kind;
            edge.dataset.sourceEndpointId = relationship.sourceEndpoint.id;
            edge.dataset.sourcePort = relationship.sourcePort;
            edge.dataset.targetEndpointKind = relationship.targetEndpoint.kind;
            edge.dataset.targetEndpointId = relationship.targetEndpoint.id;
            edge.dataset.targetPort = relationship.targetPort;
            edge.dataset.relationshipKind = relationship.kind;
            edge.dataset.directed = "true";
            edge.tabIndex = 0;
            edge.setAttribute("role", "button");
            edge.setAttribute("aria-label", flowRelationshipText(projection.graph, relationship));
            line.setAttribute("x1", String(geometry.startX));
            line.setAttribute("y1", String(geometry.startY));
            line.setAttribute("x2", String(geometry.endX));
            line.setAttribute("y2", String(geometry.endY));
            arrow.setAttribute("points", geometry.arrow);
            label.setAttribute("x", String((geometry.startX + geometry.endX) / 2));
            label.setAttribute("y", String((geometry.startY + geometry.endY) / 2 - 8));
            label.textContent = relationship.label ?? "";
            edge.addEventListener("click", selectRelationship);
            edge.addEventListener("keydown", (event) => { if (event.key !== "Enter" && event.key !== " ")
                return; event.preventDefault(); selectRelationship(); });
            edge.append(line, arrow);
            if (relationship.label)
                edge.append(label);
            canvas.append(edge);
            const row = document.createElement("li"), control = button(flowRelationshipText(projection.graph, relationship), selectRelationship);
            row.dataset.relationshipId = relationship.id;
            row.dataset.sourceEndpointKind = relationship.sourceEndpoint.kind;
            row.dataset.sourcePort = relationship.sourcePort;
            row.dataset.targetEndpointKind = relationship.targetEndpoint.kind;
            row.dataset.targetPort = relationship.targetPort;
            row.append(control);
            outline.append(row);
        }
        for (const nodeData of projection.graph.nodes) {
            if (!nodeData.layout)
                continue;
            const group = svg("g"), box = svg("rect"), title = svg("text"), detail = svg("text"), layout = nodeData.layout;
            group.classList.add("flow-node");
            group.dataset.occurrenceId = nodeData.id;
            group.setAttribute("transform", `translate(${layout.x} ${layout.y})`);
            group.setAttribute("tabindex", "0");
            group.setAttribute("role", "button");
            group.setAttribute("aria-label", `${nodeData.name}. Drag or use Arrow keys to move.`);
            box.setAttribute("width", String(nodeWidth));
            box.setAttribute("height", String(nodeHeight));
            box.setAttribute("rx", "10");
            title.setAttribute("x", "12");
            title.setAttribute("y", "30");
            title.textContent = nodeData.name;
            detail.setAttribute("x", "12");
            detail.setAttribute("y", "55");
            detail.textContent = "Interaction Event";
            detail.textContent = `Interaction Event${nodeData.trigger ? ` · ${nodeData.trigger}` : ""}`;
            group.setAttribute("aria-label", `${nodeData.name}. Interaction Event. Drag or use Arrow keys to move.`);
            const storedOccurrence = stored.occurrences.find(({ id }) => id === nodeData.id), storedPosition = storedOccurrence.position, focusNode = () => queueMicrotask(() => elementByData("data-occurrence-id", nodeData.id)?.focus()), containingPageFrame = projection.graph.connectionEndpoints.find(({ kind, id }) => kind === "page-frame" && id === nodeData.pageFrameId), containedMoveAllowed = (x, y) => Boolean(containingPageFrame && x >= FLOW_GRAPH_GEOMETRY.eventMinX && y >= FLOW_GRAPH_GEOMETRY.eventMinY && x + nodeWidth <= containingPageFrame.width && y + nodeHeight <= containingPageFrame.height), rejectContainedMove = () => { group.setAttribute("transform", `translate(${layout.x} ${layout.y})`); statusMessage = "Use Change Page to move this Event occurrence to another Page frame."; statusRepairHref = ""; render(); focusNode(); }, moveContained = (x, y) => { if (!containedMoveAllowed(x, y)) {
                rejectContainedMove();
                return;
            } persist(moveGraphOccurrence(current().state, flow.id, nodeData.id, { x, y })); focusNode(); }, rejectMembershipMove = () => { if (nodeData.freePageFrame) {
                const page = state.project.collections.pages.find(({ id }) => id === nodeData.pageId);
                statusMessage = `${page?.name ?? nodeData.name} requires explicit Property Set membership before entering a named lane.`;
                statusRepairHref = `?kind=pages&entity=${encodeURIComponent(nodeData.pageId)}&field=pageGroupIds`;
            }
            else {
                statusMessage = "Use Change Page to move this Event occurrence to another Page frame.";
                statusRepairHref = "";
            } render(); focusNode(); };
            let dragStart;
            const ownsDrag = (event) => ownsPointerDrag(dragStart?.pointerId, event.pointerId), stopDragTracking = (pointerId) => { window.removeEventListener("pointermove", moveDraggedNode); window.removeEventListener("pointerup", finishDraggedNode); window.removeEventListener("pointercancel", cancelDraggedNode); if (group.hasPointerCapture(pointerId))
                group.releasePointerCapture(pointerId); dragStart = undefined; }, moveDraggedNode = (event) => { if (!ownsDrag(event))
                return; group.setAttribute("transform", `translate(${dragStart.x + event.clientX - dragStart.clientX} ${dragStart.y + event.clientY - dragStart.clientY})`); }, cancelDraggedNode = (event) => { if (!ownsDrag(event))
                return; const pointerId = dragStart.pointerId; stopDragTracking(pointerId); group.setAttribute("transform", `translate(${layout.x} ${layout.y})`); }, finishDraggedNode = (event) => { if (!ownsDrag(event))
                return; const initial = dragStart, x = Math.round(initial.x + event.clientX - initial.clientX), y = Math.round(initial.y + event.clientY - initial.clientY); stopDragTracking(initial.pointerId); if (nodeData.pageFrameId) {
                const relativeX = x - Number(containingPageFrame?.layout.x ?? 0), relativeY = y - Number(containingPageFrame?.layout.y ?? 0);
                moveContained(relativeX, relativeY);
                return;
            } persist(moveGraphOccurrence(current().state, flow.id, nodeData.id, { lane: layout.lane, x, y: Math.max(55, y) })); focusNode(); };
            group.addEventListener("pointerdown", (event) => { if (event.target.closest("foreignObject") || dragStart)
                return; dragStart = { x: layout.x, y: layout.y, clientX: event.clientX, clientY: event.clientY, pointerId: event.pointerId }; window.addEventListener("pointermove", moveDraggedNode); window.addEventListener("pointerup", finishDraggedNode); window.addEventListener("pointercancel", cancelDraggedNode); try {
                group.setPointerCapture(event.pointerId);
            }
            catch { /* Synthetic regression events have no active device pointer to capture. */ } });
            group.addEventListener("keydown", (event) => { if (event.target.closest("foreignObject,input,button,a,summary,details") || !event.key.startsWith("Arrow"))
                return; event.preventDefault(); const dx = event.key === "ArrowLeft" ? -20 : event.key === "ArrowRight" ? 20 : 0, dy = event.key === "ArrowUp" ? -20 : event.key === "ArrowDown" ? 20 : 0; if (nodeData.pageFrameId) {
                moveContained(Number(storedPosition.x ?? 24) + dx, Number(storedPosition.y ?? 70) + dy);
                return;
            } persist(moveGraphOccurrence(current().state, flow.id, nodeData.id, { lane: layout.lane, x: layout.x + dx, y: Math.max(55, layout.y + dy) })); focusNode(); });
            group.addEventListener("click", (event) => { if (event.target.closest("foreignObject"))
                return; if (suppressNodeClick) {
                suppressNodeClick = false;
                return;
            } saveSelection({ kind: "occurrence", id: nodeData.id }); });
            const canvasExample = occurrenceExampleDetails(state, flow.id, nodeData.id, nodeData.name), exampleHost = svg("foreignObject"), resizeCanvasExample = () => { const expandedHeight = canvasExample.open ? Math.max(260, Math.ceil(canvasExample.scrollHeight) + 8) : 30; exampleHost.setAttribute("height", String(expandedHeight)); box.setAttribute("height", String(canvasExample.open ? nodeHeight + expandedHeight - 30 : nodeHeight)); resizeCanvasHeight(); };
            exampleHost.dataset.eventExampleNode = nodeData.id;
            exampleHost.setAttribute("x", "4");
            exampleHost.setAttribute("y", "62");
            exampleHost.setAttribute("width", String(nodeWidth - 8));
            exampleHost.setAttribute("height", "30");
            canvasExample.className = "flow-node-example";
            canvasExample.style.fontSize = "14px";
            canvasExample.style.background = "white";
            new MutationObserver(resizeCanvasExample).observe(canvasExample, { attributes: true, attributeFilter: ["open"] });
            const canvasSummary = canvasExample.querySelector("summary");
            canvasSummary.addEventListener("keydown", (event) => { if (event.key !== "Enter" && event.key !== " ")
                return; event.preventDefault(); canvasExample.open = !canvasExample.open; });
            exampleHost.append(canvasExample);
            group.append(box, title, detail, exampleHost);
            canvas.append(group);
            const row = document.createElement("li"), control = button(`${nodeData.name} · Interaction Event${nodeData.trigger ? ` · ${nodeData.trigger}` : ""}`, () => saveSelection({ kind: "occurrence", id: nodeData.id })), outlineExample = occurrenceExampleDetails(state, flow.id, nodeData.id, nodeData.name);
            row.dataset.occurrenceId = nodeData.id;
            row.append(control, outlineExample);
            outline.insertBefore(row, outline.querySelector("[data-relationship-id]"));
        }
        for (const nodeData of projection.graph.nodes) {
            const control = outline.querySelector(`[data-occurrence-id="${CSS.escape(nodeData.id)}"] button`);
            if (control)
                control.textContent = `${nodeData.name} · Interaction Event${nodeData.trigger ? ` · ${nodeData.trigger}` : ""}`;
        }
        for (const port of Array.from(canvas.querySelectorAll("[data-input-port-for],[data-output-port-for]"))) {
            const endpointId = port.dataset.inputPortFor ?? port.dataset.outputPortFor, endpoint = projection.graph.connectionEndpoints.find(({ id }) => id === endpointId);
            if (!endpoint)
                continue;
            const side = port.dataset.outputPortFor ? "right" : "left", point = flowPortPoint(endpoint.layout, { width: endpoint.width, height: endpoint.height }, side);
            port.dataset.flowPortFor = endpoint.id;
            port.dataset.flowPortSide = side;
            port.setAttribute("aria-label", `${side} port for ${endpoint.name}`);
            port.setAttribute("cx", String(point.x));
            port.setAttribute("cy", String(point.y));
            canvas.append(port);
        }
        for (const endpoint of projection.graph.connectionEndpoints) {
            for (const side of ["top", "bottom"]) {
                const port = svg("circle"), point = flowPortPoint(endpoint.layout, { width: endpoint.width, height: endpoint.height }, side);
                port.setAttribute("cx", String(point.x));
                port.setAttribute("cy", String(point.y));
                port.setAttribute("r", "8");
                port.tabIndex = 0;
                port.dataset.flowPortFor = endpoint.id;
                port.dataset.flowPortSide = side;
                port.dataset.inputPortFor = endpoint.id;
                port.setAttribute("aria-label", `${side} port for ${endpoint.name}`);
                port.addEventListener("pointerdown", (event) => { event.stopPropagation(); if (!connection)
                    beginPortConnection(endpoint, side, port); });
                port.addEventListener("pointerup", (event) => { event.stopPropagation(); if (connection)
                    commitConnection(endpoint.id, side); });
                port.addEventListener("keydown", (event) => { event.stopPropagation(); if (event.key === "Enter" && !connection) {
                    event.preventDefault();
                    beginPortConnection(endpoint, side, port);
                    return;
                } if (!connection || connection.sourceId !== endpoint.id || connection.sourcePort !== side)
                    return; if (event.key === "Escape") {
                    event.preventDefault();
                    cancelConnection();
                    return;
                } if (event.key.startsWith("Arrow")) {
                    event.preventDefault();
                    document.querySelectorAll(".is-valid-target").forEach((element) => element.classList.remove("is-valid-target"));
                    connection.targetIndex = (connection.targetIndex + (event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1) + connection.targets.length) % connection.targets.length;
                    targetPortElement(connection.targets[connection.targetIndex], side)?.classList.add("is-valid-target");
                    return;
                } if (event.key === "Enter") {
                    event.preventDefault();
                    commitConnection(connection.targets[connection.targetIndex], targetPortFor(side));
                } });
                canvas.append(port);
            }
        }
        canvas.addEventListener("pointermove", (event) => { if (!connection?.preview)
            return; canvasScroll.classList.add("is-connecting"); const port = event.target.closest("[data-flow-port-for]"), scrollBounds = canvasScroll.getBoundingClientRect(), edgeSize = 36, edgeStep = 28; if (!port) {
            if (event.clientX <= scrollBounds.left + edgeSize)
                canvasScroll.scrollLeft = Math.max(0, canvasScroll.scrollLeft - edgeStep);
            else if (event.clientX >= scrollBounds.right - edgeSize)
                canvasScroll.scrollLeft = Math.min(canvasScroll.scrollWidth - canvasScroll.clientWidth, canvasScroll.scrollLeft + edgeStep);
            if (event.clientY <= scrollBounds.top + edgeSize)
                canvasScroll.scrollTop = Math.max(0, canvasScroll.scrollTop - edgeStep);
            else if (event.clientY >= scrollBounds.bottom - edgeSize)
                canvasScroll.scrollTop = Math.min(canvasScroll.scrollHeight - canvasScroll.clientHeight, canvasScroll.scrollTop + edgeStep);
        } const bounds = canvas.getBoundingClientRect(), viewBox = canvas.viewBox.baseVal, scaleX = viewBox.width / bounds.width, scaleY = viewBox.height / bounds.height; connection.preview.setAttribute("x2", String(viewBox.x + (event.clientX - bounds.left) * scaleX)); connection.preview.setAttribute("y2", String(viewBox.y + (event.clientY - bounds.top) * scaleY)); document.querySelectorAll(".is-valid-target,.is-invalid-target").forEach((element) => element.classList.remove("is-valid-target", "is-invalid-target")); const valid = port && port.dataset.flowPortFor !== connection.sourceId && port.dataset.flowPortSide === targetPortFor(connection.sourcePort ?? "right"); (port ?? canvas).classList.add(valid ? "is-valid-target" : "is-invalid-target"); });
        canvas.addEventListener("pointerup", (event) => { if (!connection)
            return; const delivered = event.target.closest("[data-flow-port-for]"), hit = document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-flow-port-for]"), port = hit ?? delivered, side = port?.dataset.flowPortSide; if (port && side)
            commitConnection(port.dataset.flowPortFor, side);
        else
            cancelConnection(true, true); });
        canvas.addEventListener("keydown", (event) => { if (!connection)
            return; if (event.key === "Escape") {
            event.preventDefault();
            event.stopImmediatePropagation();
            cancelConnection();
            return;
        } if (event.key.startsWith("Arrow")) {
            event.preventDefault();
            event.stopImmediatePropagation();
            document.querySelectorAll(".is-valid-target").forEach((element) => element.classList.remove("is-valid-target"));
            connection.targetIndex = (connection.targetIndex + (event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1) + connection.targets.length) % connection.targets.length;
            targetPortElement(connection.targets[connection.targetIndex], connection.sourcePort ?? "right")?.classList.add("is-valid-target");
            return;
        } if (event.key === "Enter") {
            event.preventDefault();
            event.stopImmediatePropagation();
            commitConnection(connection.targets[connection.targetIndex], targetPortFor(connection.sourcePort ?? "right"));
        } }, true);
        canvasScroll.className = "flow-canvas-scroll";
        canvasScroll.append(canvas);
        views.append(canvasScroll, outline);
        renderRelationshipPopover(popover);
        renderActions(actions);
        section.append(heading, boundary, toolbar, laneControls, status, frames, views, actions, popover);
        host.append(section);
        document.querySelectorAll("[data-occurrence-id],[data-relationship-id],[data-page-frame-id]").forEach((element) => { const id = element.dataset.occurrenceId ?? element.dataset.relationshipId ?? element.dataset.pageFrameId; element.classList.toggle("is-selected", id === selected?.id); });
        if (relationshipDeletionFocusTimer !== undefined) {
            clearTimeout(relationshipDeletionFocusTimer);
            relationshipDeletionFocusTimer = undefined;
        }
        const deletionIntent = relationshipDeletionFocusIntent;
        if (deletionIntent) {
            const restored = Boolean(canvas.querySelector(`[data-relationship-id="${CSS.escape(deletionIntent.id)}"]`));
            if (restored || !deletionIntent.sourceFocused)
                relationshipDeletionFocusTimer = setTimeout(() => { relationshipDeletionFocusTimer = undefined; if (relationshipDeletionFocusIntent !== deletionIntent)
                    return; const liveCanvas = document.querySelector('[aria-label="Interactive directional Flow canvas"]'), selector = restored ? `[data-relationship-id="${CSS.escape(deletionIntent.id)}"]` : `[${deletionIntent.sourceKind === "page-frame" ? "data-page-frame-id" : "data-occurrence-id"}="${CSS.escape(deletionIntent.sourceId)}"]`, target = liveCanvas?.querySelector(selector); if (!target?.isConnected)
                    return; target.focus(); relationshipDeletionFocusIntent = consumeRelationshipDeletionFocus(deletionIntent, restored).next; }, 50);
        }
        const frameIntent = pageFrameFocusIntent;
        if (frameIntent) {
            const focusedFrame = document.querySelector(`[data-free-page-frame-canvas="${CSS.escape(frameIntent.id)}"]`);
            if (focusedFrame) {
                const renderRevision = Number(current().revision ?? 0), replacement = frameIntent.optimisticFocused && renderRevision > frameIntent.revision;
                if (!frameIntent.optimisticFocused) {
                    frameIntent.optimisticFocused = true;
                    frameIntent.revision = renderRevision;
                }
                queueMicrotask(() => { if (!focusedFrame.isConnected)
                    return; focusedFrame.focus(); if (replacement && pageFrameFocusIntent === frameIntent)
                    pageFrameFocusIntent = undefined; });
            }
        }
        const edgeIntent = relationshipEdgeFocusIntent;
        if (edgeIntent) {
            const edge = document.querySelector(`[data-relationship-id="${CSS.escape(edgeIntent.id)}"]`);
            if (edge) {
                const renderRevision = Number(current().revision ?? 0), replacement = edgeIntent.optimisticFocused && renderRevision > edgeIntent.revision;
                if (!edgeIntent.optimisticFocused) {
                    edgeIntent.optimisticFocused = true;
                    edgeIntent.revision = renderRevision;
                }
                queueMicrotask(() => { if (!edge.isConnected)
                    return; edge.focus(); if (replacement && relationshipEdgeFocusIntent === edgeIntent)
                    relationshipEdgeFocusIntent = undefined; });
            }
        }
        renderInspector();
    }
    function render() { const { state, flow } = current(); advanced.hidden = !flow; if (flow) {
        renderGraph(flow);
        document.querySelectorAll("[data-page-frame-id]").forEach((candidate) => candidate.setAttribute("aria-pressed", String(selected?.kind === "page-frame" && candidate.dataset.pageFrameId === selected.id)));
        if (state) {
            const focusId = sessionStorage.getItem(`my-chrome-utilities.flow-focus.v1:${state.project.id}:${flow.id}`);
            if (focusId)
                queueMicrotask(() => document.querySelector(`article[data-page-frame-id="${CSS.escape(focusId)}"]`)?.focus({ preventScroll: true }));
        }
    }
    else {
        document.querySelector("#flow-graph-workspace")?.replaceChildren();
        inspectorContext.replaceChildren();
    } }
    return { render, renderSelectors: render };
}
//# sourceMappingURL=data-layer-flow-graph-ui.js.map