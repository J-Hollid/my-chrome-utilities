import { fitFlowBounds, flowDetailLevel, initialFlowWorkspaceView, openFlowSurface, tidyFlowItems, zoomFlowCamera } from "./workspace.js";
const viewByFlow = new Map();
const invokingFocusByFlow = new Map();
function storedView(projectId, flowId) { try {
    const stored = sessionStorage.getItem(`my-chrome-utilities.flow-view.v1:${projectId}:${flowId}`);
    return stored ? JSON.parse(stored) : undefined;
}
catch {
    return undefined;
} }
function storeView(projectId, flowId, view) { try {
    const key = `my-chrome-utilities.flow-view.v1:${projectId}:${flowId}`, prior = JSON.parse(sessionStorage.getItem(key) ?? "{}");
    sessionStorage.setItem(key, JSON.stringify({ ...prior, viewport: view.camera, minimap: view.minimap, surface: view.surface, focusCanvas: view.focusCanvas }));
}
catch { /* Session UI state is best-effort and never enters project bytes. */ } }
function control(text, action) { const result = document.createElement("button"); result.type = "button"; result.textContent = text; result.addEventListener("click", action); return result; }
function boundsForCanvas(canvas) { const boxes = Array.from(canvas.querySelectorAll("[data-flow-section-id],[data-page-frame-id],[data-occurrence-id]")).flatMap((item) => { try {
    const box = item.getBBox();
    return Number.isFinite(box.x) ? [box] : [];
}
catch {
    return [];
} }); if (!boxes.length)
    return { x: 0, y: 0, width: 960, height: 720 }; const left = Math.min(...boxes.map(({ x }) => x)), top = Math.min(...boxes.map(({ y }) => y)), right = Math.max(...boxes.map(({ x, width }) => x + width)), bottom = Math.max(...boxes.map(({ y, height }) => y + height)); return { x: left, y: top, width: Math.max(1, right - left), height: Math.max(1, bottom - top) }; }
export function upgradeFlowWorkspace(root) {
    const workspace = root.querySelector(".documentary-flow");
    if (!workspace || workspace.dataset.canvasFirstR02 === "true")
        return;
    workspace.dataset.canvasFirstR02 = "true";
    const flowId = workspace.dataset.flowSectionWorkspace ?? "flow", legacyToolbar = workspace.querySelector('[aria-label="Flow component catalogs"]'), canvasViewport = workspace.querySelector(".flow-canvas-scroll"), canvas = canvasViewport?.querySelector(".flow-graph-canvas"), outline = workspace.querySelector('[aria-label="Synchronized editable Flow outline"]'), rawSections = workspace.querySelector('[aria-label="Flow Section controls"]'), duplicateFrames = workspace.querySelector('[aria-label="Flow Page frames"]'), actions = workspace.querySelector('[aria-label^="Selected "]'), relationship = workspace.querySelector('[aria-label="Inline relationship popover"]');
    if (!legacyToolbar || !canvasViewport || !canvas || !outline)
        return;
    const projectId = rawSections?.dataset.flowProjectId ?? "project", restored = storedView(projectId, flowId);
    let view = viewByFlow.get(flowId) ?? { ...initialFlowWorkspaceView(), ...(restored ?? {}), camera: restored?.viewport ?? restored?.camera ?? initialFlowWorkspaceView().camera }, emptyDrop;
    const toolbar = document.createElement("nav"), surface = document.createElement("section"), surfaceBody = document.createElement("div"), surfaceHeading = document.createElement("h4"), close = control("Close", () => { emptyDrop = undefined; showSurface(undefined); });
    toolbar.className = "flow-workspace-toolbar";
    toolbar.setAttribute("aria-label", "Flow toolbar");
    surface.className = "flow-workspace-surface";
    surface.setAttribute("aria-label", "Flow contextual surface");
    Object.assign(surface.style, { position: "absolute", inset: "6px 6px 6px auto", boxSizing: "border-box", height: "calc(100% - 12px)", minHeight: "0", maxHeight: "calc(100% - 12px)", overflow: "auto" });
    surface.hidden = true;
    surfaceHeading.textContent = "Flow tools";
    surface.append(surfaceHeading, close, surfaceBody);
    const pageCatalog = legacyToolbar.querySelector('[aria-label="Pages catalog"]'), eventCatalog = legacyToolbar.querySelector('[aria-label="Events catalog"]'), sectionForm = rawSections?.querySelector("form"), detailsSource = duplicateFrames?.querySelector('[aria-pressed="true"]') ?? duplicateFrames?.querySelector(".is-selected"), selectedOutline = outline.querySelector(".is-selected");
    const detailsPark = document.createDocumentFragment(), detailsParents = new Map();
    if (detailsSource)
        detailsParents.set(detailsSource, duplicateFrames);
    if (selectedOutline)
        detailsParents.set(selectedOutline, outline);
    if (relationship)
        detailsParents.set(relationship, detailsPark);
    const restoreDetailsNodes = () => { for (const [node, parent] of detailsParents)
        if (node.parentNode === surfaceBody)
            parent.appendChild(node); };
    if (sectionForm) {
        sectionForm.querySelector("button").textContent = "New Section";
    }
    for (const card of Array.from(duplicateFrames?.querySelectorAll("[data-page-frame-id]") ?? [])) {
        const frameId = card.dataset.pageFrameId, group = canvas.querySelector(`[data-page-frame-id="${CSS.escape(frameId)}"]`), sourceLabel = card.querySelector('[aria-label^="Name in this Flow for "]')?.getAttribute("aria-label")?.replace("Name in this Flow for ", "") ?? "Page", status = card.querySelector("[data-example-status]")?.dataset.exampleStatus ?? "Incomplete";
        if (!group)
            continue;
        group.classList.add("flow-page-card");
        const provenance = document.createElementNS("http://www.w3.org/2000/svg", "text"), readiness = document.createElementNS("http://www.w3.org/2000/svg", "text");
        provenance.setAttribute("x", "14");
        provenance.setAttribute("y", "54");
        provenance.classList.add("flow-page-source");
        provenance.textContent = sourceLabel;
        readiness.setAttribute("x", "14");
        readiness.setAttribute("y", "76");
        readiness.classList.add("flow-readiness");
        readiness.textContent = status;
        group.append(provenance, readiness);
        group.setAttribute("aria-label", `${group.getAttribute("aria-label") ?? "Page frame"}. Source Page ${sourceLabel}. ${status}.`);
    }
    for (const row of Array.from(outline.querySelectorAll("[data-occurrence-id]"))) {
        const occurrenceId = row.dataset.occurrenceId, group = canvas.querySelector(`[data-occurrence-id="${CSS.escape(occurrenceId)}"]`), status = row.querySelector("[data-example-status]")?.dataset.exampleStatus ?? "Incomplete";
        if (!group)
            continue;
        const readiness = document.createElementNS("http://www.w3.org/2000/svg", "text");
        readiness.setAttribute("x", "12");
        readiness.setAttribute("y", "76");
        readiness.classList.add("flow-readiness");
        readiness.textContent = status;
        group.append(readiness);
        group.setAttribute("aria-label", `${group.getAttribute("aria-label") ?? "Event occurrence"}. ${status}.`);
    }
    function surfaceContents(kind) { if (kind === "add")
        return [...(rawSections ? [rawSections] : []), ...(pageCatalog ? [pageCatalog] : []), ...(eventCatalog ? [eventCatalog] : [])]; if (kind === "outline")
        return [outline]; if (kind === "details")
        return [...(relationship ? [relationship] : []), ...(detailsSource ? [detailsSource] : []), ...(selectedOutline ? [selectedOutline] : [])]; const tidy = document.createElement("section"), copy = document.createElement("p"), horizontal = control("Preview horizontal Tidy", () => previewTidy("horizontal")), vertical = control("Preview vertical Tidy", () => previewTidy("vertical")), cancel = control("Cancel Tidy", () => { clearTidyPreview(); showSurface(undefined); }); copy.textContent = "Tidy previews presentation coordinates only. Relationship endpoints, kinds, containment, schema meaning, and documentation order stay unchanged."; tidy.setAttribute("aria-label", "Tidy Flow presentation"); tidy.append(copy, horizontal, vertical, cancel); return [tidy]; }
    function saveView() { viewByFlow.set(flowId, view); storeView(projectId, flowId, view); }
    function showSurface(kind, invoker) { if (invoker) {
        invokingFocusByFlow.set(flowId, invoker);
    } view = kind ? openFlowSurface(view, kind) : { ...view, surface: undefined }; saveView(); surface.hidden = !kind; restoreDetailsNodes(); surfaceBody.replaceChildren(...(kind ? surfaceContents(kind) : [])); surfaceHeading.textContent = kind ? `${kind[0].toUpperCase()}${kind.slice(1)}` : "Flow tools"; toolbar.querySelectorAll("[data-flow-surface]").forEach((button) => button.setAttribute("aria-expanded", String(button.dataset.flowSurface === kind))); if (!kind) {
        invokingFocusByFlow.get(flowId)?.focus({ preventScroll: true });
        invokingFocusByFlow.delete(flowId);
    } }
    if (actions?.getAttribute("aria-label")?.includes("Page instance")) {
        actions.classList.add("flow-contextual-toolbar");
        const rename = control("Rename in Flow", () => { showSurface("details"); detailsSource?.querySelector('[aria-label^="Name in this Flow"]')?.focus(); }), addEvent = control("Add Event", () => showSurface("add")), duplicate = control("Duplicate", () => detailsSource?.querySelector("button:nth-last-child(2)")?.click()), openDetails = control("Details", () => showSurface("details"));
        actions.prepend(rename, addEvent, duplicate, openDetails);
    }
    if (actions?.getAttribute("aria-label")?.includes("Event occurrence")) {
        actions.classList.add("flow-contextual-toolbar");
        const openDetails = control("Details", () => showSurface("details"));
        actions.prepend(openDetails);
    }
    if (relationship && actions) {
        actions.classList.add("flow-contextual-toolbar");
        actions.setAttribute("aria-label", "Selected relationship actions");
        const edit = control("Edit documentation", () => showSurface("details")), remove = relationship.querySelector('button[aria-label^="Delete relationship"]');
        actions.append(edit, ...(remove ? [remove] : []));
    }
    workspace.addEventListener("flow-empty-connection-drop", (event) => { const detail = event.detail; if (!detail)
        return; emptyDrop = { sourceId: detail.sourceId, sourcePort: detail.sourcePort, targetPort: detail.targetPort, position: detail.position }; showSurface("add", detail.sourceElement); surfaceHeading.textContent = "Choose target Page"; });
    workspace.addEventListener("click", (event) => { const target = event.target.closest("button"), label = target?.textContent?.trim(); if (label === "Open schema contribution") {
        view = openFlowSurface(view, "details");
        saveView();
    }
    else if (view.surface === "add" && label?.startsWith("Add ")) {
        if (emptyDrop && target?.dataset.componentKind === "page") {
            event.preventDefault();
            event.stopImmediatePropagation();
            root.dispatchEvent(new CustomEvent("flow-empty-connection-page", { bubbles: true, detail: { ...emptyDrop, pageId: target.dataset.componentId } }));
            emptyDrop = undefined;
        }
        view = { ...view, surface: undefined };
        saveView();
    } }, true);
    function applyCamera(camera) { view = { ...view, camera }; saveView(); const visibleWidth = Math.max(240, canvasViewport.clientWidth || 960), visibleHeight = Math.max(240, canvasViewport.clientHeight || 600), worldWidth = visibleWidth / camera.zoom, worldHeight = visibleHeight / camera.zoom; canvas.setAttribute("viewBox", `${camera.x} ${camera.y} ${worldWidth} ${worldHeight}`); canvas.dataset.viewport = JSON.stringify(camera); canvas.dataset.semanticDetail = flowDetailLevel(camera.zoom); zoomValue.textContent = `${Math.round(camera.zoom * 100)}%`; }
    const surfaceButton = (label, kind) => { const result = control(label, () => showSurface(view.surface === kind ? undefined : kind, result)); result.dataset.flowSurface = kind; result.setAttribute("aria-expanded", String(view.surface === kind)); return result; };
    const add = surfaceButton("Add", "add"), outlineButton = surfaceButton("Outline", "outline"), details = surfaceButton("Details", "details"), tidy = surfaceButton("Tidy", "tidy"), focusCanvas = control("Focus Canvas", () => { view = { ...view, focusCanvas: !view.focusCanvas }; saveView(); document.body.classList.toggle("flow-focus-canvas", view.focusCanvas); focusCanvas.textContent = view.focusCanvas ? "Exit Focus Canvas" : "Focus Canvas"; }), zoomOut = control("Zoom out", () => applyCamera(zoomFlowCamera(view.camera, .8, { x: (canvasViewport.clientWidth || 960) / 2, y: (canvasViewport.clientHeight || 600) / 2 }))), zoomIn = control("Zoom in", () => applyCamera(zoomFlowCamera(view.camera, 1.25, { x: (canvasViewport.clientWidth || 960) / 2, y: (canvasViewport.clientHeight || 600) / 2 }))), actual = control("100 percent", () => applyCamera({ ...view.camera, zoom: 1 })), fit = control("Fit Flow", () => applyCamera(fitFlowBounds(boundsForCanvas(canvas), { width: canvasViewport.clientWidth || 960, height: canvasViewport.clientHeight || 600 }))), fitSelection = control("Fit selection", () => { const selected = canvas.querySelector(".is-selected"); if (!selected)
        return; const box = selected.getBBox(); applyCamera(fitFlowBounds({ x: box.x, y: box.y, width: box.width, height: box.height }, { width: canvasViewport.clientWidth || 960, height: canvasViewport.clientHeight || 600 }, 80)); }), minimap = control("Minimap", () => { view = { ...view, minimap: !view.minimap }; saveView(); map.hidden = !view.minimap; minimap.setAttribute("aria-pressed", String(view.minimap)); }), zoomValue = document.createElement("output"), map = document.createElement("aside");
    zoomValue.setAttribute("aria-label", "Flow zoom percentage");
    map.className = "flow-minimap";
    map.setAttribute("aria-label", "Flow minimap");
    map.textContent = "Complete Flow bounds";
    map.hidden = !view.minimap;
    minimap.setAttribute("aria-pressed", String(view.minimap));
    toolbar.append(add, outlineButton, details, tidy, focusCanvas, zoomOut, zoomValue, zoomIn, actual, fit, fitSelection, minimap);
    legacyToolbar.replaceWith(toolbar);
    rawSections?.remove();
    duplicateFrames?.remove();
    const projections = canvasViewport.parentElement, status = projections?.previousElementSibling instanceof HTMLParagraphElement ? projections.previousElementSibling : undefined;
    projections?.classList.add("flow-canvas-viewport");
    canvasViewport.style.position = "relative";
    if (status) {
        status.classList.add("flow-workspace-status");
        canvasViewport.append(status);
    }
    canvasViewport.append(surface, map, ...(actions ? [actions] : []));
    outline.remove();
    relationship?.remove();
    canvas.style.removeProperty("width");
    canvas.style.removeProperty("height");
    canvasViewport.tabIndex = 0;
    canvasViewport.setAttribute("aria-label", "Flow canvas viewport");
    queueMicrotask(() => workspace.scrollIntoView({ block: "start", inline: "nearest" }));
    let pan;
    canvas.addEventListener("pointerdown", (event) => { if (event.target !== canvas)
        return; pan = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, camera: view.camera }; try {
        canvas.setPointerCapture(event.pointerId);
    }
    catch { /* Synthetic pointers do not own capture. */ } });
    canvas.addEventListener("pointermove", (event) => { if (!pan || pan.pointerId !== event.pointerId)
        return; applyCamera({ ...pan.camera, x: pan.camera.x - (event.clientX - pan.x) / pan.camera.zoom, y: pan.camera.y - (event.clientY - pan.y) / pan.camera.zoom }); });
    const finishPan = (event) => { if (pan?.pointerId === event.pointerId)
        pan = undefined; };
    canvas.addEventListener("pointerup", finishPan);
    canvas.addEventListener("pointercancel", finishPan);
    canvasViewport.addEventListener("wheel", (event) => { if (!event.ctrlKey && !event.metaKey)
        return; event.preventDefault(); const box = canvasViewport.getBoundingClientRect(); applyCamera(zoomFlowCamera(view.camera, event.deltaY < 0 ? 1.1 : .9, { x: event.clientX - box.left, y: event.clientY - box.top })); }, { passive: false });
    function clearTidyPreview() { canvas.querySelectorAll("[data-tidy-transform]").forEach((item) => { item.setAttribute("transform", item.dataset.tidyTransform ?? ""); delete item.dataset.tidyTransform; }); }
    function previewTidy(direction) { clearTidyPreview(); const items = Array.from(canvas.querySelectorAll("[data-page-frame-id]")).map((item) => { const transform = item.getAttribute("transform") ?? "translate(0 0)", match = transform.match(/translate\(([-\d.]+)[ ,]([-\d.]+)/); return { id: item.dataset.pageFrameId, position: { x: Number(match?.[1] ?? 0), y: Number(match?.[2] ?? 0) }, item, transform }; }), placements = tidyFlowItems(items, direction, { x: 60, y: 80, gap: direction === "horizontal" ? 260 : 190 }); for (const placement of placements) {
        const entry = items.find(({ id }) => id === placement.id);
        entry.item.dataset.tidyTransform = entry.transform;
        entry.item.setAttribute("transform", `translate(${placement.position.x} ${placement.position.y})`);
    } const confirm = control("Confirm Tidy", () => { const event = new CustomEvent("flow-tidy-confirm", { bubbles: true, detail: { direction, placements } }); root.dispatchEvent(event); showSurface(undefined); }); surfaceBody.querySelector('[data-tidy-confirm]')?.remove(); confirm.dataset.tidyConfirm = "true"; surfaceBody.append(confirm); }
    applyCamera(view.camera);
    if (view.surface)
        showSurface(view.surface);
    document.body.classList.toggle("flow-focus-canvas", view.focusCanvas);
}
//# sourceMappingURL=workspace-ui.js.map