import { addEventOccurrenceToPage, addGraphOccurrence, deriveFlowOccurrenceExample, deriveFlowPageFrameExample, documentaryFlowGraph, duplicateFlowPageFrame, effectiveFlowPageFrameName, flowOccurrenceExampleEditorRows, FLOW_GRAPH_GEOMETRY, flowRelationshipText, inspectOccurrencePageChange, migrateLegacyFlowContextBindings, migrateLegacyFlowRelationshipKinds, moveGraphOccurrence, projectFlowGraph, reassignFlowOccurrencePage, reviewLegacyFlowContextMigration, removeFlowPageFrame, renameFlowPageFrame, resetFlowPageFrameName, removeFlowRelationship, removeGraphOccurrence, saveGraphRelationship, setFlowOccurrenceExample, } from "./data-layer-flow-graph.js";
import { appendFlowPageFrameCardControls } from "./data-layer-flow-graph-ui-page-frame.js";
import { addFlowPageFrameAndRelationship, addFlowPageFrameAtPosition, addFlowPageFrameToSection, connectFlowPageFrames, createFlowSection, createFlowSectionAroundFrames, inspectSectionRemovalWithContents, moveFlowPageFramePresentation, moveFlowSection, movePageFrameToSection, removeFlowSection, removeFlowSectionWithContents, renameAndResizeFlowSection, tidyFlowPageFrames } from "./utilities/data-layer/property-set-flow-section.js";
import { button, elementByData, entityName, flowEdgeGeometry, flowPortPoint, nodeHeight, nodeWidth, ownsPointerDrag, q, restorePointerCancellationFocus, svg } from "./flow-graph/ui-primitives.js";
import { flowPointerSnapTarget, flowPortSnapTarget } from "./flow-graph/relationship-port-snap.js";
import { flowBoundsContains, flowPointerDelta } from "./flow-graph/page-placement.js";
import { attachFlowConceptVisual, flowConceptVisual, removeFlowConceptVisual } from "./flow-graph/concept-visuals.js";
import { createFlowConceptVisualEditor, openFlowConceptVisualViewer } from "./flow-graph/concept-visual-ui.js";
import { flowItemActivationRequest, flowItemMenuRequest } from "./flow-graph/workspace-item-menu.js";
import { upgradeFlowWorkspace } from "./flow-graph/workspace-ui.js";
import { flowSelectionContains, primaryFlowSelection, selectionAfterActivation, selectionAfterRemoval, selectionFromStoredView, storedViewWithSelection } from "./flow-graph/workspace-selection.js";
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
export function flowViewAfterRelationshipDeletion(view, relationshipId) { const selection = selectionFromStoredView(view); if (!selection.some(({ kind, id }) => kind === "relationship" && id === relationshipId))
    return view; if (!view.selectedItems) {
    const { selectedItem, ...retained } = view;
    void selectedItem;
    return retained;
} return storedViewWithSelection(view, selectionAfterRemoval(selection, relationshipId)); }
export function consumeRelationshipDeletionFocus(intent, relationshipRestored) { if (!intent)
    return {}; if (relationshipRestored)
    return { target: "relationship" }; if (!intent.sourceFocused)
    return { target: "source", next: { ...intent, sourceFocused: true } }; return { next: intent }; }
export function flowRelationshipDeletionAccessibleName(label, sourceName, targetName) { return `Delete relationship ${[label, `${sourceName} to ${targetName}`].filter(Boolean).join(", ")}`; }
export function installFlowGraphBuilder(options) {
    const inspector = q("#project-inspector"), advanced = q("#flow-step-editor"), inspectorContext = document.createElement("section");
    inspectorContext.id = "flow-inspector-context";
    inspector.insertBefore(inspectorContext, advanced);
    let selectedItems = [];
    let selected;
    let selectionFocusIntent;
    let selectionWorkspace = "";
    let connection;
    let connectionPointerCleanup = () => { };
    let relationshipPopoverFocusIntent;
    let relationshipEdgeFocusIntent;
    let relationshipDeletionFocusIntent;
    let relationshipDeletionFocusTimer;
    let pageFrameFocusIntent;
    let suppressNodeClick = false;
    let statusMessage = "";
    let statusRepairHref = "";
    let activeCatalogPayload;
    let pendingItemMenu;
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
    const workspaceContent = q("#workspace-content"), upgradeWorkspace = () => queueMicrotask(() => { const flowRoot = document.querySelector("#flow-graph-workspace"); if (flowRoot) {
        upgradeFlowWorkspace(flowRoot, pendingItemMenu);
        pendingItemMenu = undefined;
    } });
    new MutationObserver(upgradeWorkspace).observe(workspaceContent, { childList: true, subtree: true });
    workspaceContent.addEventListener("flow-tidy-confirm", (event) => { const detail = event.detail, { state, flow } = current(); if (state && flow && detail.placements)
        persist(tidyFlowPageFrames(state, flow.id, detail.placements), "Tidied Flow presentation; Undo available."); });
    workspaceContent.addEventListener("flow-empty-connection-page", (event) => { const detail = event.detail, { state, flow } = current(); if (!state || !flow || !detail.pageId || !detail.sourceId || !detail.sourcePort || !detail.targetPort || !detail.position)
        return; persist(addFlowPageFrameAndRelationship(state, flow.id, { pageId: detail.pageId, sourceId: detail.sourceId, sourcePort: detail.sourcePort, targetPort: detail.targetPort, position: detail.position }, options.id), "Created Page instance and relationship in one Flow command; Undo removes both."); });
    workspaceContent.addEventListener("flow-add-page-at", (event) => {
        const detail = event.detail, { state, flow, graph } = current();
        if (!state || !flow || !graph || !detail.pageId)
            return;
        const position = detail.position ?? { x: 80, y: 80 }, sectionId = graph.sections.find((section) => { const bounds = section.bounds; return position.x >= bounds.x && position.x <= bounds.x + bounds.width && position.y >= bounds.y && position.y <= bounds.y + bounds.height; })?.id;
        persist(addFlowPageFrameAtPosition(state, flow.id, detail.pageId, position, sectionId, options.id));
    });
    workspaceContent.addEventListener("flow-visual-display-mode", () => render());
    workspaceContent.addEventListener("flow-section-impact-request", (event) => {
        const detail = event.detail, { state, flow } = current();
        if (!state || !flow || !detail.sectionId || !detail.respond)
            return;
        detail.respond(inspectSectionRemovalWithContents(state.project, flow.id, detail.sectionId));
    });
    workspaceContent.addEventListener("flow-section-command", (event) => {
        const detail = event.detail, { state, flow, graph } = current();
        if (!state || !flow || !graph || !detail)
            return;
        if (detail.kind === "select") {
            selectCanvasItem({ kind: "section", id: detail.sectionId });
            return;
        }
        if (detail.kind === "create") {
            persist(detail.frameIds.length ? createFlowSectionAroundFrames(state, flow.id, { name: detail.name, bounds: detail.bounds, frameIds: detail.frameIds }, options.id) : createFlowSection(state, flow.id, { name: detail.name, bounds: detail.bounds }, options.id));
            return;
        }
        const section = graph.sections.find(({ id }) => id === detail.sectionId);
        if (!section)
            return;
        if (detail.kind === "move") {
            persist(moveFlowSection(state, flow.id, section.id, detail.position));
            return;
        }
        if (detail.kind === "resize") {
            persist(renameAndResizeFlowSection(state, flow.id, section.id, { name: section.name, bounds: detail.bounds }));
            return;
        }
        if (detail.kind === "rename") {
            persist(renameAndResizeFlowSection(state, flow.id, section.id, { name: detail.name, bounds: section.bounds }));
            return;
        }
        if (detail.kind === "remove") {
            persist(removeFlowSection(state, flow.id, section.id), `Removed Section ${section.name}; Page instances and relationships retained. Undo available.`);
            return;
        }
        const review = detail.review;
        persist(removeFlowSectionWithContents(state, flow.id, section.id, review), `Removed Section ${section.name} with ${review.pageFrames.length} Page instances, ${review.occurrences.length} occurrences, and ${review.relationships.length} relationships. Undo available.`);
    });
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
    const saveSelection = (value, extend = false) => { selectedItems = value ? selectionAfterActivation(selectedItems, value, extend) : []; selected = primaryFlowSelection(selectedItems); const { state, flow } = current(); if (state && flow)
        writeView(state.project.id, flow.id, storedViewWithSelection(readView(state.project.id, flow.id), selectedItems)); render(); };
    const selectCanvasItem = (value) => { selectionFocusIntent = value; saveSelection(value); };
    const requestItemMenu = (kind, id, event) => { const request = flowItemMenuRequest(event); if (!request)
        return false; event.preventDefault(); pendingItemMenu = { kind, id, request }; const selection = kind === "page" ? { kind: "page-frame", id } : kind === "event" ? { kind: "occurrence", id } : { kind: "relationship", id }; saveSelection(selection); return true; };
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
        const occurrence = graph?.occurrences.find(({ id }) => id === selected.id), relationship = graph?.relationships.find(({ id }) => id === selected.id), frame = graph?.pageFrames.find(({ id }) => id === selected.id), section = graph?.sections.find(({ id }) => id === selected.id);
        copy.textContent = occurrence ? `${occurrence.name} · stable occurrence ${occurrence.id}` : relationship ? `Stable relationship ${relationship.id}` : frame ? `${effectiveFlowPageFrameName(state.project, frame)} · stable Page frame ${frame.id}` : section ? `${section.name} · stable Flow Section ${section.id}` : "Selection details unavailable";
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
        host.dataset.flowProjectId = state.project.id;
        host.setAttribute("aria-label", "Flow Section controls");
        name.setAttribute("aria-label", "New Section name");
        form.addEventListener("submit", (event) => { event.preventDefault(); persist(createFlowSection(current().state, flow.id, { name: name.value, bounds: { x: 40 + graph.sections.length * 360, y: 40, width: 320, height: 220 } }, options.id)); });
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
            const label = effectiveFlowPageFrameName(state.project, frame);
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
            const effectiveName = effectiveFlowPageFrameName(state.project, frame), section = graph.sections.find(({ id }) => id === frame.sectionId), card = document.createElement("article"), title = button(`${section?.name ?? "Outside Sections"} / ${contextSettingPageLabel(effectiveName)}`, () => saveSelection({ kind: "page-frame", id: frame.id })), move = (dx, dy) => { sessionStorage.setItem(`my-chrome-utilities.flow-focus.v1:${state.project.id}:${flow.id}`, frame.id); persist(moveFlowPageFramePresentation(current().state, flow.id, frame.id, { x: Number(frame.position.x ?? 0) + dx, y: frame.position.y + dy, sectionId: frame.sectionId ?? null })); };
            card.dataset.pageFrameId = frame.id;
            card.dataset.pageId = frame.pageId;
            if (frame.sectionId)
                card.dataset.flowSectionId = frame.sectionId;
            card.tabIndex = 0;
            card.setAttribute("aria-label", `Page frame ${effectiveName}`);
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
            appendFlowPageFrameCardControls({ card, title, state, flow, graph, frame, entityName, pageExampleDetails, saveSelection: (value) => saveSelection(value), ...(options.openOccurrenceSchema ? { openOccurrenceSchema: options.openOccurrenceSchema } : {}), persist: (next) => persist(next), duplicatePageFrame: (next, flowId, frameId) => duplicateFlowPageFrame(next, flowId, frameId, options.id), removePageFrame: (next, flowId, frameId) => removeFlowPageFrame(next, flowId, frameId), renamePageFrame: renameFlowPageFrame, resetPageFrameName: resetFlowPageFrameName });
            host.append(card);
        }
    }
    function clearConnectionFeedback() { document.querySelectorAll(".is-valid-target,.is-invalid-target").forEach((element) => element.classList.remove("is-valid-target", "is-invalid-target")); }
    function emphasizeCompatiblePort(port) { port.classList.add("is-valid-target"); }
    function cancelConnection(announce = true, suppressClick = false) { const sourceId = connection?.sourceId, sourcePort = connection?.sourcePort; connectionPointerCleanup(); connection?.preview?.remove(); connection = undefined; document.querySelector(".flow-canvas-scroll")?.classList.remove("is-connecting"); clearConnectionFeedback(); if (announce)
        statusMessage = "Connection cancelled; canonical state was not changed."; if (suppressClick) {
        suppressNodeClick = true;
        setTimeout(() => { suppressNodeClick = false; }, 0);
    } document.querySelector(`[data-flow-port-for="${CSS.escape(sourceId ?? "")}"][data-flow-port-side="${sourcePort ?? "right"}"]`)?.focus(); }
    function clearSelectedRelationshipForConnection() { if (selected?.kind !== "relationship")
        return; selectedItems = selectionAfterRemoval(selectedItems, selected.id); selected = primaryFlowSelection(selectedItems); relationshipPopoverFocusIntent = undefined; relationshipEdgeFocusIntent = undefined; document.querySelector('[aria-label="Inline relationship popover"]')?.remove(); }
    function commitConnection(targetId, targetPort) { const { state, flow, graph, revision } = current(), sourceId = connection?.sourceId, sourcePort = connection?.sourcePort ?? "right", inferredTargetPort = targetPort ?? (sourcePort === "right" ? "left" : sourcePort === "top" ? "bottom" : sourcePort === "bottom" ? "top" : undefined); if (!state || !flow || !graph || !sourceId || !targetId || !inferredTargetPort || sourceId === targetId) {
        cancelConnection(true, true);
        return;
    } const before = new Set(graph.relationships.map(({ id }) => id)), next = saveGraphRelationship(state, flow.id, sourceId, { toStepId: targetId, sourcePort, targetPort: inferredTargetPort }, options.id), created = documentaryFlowGraph(next.project, flow.id).relationships.find(({ id }) => !before.has(id)); if (!created) {
        cancelConnection(true, true);
        return;
    } connectionPointerCleanup(); connection = undefined; document.querySelector(".flow-canvas-scroll")?.classList.remove("is-connecting"); selectedItems = [{ kind: "relationship", id: created.id }]; selected = primaryFlowSelection(selectedItems); writeView(state.project.id, flow.id, storedViewWithSelection(readView(state.project.id, flow.id), selectedItems)); relationshipPopoverFocusIntent = { id: created.id, revision: Number(revision ?? 0), optimisticFocused: false }; persist(next); }
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
        remove.addEventListener("click", () => { relationshipPopoverFocusIntent = undefined; relationshipEdgeFocusIntent = undefined; relationshipDeletionFocusIntent = { id: relationship.id, sourceKind: relationship.sourceEndpoint.kind, sourceId, sourceFocused: false }; selectedItems = selectionAfterRemoval(selectedItems, relationship.id); selected = primaryFlowSelection(selectedItems); const context = current(), view = readView(context.state.project.id, flow.id); writeView(context.state.project.id, flow.id, flowViewAfterRelationshipDeletion(view, relationship.id)); persist(removeFlowRelationship(context.state, flow.id, relationship.id), `Deleted relationship ${relationshipName}. Saved Draft; documentation preview stale; Undo available.`); });
        cancel.addEventListener("click", () => { relationshipPopoverFocusIntent = undefined; relationshipEdgeFocusIntent = undefined; selectedItems = []; selected = undefined; render(); document.querySelector(`[data-flow-port-for="${CSS.escape(sourceId)}"][data-flow-port-side="${relationship.sourcePort}"]`)?.focus(); });
        form.addEventListener("keydown", (event) => { if (event.key !== "Escape")
            return; event.preventDefault(); relationshipPopoverFocusIntent = undefined; relationshipEdgeFocusIntent = undefined; document.querySelector(`[data-relationship-id="${CSS.escape(relationship.id)}"]`)?.focus(); });
        form.addEventListener("submit", (event) => { event.preventDefault(); relationshipPopoverFocusIntent = undefined; relationshipEdgeFocusIntent = { id: relationship.id, revision: Number(revision ?? 0), optimisticFocused: false }; persist(saveGraphRelationship(current().state, flow.id, sourceId, { id: relationship.id, toStepId: targetId, sourcePort: relationship.sourcePort, targetPort: relationship.targetPort, group: group.value.trim(), label: label.value.trim(), documentationCondition: condition.value.trim(), expectation: expectation.value.trim() }, options.id)); queueMicrotask(() => document.querySelector(`[data-relationship-id="${CSS.escape(relationship.id)}"]`)?.focus()); });
        const labeled = (text, control) => { const wrapper = document.createElement("label"); wrapper.append(text, control); return wrapper; };
        form.append(heading, endpoints, inferredKind, labeled("Group", group), labeled("Optional label", label), labeled("Condition", condition), labeled("Expectation", expectation), save, cancel, remove);
        if (relationshipPopoverFocusIntent?.id === relationship.id)
            form.dataset.flowRelationshipAutofocus = "true";
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
        const itemAction = (label, action) => { const control = button(label, action); control.dataset.flowItemCommand = label; return control; };
        const visualActions = (actions, target, label) => {
            const saved = flowConceptVisual(state.project, flow.id, target), close = () => actions.dispatchEvent(new CustomEvent("flow-close-item-editor", { bubbles: true })), openEditor = () => { const editor = createFlowConceptVisualEditor({ project: () => current().state.project, ...(saved ? { existing: { attachment: saved.attachment, raster: saved.asset } } : {}), save: (value) => { persist(attachFlowConceptVisual(current().state, flow.id, target, { ...value }, options.id), `Saved concept visual for ${label}; Undo available.`); close(); }, cancel: close }); actions.dispatchEvent(new CustomEvent("flow-open-item-editor", { bubbles: true, detail: { title: `${saved ? "Edit" : "Add"} visual for ${label}`, content: editor.root, firstControl: editor.firstControl } })); }, view = () => { const currentVisual = flowConceptVisual(current().state.project, flow.id, target); if (currentVisual)
                openFlowConceptVisualViewer({ attachment: currentVisual.attachment, raster: currentVisual.asset }, document.activeElement); };
            if (!saved)
                return [itemAction("Add visual", openEditor)];
            return [itemAction("View visual", view), itemAction("Edit visual", openEditor), itemAction("Replace visual", openEditor), itemAction("Remove visual", () => persist(removeFlowConceptVisual(current().state, flow.id, target), `Removed concept visual from ${label}; Undo available.`))];
        };
        if (selected?.kind === "page-frame") {
            const frame = graph.pageFrames.find(({ id }) => id === selected.id);
            if (!frame)
                return;
            const actions = document.createElement("section"), openSchema = itemAction("Open schema contribution", () => options.openOccurrenceSchema?.(frame.id, undefined, openSchema));
            actions.dataset.flowItemKind = "page";
            actions.dataset.flowItemId = frame.id;
            openSchema.dataset.flowSchemaContribution = "true";
            actions.setAttribute("aria-label", "Selected Page instance inline actions");
            actions.append(...visualActions(actions, { kind: "page-frame", id: frame.id }, effectiveFlowPageFrameName(state.project, frame)), itemAction("Move", () => document.querySelector(`[data-page-frame-id="${CSS.escape(frame.id)}"]`)?.focus()), itemAction("Connect", () => document.querySelector(`[data-output-port-for="${CSS.escape(frame.id)}"]`)?.focus()), openSchema, itemAction("Remove", () => persist(removeFlowPageFrame(current().state, flow.id, frame.id))));
            host.append(actions);
            return;
        }
        if (selected?.kind === "relationship") {
            const actions = document.createElement("section");
            actions.dataset.flowItemKind = "relationship";
            actions.dataset.flowItemId = selected.id;
            actions.setAttribute("aria-label", "Selected relationship inline actions");
            host.append(actions);
            return;
        }
        if (selected?.kind !== "occurrence")
            return;
        const occurrence = graph.occurrences.find(({ id }) => id === selected.id), node = projectFlowGraph(state.project, flow.id).graph.nodes.find(({ id }) => id === selected.id);
        if (!occurrence || !node)
            return;
        const actions = document.createElement("section"), editor = document.createElement("section"), migration = reviewLegacyFlowContextMigration(state.project, flow.id), pageChoice = document.createElement("select"), impact = document.createElement("output"), confirmPage = button("Confirm Page change", () => persist(reassignFlowOccurrencePage(current().state, flow.id, occurrence.id, pageChoice.value)));
        actions.dataset.flowItemKind = "event";
        actions.dataset.flowItemId = occurrence.id;
        actions.setAttribute("aria-label", "Selected Event occurrence inline actions");
        editor.dataset.flowItemEditor = "change-page";
        editor.setAttribute("aria-label", `Change Page for ${occurrence.name}`);
        pageChoice.setAttribute("aria-label", "Containing Page frame");
        pageChoice.append(new Option("Choose containing Page", ""));
        for (const frame of graph.pageFrames.filter(({ id }) => id !== occurrence.pageFrameId)) {
            const page = state.project.collections.pages.find(({ id }) => id === frame.pageId);
            pageChoice.append(new Option(`${page?.name ?? frame.pageId} · ${frame.id}`, frame.id));
        }
        confirmPage.disabled = true;
        pageChoice.addEventListener("change", () => { const review = inspectOccurrencePageChange(state.project, flow.id, occurrence.id, pageChoice.value); impact.textContent = review.message; confirmPage.disabled = review.rejected; });
        editor.append(pageChoice, impact, confirmPage);
        const openEditor = () => actions.dispatchEvent(new CustomEvent("flow-open-item-editor", { bubbles: true, detail: { title: `Change Page for ${occurrence.name}`, content: editor, firstControl: pageChoice } }));
        const duplicate = () => { const next = addGraphOccurrence(current().state, flow.id, { name: `${occurrence.name} copy`, ...(occurrence.pageFrameId ? { pageFrameId: String(occurrence.pageFrameId) } : {}), ...(occurrence.pageGroupId ? { pageGroupId: String(occurrence.pageGroupId) } : {}), ...(occurrence.freePageFrameId ? { freePageFrameId: String(occurrence.freePageFrameId) } : {}), pageId: String(occurrence.pageId), eventId: node.eventId, ...(node.trigger ? { trigger: node.trigger } : {}), obligation: String(occurrence.obligation ?? "Required"), minimum: Number(occurrence.minimum ?? 1), maximum: Number(occurrence.maximum ?? 1), y: Number(occurrence.position?.y ?? 70) + 24 }, options.id); persist(next); }, duplicateButton = itemAction("Duplicate", duplicate);
        duplicateButton.disabled = Boolean(migration.items.length || migration.blockers.length);
        if (duplicateButton.disabled)
            duplicateButton.title = "Confirm the Page-context migration before changing this graph.";
        const openSchema = () => { document.querySelector(`[data-occurrence-id="${CSS.escape(occurrence.id)}"]`)?.dispatchEvent(new MouseEvent("click", { bubbles: true })); queueMicrotask(() => { const open = Array.from(document.querySelectorAll('[aria-label="Schema constraints summary"] button')).find(({ textContent }) => textContent?.includes("Open complete schema editor")); open?.click(); }); };
        actions.append(itemAction("Move", () => document.querySelector(`[data-occurrence-id="${CSS.escape(occurrence.id)}"]`)?.focus()), itemAction("Change Page", openEditor), ...visualActions(actions, { kind: "occurrence", id: occurrence.id }, occurrence.name), duplicateButton, itemAction("Remove", () => persist(removeGraphOccurrence(current().state, flow.id, occurrence.id))), itemAction("Open schema contribution", openSchema), editor);
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
        const transientView = readView(state.project.id, flow.id), workspaceKey = `${state.project.id}\u0000${flow.id}`, selectionExists = (item) => { const collection = item.kind === "section" ? stored.sections : item.kind === "page-frame" ? stored.pageFrames : item.kind === "occurrence" ? stored.occurrences : stored.relationships; return collection.some(({ id }) => id === item.id); };
        if (selectionWorkspace !== workspaceKey) {
            selectedItems = selectionFromStoredView(transientView);
            selectionWorkspace = workspaceKey;
        }
        selectedItems = selectedItems.filter(selectionExists);
        selected = primaryFlowSelection(selectedItems);
        const projection = projectFlowGraph(state.project, flow.id), visualMode = (transientView.visualDisplayMode ?? "Badges"), thumbnailVisuals = visualMode === "Thumbnails" && Number(transientView.viewport?.zoom ?? 1) >= .5;
        if (thumbnailVisuals)
            for (const endpoint of projection.graph.connectionEndpoints) {
                const target = { kind: endpoint.kind === "page-frame" ? "page-frame" : "occurrence", id: endpoint.id };
                if (flowConceptVisual(state.project, flow.id, target))
                    endpoint.height += 104;
            }
        const section = document.createElement("section"), heading = document.createElement("h3"), boundary = document.createElement("p"), toolbar = document.createElement("section"), laneControls = document.createElement("section"), status = document.createElement("p"), frames = document.createElement("section"), views = document.createElement("div"), canvasScroll = document.createElement("div"), canvas = svg("svg"), outline = document.createElement("ol"), popover = document.createElement("section"), actions = document.createElement("section");
        const decorateVisual = (group, target, width, height) => { const visual = flowConceptVisual(state.project, flow.id, target); if (!visual || visualMode === "Hidden")
            return; if (!thumbnailVisuals) {
            const badge = svg("text");
            badge.dataset.flowVisualBadge = target.id;
            badge.setAttribute("x", "10");
            badge.setAttribute("y", "44");
            badge.textContent = "▧ Visual";
            group.append(badge);
            return;
        } const foreign = svg("foreignObject"), image = document.createElement("img"); foreign.dataset.flowVisualThumbnail = target.id; foreign.setAttribute("x", "8"); foreign.setAttribute("y", String(height - 96)); foreign.setAttribute("width", String(width - 16)); foreign.setAttribute("height", "88"); image.src = visual.asset.bytes; image.alt = visual.attachment.description; Object.assign(image.style, { width: "100%", height: "100%", objectFit: "contain" }); foreign.append(image); group.append(foreign); };
        const namedRight = Math.max(940, ...projection.laneBands.map(({ x, width }) => x + width), ...projection.graph.connectionEndpoints.map((endpoint) => endpoint.layout.x + endpoint.width + 60)), viewWidth = Math.max(960, namedRight + 100), viewHeight = Math.max(780, ...projection.laneBands.map(({ y, height }) => y + height + 80), ...projection.graph.connectionEndpoints.map((endpoint) => endpoint.layout.y + endpoint.height + 100));
        let startConnectionPointerTracking = (_pointerId) => { };
        const canvasSelection = (target) => { if (!(target instanceof Element))
            return undefined; const item = target.closest("[data-flow-section-id],[data-page-frame-id],[data-occurrence-id],[data-relationship-id]"); return item?.dataset.occurrenceId ? { kind: "occurrence", id: item.dataset.occurrenceId } : item?.dataset.relationshipId ? { kind: "relationship", id: item.dataset.relationshipId } : item?.dataset.pageFrameId ? { kind: "page-frame", id: item.dataset.pageFrameId } : item?.dataset.flowSectionId ? { kind: "section", id: item.dataset.flowSectionId } : undefined; };
        canvas.addEventListener("click", (event) => { const item = canvasSelection(event.target); if (item)
            selectionFocusIntent = item; }, true);
        canvas.addEventListener("keydown", (event) => { const item = canvasSelection(event.target); if (item && flowItemActivationRequest(event))
            selectionFocusIntent = item; }, true);
        canvas.addEventListener("contextmenu", (event) => { if (event.defaultPrevented)
            return; const occurrence = event.target.closest("[data-occurrence-id]"); if (occurrence?.dataset.occurrenceId)
            requestItemMenu("event", occurrence.dataset.occurrenceId, event); });
        canvas.addEventListener("keydown", (event) => { if (event.defaultPrevented)
            return; const occurrence = event.target.closest("[data-occurrence-id]"); if (!occurrence?.dataset.occurrenceId)
            return; if (requestItemMenu("event", occurrence.dataset.occurrenceId, event))
            return; if (flowItemActivationRequest(event)) {
            event.preventDefault();
            saveSelection({ kind: "occurrence", id: occurrence.dataset.occurrenceId });
        } });
        const targetPortFor = (sourcePort) => sourcePort === "right" ? "left" : sourcePort === "top" ? "bottom" : sourcePort === "bottom" ? "top" : undefined;
        const targetPortElement = (endpointId, sourcePort) => { const targetPort = targetPortFor(sourcePort); return targetPort ? canvas.querySelector(`[data-flow-port-for="${CSS.escape(endpointId)}"][data-flow-port-side="${targetPort}"]`) ?? undefined : undefined; };
        const beginPortConnection = (endpoint, sourcePort, port, pointerId) => { clearSelectedRelationshipForConnection(); connection?.preview?.remove(); const targetPort = targetPortFor(sourcePort), targets = targetPort ? projection.graph.connectionEndpoints.map(({ id }) => id).filter((id) => id !== endpoint.id) : []; if (!targets.length) {
            statusMessage = targetPort ? "Add another Page frame before drawing a relationship." : "This port cannot start a relationship.";
            render();
            return;
        } const start = flowPortPoint(endpoint.layout, { width: endpoint.width, height: endpoint.height }, sourcePort), preview = svg("line"); preview.classList.add("flow-connection-preview"); preview.setAttribute("x1", String(start.x)); preview.setAttribute("y1", String(start.y)); preview.setAttribute("x2", String(start.x)); preview.setAttribute("y2", String(start.y)); canvas.append(preview); connection = { sourceId: endpoint.id, sourcePort, targets, targetIndex: -1, preview, ...(pointerId === undefined ? {} : { pointerId }) }; startConnectionPointerTracking(pointerId); canvasScroll.classList.add("is-connecting"); statusMessage = `Connection mode: choose a ${targetPort} port; Escape cancels.`; status.textContent = statusMessage; port.focus(); };
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
        const placeActiveCatalogPage = (event) => { const payload = activeCatalogPayload, page = payload?.kind === "page" ? current().state?.project.collections.pages.find(({ id }) => id === payload.id) : undefined; if (!page)
            return; const target = event.target.closest("[data-section-dropzone]"); if (target?.dataset.sectionDropzone)
            insertPage(page, target.dataset.sectionDropzone); };
        canvas.addEventListener("pointerup", placeActiveCatalogPage);
        canvas.addEventListener("mouseup", placeActiveCatalogPage);
        for (const frame of stored.pageFrames) {
            const endpoint = projection.graph.connectionEndpoints.find(({ kind, id }) => kind === "page-frame" && id === frame.id), x = endpoint.layout.x, y = endpoint.layout.y, group = svg("g"), rect = svg("rect"), label = svg("text"), inputPort = svg("circle"), outputPort = svg("circle"), moveTo = (targetId, nextX, nextY) => { sessionStorage.setItem(`my-chrome-utilities.flow-focus.v1:${state.project.id}:${flow.id}`, frame.id); const currentState = current().state, next = moveFlowPageFramePresentation(currentState, flow.id, frame.id, { x: Math.max(0, Math.round(nextX)), y: Math.max(0, Math.round(nextY)), sectionId: targetId ?? null }); if (next !== currentState)
                persist(next); setTimeout(() => elementByData("data-page-frame-id", frame.id)?.focus(), 50); };
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
            outputPort.addEventListener("pointerdown", (event) => { event.stopPropagation(); beginPortConnection(endpoint, "right", outputPort, event.pointerId); });
            outputPort.addEventListener("keydown", (event) => { if (event.key === "Enter" && !connection) {
                event.preventDefault();
                beginPortConnection(endpoint, "right", outputPort);
                return;
            } if (event.key === "Escape" && connection) {
                event.preventDefault();
                cancelConnection();
                return;
            } if (event.key === "Enter" && connection) {
                event.preventDefault();
                commitConnection(connection.targets[connection.targetIndex]);
            } });
            label.textContent = `${endpoint.name} · Context-setting Page`;
            group.setAttribute("aria-label", `Page frame ${endpoint.name}. Context-setting Page. Drag or use Arrow keys to move.`);
            group.addEventListener("dragover", (event) => event.preventDefault());
            group.addEventListener("drop", (event) => { event.preventDefault(); event.stopPropagation(); const payload = dropPayload(event); if (payload?.kind !== "event")
                return; const entity = current().state?.project.collections.events.find(({ id }) => id === payload.id); if (entity)
                insertEvent(entity, frame.id); });
            let start, suppressPointerClick = false;
            const releaseClickSuppression = () => setTimeout(() => { suppressPointerClick = false; }, 1000), dragDelta = (event) => flowPointerDelta({ x: start.clientX, y: start.clientY }, { x: event.clientX, y: event.clientY }, start.zoom), move = (event) => { if (!ownsPointerDrag(start?.pointerId, event.pointerId))
                return; const delta = dragDelta(event); group.setAttribute("transform", `translate(${x + delta.x} ${y + delta.y})`); }, finish = (up) => { if (!ownsPointerDrag(start?.pointerId, up.pointerId))
                return; window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", finish); window.removeEventListener("pointercancel", cancel); const initial = start, delta = dragDelta(up), nextX = x + delta.x, nextY = y + delta.y, pointerTarget = Array.from(canvas.querySelectorAll("[data-section-dropzone]")).find((region) => { const bounds = region.getBoundingClientRect(); return up.clientX >= bounds.left && up.clientX <= bounds.right && up.clientY >= bounds.top && up.clientY <= bounds.bottom; })?.dataset.sectionDropzone, containedTarget = projection.laneBands.find((band) => flowBoundsContains(band, { x: nextX, y: nextY, width: endpoint.width, height: endpoint.height }))?.id, target = pointerTarget ?? containedTarget, pointerId = initial.pointerId; if (group.hasPointerCapture(pointerId))
                group.releasePointerCapture(pointerId); start = undefined; if (suppressPointerClick)
                releaseClickSuppression(); moveTo(target, nextX, nextY); }, cancel = (event) => { if (!ownsPointerDrag(start?.pointerId, event.pointerId))
                return; window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", finish); window.removeEventListener("pointercancel", cancel); if (group.hasPointerCapture(start.pointerId))
                group.releasePointerCapture(start.pointerId); start = undefined; group.setAttribute("transform", `translate(${x} ${y})`); if (suppressPointerClick)
                releaseClickSuppression(); };
            group.addEventListener("pointerdown", (event) => { if (event.target.closest("circle"))
                return; if (start) {
                suppressPointerClick = true;
                return;
            } const activeCamera = JSON.parse(canvas.dataset.viewport ?? "{}"); start = { pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY, zoom: activeCamera.zoom ?? 1 }; window.addEventListener("pointermove", move); window.addEventListener("pointerup", finish); window.addEventListener("pointercancel", cancel); try {
                group.setPointerCapture(event.pointerId);
            }
            catch { /* Synthetic tests have no active device pointer to capture. */ } });
            group.addEventListener("contextmenu", (event) => { if (!event.target.closest("circle"))
                requestItemMenu("page", frame.id, event); });
            group.addEventListener("keydown", (event) => { if (event.target.closest("circle"))
                return; if (requestItemMenu("page", frame.id, event))
                return; if (flowItemActivationRequest(event)) {
                event.preventDefault();
                saveSelection({ kind: "page-frame", id: frame.id });
                return;
            } if (!event.key.startsWith("Arrow"))
                return; event.preventDefault(); const dx = event.key === "ArrowLeft" ? -20 : event.key === "ArrowRight" ? 20 : 0, dy = event.key === "ArrowUp" ? -20 : event.key === "ArrowDown" ? 20 : 0; moveTo(frame.sectionId, x + dx, y + dy); });
            group.addEventListener("click", (event) => { if (event.target.closest("circle"))
                return; if (suppressPointerClick) {
                event.stopPropagation();
                return;
            } saveSelection({ kind: "page-frame", id: frame.id }, event.ctrlKey || event.metaKey || event.shiftKey); });
            group.append(rect, label, inputPort, outputPort);
            decorateVisual(group, { kind: "page-frame", id: frame.id }, endpoint.width, endpoint.height);
            canvas.append(group);
            const outlineRow = document.createElement("li"), outlineControl = button(`${endpoint.name} · Page instance`, () => saveSelection({ kind: "page-frame", id: frame.id }));
            outlineRow.dataset.pageFrameId = frame.id;
            outlineRow.dataset.pageId = frame.pageId;
            outlineRow.append(outlineControl);
            outline.append(outlineRow);
            if (frame.sectionId)
                outlineRow.dataset.flowSectionId = frame.sectionId;
            outlineControl.textContent = `${endpoint.name} · Context-setting Page`;
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
            edge.addEventListener("contextmenu", (event) => requestItemMenu("relationship", relationship.id, event));
            edge.addEventListener("keydown", (event) => { if (requestItemMenu("relationship", relationship.id, event))
                return; if (!flowItemActivationRequest(event))
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
            const group = svg("g"), box = svg("rect"), title = svg("text"), detail = svg("text"), layout = nodeData.layout, visualEndpoint = projection.graph.connectionEndpoints.find(({ id }) => id === nodeData.id), renderedNodeHeight = visualEndpoint?.height ?? nodeHeight;
            group.classList.add("flow-node");
            group.dataset.occurrenceId = nodeData.id;
            group.setAttribute("transform", `translate(${layout.x} ${layout.y})`);
            group.setAttribute("tabindex", "0");
            group.setAttribute("role", "button");
            group.setAttribute("aria-label", `${nodeData.name}. Drag or use Arrow keys to move.`);
            box.setAttribute("width", String(nodeWidth));
            box.setAttribute("height", String(renderedNodeHeight));
            box.setAttribute("rx", "10");
            title.setAttribute("x", "12");
            title.setAttribute("y", "30");
            title.textContent = nodeData.name;
            detail.setAttribute("x", "12");
            detail.setAttribute("y", "55");
            detail.textContent = "Interaction Event";
            detail.textContent = `Interaction Event${nodeData.trigger ? ` · ${nodeData.trigger}` : ""}`;
            group.setAttribute("aria-label", `${nodeData.name}. Interaction Event. Drag or use Arrow keys to move.`);
            if (nodeData.pageFrameId)
                group.dataset.containingPageFrameId = nodeData.pageFrameId;
            const storedOccurrence = stored.occurrences.find(({ id }) => id === nodeData.id), storedPosition = storedOccurrence.position, focusNode = () => queueMicrotask(() => elementByData("data-occurrence-id", nodeData.id)?.focus()), containingPageFrame = projection.graph.connectionEndpoints.find(({ kind, id }) => kind === "page-frame" && id === nodeData.pageFrameId), containedMoveAllowed = (x, y) => Boolean(containingPageFrame && x >= FLOW_GRAPH_GEOMETRY.eventMinX && y >= FLOW_GRAPH_GEOMETRY.eventMinY && x + nodeWidth <= containingPageFrame.width && y + nodeHeight <= containingPageFrame.height), rejectContainedMove = () => { group.setAttribute("transform", `translate(${layout.x} ${layout.y})`); statusMessage = "Use Change Page to move this Event occurrence to another Page frame."; statusRepairHref = ""; render(); focusNode(); }, moveContained = (x, y) => { if (!containedMoveAllowed(x, y)) {
                rejectContainedMove();
                return;
            } persist(moveGraphOccurrence(current().state, flow.id, nodeData.id, { x, y })); focusNode(); };
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
            } saveSelection({ kind: "occurrence", id: nodeData.id }, event.ctrlKey || event.metaKey || event.shiftKey); });
            const canvasExample = occurrenceExampleDetails(state, flow.id, nodeData.id, nodeData.name), exampleHost = svg("foreignObject"), resizeCanvasExample = () => { const expandedHeight = canvasExample.open ? Math.max(260, Math.ceil(canvasExample.scrollHeight) + 8) : 30; exampleHost.setAttribute("height", String(expandedHeight)); box.setAttribute("height", String(canvasExample.open ? renderedNodeHeight + expandedHeight - 30 : renderedNodeHeight)); resizeCanvasHeight(); };
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
            decorateVisual(group, { kind: "occurrence", id: nodeData.id }, nodeWidth, renderedNodeHeight);
            canvas.append(group);
            const row = document.createElement("li"), control = button(`${nodeData.name} · Interaction Event${nodeData.trigger ? ` · ${nodeData.trigger}` : ""}`, () => saveSelection({ kind: "occurrence", id: nodeData.id })), outlineExample = occurrenceExampleDetails(state, flow.id, nodeData.id, nodeData.name);
            row.dataset.occurrenceId = nodeData.id;
            if (nodeData.pageFrameId)
                row.dataset.containingPageFrameId = nodeData.pageFrameId;
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
                    beginPortConnection(endpoint, side, port, event.pointerId); });
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
                    clearConnectionFeedback();
                    connection.targetIndex = (connection.targetIndex + (event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1) + connection.targets.length) % connection.targets.length;
                    const target = targetPortElement(connection.targets[connection.targetIndex], side);
                    if (target)
                        emphasizeCompatiblePort(target);
                    return;
                } if (event.key === "Enter") {
                    event.preventDefault();
                    commitConnection(connection.targets[connection.targetIndex], targetPortFor(side));
                } });
                canvas.append(port);
            }
        }
        section.addEventListener("pointerdown", (event) => { if (connection || event.target.closest("[data-flow-port-for]"))
            return; const port = document.elementsFromPoint(event.clientX, event.clientY).find((element) => element instanceof SVGCircleElement && Boolean(element.dataset.flowPortFor && element.dataset.flowPortSide)); if (!port)
            return; const rect = port.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)
            return; const endpoint = projection.graph.connectionEndpoints.find(({ id }) => id === port.dataset.flowPortFor), side = port.dataset.flowPortSide; if (!endpoint)
            return; event.preventDefault(); event.stopImmediatePropagation(); beginPortConnection(endpoint, side, port, event.pointerId); }, true);
        const compatiblePortSnap = (client) => { if (!connection)
            return undefined; const compatibleSide = targetPortFor(connection.sourcePort ?? "right"); if (!compatibleSide)
            return undefined; const ports = Array.from(canvas.querySelectorAll(`[data-flow-port-side="${compatibleSide}"]`)).filter(({ dataset }) => dataset.flowPortFor !== connection.sourceId), candidates = ports.map((port, presentationOrder) => { const rect = port.getBoundingClientRect(); return { endpointId: port.dataset.flowPortFor, port: compatibleSide, center: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }, presentationOrder, element: port }; }); return flowPortSnapTarget(client, candidates); };
        const directFlowSnapTarget = (direct) => direct?.dataset.flowPortFor && direct.dataset.flowPortSide ? { kind: "port", endpointId: direct.dataset.flowPortFor, port: direct.dataset.flowPortSide } : direct?.dataset.occurrenceId ? { kind: "event", endpointId: direct.dataset.occurrenceId } : direct?.dataset.pageFrameId ? { kind: "page", endpointId: direct.dataset.pageFrameId } : undefined;
        const pointerDirectAt = (event) => { const hit = document.elementFromPoint(event.clientX, event.clientY) ?? event.target; return hit instanceof Element ? hit.closest("[data-flow-port-for],[data-page-frame-id],[data-occurrence-id]") : null; };
        const pointerSnap = (event) => { if (!connection)
            return undefined; const compatibleSide = targetPortFor(connection.sourcePort ?? "right"), direct = pointerDirectAt(event); return flowPointerSnapTarget({ sourceId: connection.sourceId, compatibleSide, direct: directFlowSnapTarget(direct), snap: compatiblePortSnap({ x: event.clientX, y: event.clientY }) }); };
        const previewPoint = (client) => { const screenTransform = canvas.getScreenCTM(); if (screenTransform) {
            const point = new DOMPoint(client.x, client.y).matrixTransform(screenTransform.inverse());
            return { x: point.x, y: point.y };
        } const bounds = canvas.getBoundingClientRect(), viewBox = canvas.viewBox.baseVal; return { x: viewBox.x + (client.x - bounds.left) * viewBox.width / bounds.width, y: viewBox.y + (client.y - bounds.top) * viewBox.height / bounds.height }; };
        const ownsConnectionPointer = (event) => connection?.pointerId === event.pointerId;
        const trackConnectionPointerMove = (event) => { if (!connection?.preview || !ownsConnectionPointer(event))
            return; const direct = pointerDirectAt(event), scrollBounds = canvasScroll.getBoundingClientRect(), edgeSize = 36, edgeStep = 28; if (!direct) {
            if (event.clientX <= scrollBounds.left + edgeSize)
                canvasScroll.scrollLeft = Math.max(0, canvasScroll.scrollLeft - edgeStep);
            else if (event.clientX >= scrollBounds.right - edgeSize)
                canvasScroll.scrollLeft = Math.min(canvasScroll.scrollWidth - canvasScroll.clientWidth, canvasScroll.scrollLeft + edgeStep);
            if (event.clientY <= scrollBounds.top + edgeSize)
                canvasScroll.scrollTop = Math.max(0, canvasScroll.scrollTop - edgeStep);
            else if (event.clientY >= scrollBounds.bottom - edgeSize)
                canvasScroll.scrollTop = Math.min(canvasScroll.scrollHeight - canvasScroll.clientHeight, canvasScroll.scrollTop + edgeStep);
        } clearConnectionFeedback(); const snap = pointerSnap(event), endpoint = snap && projection.graph.connectionEndpoints.find(({ id }) => id === snap.endpointId), point = previewPoint(snap?.center ?? { x: event.clientX, y: event.clientY }); connection.preview.setAttribute("x2", String(point.x)); connection.preview.setAttribute("y2", String(point.y)); if (snap) {
            emphasizeCompatiblePort(snap.element);
            const kind = connection.sourcePort === "top" ? "alternative" : connection.sourcePort === "bottom" ? "merge" : "expected_next";
            status.textContent = `${endpoint?.name ?? snap.endpointId} ${snap.port} port · inferred ${kind}`;
        }
        else {
            direct?.classList.add("is-invalid-target");
            status.textContent = "No compatible relationship port acquired.";
        } };
        const trackConnectionPointerUp = (event) => { if (!connection || !ownsConnectionPointer(event))
            return; const snap = pointerSnap(event); if (snap) {
            commitConnection(snap.endpointId, snap.port);
            return;
        } const sourceId = connection.sourceId, sourcePort = connection.sourcePort ?? "right", targetPort = targetPortFor(sourcePort), position = previewPoint({ x: event.clientX, y: event.clientY }), sourceElement = canvas.querySelector(`[data-flow-port-for="${CSS.escape(sourceId)}"][data-flow-port-side="${sourcePort}"]`); connection.preview?.remove(); connectionPointerCleanup(); connection = undefined; canvasScroll.classList.remove("is-connecting"); if (!targetPort) {
            cancelConnection(true, true);
            return;
        } canvas.dispatchEvent(new CustomEvent("flow-empty-connection-drop", { bubbles: true, detail: { sourceId, sourcePort, targetPort, position: { x: Math.round(position.x), y: Math.round(position.y) }, sourceElement } })); };
        const trackConnectionPointerCancel = (event) => { if (ownsConnectionPointer(event))
            cancelConnection(); };
        startConnectionPointerTracking = (pointerId) => { if (pointerId === undefined)
            return; connectionPointerCleanup(); window.addEventListener("pointermove", trackConnectionPointerMove, true); window.addEventListener("pointerup", trackConnectionPointerUp, true); window.addEventListener("pointercancel", trackConnectionPointerCancel, true); connectionPointerCleanup = () => { window.removeEventListener("pointermove", trackConnectionPointerMove, true); window.removeEventListener("pointerup", trackConnectionPointerUp, true); window.removeEventListener("pointercancel", trackConnectionPointerCancel, true); connectionPointerCleanup = () => { }; }; };
        canvas.addEventListener("keydown", (event) => { if (!connection)
            return; if (event.key === "Escape") {
            event.preventDefault();
            event.stopImmediatePropagation();
            cancelConnection();
            return;
        } if (event.key.startsWith("Arrow")) {
            event.preventDefault();
            event.stopImmediatePropagation();
            clearConnectionFeedback();
            connection.targetIndex = (connection.targetIndex + (event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1) + connection.targets.length) % connection.targets.length;
            const target = targetPortElement(connection.targets[connection.targetIndex], connection.sourcePort ?? "right");
            if (target)
                emphasizeCompatiblePort(target);
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
        document.querySelectorAll("[data-occurrence-id],[data-relationship-id],[data-page-frame-id]").forEach((element) => { const item = element.dataset.occurrenceId ? { kind: "occurrence", id: element.dataset.occurrenceId } : element.dataset.relationshipId ? { kind: "relationship", id: element.dataset.relationshipId } : { kind: "page-frame", id: element.dataset.pageFrameId }; element.classList.toggle("is-selected", flowSelectionContains(selectedItems, item)); });
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
    function render() {
        const { state, flow } = current();
        advanced.hidden = !flow;
        if (flow) {
            renderGraph(flow);
            document.querySelectorAll("[data-page-frame-id]").forEach((candidate) => candidate.setAttribute("aria-pressed", String(flowSelectionContains(selectedItems, { kind: "page-frame", id: candidate.dataset.pageFrameId }))));
            if (state) {
                const focusId = sessionStorage.getItem(`my-chrome-utilities.flow-focus.v1:${state.project.id}:${flow.id}`);
                if (focusId)
                    queueMicrotask(() => (document.querySelector(`[aria-label="Interactive directional Flow canvas"] [data-page-frame-id="${CSS.escape(focusId)}"]`) ?? document.querySelector(`article[data-page-frame-id="${CSS.escape(focusId)}"]`))?.focus({ preventScroll: true }));
            }
            const intent = selectionFocusIntent;
            selectionFocusIntent = undefined;
            if (intent)
                queueMicrotask(() => queueMicrotask(() => { const attribute = intent.kind === "section" ? "data-flow-section-id" : intent.kind === "page-frame" ? "data-page-frame-id" : intent.kind === "occurrence" ? "data-occurrence-id" : "data-relationship-id"; document.querySelector(`[aria-label="Interactive directional Flow canvas"] [${attribute}="${CSS.escape(intent.id)}"]`)?.focus({ preventScroll: true }); }));
        }
        else {
            selectionWorkspace = "";
            selectedItems = [];
            selected = undefined;
            selectionFocusIntent = undefined;
            document.querySelector("#flow-graph-workspace")?.replaceChildren();
            inspectorContext.replaceChildren();
        }
    }
    return { render, renderSelectors: render };
}
//# sourceMappingURL=data-layer-flow-graph-ui.js.map